const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const dns = require('dns');

// Force DNS resolution to prefer IPv4 to prevent IPv6 Docker timeouts on dual-stack servers
dns.setDefaultResultOrder('ipv4first');
const { sequelize, Widget, CallRecord, Agent, DialerWidget, DialerCallRecord, DialerAgent, User, SystemSetting } = require('./db');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) return false;
  const [salt, originalHash] = storedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

require('dotenv').config();

// ─── 3CX OAuth Token Cache ───────────────────────────────────────────────────
// Stores { [widgetId]: { token: string, expiresAt: number } }
const tokenCache = {};

/**
 * Strip any accidental http:// or https:// prefix from the FQDN field.
 * Users sometimes paste the full URL; this normalises it to host:port.
 */
function sanitizeFqdn(fqdn) {
  return (fqdn || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

/**
 * Check if the widget is currently within its configured office hours.
 * Uses native Intl formatting to avoid dependency on heavy libraries.
 */
function isOfficeHours(widget) {
  if (!widget.office_hours_enabled) return true;

  try {
    const tz = widget.office_hours_timezone || 'Asia/Dubai';
    const now = new Date();
    
    // Convert current time to target timezone string
    const tzString = now.toLocaleString('en-US', { timeZone: tz });
    const localDate = new Date(tzString);
    const dayOfWeek = localDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if current day of week is allowed (Mon-Fri = 1,2,3,4,5)
    const allowedDays = (widget.office_hours_days || '1,2,3,4,5')
      .split(',')
      .map(x => parseInt(x.trim(), 10))
      .filter(x => !isNaN(x));

    if (!allowedDays.includes(dayOfWeek)) {
      return false;
    }

    // Check time bounds (HH:MM format)
    const currentHour = String(localDate.getHours()).padStart(2, '0');
    const currentMin  = String(localDate.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMin}`;

    const start = widget.office_hours_start || '09:00';
    const end   = widget.office_hours_end || '18:00';

    return currentTime >= start && currentTime <= end;
  } catch (err) {
    console.error('[3CX] Error evaluating office hours:', err.message);
    return true; // fallback to true to prevent blocking calls on error
  }
}

/**
 * Sends a detailed webhook payload to the configured n8n/GHL URL on call lifecycle changes.
 */
async function triggerUserWebhook(callRecord, widget) {
  if (!widget) {
    console.warn(`[Webhook] triggerUserWebhook called with null widget for call ${callRecord?.id}`);
    return;
  }

  // Re-fetch the widget fresh from DB to ensure we have latest webhook URLs
  let freshWidget = widget;
  try {
    const fetched = await Widget.findByPk(widget.id || widget.dataValues?.id);
    if (fetched) freshWidget = fetched;
  } catch (e) { /* use passed widget if refetch fails */ }

  const urls = [];
  if (freshWidget.webhook_url_n8n) urls.push(freshWidget.webhook_url_n8n);

  // Add event-specific webhook URLs if configured
  if (callRecord.status === 'Initiated' || callRecord.status === 'Ringing') {
    if (freshWidget.webhook_initiated) urls.push(freshWidget.webhook_initiated);
  } else if (callRecord.status === 'Answered') {
    if (freshWidget.webhook_answered) urls.push(freshWidget.webhook_answered);
  } else if (callRecord.status === 'Completed') {
    if (callRecord.outcome === 'Lead') {
      if (freshWidget.webhook_lead) urls.push(freshWidget.webhook_lead);
    } else {
      if (freshWidget.webhook_completed) urls.push(freshWidget.webhook_completed);
    }
  } else if (['Failed', 'Missed', 'Abandoned'].includes(callRecord.status) || ['Failed', 'Missed', 'Abandoned'].includes(callRecord.outcome)) {
    if (freshWidget.webhook_failed) urls.push(freshWidget.webhook_failed);
  }

  console.log(`[Webhook] triggerUserWebhook called | call=${callRecord.id} | status=${callRecord.status} | outcome=${callRecord.outcome} | widgetId=${freshWidget.id} | webhook_url_n8n=${freshWidget.webhook_url_n8n || 'none'} | webhook_initiated=${freshWidget.webhook_initiated || 'none'} | webhook_answered=${freshWidget.webhook_answered || 'none'} | webhook_completed=${freshWidget.webhook_completed || 'none'} | webhook_failed=${freshWidget.webhook_failed || 'none'} | urls_found=${urls.length}`);

  if (urls.length === 0) {
    console.warn(`[Webhook] No webhook URLs configured for widget ${freshWidget.id} (status: ${callRecord.status}). Nothing to send.`);
    return;
  }
  const uniqueUrls = [...new Set(urls)];

  try {
    const appUrl = getAppUrl();
    let recordingUrl = null;
    let recordingListenUrl = null;

    if (callRecord.recording_id) {
      // Auto-generate recording_token if missing
      if (!callRecord.recording_token) {
        const crypto = require('crypto');
        callRecord.recording_token = crypto.randomBytes(32).toString('hex');
        await callRecord.save();
      }
      recordingUrl = `${appUrl}/recordings/${callRecord.recording_token}/download`;
      recordingListenUrl = `${appUrl}/recordings/${callRecord.recording_token}/listen`;
    }

    let targetExt = '';
    let agentId = '';
    let agentEmail = '';
    let agentName = '';

    if (callRecord.agent_extension) {
      const parts = callRecord.agent_extension.split(',');
      let matchedExt = parts.find(p => p.includes(':answered') || p.includes(':completed'));
      if (matchedExt) {
        targetExt = matchedExt.split(':')[0].trim();
      } else {
        targetExt = parts[parts.length - 1].split(':')[0].trim();
      }

      if (targetExt) {
        const matchedAgent = await Agent.findOne({ where: { widgetId: widget.id, extension: targetExt } });
        if (matchedAgent) {
          agentId = matchedAgent.crm_agent_id || matchedAgent.id;
          agentEmail = matchedAgent.email || '';
          agentName = `${matchedAgent.first_name} ${matchedAgent.last_name || ''}`.trim();
        }
      }
    }

    const payload = {
      callId:             callRecord.id,
      widgetId:           widget.id,
      widgetName:         widget.name,
      locationId:         widget.location_id || '',
      customerName:       callRecord.customer_name,
      customerPhone:      callRecord.customer_phone,
      customerEmail:      callRecord.customer_email || '',
      agentExtension:     targetExt || callRecord.agent_extension || '',
      agentId:            agentId,
      agentEmail:         agentEmail,
      agentName:          agentName,
      status:             callRecord.status,
      outcome:            callRecord.outcome || callRecord.status,
      durationSeconds:    callRecord.duration_seconds || 0,
      retryCount:         callRecord.retry_count || 0,
      recordingId:        callRecord.recording_id || null,
      recordingUrl:       recordingUrl,
      recordingListenUrl: recordingListenUrl,
      pageUrl:            callRecord.page_url || '',
      ipAddress:          callRecord.ip_address || '',
      timestamp:          new Date()
    };

    for (const url of uniqueUrls) {
      try {
        await axios.post(url, payload, { timeout: 5000 });
        console.log(`[Webhook] Sent call lifecycle update for ${callRecord.id} to ${url}`);
      } catch (err) {
        console.error(`[Webhook] Failed to send update to ${url}:`, err.message);
      }
    }
  } catch (err) {
    console.error(`[Webhook] Global error in triggerUserWebhook:`, err.message);
  }
}

/**
 * Helper to parse GoHighLevel Location ID, Contact ID, and Query Parameters from a page URL.
 */
function parsePageUrlInfo(pageUrl) {
  const result = {
    locationId: '',
    contactId: '',
    queryParams: {}
  };
  
  if (!pageUrl) return result;
  
  try {
    // 1. Extract locationId and contactId via regex matching path segments
    const locMatch = pageUrl.match(/\/location\/([A-Za-z0-9_-]+)/);
    if (locMatch) result.locationId = locMatch[1];
    
    const contactMatch = pageUrl.match(/\/contacts\/detail\/([A-Za-z0-9_-]+)/);
    if (contactMatch) result.contactId = contactMatch[1];
    
    // 2. Parse query parameters
    const urlObj = new URL(pageUrl);
    for (const [key, value] of urlObj.searchParams.entries()) {
      result.queryParams[key] = value;
    }
  } catch (err) {
    // Fallback manual query parser if URL construction fails (e.g. invalid relative URL)
    try {
      const qIndex = pageUrl.indexOf('?');
      if (qIndex !== -1) {
        const queryStr = pageUrl.substring(qIndex + 1);
        const pairs = queryStr.split('&');
        for (const pair of pairs) {
          const [k, v] = pair.split('=');
          if (k) {
            result.queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
          }
        }
      }
    } catch (e) {}
  }
  
  return result;
}

/**
 * Sends a detailed webhook payload to configured dialer webhook URLs on call lifecycle changes.
 */
async function triggerDialerWebhook(record, dialer) {
  if (!dialer) {
    console.warn(`[Dialer Webhook] triggerDialerWebhook called with null dialer for call ${record?.id}`);
    return;
  }

  // Re-fetch dialer fresh from DB to ensure we have latest webhook URLs
  let freshDialer = dialer;
  try {
    const fetched = await DialerWidget.findByPk(dialer.id || dialer.dataValues?.id);
    if (fetched) freshDialer = fetched;
  } catch (e) { /* use passed dialer if refetch fails */ }

  const urls = [];
  if (record.status === 'Initiated') {
    if (freshDialer.webhook_initiated) urls.push(freshDialer.webhook_initiated);
  } else if (record.status === 'Ringing') {
    // Optionally fire on ringing if configured
  } else if (record.status === 'Connected') {
    if (freshDialer.webhook_connected) urls.push(freshDialer.webhook_connected);
  } else if (record.status === 'Completed') {
    if (freshDialer.webhook_completed) urls.push(freshDialer.webhook_completed);
  } else if (record.status === 'Failed') {
    if (freshDialer.webhook_failed) urls.push(freshDialer.webhook_failed);
  }

  console.log(`[Dialer Webhook] triggerDialerWebhook called | call=${record.id} | status=${record.status} | dialerId=${freshDialer.id} | webhook_initiated=${freshDialer.webhook_initiated || 'none'} | webhook_completed=${freshDialer.webhook_completed || 'none'} | webhook_failed=${freshDialer.webhook_failed || 'none'} | urls_found=${urls.length}`);

  if (urls.length === 0) {
    console.warn(`[Dialer Webhook] No webhook URLs configured for dialer ${freshDialer.id} (status: ${record.status}). Nothing to send.`);
    return;
  }
  const uniqueUrls = [...new Set(urls)];

  try {
    const appUrl = getAppUrl();
    let recordingUrl = null;
    let recordingListenUrl = null;

    if (record.recording_id) {
      // Auto-generate recording_token if missing
      if (!record.recording_token) {
        const crypto = require('crypto');
        record.recording_token = crypto.randomBytes(32).toString('hex');
        await record.save();
      }
      recordingUrl = `${appUrl}/recordings/${record.recording_token}/download`;
      recordingListenUrl = `${appUrl}/recordings/${record.recording_token}/listen`;
    }

    let agentId = '';
    let agentEmail = '';
    let agentName = '';
    let agentLocationId = '';

    if (record.agent_extension) {
      const extStr = String(record.agent_extension).trim();
      const matchedAgent = await DialerAgent.findOne({ where: { dialerId: freshDialer.id, extension: extStr } });
      if (matchedAgent) {
        agentId = matchedAgent.crm_user_id || matchedAgent.id;
        agentEmail = matchedAgent.email || '';
        agentName = `${matchedAgent.first_name || ''} ${matchedAgent.last_name || ''}`.trim();
        agentLocationId = matchedAgent.location_id || '';
      }
    }

    const urlInfo = parsePageUrlInfo(record.page_url);
    const resolvedLocationId = urlInfo.locationId || agentLocationId || freshDialer.location_id || '';
    const resolvedContactId = record.contact_id || urlInfo.contactId || '';

    const payload = {
      callId:             record.id,
      dialerId:           freshDialer.id,
      dialerName:         freshDialer.name,
      locationId:         resolvedLocationId,
      agentExtension:     record.agent_extension || '',
      agentId:            agentId,
      agentEmail:         agentEmail,
      agentName:          agentName,
      destination:        record.destination,
      contactId:          resolvedContactId,
      status:             record.status,
      durationSeconds:    record.duration_seconds || 0,
      recordingId:        record.recording_id || null,
      recordingUrl:       recordingUrl,
      recordingListenUrl: recordingListenUrl,
      pageUrl:            record.page_url || '',
      ipAddress:          record.ip_address || '',
      endedAt:            record.ended_at || null,
      timestamp:          new Date(),
      urlLocationId:      urlInfo.locationId,
      urlContactId:       urlInfo.contactId,
      urlQueryParams:     urlInfo.queryParams
    };

    for (const url of uniqueUrls) {
      try {
        await axios.post(url, payload, { timeout: 5000 });
        console.log(`[Dialer Webhook] Sent call update for ${record.id} to ${url}`);
      } catch (err) {
        console.error(`[Dialer Webhook] Failed to send update to ${url}:`, err.message);
      }
    }
  } catch (err) {
    console.error(`[Dialer Webhook] Global error in triggerDialerWebhook:`, err.message);
  }
}

/**
 * Searches the 3CX recordings list for a match and links it to the dialer call record.
 * Retries up to 4 times with a 5-second delay.
 */
async function fetchAndLinkDialerRecording(recordId, attempt = 1) {
  try {
    const record = await DialerCallRecord.findByPk(recordId, { include: [DialerWidget] });
    if (!record || !record.DialerWidget) return;
    
    const dialer = record.DialerWidget;
    if (!dialer.client_id_3cx || !dialer.client_secret_3cx) return;

    console.log(`[3CX Dialer] Searching call recording for destination ${record.destination} / call ${record.id} (Attempt ${attempt}/4)...`);

    const token = await get3cxToken(dialer);
    const fqdn = sanitizeFqdn(dialer.fqdn_3cx);
    const url = `https://${fqdn}/xapi/v1/Recordings?$top=45&$orderby=Id desc`;
    
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });

    const list = Array.isArray(resp.data) ? resp.data : (resp.data?.value || []);
    
    console.log(`[3CX Dialer] Total recordings fetched: ${list.length}.`);

    const matches = list.filter(r => {
      const fields = [
        r.FromCallerNumber,
        r.ToCallerNumber,
        r.FromDisplayName,
        r.ToDisplayName,
        r.RecordingUrl,
        r.FromDn,
        r.ToDn
      ];
      
      const callerText = fields.filter(Boolean).map(String).join(' | ').replace(/\D/g, '');
      const cleanPhone = record.destination.replace(/\D/g, '');
      const agentExt = record.agent_extension.replace(/\D/g, '');
      
      const phoneSuffix = cleanPhone.slice(-8);
      const phoneMatch = phoneSuffix && callerText.includes(phoneSuffix);
      const extMatch = agentExt && callerText.includes(agentExt);
      
      if (!phoneMatch || !extMatch) return false;

      const recDateStr = r.Date || r.date || r.StartTime || r.startTime || r.DateTime || r.dateTime;
      let timeMatch = true;
      if (recDateStr) {
        const recTime = new Date(recDateStr).getTime();
        const callTime = new Date(record.ended_at || record.updatedAt).getTime();
        const diffMs = Math.abs(recTime - callTime);
        timeMatch = diffMs < 12 * 60 * 60 * 1000;
      }

      return phoneMatch && timeMatch;
    });

    let match = null;
    if (matches.length > 0) {
      matches.sort((a, b) => {
        const idA = parseInt(a.Id || a.id || a.recId || 0, 10);
        const idB = parseInt(b.Id || b.id || b.recId || 0, 10);
        return idB - idA;
      });
      match = matches[0];
    }

    if (match) {
      const recId = String(match.Id || match.id || match.recId || '');
      if (recId) {
        console.log(`[3CX Dialer] Found recording ID ${recId} for call ${record.id}!`);
        record.recording_id = recId;
        const crypto = require('crypto');
        record.recording_token = crypto.randomBytes(32).toString('hex');
        await record.save();
        
        // Push update to webhook
        await triggerDialerWebhook(record, dialer);
      }
    } else {
      if (attempt < 4) {
        console.log(`[3CX Dialer] Recording not found yet. Retrying search (attempt ${attempt + 1}/4) in 5s...`);
        setTimeout(() => fetchAndLinkDialerRecording(recordId, attempt + 1), 5000);
      } else {
        console.log(`[3CX Dialer] Max recording search attempts reached. No matching recording found in the recent recordings list for call ${record.id}.`);
      }
    }
  } catch (err) {
    console.error('[3CX Dialer] Error fetching recordings list:', err.response?.data || err.message);
    if (attempt < 4) {
      console.log(`[3CX Dialer] Retrying search due to error (attempt ${attempt + 1}/4) in 5s...`);
      setTimeout(() => fetchAndLinkDialerRecording(recordId, attempt + 1), 5000);
    }
  }
}

/**
 * Polls 3CX ActiveCalls API every 4s to track live dialer calls and handle state transitions.
 */
async function pollActiveDialerCalls() {
  try {
    const { Op } = require('sequelize');
    const activeCalls = await DialerCallRecord.findAll({
      where: {
        status: {
          [Op.in]: ['Initiated', 'Ringing', 'Connected']
        }
      },
      include: [DialerWidget]
    });

    if (activeCalls.length === 0) return;

    const callsByDialer = {};
    for (const record of activeCalls) {
      if (!callsByDialer[record.dialerId]) {
        callsByDialer[record.dialerId] = {
          dialer: record.DialerWidget,
          records: []
        };
      }
      callsByDialer[record.dialerId].records.push(record);
    }

    for (const dialerId in callsByDialer) {
      const { dialer, records } = callsByDialer[dialerId];
      if (!dialer || !dialer.client_id_3cx || !dialer.client_secret_3cx) continue;

      for (const record of records) {
        try {
          const ageMinutes = (new Date() - new Date(record.updatedAt)) / 60000;
          if (ageMinutes > 10) {
            const oldStatus = record.status;
            record.status = oldStatus === 'Connected' ? 'Completed' : 'Failed';
            record.ended_at = new Date();
            await record.save();
            await triggerDialerWebhook(record, dialer);
            continue;
          }

          const ageSecondsSinceCreation = (Date.now() - new Date(record.createdAt).getTime()) / 1000;

          // Fetch extension participant status using call control
          const ccStatus = await checkDialerCallControlStatus(dialer, record.agent_extension, record.destination);

          if (ccStatus) {
            if (ccStatus.active) {
              const newStatus = ccStatus.connected ? 'Connected' : 'Ringing';
              if (record.status !== newStatus) {
                record.status = newStatus;
                await record.save();
                await triggerDialerWebhook(record, dialer);
              }
            } else {
              if (record.status === 'Connected') {
                console.log(`[3CX Dialer] Call ${record.id} ended talking. Marking Completed.`);
                record.status = 'Completed';
                record.ended_at = new Date();
                const start = new Date(record.updatedAt);
                record.duration_seconds = Math.max(1, Math.round((new Date() - start) / 1000));
                await record.save();
                await triggerDialerWebhook(record, dialer);

                setTimeout(() => fetchAndLinkDialerRecording(record.id), 5000);
              } else {
                // Wait at least 15 seconds before marking as failed if not found in active calls
                if (ageSecondsSinceCreation > 15) {
                  console.log(`[3CX Dialer] Call ${record.id} did not connect. Marking Failed.`);
                  record.status = 'Failed';
                  record.ended_at = new Date();
                  await record.save();
                  await triggerDialerWebhook(record, dialer);
                }
              }
            }
          }
        } catch (recordErr) {
          console.error(`[3CX Dialer] Error processing record ${record.id}:`, recordErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[3CX Dialer] Error in pollActiveDialerCalls loop:', err.message);
  }
}




/**
 * Fetch (or return cached) OAuth bearer token for a widget's 3CX server.
 * Auto-refreshes 5 minutes before expiry.
 */
async function get3cxToken(widget) {
  const cached = tokenCache[widget.id];
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.token;
  }

  const clientId     = widget.client_id_3cx;
  const clientSecret = widget.client_secret_3cx;
  const grantType    = widget.grant_type_3cx || 'client_credentials';

  if (!clientId || !clientSecret) {
    throw new Error('3CX OAuth credentials not configured for this widget.');
  }

  const fqdn     = sanitizeFqdn(widget.fqdn_3cx);
  const tokenUrl = `https://${fqdn}/connect/token`;

  const params   = new URLSearchParams({
    client_id:     clientId,
    client_secret: clientSecret,
    grant_type:    grantType,
  });

  const resp = await axios.post(tokenUrl, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 8000,
  });

  const { access_token, expires_in } = resp.data;
  tokenCache[widget.id] = {
    token:     access_token,
    expiresAt: Date.now() + (expires_in || 3600) * 1000,
  };
  console.log(`[3CX] Token refreshed for widget ${widget.id} (expires in ${expires_in}s)`);
  return access_token;
}

/**
 * Invalidate cached token (e.g. after credential update).
 */
function invalidate3cxToken(widgetId) {
  delete tokenCache[widgetId];
}

/**
 * Helper to execute 3CX Call Control makecall with automatic 401 retry & token cache invalidation
 */
async function execute3cxMakeCall(widgetOrDialer, extension, destination) {
  const fqdn = sanitizeFqdn(widgetOrDialer.fqdn_3cx);
  const callUrl = `https://${fqdn}/callcontrol/${encodeURIComponent(extension)}/makecall`;
  const payload = { destination: String(destination) };

  let token = await get3cxToken(widgetOrDialer);

  try {
    const res = await axios.post(callUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 8000
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 403) {
      console.error(`[3CX 403 Forbidden Error] 3CX denied permission to place call from Extension ${extension}.`, err.response?.data || '');
      console.error(`[3CX Fix Instruction] To resolve 403 Forbidden:\n` +
                    ` 1. In 3CX Console, go to Admin -> Integrations / System API Credentials.\n` +
                    ` 2. Ensure the Client ID is assigned 'System Owner' or 'System Administrator' role.\n` +
                    ` 3. In Users -> Ext ${extension} -> Rights, ensure Call Control / CTI operations are allowed.`);
    } else if (err.response?.status === 401) {
      console.warn(`[3CX CallControl] 401 Unauthorized for Ext ${extension}. Clearing token cache & retrying...`);
      invalidate3cxToken(widgetOrDialer.id);
      token = await get3cxToken(widgetOrDialer);
      try {
        const resRetry = await axios.post(callUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 8000
        });
        return resRetry.data;
      } catch (retryErr) {
        if (retryErr.response?.status === 401) {
          console.error(`[3CX 401 Unauthorized Error] 3CX rejected API token for extension ${extension}. Verify that Client ID/Secret has 'System Owner' permissions in 3CX and extension ${extension} is valid.`);
        }
        throw retryErr;
      }
    }
    throw err;
  }
}

/**
 * Fetches the list of Directory Numbers / Users from 3CX.
 * Tries the modern v20 /xapi/v1/Users endpoint first, then falls back to /xapi/v1/dnlist.
 */
async function fetch3cxDnList(widget) {
  const token = await get3cxToken(widget);
  const fqdn = sanitizeFqdn(widget.fqdn_3cx);
  
  // Try Users endpoint first
  try {
    const usersUrl = `https://${fqdn}/xapi/v1/Users`;
    const resp = await axios.get(usersUrl, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 4000,
    });
    const list = Array.isArray(resp.data) ? resp.data : (resp.data?.value || []);
    if (list.length > 0) return list;
  } catch (err) {
    if (err.response?.status !== 404) {
      console.log(`[3CX] /xapi/v1/Users failed with status ${err.response?.status}: ${err.message}`);
    }
  }

  // Fallback to dnlist
  const dnUrl = `https://${fqdn}/xapi/v1/dnlist`;
  const resp = await axios.get(dnUrl, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 4000,
  });
  return Array.isArray(resp.data) ? resp.data : (resp.data?.value || []);
}

/**
 * Helper to fetch all available (registered, not DND, and not busy on a call) agents for a widget.
 */
async function fetchAvailableAgents(widget) {
  if (!widget.Agents || widget.Agents.length === 0) {
    return [];
  }

  // 1. Fetch DN List
  const dnList = await fetch3cxDnList(widget);

  // 2. Fetch Active Calls list to filter out agents on a call
  let activeCalls = [];
  try {
    const token = await get3cxToken(widget);
    const activeUrl = `https://${sanitizeFqdn(widget.fqdn_3cx)}/xapi/v1/ActiveCalls`;
    const activeResp = await axios.get(activeUrl, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 4000,
    });
    activeCalls = Array.isArray(activeResp.data) ? activeResp.data : (activeResp.data?.value || []);
    console.log(`[3CX] ActiveCalls list fetched. Total active calls: ${activeCalls.length}`);
  } catch (err) {
    console.error('[3CX] Error fetching ActiveCalls list:', err.message);
  }

  const availableAgents = [];

  for (const agent of widget.Agents) {
    const extStr = String(agent.extension).trim();
    
    // Check user presence
    const dn = dnList.find(d =>
      String(d.Number || d.DN || d.Extension || d.number || '').trim() === extStr
    );

    if (dn) {
      const registered  = dn.IsRegistered !== false;
      const profileName = String(dn.CurrentProfileName || '').toLowerCase().trim();
      
      // Profiles allowed for widget routing
      const isAvailableProfile = profileName === '' || 
                                 profileName === 'available' || 
                                 profileName === 'default';

      if (!registered || !isAvailableProfile) {
        console.log(`[3CX] Agent ${agent.first_name} (${extStr}) filtered out: Registered=${registered}, Profile="${profileName}"`);
        continue;
      }
    }

    // Check active calls status (if agent extension is in Caller or Callee of any active call)
    const isOnActiveCall = activeCalls.some(c => {
      const caller = String(c.Caller || c.CallerID || c.callerId || '').trim();
      const callee = String(c.Callee || c.calleeId || '').trim();
      
      return caller === extStr ||
             callee === extStr ||
             caller.endsWith(`(${extStr})`) ||
             callee.endsWith(`(${extStr})`) ||
             caller.startsWith(`${extStr} `) ||
             callee.startsWith(`${extStr} `) ||
             new RegExp(`\\b${extStr}\\b`).test(caller) ||
             new RegExp(`\\b${extStr}\\b`).test(callee);
    });

    if (isOnActiveCall) {
      console.log(`[3CX] Agent ${agent.first_name} (${extStr}) filtered out: Busy on active call (found in ActiveCalls list).`);
      continue;
    }

    // Fallback: Check CallControl participants endpoint
    try {
      const ccState = await checkCallStatusViaCallControl(widget, agent.extension);
      if (ccState && ccState.active === true) {
        console.log(`[3CX] Agent ${agent.first_name} (${extStr}) filtered out: Busy on CallControl participants check.`);
        continue;
      }
    } catch (ccErr) {
      console.warn(`[3CX] CallControl participants fallback check failed for agent ${agent.extension}:`, ccErr.message);
    }

    // If passed all checks, agent is available
    availableAgents.push(agent);
  }

  return availableAgents;
}


// ─── Call Lifecycle Polling & Failover ────────────────────────────────────────

/**
 * Auto-retry the call with another available agent on the widget if the current agent misses/declines it.
 */
async function triggerFailoverCall(callRecord, widget) {
  try {
    // Find all agents configured on this widget
    const agents = await Agent.findAll({ where: { widgetId: widget.id } });
    if (!agents || agents.length === 0) {
      callRecord.status = 'Failed';
      callRecord.outcome = 'Missed';
      callRecord.ended_at = new Date();
      await callRecord.save();
      await triggerUserWebhook(callRecord, widget);
      return false;
    }

    // Parse agents already tried (comma-separated list of extensions, removing status suffixes)
    const triedExtensions = (callRecord.agent_extension || '').split(',').map(x => x.trim().split(':')[0]).filter(Boolean);
    const remainingAgents = agents.filter(a => !triedExtensions.includes(String(a.extension)));

    // Maximum 3 retries or run out of remaining agents
    if (remainingAgents.length === 0 || (callRecord.retry_count || 0) >= 3) {
      console.log(`[3CX] Call ${callRecord.id} missed by all available agents. Marking Failed.`);
      callRecord.status = 'Failed';
      callRecord.outcome = 'Missed';
      callRecord.ended_at = new Date();
      await callRecord.save();
      await triggerUserWebhook(callRecord, widget);
      return false;
    }

    // Pick next agent randomly from remaining ones
    const newAgent = remainingAgents[Math.floor(Math.random() * remainingAgents.length)];
    const oldExt = triedExtensions[triedExtensions.length - 1] || 'default';
    console.log(`[3CX] Call ${callRecord.id} missed/declined by Ext ${oldExt}. Auto-retrying with ${newAgent.first_name} (Ext ${newAgent.extension})...`);

    const responseData = await execute3cxMakeCall(widget, newAgent.extension, callRecord.customer_phone);

    const newCallId = responseData?.result?.callid || responseData?.result?.id || responseData?.callid;

    // Append extension to tracking field, update call ID and increment retry count
    callRecord.agent_extension = `${callRecord.agent_extension || ''}, ${newAgent.extension}`.trim().replace(/^,/, '');
    callRecord.cx_call_id = newCallId ? String(newCallId) : null;
    callRecord.status = 'Ringing';
    callRecord.retry_count = (callRecord.retry_count || 0) + 1;
    await callRecord.save();
    await triggerUserWebhook(callRecord, widget);
    return true;
  } catch (err) {
    console.error(`[3CX] Failover call to Ext failed:`, err.message);
    callRecord.status = 'Failed';
    callRecord.outcome = 'Failed';
    callRecord.ended_at = new Date();
    await callRecord.save();
    await triggerUserWebhook(callRecord, widget);
    return false;
  }
}

/**
 * Fallback Call Status Checker: queries participants of a single extension
 * via the Call Control API. This works even when global activecalls OData is 403.
 */
async function checkCallStatusViaCallControl(widget, extension, cxCallId, customerPhone) {
  try {
    const token = await get3cxToken(widget);
    const url = `https://${sanitizeFqdn(widget.fqdn_3cx)}/callcontrol/${encodeURIComponent(extension)}/participants`;
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 4000
    });

    const participants = resp.data || [];
    if (participants.length > 0) {
      // Filter the participants list to include only those belonging to this call (by CallId or matching customer phone suffix)
      let filteredParticipants = participants;
      if (cxCallId || customerPhone) {
        filteredParticipants = participants.filter(p => {
          // 1. Match by call ID
          const pCallId = String(p.CallId || p.callId || p.callid || p.Id || p.id || '');
          if (cxCallId && pCallId && pCallId === String(cxCallId)) {
            return true;
          }
          
          // 2. Match by customer phone suffix (last 8 digits to handle country code differences)
          if (customerPhone) {
            const cleanPhone = customerPhone.replace(/\D/g, '');
            const phoneSuffix = cleanPhone.slice(-8);
            if (phoneSuffix) {
              const fields = [
                p.PartyDn, p.partyDn, p.DN, p.dn, p.Number, p.number, p.party_caller_id,
                p.Caller, p.CallerID, p.callerId, p.Callee, p.calleeId,
                p.PartyCallerName, p.party_caller_name
              ];
              const searchableText = fields.filter(Boolean).map(String).join(' | ').replace(/\D/g, '');
              if (searchableText.includes(phoneSuffix)) {
                return true;
              }
            }
          }
          
          return false;
        });
      }

      if (filteredParticipants.length > 0) {
        // Find the participant representing the agent's extension
        const agentExtStr = String(extension).trim();
        const agentPart = filteredParticipants.find(p => {
          const pDn = String(p.PartyDn || p.partyDn || p.DN || p.dn || p.Number || p.number || '').trim();
          return pDn === agentExtStr;
        });

        if (agentPart) {
          const state = String(agentPart.State || agentPart.state || agentPart.Status || agentPart.status || '').toLowerCase().trim();
          const isConnected = state === 'connected' || state === 'talking' || state === 'established';
          const isRinging = state === 'ringing' || state === 'dialing' || state === 'invited';
          console.log(`[3CX] Extension ${agentExtStr} CallControl status for Call ${cxCallId || 'any'}: "${state}" (connected=${isConnected}, ringing=${isRinging})`);
          return { active: true, connected: isConnected, ringing: isRinging };
        }

        // Fallback: if agent participant is not found in the list, check if any participant in the filtered list is connected
        let isConnected = false;
        let isRinging = false;
        for (const p of filteredParticipants) {
          const state = String(p.State || p.state || p.Status || p.status || '').toLowerCase().trim();
          if (state === 'connected' || state === 'talking' || state === 'established') {
            isConnected = true;
          } else if (state === 'ringing' || state === 'dialing' || state === 'invited') {
            isRinging = true;
          }
        }
        return { active: true, connected: isConnected, ringing: isRinging };
      } else {
        // Active participants exist on extension, but none belong to this call id (agent is busy on another call)
        console.log(`[3CX] Extension ${extension} is busy on another call (active call participants present but do not match CallId ${cxCallId}).`);
        return { active: false, busy: true };
      }
    }
    return { active: false };
  } catch (err) {
    console.error(`[3CX] Failed checkCallStatusViaCallControl for Ext ${extension}:`, err.message);
    return null; // Return null to indicate the check itself failed
  }
}

/**
 * Specifically checks the state of a dialer call via extension participants.
 * Distinguishes between agent-ringing phase, customer-ringing phase, and customer-connected phase.
 */
async function checkDialerCallControlStatus(dialer, extension, destination) {
  try {
    const token = await get3cxToken(dialer);
    const url = `https://${sanitizeFqdn(dialer.fqdn_3cx)}/callcontrol/${encodeURIComponent(extension)}/participants`;
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 4000
    });

    const participants = resp.data || [];
    console.log(`[3CX Dialer CC Debug] Ext ${extension} participants:`, JSON.stringify(participants));
    if (participants.length === 0) {
      return { active: false };
    }

    const agentExtStr = String(extension).trim();
    // Find the participant representing the agent's extension (p.dn)
    const agentPart = participants.find(p => {
      const pDn = String(p.dn || p.DN || p.PartyDn || p.partyDn || '').trim();
      return pDn === agentExtStr;
    });

    if (agentPart) {
      const state = String(agentPart.status || agentPart.Status || agentPart.state || agentPart.State || '').toLowerCase().trim();
      const isConnected = state === 'connected' || state === 'talking' || state === 'established';
      const isRinging = state === 'ringing' || state === 'dialing' || state === 'invited' || state === 'routing' || state === 'initiating';
      
      console.log(`[3CX Dialer CC] Ext ${extension} state: "${state}" (connected=${isConnected}, ringing=${isRinging})`);
      return { active: true, connected: isConnected, ringing: isRinging };
    }

    // Fallback if agentPart is not found but there are active participants
    return { active: true, connected: false, ringing: true };
  } catch (err) {
    console.error(`[3CX Dialer CC] Failed checking CallControl for Ext ${extension}:`, err.message);
    return null;
  }
}


function updateLastAgentStatus(agentExtensionStr, status) {
  if (!agentExtensionStr) return '';
  const parts = agentExtensionStr.split(',').map(x => x.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  const lastIndex = parts.length - 1;
  const lastPart = parts[lastIndex];
  const ext = lastPart.split(':')[0];
  parts[lastIndex] = `${ext}:${status}`;
  return parts.join(', ');
}

/**
 * Searches the 3CX recordings list for a match and links it to the call record.
 * Retries up to 4 times with a 5-second delay to handle PBX write latency.
 */
async function fetchAndLinkRecording(recordId, attempt = 1) {
  try {
    const record = await CallRecord.findByPk(recordId, { include: [Widget] });
    if (!record || !record.Widget) return;
    
    const widget = record.Widget;
    if (!widget.client_id_3cx || !widget.client_secret_3cx) return;

    console.log(`[3CX] Searching call recording for customer ${record.customer_phone} / call ${record.id} (Attempt ${attempt}/4)...`);

    const token = await get3cxToken(widget);
    const fqdn = sanitizeFqdn(widget.fqdn_3cx);
    // Fetch recent recordings (limit to top 45, sorted descending by ID so we get the newest ones first)
    const url = `https://${fqdn}/xapi/v1/Recordings?$top=45&$orderby=Id desc`;
    
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });

    const list = Array.isArray(resp.data) ? resp.data : (resp.data?.value || []);
    
    console.log(`[3CX] Total recordings fetched: ${list.length}. Sample:`, JSON.stringify(list.slice(0, 2), null, 2));

    // Find matching recordings using multi-factor criteria:
    const matches = list.filter(r => {
      // Aggregate all V20 caller/participant and URL properties into a single searchable string
      const fields = [
        r.FromCallerNumber,
        r.ToCallerNumber,
        r.FromDisplayName,
        r.ToDisplayName,
        r.RecordingUrl,
        r.FromDn,
        r.ToDn
      ];
      
      const callerText = fields.filter(Boolean).map(String).join(' | ').replace(/\D/g, '');
      const cleanPhone = record.customer_phone.replace(/\D/g, '');
      
      // Compare the last 8 digits to handle international/local country code prefix differences (e.g. +971 vs 0 vs no prefix)
      const phoneSuffix = cleanPhone.slice(-8);
      const phoneMatch = phoneSuffix && callerText.includes(phoneSuffix);
      if (!phoneMatch) return false;

      // Time match (ensures the recording timestamp is close to call end time, timezone-tolerant 12h window)
      const recDateStr = r.Date || r.date || r.StartTime || r.startTime || r.DateTime || r.dateTime;
      let timeMatch = true;
      if (recDateStr) {
        const recTime = new Date(recDateStr).getTime();
        const callTime = new Date(record.ended_at || record.updatedAt).getTime();
        const diffMs = Math.abs(recTime - callTime);
        timeMatch = diffMs < 12 * 60 * 60 * 1000;
      }

      return phoneMatch && timeMatch;
    });

    let match = null;
    if (matches.length > 0) {
      // Sort matches descending by ID (highest ID represents the newest recording)
      matches.sort((a, b) => {
        const idA = parseInt(a.Id || a.id || a.recId || 0, 10);
        const idB = parseInt(b.Id || b.id || b.recId || 0, 10);
        return idB - idA;
      });
      match = matches[0];
    }

    if (match) {
      const recId = String(match.Id || match.id || match.recId || '');
      if (recId) {
        console.log(`[3CX] Found recording ID ${recId} for call ${record.id}!`);
        record.recording_id = recId;
        const crypto = require('crypto');
        record.recording_token = crypto.randomBytes(32).toString('hex');
        await record.save();
        
        // Push update to webhook.site / n8n so they get the download link!
        await triggerUserWebhook(record, widget);
      }
    } else {
      if (attempt < 4) {
        console.log(`[3CX] Recording not found yet. Retrying search (attempt ${attempt + 1}/4) in 5s...`);
        setTimeout(() => fetchAndLinkRecording(recordId, attempt + 1), 5000);
      } else {
        console.log(`[3CX] Max recording search attempts reached. No matching recording found in the recent recordings list for call ${record.id}.`);
      }
    }
  } catch (err) {
    console.error('[3CX] Error fetching recordings list:', err.response?.data || err.message);
    if (attempt < 4) {
      console.log(`[3CX] Retrying search due to error (attempt ${attempt + 1}/4) in 5s...`);
      setTimeout(() => fetchAndLinkRecording(recordId, attempt + 1), 5000);
    }
  }
}


/**
 * Polls 3CX ActiveCalls API every 4s to track live calls and handle state transitions.
 */
async function pollActiveCalls() {
  try {
    const { Op } = require('sequelize');
    // Find all calls currently in progress
    const activeCalls = await CallRecord.findAll({
      where: {
        status: {
          [Op.in]: ['Initiated', 'Ringing', 'Answered']
        }
      },
      include: [Widget]
    });

    if (activeCalls.length === 0) return;

    // Group calls by widgetId so we perform at most one request per widget per loop iteration
    const callsByWidget = {};
    for (const record of activeCalls) {
      if (!callsByWidget[record.widgetId]) {
        callsByWidget[record.widgetId] = {
          widget: record.Widget,
          records: []
        };
      }
      callsByWidget[record.widgetId].records.push(record);
    }

    for (const widgetId in callsByWidget) {
      const { widget, records } = callsByWidget[widgetId];
      if (!widget || !widget.client_id_3cx || !widget.client_secret_3cx) continue;

      try {
        let activeList = [];
        try {
          const token = await get3cxToken(widget);
          const activeUrl = `https://${sanitizeFqdn(widget.fqdn_3cx)}/xapi/v1/ActiveCalls`;
          const activeResp = await axios.get(activeUrl, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 4500,
          });
          activeList = Array.isArray(activeResp.data)
            ? activeResp.data
            : (activeResp.data?.value || []);
        } catch (apiErr) {
          console.log(`[3CX] ActiveCalls query failed (will fallback to Call Control):`, apiErr.message);
        }

        for (const record of records) {
          // Safety Timeout: if call is stuck in progress for over 10m, close it
          const ageMinutes = (new Date() - new Date(record.updatedAt)) / 60000;
          if (ageMinutes > 10) {
            record.status = record.status === 'Answered' ? 'Completed' : 'Failed';
            record.outcome = record.status === 'Completed' ? 'Answered' : 'Missed';
            record.ended_at = new Date();
            await record.save();
            continue;
          }

          const ageSeconds = (Date.now() - new Date(record.updatedAt).getTime()) / 1000;

          // 1. Try to check global active list first
          let cxCall = null;
          if (activeList.length > 0) {
            cxCall = activeList.find(c => {
              const cId = String(c.CallId || c.callid || c.id || '');
              const recId = String(record.cx_call_id || '');
              if (recId && cId === recId) return true;

              const partyId = String(c.CallerID || c.callerId || c.party_caller_id || c.From || '');
              if (record.customer_phone && partyId.includes(record.customer_phone)) return true;
              return false;
            });
          }

          // 2. If found in global activeList, process state transitions
          if (cxCall) {
            const state = String(cxCall.State || cxCall.state || cxCall.status || '').toLowerCase();
            const established = cxCall.Established || cxCall.established || cxCall.EstablishedAt || cxCall.establishedAt ||
                                (state === 'connected' || state === 'talking' || state === 'established');

            if (established && record.status !== 'Answered') {
              console.log(`[3CX] Call ${record.id} answered.`);
              record.status = 'Answered';
              record.outcome = 'Answered';
              record.agent_extension = updateLastAgentStatus(record.agent_extension, 'answered');
              await record.save();
              await triggerUserWebhook(record, widget);
            } else if (!established && record.status === 'Initiated') {
              record.status = 'Ringing';
              await record.save();
            }
            continue; // Successfully handled from active list!
          }

          // 3. Fallback: If NOT found in activeList (or query failed), check Extension participants
          try {
            const triedExts = (record.agent_extension || '').split(',').map(x => x.trim().split(':')[0]).filter(Boolean);
            const lastExt = triedExts[triedExts.length - 1];

            if (lastExt) {
              const ccState = await checkCallStatusViaCallControl(widget, lastExt, record.cx_call_id, record.customer_phone);

              if (ccState) {
                if (ccState.active) {
                  if (ccState.connected && record.status !== 'Answered') {
                    console.log(`[3CX] Call ${record.id} answered (detected via extension ${lastExt} participants fallback).`);
                    record.status = 'Answered';
                    record.outcome = 'Answered';
                    record.agent_extension = updateLastAgentStatus(record.agent_extension, 'answered');
                    await record.save();
                    await triggerUserWebhook(record, widget);
                  } else if (!ccState.connected && (record.status === 'Initiated' || record.status === 'Ringing')) {
                    record.status = 'Ringing';
                    await record.save();

                    // If still ringing and exceeded user timeout limit, trigger next agent
                    const timeoutLimit = widget.ring_timeout_seconds || 40;
                    if (ageSeconds > timeoutLimit) {
                      console.log(`[3CX] Ring timeout (${timeoutLimit}s) exceeded on extension ${lastExt} for call ${record.id}. Retrying next.`);
                      record.agent_extension = updateLastAgentStatus(record.agent_extension, 'missed');
                      await record.save();
                      await triggerFailoverCall(record, widget);
                    }
                  }
                } else {
                  // Extension has no active call participants (call ended on extension or busy)
                  if (record.status === 'Answered') {
                    console.log(`[3CX] Call ${record.id} ended talking. Marking Completed.`);
                    record.status = 'Completed';
                    record.outcome = 'Answered';
                    record.ended_at = new Date();
                    const start = new Date(record.updatedAt);
                    record.duration_seconds = Math.max(1, Math.round((new Date() - start) / 1000));
                    await record.save();
                    await triggerUserWebhook(record, widget);
                    
                    // Search and link recording after 5s settle delay
                    setTimeout(() => fetchAndLinkRecording(record.id), 5000);
                  } else {
                    if (ageSeconds < 12) {
                      console.log(`[3CX] Call ${record.id} not active on extension ${lastExt} yet (age ${Math.round(ageSeconds)}s). Waiting.`);
                      continue;
                    }
                    const isBusy = ccState.busy === true;
                    const outcomeStatus = isBusy ? 'busy' : 'missed';
                    console.log(`[3CX] Call ${record.id} went unanswered/busy (${outcomeStatus}) on extension ${lastExt}. Triggering failover.`);
                    record.agent_extension = updateLastAgentStatus(record.agent_extension, outcomeStatus);
                    await record.save();
                    await triggerFailoverCall(record, widget);
                  }
                }
                continue; // Successfully handled via Extension check!
              }
            }
          } catch (ccErr) {
            console.error(`[3CX] Extension status check failed for call ${record.id}:`, ccErr.message);
          }

          // 4. Double Fallback: if both activeList and participants checks failed (e.g. timeout / network errors)
          if (record.status === 'Initiated' || record.status === 'Ringing') {
            if (ageSeconds < 12) {
              console.log(`[3CX] Call ${record.id} not verified yet (age ${Math.round(ageSeconds)}s). Waiting.`);
              continue;
            }
            console.log(`[3CX] Call ${record.id} unanswered (no active status found). Triggering failover.`);
            record.agent_extension = updateLastAgentStatus(record.agent_extension, 'missed');
            await record.save();
            await triggerFailoverCall(record, widget);
          } else if (ageSeconds > 240) {
            record.status = record.status === 'Answered' ? 'Completed' : 'Failed';
            record.outcome = record.status === 'Completed' ? 'Answered' : 'Missed';
            record.ended_at = new Date();
            await record.save();
            await triggerUserWebhook(record, widget);
          }
        }
      } catch (widgetErr) {
        console.error(`[3CX] Global error in widget ${widgetId} active call processing:`, widgetErr.message);
      }
    }
  } catch (err) {
    console.error('[3CX] Error in pollActiveCalls loop:', err.message);
  }
}

// Start active call polling interval
setInterval(pollActiveCalls, 4000);
setInterval(pollActiveDialerCalls, 4000);
// ─────────────────────────────────────────────────────────────────────────────



let lastKnownAppUrl = process.env.APP_URL || process.env.FRONTEND_URL || '';

function getAppUrl(req) {
  if (process.env.APP_URL && !process.env.APP_URL.includes('localhost')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (req) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      return `${proto}://${host}`.replace(/\/$/, '');
    }
  }
  if (lastKnownAppUrl && !lastKnownAppUrl.includes('localhost')) {
    return lastKnownAppUrl.replace(/\/$/, '');
  }
  if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) {
    return process.env.FRONTEND_URL.replace(/\/$/, '');
  }
  return 'https://3cx.netxsites.com';
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    lastKnownAppUrl = `${proto}://${host}`;
  }
  next();
});

// Serve dialer-embed.js and dialer.html with disabled cache
app.get('/dialer-embed.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, 'public/dialer-embed.js'));
});

app.get('/dialer.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, 'public/dialer.html'));
});

// Serve Vue admin-dist FIRST so /assets/ JS/CSS resolve correctly
app.use(express.static(path.join(__dirname, 'public/admin-dist')));
// Then serve other public files (widget.css, widget-template.js etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Redirect old admin.html to the Vue SPA root
app.get('/admin.html', (req, res) => {
  res.redirect('/');
});

// Root → Vue admin SPA
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, 'public/admin-dist/index.html'));
});

// Preview endpoint
app.get('/preview/:id', (req, res) => {
  const widgetId = req.params.id;
  const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost:3000';
  const fallbackUrl = `//${host}`;
  const serverUrl = process.env.FRONTEND_URL || fallbackUrl;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Widget Preview</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/css/intlTelInput.min.css">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            header { background-color: #0b4526; color: white; padding: 20px; text-align: center; }
            .container { max-width: 800px; margin: 40px auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        </style>
    </head>
    <body>
    <header>
        <h1>Preview Website</h1>
        <p>Testing your 3CX Widget</p>
    </header>
    <div class="container">
        <h2>Widget ID: ${widgetId}</h2>
        <p>You should see the floating button on the bottom right. Test the form to verify calls are routed to your agents.</p>
    </div>
    <script src="${serverUrl}/widget.js?id=${widgetId}"></script>
    </body>
    </html>
  `);
});

// 1. Serve dynamic widget.js
app.get('/widget.js', async (req, res) => {
  const widgetId = req.query.id;
  if (!widgetId) {
    return res.status(400).send('console.error("Widget ID is required");');
  }
  
  try {
    const widget = await Widget.findByPk(widgetId);
    if (!widget) {
      return res.status(404).send('console.error("Widget not found");');
    }

    const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost:3000';
    const fallbackUrl = `//${host}`;
    const frontendUrl = process.env.FRONTEND_URL || fallbackUrl;
    const fs = require('fs');
    const widgetScriptPath = path.join(__dirname, 'public', 'widget-template.js');
    let scriptContent = fs.readFileSync(widgetScriptPath, 'utf8');
    
    const isClosed = !isOfficeHours(widget);
    
    // Replace all dynamic placeholders
    const replacements = {
      '__WIDGET_ID__': widgetId,
      '__SERVER_URL__': frontendUrl,
      '__COLOR_PRIMARY__': widget.color_primary || '#0b4526',
      '__COLOR_BUTTON_TEXT__': widget.color_button_text || '#ffffff',
      '__WIDGET_TITLE__': (widget.widget_title || 'Need Expert Business Setup Advice?').replace(/'/g, "\\'"),
      '__WIDGET_SUBTITLE__': (widget.widget_subtitle || "We'll Call You in 55 Seconds! 📞").replace(/'/g, "\\'"),
      '__WIDGET_BUTTON_TEXT__': (widget.widget_button_text || 'Call me!').replace(/'/g, "\\'"),
      '__WIDGET_SUCCESS_TITLE__': (widget.widget_success_title || 'Calling you now...').replace(/'/g, "\\'"),
      '__WIDGET_SUCCESS_MSG__': (widget.widget_success_msg || 'Please keep your phone nearby.').replace(/'/g, "\\'"),
      '__TOOLTIP_TEXT__': (widget.tooltip_text || "Let's Talk!").replace(/'/g, "\\'"),
      '__TOOLTIP_AUTOHIDE__': widget.tooltip_autohide !== false ? 'true' : 'false',
      '__TOOLTIP_AUTOHIDE_SEC__': String(widget.tooltip_autohide_seconds || 15),
      '__COUNTRY_CODE__': widget.country_code || '+971',
      '__COUNTRY_FLAG__': widget.country_flag || '🇦🇪',
      '__REQUIRE_EMAIL__': widget.require_email ? 'true' : 'false',
      '__REQUIRE_LASTNAME__': widget.require_lastname ? 'true' : 'false',
      '__LOGO_URL__': widget.logo_url || '',
      '__POSITION__': widget.position || 'bottom-right',
      '__POPUP_STYLE__': widget.popup_style || 'corner',
      '__BORDER_RADIUS__': String(widget.border_radius ?? 16),
      '__BTN_SIZE__': String(widget.btn_size ?? 60),
      '__FONT_FAMILY__': widget.font_family || 'Inter',
      '__SHOW_AGENT__': widget.show_agent !== false ? 'true' : 'false',
      '__AVATAR_SHAPE__': widget.avatar_shape || 'circle',
      '__AVATAR_BORDER_COLOR__': widget.avatar_border_color || '#0b4526',
      '__AGENT_STATUS_TEXT__': (widget.agent_status_text || 'Will answer your call').replace(/'/g, "\\'"),
      '__FIELDS_ORDER__': widget.fields_order || 'first_name,last_name,email,phone',
      '__ANIMATION_STYLE__': widget.animation_style || 'pulse',
      '__TOOLTIP_STYLE__': widget.tooltip_style || 'classic',
      '__OVERLAY_BLUR__': String(widget.overlay_blur ?? 3),
      '__CUSTOM_CSS__': (widget.custom_css || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' '),
      '__SHOW_BRANDING__': widget.show_branding !== false ? 'true' : 'false',
      '__BRANDING_TEXT__': (widget.branding_text || 'Powered by 3CX Widget').replace(/'/g, "\\'"),
      '__BRANDING_URL__': (widget.branding_url || 'https://3cx.com').replace(/'/g, "\\'"),
      '__THEME_STYLE__': widget.theme_style || 'classic',
      '__AGENT_BG_URL__': widget.agent_bg_url || '',
      '__WIDGET_WIDTH__': String(widget.widget_width ?? 345),
      '__WIDGET_HEIGHT__': widget.widget_height ? String(widget.widget_height) : 'auto',
      '__LOGO_HEIGHT__': widget.logo_height ? String(widget.logo_height) : '36',
      '__LOGO_WIDTH__': widget.logo_width ? String(widget.logo_width) : 'auto',
      '__ICON_SUCCESS_HTML__': (widget.icon_success_html || '&#x2705;').replace(/'/g, "\\'"),
      '__ICON_FAILED_HTML__': (widget.icon_failed_html || '&#x274C;').replace(/'/g, "\\'"),
      '__ICON_SUCCESS_STYLE__': (widget.icon_success_style || '').replace(/'/g, "\\'").replace(/__PRIMARY__/g, widget.color_primary || '#0b4526'),
      '__ICON_FAILED_STYLE__': (widget.icon_failed_style || '').replace(/'/g, "\\'"),
      '__OFFICE_CLOSED__': isClosed ? 'true' : 'false',
      '__OFFICE_OUT_TITLE__': (widget.office_hours_out_title || 'Office Closed').replace(/'/g, "\\'"),
      '__OFFICE_OUT_SUBTITLE__': (widget.office_hours_out_subtitle || 'We are currently offline. Please leave your details below and we will contact you during business hours!').replace(/'/g, "\\'"),
      '__OFFICE_OUT_MSG__': (widget.office_hours_out_msg || 'We have received your inquiry. You will be contacted shortly during business hours!').replace(/'/g, "\\'"),
      '__OFFICE_OUT_STATUS__': (widget.office_hours_out_status || "We're Offline").replace(/'/g, "\\'"),
      '__OFFICE_OUT_SUB__': (widget.office_hours_out_sub || "Leave a message and we'll reply during business hours!").replace(/'/g, "\\'"),
      '__AGENT_ROTATION_ENABLED__': widget.agent_rotation_enabled !== false ? 'true' : 'false',
      '__RING_TIMEOUT__': String(widget.ring_timeout_seconds ?? 55),
    };
    for (const [key, val] of Object.entries(replacements)) {
      // Use split/join to replace all occurrences globally
      scriptContent = scriptContent.split(key).join(val);
    }
    
    res.setHeader('Content-Type', 'application/javascript');
    res.send(scriptContent);
  } catch (err) {
    console.error(err);
    res.status(500).send('console.error("Internal Server Error");');
  }
});

// 1.5 API to get available agent
app.get('/api/widget/:id/available-agent', async (req, res) => {
  const widgetId = req.params.id;
  try {
    const widget = await Widget.findByPk(widgetId, { include: [Agent] });
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    if (!widget.Agents || widget.Agents.length === 0) {
      return res.json({ agent: null });
    }

    let availableAgent = null;

    try {
      const availableAgents = await fetchAvailableAgents(widget);
      if (availableAgents.length > 0) {
        availableAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
      }
    } catch (err) {
      console.error('[3CX] Error checking agent availability, falling back to random agent:', err.message);
      availableAgent = widget.Agents[Math.floor(Math.random() * widget.Agents.length)];
    }

    if (availableAgent) {
      res.json({
        agent: {
          extension: availableAgent.extension,
          firstName: availableAgent.first_name,
          lastName: availableAgent.last_name,
          avatarUrl: availableAgent.avatar_url
        }
      });
    } else {
      res.json({ agent: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get ALL available agents for a widget (for round-robin cycling)
app.get('/api/widget/:id/available-agents', async (req, res) => {
  const widgetId = req.params.id;
  try {
    const widget = await Widget.findByPk(widgetId, { include: [Agent] });
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    if (!widget.Agents || widget.Agents.length === 0) {
      return res.json({ agents: [] });
    }

    let availableAgents = [];

    try {
      availableAgents = await fetchAvailableAgents(widget);
    } catch (err) {
      console.error('[3CX] Error checking agent availability list, falling back to all widget agents:', err.message);
      availableAgents = widget.Agents;
    }

    const list = availableAgents.map(a => ({
      extension: a.extension,
      firstName: a.first_name,
      lastName: a.last_name,
      avatarUrl: a.avatar_url
    }));

    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    res.json({ agents: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Phone Validation Helper: ensures string has 7 to 15 digits and contains no alphabets
function isValidPhoneNumber(phone) {
  if (!phone || (typeof phone !== 'string' && typeof phone !== 'number')) return false;
  const str = String(phone).trim();
  if (/[a-zA-Z]/.test(str)) return false;
  const cleanDigits = str.replace(/[\s\-\+\(\)\.]/g, '');
  return /^\d{7,15}$/.test(cleanDigits);
}

// In-Memory IP Rate Limiter for /api/call
const callIpRateMap = new Map();
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  for (const [ip, timestamps] of callIpRateMap.entries()) {
    const valid = timestamps.filter(ts => now - ts < windowMs);
    if (valid.length === 0) {
      callIpRateMap.delete(ip);
    } else {
      callIpRateMap.set(ip, valid);
    }
  }
}, 15 * 60 * 1000);

function isIpRateLimited(clientIp, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const timestamps = callIpRateMap.get(clientIp) || [];
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
  
  if (validTimestamps.length >= limit) {
    return true; // Rate limited
  }
  
  validTimestamps.push(now);
  callIpRateMap.set(clientIp, validTimestamps);
  return false;
}

// 2. API to initiate the call
app.post('/api/call', async (req, res) => {
  const { widgetId, firstName, lastName, email, phone, agentExtension, website_hp_confirm, website, fax } = req.body;

  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || req.ip || '';
  const userAgent = req.get('user-agent') || '';
  const origin = req.get('origin') || '';
  const referer = req.get('referer') || '';

  // 1. Anti-Postman & API Tool Detection
  const isApiClient = /PostmanRuntime|Insomnia|curl|PyHTTP|python-requests|Go-http-client|axios|HttpClient|Wget/i.test(userAgent);
  if (isApiClient) {
    console.warn(`[Security] API Client tool detected (${userAgent}) from IP ${clientIp}. Blocking Postman request.`);
    return res.status(403).json({ error: 'Access denied. Calls must be initiated from the official web widget.' });
  }

  // 2. Origin & Referer Verification: Real browser fetch POST requests always send Origin or Referer
  if (!origin && !referer) {
    console.warn(`[Security] Direct request missing Origin and Referer from IP ${clientIp}. Blocking request.`);
    return res.status(403).json({ error: 'Access denied. Direct API requests are not allowed.' });
  }

  if (origin.startsWith('chrome-extension://') || origin.toLowerCase().includes('postman')) {
    console.warn(`[Security] Postman extension origin (${origin}) from IP ${clientIp}. Blocking request.`);
    return res.status(403).json({ error: 'Access denied. Unauthorized origin.' });
  }

  // 3. IP Rate Limiting: Max 5 call requests per 15 minutes per IP
  if (isIpRateLimited(clientIp, 5, 15 * 60 * 1000)) {
    console.warn(`[Security] IP Rate limit exceeded for IP ${clientIp}`);
    return res.status(429).json({ error: 'Too many call attempts from this IP. Please try again in 15 minutes.' });
  }

  // 4. Honeypot Anti-Bot Protection: Real human visitors cannot see or fill hidden fields
  const honeypotTriggered = (website_hp_confirm && String(website_hp_confirm).trim() !== '') ||
                            (website && String(website).trim() !== '') ||
                            (fax && String(fax).trim() !== '');

  if (honeypotTriggered) {
    console.warn(`[Security] Spam Bot Honeypot triggered from IP ${clientIp} for Widget ${widgetId}`);
    // Return fake success response so bot doesn't retry, without creating a call record or touching 3CX
    return res.json({ success: true, message: 'Call initiated successfully', callId: null });
  }

  // 5. Spam Pattern Check: Reject inputs with embedded spam website URLs
  const containsUrlPattern = /(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|ru|xyz|top|online|site|info))/i;
  if (containsUrlPattern.test(firstName) || containsUrlPattern.test(lastName || '') || containsUrlPattern.test(phone)) {
    console.warn(`[Security] Spam URL detected in form input from IP ${clientIp}`);
    return res.json({ success: true, message: 'Call initiated successfully', callId: null });
  }

  if (!widgetId || !firstName || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isValidPhoneNumber(phone)) {
    return res.status(400).json({ error: 'Invalid phone number. Please enter a valid telephone number with 7 to 15 digits.' });
  }

  try {
    const widget = await Widget.findByPk(widgetId);
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    const pageUrl  = req.body.pageUrl || req.get('referer') || req.get('origin') || '';

    // Save call record
    const callRecord = await CallRecord.create({
      widgetId: widget.id,
      customer_name: `${firstName} ${lastName || ''}`.trim(),
      customer_email: email || '',
      customer_phone: phone,
      page_url: pageUrl,
      ip_address: clientIp,
      status: 'Initiated'
    });

    // Check office hours: If closed, skip 3CX call control and save as offline lead
    const isClosed = !isOfficeHours(widget);
    if (isClosed) {
      callRecord.status = 'Completed';
      callRecord.outcome = 'Lead';
      callRecord.ended_at = new Date();
      await callRecord.save();

      // Trigger Webhooks immediately for the offline lead
      await triggerUserWebhook(callRecord, widget);

      return res.json({ success: true, isLead: true, message: 'Lead captured successfully' });
    }

    // ── 3CX Call Control API: makecall via agent extension ───────────────────
    // POST /callcontrol/{extension}/makecall
    // The agent's phone rings first, then 3CX bridges to the customer.
    const ext = agentExtension || widget.agent_extension_3cx || '';
    if (!ext) {
      callRecord.status = 'Failed';
      callRecord.outcome = 'Failed';
      await callRecord.save();
      return res.status(400).json({ error: 'No agent extension configured for this widget.' });
    }

    try {
      const responseData = await execute3cxMakeCall(widget, ext, phone);

      console.log('[3CX] Call initiated:', responseData);

      // Save initial tracking info to the call record
      const cxCallId = responseData?.result?.callid || responseData?.result?.id || responseData?.callid;
      callRecord.cx_call_id = cxCallId ? String(cxCallId) : null;
      callRecord.agent_extension = ext;
      callRecord.status = 'Ringing';
      await callRecord.save();
      await triggerUserWebhook(callRecord, widget);

      res.json({ success: true, message: 'Call initiated successfully', callId: callRecord.id });
    } catch (err3cx) {
      console.error('[3CX] makecall failed:', err3cx.response?.data || err3cx.message);

      // Log failure/missed status for the first extension
      callRecord.agent_extension = `${ext}:missed`;
      await callRecord.save();

      // Trigger failover immediately to try next available agent
      try {
        const failoverSuccess = await triggerFailoverCall(callRecord, widget);
        if (failoverSuccess) {
          console.log(`[3CX] Initial makecall on Ext ${ext} failed (${err3cx.message}), successfully failed over.`);
          return res.json({ success: true, message: 'Call failed over to next agent', callId: callRecord.id });
        }
      } catch (failoverErr) {
        console.error('[3CX] Failed triggering failover after initial makecall failure:', failoverErr.message);
      }

      // If no other agent can be tried, mark as failed
      callRecord.status = 'Failed';
      callRecord.outcome = 'Failed';
      await callRecord.save();
      await triggerUserWebhook(callRecord, widget);
      return res.status(500).json({
        error: 'Failed to initiate call with 3CX',
        detail: err3cx.response?.data || err3cx.message,
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get call status for widget frontend polling
app.get('/api/call/:callId/status', async (req, res) => {
  try {
    const callRecord = await CallRecord.findByPk(req.params.callId);
    if (!callRecord) return res.status(404).json({ error: 'Call not found' });

    const exts = (callRecord.agent_extension || '').split(',').map(x => x.trim()).filter(Boolean);
    const currentExtRaw = exts[exts.length - 1] || null;
    const currentExt = currentExtRaw ? currentExtRaw.split(':')[0] : null;

    let agent = null;
    if (currentExt) {
      agent = await Agent.findOne({
        where: { widgetId: callRecord.widgetId, extension: currentExt }
      });
    }

    res.json({
      id: callRecord.id,
      status: callRecord.status,
      outcome: callRecord.outcome,
      agentExtension: currentExt,
      agentName: agent ? `${agent.first_name} ${agent.last_name || ''}`.trim() : null,
      agentAvatarUrl: agent ? agent.avatar_url : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Webhook endpoint for 3CX call completion
app.post('/api/webhook/3cx', async (req, res) => {
  // This endpoint expects a payload from 3CX when a call finishes.
  console.log('Received 3CX Webhook:', req.body);
  
  // Depending on 3CX payload structure, extract relevant fields (e.g. caller number, duration).
  // For demonstration, assume payload contains customerPhone
  const { customerPhone, duration, callStatus } = req.body;

  if (customerPhone) {
    try {
      // Find the most recent call record for this phone
      const callRecord = await CallRecord.findOne({
        where: { customer_phone: customerPhone },
        order: [['createdAt', 'DESC']],
        include: [Widget]
      });

      if (callRecord) {
        callRecord.status = callStatus || 'Completed';
        await callRecord.save();

        // Trigger Webhooks immediately on call completion
        await triggerUserWebhook(callRecord, callRecord.Widget);
      }
    } catch (dbErr) {
      console.error('Error updating call record:', dbErr);
    }
  }

  // Always return 200 OK to the webhook provider
  res.status(200).send('OK');
});

// --- Admin Routes & Auth ---

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check database users
    const user = await User.findOne({ where: { username } });
    if (user && verifyPassword(password, user.password)) {
      if (user.two_factor_enabled) {
        if (!user.email) {
          return res.status(400).json({ error: '2-Step Verification is enabled, but no email is configured. Please contact the administrator.' });
        }
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.two_factor_code = code;
        user.two_factor_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        try {
          await send2faEmail(user.email, code);
        } catch (emailErr) {
          console.error('[2fa-email-error]', emailErr);
          return res.status(500).json({ error: `Failed to send verification code. Please check SMTP settings. Detail: ${emailErr.message}` });
        }

        return res.json({ two_factor_required: true, userId: user.id, email: maskEmail(user.email) });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
      return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    }

    // Fallback: If no users matched but user is trying default admin env details, match them
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'password123';
    if (username === adminUser && password === adminPass) {
      const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
      return res.json({ token, user: { username, role: 'admin' } });
    }

    res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'two_factor_enabled', 'createdAt']
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new user
app.post('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const { username, password, email, role, two_factor_enabled } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (two_factor_enabled && !email) {
      return res.status(400).json({ error: 'Email address is required to enable 2-Step Verification' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email address is already in use' });
      }
    }

    const hashed = hashPassword(password);
    const newUser = await User.create({
      username,
      password: hashed,
      email: email || null,
      role: role || 'admin',
      two_factor_enabled: !!two_factor_enabled
    });

    res.json({ id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role, two_factor_enabled: newUser.two_factor_enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user details (optionally password)
app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    const { username, password, email, role, two_factor_enabled } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username) {
      // Check uniqueness
      const existing = await User.findOne({ where: { username } });
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      user.username = username;
    }

    // Determine final email to validate 2FA requirement
    let finalEmail = user.email;
    if (email !== undefined) {
      if (email) {
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail && existingEmail.id !== user.id) {
          return res.status(400).json({ error: 'Email address is already in use' });
        }
      }
      user.email = email || null;
      finalEmail = email || null;
    }

    if (two_factor_enabled !== undefined) {
      if (two_factor_enabled && !finalEmail) {
        return res.status(400).json({ error: 'Email address is required to enable 2-Step Verification' });
      }
      user.two_factor_enabled = !!two_factor_enabled;
    }

    if (password) {
      user.password = hashPassword(password);
    }

    if (role) {
      user.role = role;
    }

    await user.save();
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role, two_factor_enabled: user.two_factor_enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent deleting the last admin
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (user.role === 'admin' && adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last administrator' });
    }

    await user.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2FA Verification Helper & Routes ---
function maskEmail(email) {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

async function send2faEmail(email, code) {
  const settingsList = await SystemSetting.findAll();
  const settings = {};
  settingsList.forEach(s => {
    settings[s.key] = s.value;
  });

  const host = settings.smtp_host || process.env.SMTP_HOST;
  const port = parseInt(settings.smtp_port || process.env.SMTP_PORT || '587', 10);
  const user = settings.smtp_user || process.env.SMTP_USER;
  const pass = settings.smtp_pass || process.env.SMTP_PASS;
  const from = settings.smtp_from || process.env.SMTP_FROM || 'noreply@yourdomain.com';
  const secure = settings.smtp_secure === 'true' || process.env.SMTP_SECURE === 'true';

  if (!host || !user || !pass) {
    throw new Error('SMTP mail server is not configured. Please configure SMTP in Settings.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });

  const mailOptions = {
    from: `"3CX Widget Security" <${from}>`,
    to: email,
    subject: 'Your 2-Step Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 12px; background-color: #ffffff; color: #24292f;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin-top: 10px; font-weight: 700; color: #0b4526;">3CX Call Connect Platform</h2>
        </div>
        <p style="font-size: 14px; line-height: 1.5;">Hello,</p>
        <p style="font-size: 14px; line-height: 1.5;">A login attempt was made for your account. Please use the following 6-digit verification code to complete your login. This code is valid for 10 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f6f8fa; border: 1px dashed #d0d7de; color: #24292f; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 16px 24px; border-radius: 8px; display: inline-block;">
            ${code}
          </div>
        </div>
        <p style="font-size: 11px; color: #6e7781; text-align: center;">If you did not attempt to sign in, please update your password immediately.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Verify 2FA OTP Code
app.post('/api/admin/verify-2fa', async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: 'User ID and verification code are required' });

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        id: userId,
        two_factor_code: code,
        two_factor_expires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired verification code' });
    }

    // Clear verification session code
    user.two_factor_code = null;
    user.two_factor_expires = null;
    await user.save();

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SMTP & Password Reset Helper Functions ---
const nodemailer = require('nodemailer');

async function sendResetEmail(email, resetUrl) {
  // Retrieve SMTP settings from DB
  const settingsList = await SystemSetting.findAll();
  const settings = {};
  settingsList.forEach(s => {
    settings[s.key] = s.value;
  });

  const host = settings.smtp_host || process.env.SMTP_HOST;
  const port = parseInt(settings.smtp_port || process.env.SMTP_PORT || '587', 10);
  const user = settings.smtp_user || process.env.SMTP_USER;
  const pass = settings.smtp_pass || process.env.SMTP_PASS;
  const from = settings.smtp_from || process.env.SMTP_FROM || 'noreply@yourdomain.com';
  const secure = settings.smtp_secure === 'true' || process.env.SMTP_SECURE === 'true';

  if (!host || !user || !pass) {
    throw new Error('SMTP mail server is not configured. Please configure SMTP in Settings.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });

  const mailOptions = {
    from: `"3CX Widget Admin" <${from}>`,
    to: email,
    subject: 'Reset Password Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 12px; background-color: #ffffff; color: #24292f;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin-top: 10px; font-weight: 700; color: #0b4526;">3CX Call Connect Platform</h2>
        </div>
        <p style="font-size: 14px; line-height: 1.5;">Hello,</p>
        <p style="font-size: 14px; line-height: 1.5;">We received a request to reset your password for your 3CX Widget Admin account. Click the button below to choose a new password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0b4526; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #57606a; line-height: 1.5;">If the button above does not work, copy and paste the following URL into your browser:</p>
        <p style="font-size: 12px; color: #0969da; word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #d0d7de; margin: 30px 0;" />
        <p style="font-size: 11px; color: #6e7781; text-align: center;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// --- SMTP & Forgot Password API Endpoints ---

// Forgot Password Request
app.post('/api/admin/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User with this email address was not found' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    user.reset_token = token;
    user.reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const resetUrl = `${protocol}://${host}/#/reset-password?token=${token}`;

    await sendResetEmail(email, resetUrl);
    res.json({ success: true, message: 'Reset password email sent successfully' });
  } catch (err) {
    console.error('[forgot-password]', err);
    res.status(500).json({ error: err.message });
  }
});

// Reset Password with Token
app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    user.password = hashPassword(password);
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    res.json({ success: true, message: 'Password has been updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get SMTP settings
app.get('/api/admin/settings/smtp', authenticateToken, async (req, res) => {
  try {
    const list = await SystemSetting.findAll();
    const settings = {
      smtp_host: '',
      smtp_port: '587',
      smtp_user: '',
      smtp_from: 'noreply@yourdomain.com',
      smtp_secure: 'false',
      smtp_pass_configured: false
    };

    list.forEach(s => {
      if (s.key === 'smtp_pass') {
        settings.smtp_pass_configured = !!s.value;
      } else {
        settings[s.key] = s.value;
      }
    });

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update SMTP settings
app.put('/api/admin/settings/smtp', authenticateToken, async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure } = req.body;
    const items = { smtp_host, smtp_port, smtp_user, smtp_from, smtp_secure };

    for (const [key, val] of Object.entries(items)) {
      if (val !== undefined) {
        await SystemSetting.upsert({ key, value: String(val) });
      }
    }

    // Only update password if it isn't the masked value and isn't blank
    if (smtp_pass && smtp_pass !== '••••••••') {
      await SystemSetting.upsert({ key: 'smtp_pass', value: smtp_pass });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test SMTP settings
app.post('/api/admin/settings/smtp/test', authenticateToken, async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure, test_email } = req.body;
    if (!test_email) return res.status(400).json({ error: 'Destination test email is required' });

    let finalPass = smtp_pass;
    // Fallback to saved password if masked is submitted
    if (smtp_pass === '••••••••') {
      const savedPass = await SystemSetting.findOne({ where: { key: 'smtp_pass' } });
      finalPass = savedPass ? savedPass.value : '';
    }

    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: parseInt(smtp_port || '587', 10),
      secure: smtp_secure === 'true',
      auth: {
        user: smtp_user,
        pass: finalPass
      },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: `"3CX Widget Test" <${smtp_from || 'noreply@yourdomain.com'}>`,
      to: test_email,
      subject: '3CX Widget Admin SMTP Test Email',
      text: 'Congratulations! Your SMTP settings are correctly configured and working.',
      html: '<h3>Congratulations!</h3><p>Your 3CX Call Connect Platform SMTP settings are correctly configured and working.</p>'
    });

    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (err) {
    res.status(500).json({ error: `SMTP test failed: ${err.message}` });
  }
});

// Get all widgets
app.get('/api/admin/widgets', authenticateToken, async (req, res) => {
  try {
    const widgets = await Widget.findAll({ include: [Agent] });
    res.json(widgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create widget
app.post('/api/admin/widgets', authenticateToken, async (req, res) => {
  try {
    const widget = await Widget.create(req.body);
    res.json(widget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clone widget
app.post('/api/admin/widgets/:id/clone', authenticateToken, async (req, res) => {
  try {
    const orig = await Widget.findByPk(req.params.id, { include: [Agent] });
    if (!orig) return res.status(404).json({ error: 'Widget not found' });

    const origData = orig.toJSON();
    delete origData.id;
    delete origData.createdAt;
    delete origData.updatedAt;
    delete origData.Agents;
    
    origData.name = `${orig.name} (Copy)`;

    const clone = await Widget.create(origData);

    if (orig.Agents && orig.Agents.length > 0) {
      for (const ag of orig.Agents) {
        const agData = ag.toJSON();
        delete agData.id;
        delete agData.createdAt;
        delete agData.updatedAt;
        agData.widgetId = clone.id;
        await Agent.create(agData);
      }
    }

    const fullClone = await Widget.findByPk(clone.id, { include: [Agent] });
    res.json(fullClone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete widget
app.delete('/api/admin/widgets/:id', authenticateToken, async (req, res) => {
  try {
    await Widget.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Agent to Widget
app.post('/api/admin/widgets/:id/agents', authenticateToken, async (req, res) => {
  try {
    const { extension, first_name, crm_agent_id, email } = req.body;
    if (!extension || !first_name || !crm_agent_id || !email) {
      return res.status(400).json({ error: 'Missing required agent fields (Extension, First Name, Agent ID, Email)' });
    }
    const agent = await Agent.create({ ...req.body, widgetId: req.params.id });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Agent
app.put('/api/admin/agents/:id', authenticateToken, async (req, res) => {
  try {
    const agent = await Agent.findByPk(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    await agent.update(req.body);
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Agent
app.delete('/api/admin/agents/:id', authenticateToken, async (req, res) => {
  try {
    await Agent.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Test 3CX connection (OAuth token + XAPI ping)
app.post('/api/admin/widgets/:id/test-connection', authenticateToken, async (req, res) => {
  try {
    const widget = await Widget.findByPk(req.params.id);
    if (!widget) return res.status(404).json({ ok: false, error: 'Widget not found' });

    // Allow caller to supply unsaved credentials for immediate testing
    const testWidget = {
      ...widget.toJSON(),
      ...req.body,             // override with form values if provided
      id: widget.id,
    };

    // Force token refresh so we always validate fresh credentials
    invalidate3cxToken(widget.id);

    let token;
    try {
      token = await get3cxToken(testWidget);
    } catch (tokenErr) {
      return res.json({ ok: false, error: `Authentication failed: ${tokenErr.response?.data?.error_description || tokenErr.message}` });
    }

    // Ping XAPI to confirm the token works and retrieve extensions
    try {
      const dnList     = await fetch3cxDnList(testWidget);
      const extensions = dnList
        .map(d => (d.Number || d.DN || d.Extension || d.number || '').toString())
        .filter(Boolean)
        .slice(0, 50);

      return res.json({ ok: true, message: 'Connected successfully', extensionCount: dnList.length, extensions });
    } catch (apiErr) {
      return res.json({ ok: false, error: `Token valid but XAPI call failed: ${apiErr.response?.data?.message || apiErr.message}` });
    }
  } catch (err) {
    console.error('[test-connection]', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// Update widget settings (also invalidates token cache when credentials change)
app.put('/api/admin/widgets/:id', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body };
    const intFields = [
      'border_radius', 'btn_size', 'widget_width', 'widget_height', 
      'logo_height', 'logo_width', 'ring_timeout_seconds', 'overlay_blur'
    ];
    intFields.forEach(field => {
      if (data[field] === '' || data[field] === undefined) {
        data[field] = null;
      }
    });

    await Widget.update(data, { where: { id: req.params.id } });
    // Invalidate cached token if credentials changed
    if (req.body.client_id_3cx || req.body.client_secret_3cx || req.body.fqdn_3cx) {
      invalidate3cxToken(req.params.id);
    }
    const updated = await Widget.findByPk(req.params.id, { include: [Agent] });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reporting: get call stats for a widget
app.get('/api/admin/widgets/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const widgetId = req.params.id;
    const total     = await CallRecord.count({ where: { widgetId } });
    
    // Initiated or Ringing or Answered (active calls in progress)
    const initiated = await CallRecord.count({
      where: {
        widgetId,
        status: { [Op.in]: ['Initiated', 'Ringing', 'Answered'] }
      }
    });

    // Failed, Missed or Abandoned calls
    const failed    = await CallRecord.count({
      where: {
        widgetId,
        [Op.or]: [
          { status: 'Failed' },
          { outcome: { [Op.in]: ['Missed', 'Abandoned', 'Failed'] } }
        ]
      }
    });

    // Completed calls where extension answered
    const completed = await CallRecord.count({
      where: {
        widgetId,
        [Op.or]: [
          { status: 'Completed' },
          { outcome: 'Answered' }
        ]
      }
    });

    const records = await CallRecord.findAll({
      where: { widgetId },
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json({ total, initiated, failed, completed, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reporting: get call stats for a dialer widget
app.get('/api/admin/dialer-widgets/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const dialerId = req.params.id;
    const total = await DialerCallRecord.count({ where: { dialerId } });
    
    const initiated = await DialerCallRecord.count({
      where: {
        dialerId,
        status: { [Op.in]: ['Initiated', 'Ringing'] }
      }
    });

    const failed = await DialerCallRecord.count({
      where: {
        dialerId,
        status: { [Op.in]: ['Failed', 'Missed', 'Cancelled'] }
      }
    });

    const completed = await DialerCallRecord.count({
      where: {
        dialerId,
        status: { [Op.in]: ['Completed', 'Connected', 'Answered'] }
      }
    });

    const records = await DialerCallRecord.findAll({
      where: { dialerId },
      order: [['createdAt', 'DESC']],
      limit: 200
    });
    res.json({ total, initiated, failed, completed, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Routes for Dialer Agents mapping
app.get('/api/admin/dialer-widgets/:id/agents', authenticateToken, async (req, res) => {
  try {
    const agents = await DialerAgent.findAll({ where: { dialerId: req.params.id } });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/dialer-widgets/:id/agents', authenticateToken, async (req, res) => {
  try {
    const { crm_user_id, extension, email, first_name, last_name, location_id } = req.body;
    if (!crm_user_id || !extension || !email) return res.status(400).json({ error: 'Missing required fields (crm_user_id, extension, email)' });
    const agent = await DialerAgent.create({
      dialerId: req.params.id,
      crm_user_id,
      extension,
      email,
      first_name: first_name || '',
      last_name: last_name || '',
      location_id: location_id || ''
    });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/dialer-widgets/:id/agents/:agentId', authenticateToken, async (req, res) => {
  try {
    const { crm_user_id, extension, email, first_name, last_name, location_id } = req.body;
    if (!crm_user_id || !extension || !email) return res.status(400).json({ error: 'Missing required fields (crm_user_id, extension, email)' });
    const agent = await DialerAgent.findOne({ where: { id: req.params.agentId, dialerId: req.params.id } });
    if (!agent) return res.status(404).json({ error: 'Agent mapping not found' });
    
    await agent.update({
      crm_user_id,
      extension,
      email,
      first_name: first_name || '',
      last_name: last_name || '',
      location_id: location_id || ''
    });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/dialer-widgets/:id/agents/:agentId', authenticateToken, async (req, res) => {
  try {
    await DialerAgent.destroy({ where: { id: req.params.agentId, dialerId: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Opaque proxy routes for call recording download and listen (using secure hash token)
app.get('/recordings/:token/download', async (req, res) => {
  try {
    const recordingToken = req.params.token;
    if (!recordingToken) return res.status(400).json({ error: 'Missing token' });

    // Search DialerCallRecord first
    let record = await DialerCallRecord.findOne({
      where: { recording_token: recordingToken },
      include: [DialerWidget]
    });
    
    let isDialer = true;
    let widgetOrDialer = record ? record.DialerWidget : null;

    if (!record) {
      // Search standard CallRecord
      record = await CallRecord.findOne({
        where: { recording_token: recordingToken },
        include: [Widget]
      });
      isDialer = false;
      widgetOrDialer = record ? record.Widget : null;
    }

    if (!record || !widgetOrDialer) {
      return res.status(404).json({ error: 'Call recording not found or invalid token' });
    }

    const cxToken = await get3cxToken(widgetOrDialer);
    const fqdn = sanitizeFqdn(widgetOrDialer.fqdn_3cx);
    const downloadUrl = `https://${fqdn}/xapi/v1/Recordings/Pbx.DownloadRecording(recId=${record.recording_id})?access_token=${cxToken}`;
    
    console.log(`[3CX Share] Streaming download for recording ${record.recording_id}...`);

    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream',
      headers: {
        Authorization: `Bearer ${cxToken}`
      },
      timeout: 20000
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'audio/wav');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    res.setHeader('Content-Disposition', response.headers['content-disposition'] || `attachment; filename="recording_${record.recording_id}.wav"`);

    response.data.pipe(res);
  } catch (err) {
    console.error('[3CX Share] Proxy download failed:', err.message);
    res.status(500).json({ error: `Failed to stream recording: ${err.message}` });
  }
});

app.get('/recordings/:token/listen', async (req, res) => {
  try {
    const recordingToken = req.params.token;
    if (!recordingToken) return res.status(400).json({ error: 'Missing token' });

    // Search DialerCallRecord first
    let record = await DialerCallRecord.findOne({
      where: { recording_token: recordingToken },
      include: [DialerWidget]
    });
    
    let isDialer = true;
    let widgetOrDialer = record ? record.DialerWidget : null;

    if (!record) {
      // Search standard CallRecord
      record = await CallRecord.findOne({
        where: { recording_token: recordingToken },
        include: [Widget]
      });
      isDialer = false;
      widgetOrDialer = record ? record.Widget : null;
    }

    if (!record || !widgetOrDialer) {
      return res.status(404).json({ error: 'Call recording not found or invalid token' });
    }

    const cxToken = await get3cxToken(widgetOrDialer);
    const fqdn = sanitizeFqdn(widgetOrDialer.fqdn_3cx);
    const downloadUrl = `https://${fqdn}/xapi/v1/Recordings/Pbx.DownloadRecording(recId=${record.recording_id})?access_token=${cxToken}`;
    
    console.log(`[3CX Share] Streaming inline playback for recording ${record.recording_id}...`);

    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream',
      headers: {
        Authorization: `Bearer ${cxToken}`
      },
      timeout: 20000
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'audio/wav');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    res.setHeader('Content-Disposition', 'inline');

    response.data.pipe(res);
  } catch (err) {
    console.error('[3CX Share] Proxy listen failed:', err.message);
    res.status(500).json({ error: `Failed to stream recording: ${err.message}` });
  }
});

// Secure call recording proxy download route
app.get('/api/admin/widgets/:widgetId/recordings/:recId/download', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (!token) token = req.query.token;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });

      try {
        const widget = await Widget.findByPk(req.params.widgetId);
        if (!widget) return res.status(404).json({ error: 'Widget not found' });

        const cxToken = await get3cxToken(widget);
        const fqdn = sanitizeFqdn(widget.fqdn_3cx);
        const downloadUrl = `https://${fqdn}/xapi/v1/Recordings/Pbx.DownloadRecording(recId=${req.params.recId})?access_token=${cxToken}`;
        
        console.log(`[3CX] Streaming recording ${req.params.recId} for widget ${widget.id}...`);

        const response = await axios({
          method: 'get',
          url: downloadUrl,
          responseType: 'stream',
          headers: {
            Authorization: `Bearer ${cxToken}`
          },
          timeout: 20000
        });

        // Set attachment headers
        res.setHeader('Content-Type', response.headers['content-type'] || 'audio/wav');
        if (response.headers['content-length']) {
          res.setHeader('Content-Length', response.headers['content-length']);
        }
        res.setHeader('Content-Disposition', response.headers['content-disposition'] || `attachment; filename="recording_${req.params.recId}.wav"`);

        response.data.pipe(res);
      } catch (innerErr) {
        console.error('[3CX] Recording streaming failed:', innerErr.message);
        res.status(500).json({ error: `Failed to download recording from 3CX: ${innerErr.message}` });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Secure call recording proxy live stream/listen route (inline playback)
app.get('/api/admin/widgets/:widgetId/recordings/:recId/listen', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (!token) token = req.query.token;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });

      try {
        const widget = await Widget.findByPk(req.params.widgetId);
        if (!widget) return res.status(404).json({ error: 'Widget not found' });

        const cxToken = await get3cxToken(widget);
        const fqdn = sanitizeFqdn(widget.fqdn_3cx);
        const downloadUrl = `https://${fqdn}/xapi/v1/Recordings/Pbx.DownloadRecording(recId=${req.params.recId})?access_token=${cxToken}`;
        
        console.log(`[3CX] Streaming recording ${req.params.recId} for widget ${widget.id} inline playback...`);

        const response = await axios({
          method: 'get',
          url: downloadUrl,
          responseType: 'stream',
          headers: {
            Authorization: `Bearer ${cxToken}`
          },
          timeout: 20000
        });

        // Set inline headers
        res.setHeader('Content-Type', response.headers['content-type'] || 'audio/wav');
        if (response.headers['content-length']) {
          res.setHeader('Content-Length', response.headers['content-length']);
        }
        res.setHeader('Content-Disposition', 'inline');

        response.data.pipe(res);
      } catch (innerErr) {
        console.error('[3CX] Recording streaming failed:', innerErr.message);
        res.status(500).json({ error: `Failed to stream recording from 3CX: ${innerErr.message}` });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Secure dialer call recording proxy download route
app.get('/api/admin/dialers/:dialerId/recordings/:recId/download', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (!token) token = req.query.token;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });

      try {
        const dialer = await DialerWidget.findByPk(req.params.dialerId);
        if (!dialer) return res.status(404).json({ error: 'Dialer not found' });

        const cxToken = await get3cxToken(dialer);
        const fqdn = sanitizeFqdn(dialer.fqdn_3cx);
        const downloadUrl = `https://${fqdn}/xapi/v1/Recordings/Pbx.DownloadRecording(recId=${req.params.recId})?access_token=${cxToken}`;
        
        console.log(`[3CX Dialer] Streaming recording ${req.params.recId} for dialer ${dialer.id}...`);

        const response = await axios({
          method: 'get',
          url: downloadUrl,
          responseType: 'stream',
          headers: {
            Authorization: `Bearer ${cxToken}`
          },
          timeout: 20000
        });

        // Set attachment headers
        res.setHeader('Content-Type', response.headers['content-type'] || 'audio/wav');
        if (response.headers['content-length']) {
          res.setHeader('Content-Length', response.headers['content-length']);
        }
        res.setHeader('Content-Disposition', response.headers['content-disposition'] || `attachment; filename="dialer_recording_${req.params.recId}.wav"`);

        response.data.pipe(res);
      } catch (innerErr) {
        console.error('[3CX Dialer] Recording streaming failed:', innerErr.message);
        res.status(500).json({ error: `Failed to download recording from 3CX: ${innerErr.message}` });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Secure dialer call recording proxy live stream/listen route (inline playback)
app.get('/api/admin/dialers/:dialerId/recordings/:recId/listen', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (!token) token = req.query.token;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });

      try {
        const dialer = await DialerWidget.findByPk(req.params.dialerId);
        if (!dialer) return res.status(404).json({ error: 'Dialer not found' });

        const cxToken = await get3cxToken(dialer);
        const fqdn = sanitizeFqdn(dialer.fqdn_3cx);
        const downloadUrl = `https://${fqdn}/xapi/v1/Recordings/Pbx.DownloadRecording(recId=${req.params.recId})?access_token=${cxToken}`;
        
        console.log(`[3CX Dialer] Streaming recording ${req.params.recId} for inline listen playback...`);

        const response = await axios({
          method: 'get',
          url: downloadUrl,
          responseType: 'stream',
          headers: {
            Authorization: `Bearer ${cxToken}`
          },
          timeout: 20000
        });

        // Set inline headers
        res.setHeader('Content-Type', response.headers['content-type'] || 'audio/wav');
        if (response.headers['content-length']) {
          res.setHeader('Content-Length', response.headers['content-length']);
        }
        res.setHeader('Content-Disposition', 'inline');

        response.data.pipe(res);
      } catch (innerErr) {
        console.error('[3CX Dialer] Recording streaming failed:', innerErr.message);
        res.status(500).json({ error: `Failed to stream recording from 3CX: ${innerErr.message}` });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DIALER WIDGET ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/dialers', authenticateToken, async (req, res) => {
  try {
    const dialers = await DialerWidget.findAll({ order: [['createdAt', 'DESC']] });
    res.json(dialers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/dialers', authenticateToken, async (req, res) => {
  try {
    const dialer = await DialerWidget.create(req.body);
    res.status(201).json(dialer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/dialers/:id', authenticateToken, async (req, res) => {
  try {
    const dialer = await DialerWidget.findByPk(req.params.id);
    if (!dialer) return res.status(404).json({ error: 'Dialer not found' });
    await dialer.update(req.body);
    res.json(dialer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/dialers/:id', authenticateToken, async (req, res) => {
  try {
    const dialer = await DialerWidget.findByPk(req.params.id);
    if (dialer) await dialer.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DIALER PUBLIC ROUTE (CLICK TO CALL)
// ─────────────────────────────────────────────────────────────────────────────
// Resolve Dialer Agent by CRM User ID
app.get('/api/dialer/resolve-agent', async (req, res) => {
  try {
    const { dialerId, userid } = req.query;
    if (!dialerId || !userid) return res.status(400).json({ error: 'Missing parameters' });
    
    const agent = await DialerAgent.findOne({ where: { dialerId, crm_user_id: userid } });
    if (agent && agent.extension && agent.extension.trim()) {
      return res.json({ extension: agent.extension.trim() });
    } else {
      return res.status(404).json({ error: 'Mapping not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dialer/call', async (req, res) => {
  try {
    const { dialerId, extension, destination } = req.body;
    if (!dialerId || !extension || !destination) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!isValidPhoneNumber(destination)) {
      return res.status(400).json({ error: 'Invalid destination phone number format. Must contain 7 to 15 digits.' });
    }

    const dialer = await DialerWidget.findByPk(dialerId);
    if (!dialer) return res.status(404).json({ error: 'Dialer not found' });

    console.log(`[3CX Dialer] Dialing ${destination} from extension ${extension} via https://${sanitizeFqdn(dialer.fqdn_3cx)}/callcontrol/${encodeURIComponent(extension)}/makecall`);

    await execute3cxMakeCall(dialer, extension, destination);

    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || req.ip || '';
    const pageUrl  = req.body.pageUrl || req.get('referer') || req.get('origin') || '';
    const contactId = req.body.contactId || '';

    // Create Call Record
    const record = await DialerCallRecord.create({
      dialerId,
      agent_extension: extension,
      destination: String(destination),
      page_url: pageUrl,
      ip_address: clientIp,
      contact_id: contactId,
      status: 'Initiated'
    });

    // Trigger Dialer webhook for Initiated state
    await triggerDialerWebhook(record, dialer);

    res.json({ success: true, message: 'Call initiated', callId: record.id });
  } catch (err) {
    console.error('[3CX Dialer Error]', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initiate call on 3CX' });
  }
});

app.get('/api/dialer/status', async (req, res) => {
  try {
    const { dialerId, extension, destination, callId, duration } = req.query;
    if (!dialerId || !extension) return res.json({ state: 'idle' });

    const dialer = await DialerWidget.findByPk(dialerId);
    if (!dialer) return res.json({ state: 'idle' });

    let dbRecord = null;
    const { Op } = require('sequelize');
    if (callId) {
      dbRecord = await DialerCallRecord.findByPk(callId);
    } else {
      // Find the most recent active call record for this dialer, agent, and destination
      dbRecord = await DialerCallRecord.findOne({
        where: {
          dialerId,
          agent_extension: extension,
          destination: String(destination),
          status: { [Op.in]: ['Initiated', 'Ringing', 'Connected'] }
        },
        order: [['createdAt', 'DESC']]
      });
    }

    const ccStatus = await checkDialerCallControlStatus(dialer, extension, String(destination));
    if (!ccStatus) {
      // Fallback: if the API call itself failed, keep the current database status
      return res.json({ state: dbRecord ? dbRecord.status.toLowerCase() : 'ringing' });
    }

    if (!ccStatus.active) {
      if (dbRecord && dbRecord.status !== 'Completed' && dbRecord.status !== 'Failed') {
        const ageSecondsSinceCreation = (Date.now() - new Date(dbRecord.createdAt).getTime()) / 1000;
        if (ageSecondsSinceCreation > 15) {
          const oldStatus = dbRecord.status;
          dbRecord.status = oldStatus === 'Connected' ? 'Completed' : 'Failed';
          dbRecord.duration_seconds = parseInt(duration || '0');
          dbRecord.ended_at = new Date();
          await dbRecord.save();
          
          await triggerDialerWebhook(dbRecord, dialer);

          if (dbRecord.status === 'Completed') {
            // Search and link recording after 5s settle delay
            setTimeout(() => fetchAndLinkDialerRecording(dbRecord.id), 5000);
          }
          return res.json({ state: 'idle' });
        } else {
          return res.json({ state: 'ringing' });
        }
      }
      return res.json({ state: 'idle' });
    }

    if (dbRecord) {
      const newStatus = ccStatus.connected ? 'Connected' : 'Ringing';
      if (dbRecord.status !== newStatus) {
        dbRecord.status = newStatus;
        await dbRecord.save();
        await triggerDialerWebhook(dbRecord, dialer);
      }
    }

    if (ccStatus.connected) {
      return res.json({ state: 'connected' });
    } else {
      return res.json({ state: 'ringing' });
    }
  } catch (err) {
    console.log('[3CX Dialer Status] Error:', err.message);
    res.json({ state: 'idle' }); // Silent fail on polling
  }
});

app.get('/api/dialer/history', async (req, res) => {
  try {
    const { dialerId, extension } = req.query;
    if (!dialerId || !extension) return res.status(400).json({ error: 'Missing parameters' });

    const history = await DialerCallRecord.findAll({
      where: { dialerId, agent_extension: extension },
      order: [['createdAt', 'DESC']],
      limit: 30
    });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.sync();
    console.log('Database synced');
  } catch (err) {
    console.warn('[Database] Sync warning (proceeding with server start):', err.message);
  }

  // Seed default admin user if none exists
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      const defaultUser = process.env.ADMIN_USERNAME || 'admin';
      const defaultPass = process.env.ADMIN_PASSWORD || 'password123';
      const hashed = hashPassword(defaultPass);
      await User.create({
        username: defaultUser,
        password: hashed,
        role: 'admin'
      });
      console.log(`[Seed] Created default user: ${defaultUser}`);
    }
  } catch (seedErr) {
    console.error('[Seed] Failed to seed default user:', seedErr);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
