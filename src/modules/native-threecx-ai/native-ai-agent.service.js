const { NativeAiAgent } = require('../../../db');
const axios = require('axios');
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function getNative3cxToken(agent) {
  if (!agent.fqdn_3cx || !agent.client_id_3cx || !agent.client_secret_3cx) {
    throw new Error('3CX OAuth credentials not configured for this Native AI Agent.');
  }

  const fqdn = agent.fqdn_3cx.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const tokenUrl = `https://${fqdn}/connect/token`;

  const params = new URLSearchParams({
    client_id: agent.client_id_3cx,
    client_secret: agent.client_secret_3cx,
    grant_type: 'client_credentials'
  });

  try {
    const resp = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      httpsAgent,
      timeout: 10000
    });
    if (!resp.data || !resp.data.access_token) {
      throw new Error('No access_token returned by 3CX.');
    }
    return resp.data.access_token;
  } catch (error) {
    throw new Error('Failed to obtain 3CX OAuth Token: ' + (error.response?.data?.error || error.message));
  }
}

async function listAgents(companyId) {
  const where = {};
  if (companyId) where.company_id = companyId;
  return await NativeAiAgent.findAll({ where });
}

async function createAgent(data) {
  return await NativeAiAgent.create(data);
}

async function getAgent(id) {
  return await NativeAiAgent.findByPk(id);
}

async function updateAgent(id, data) {
  const agent = await getAgent(id);
  if (!agent) throw new Error('Agent not found');
  return await agent.update(data);
}

async function deleteAgent(id) {
  const agent = await getAgent(id);
  if (!agent) throw new Error('Agent not found');
  return await agent.destroy();
}

async function verifyAgent(id) {
  const agent = await getAgent(id);
  if (!agent) throw new Error('Agent not found');
  
  try {
    const token = await getNative3cxToken(agent);
    const fqdn = agent.fqdn_3cx.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // AI Agents might not be in the standard Users endpoint. We check multiple.
    const endpoints = [
      '/xapi/v1/Users',
      '/xapi/v1/System/Extensions',
      '/xapi/v1/Queues',
      '/xapi/v1/IVRs',
      '/xapi/v1/System/Agents',
      '/xapi/v1/Groups',
      '/xapi/v1/CallQueues'
    ];
    
    let foundExtension = null;
    let foundInEndpoint = '';

    for (const ep of endpoints) {
      try {
        const url = `https://${fqdn}${ep}`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          httpsAgent,
          timeout: 5000
        });
        
        if (response.data && Array.isArray(response.data)) {
          const ext = response.data.find(u => 
            String(u.Number) === agent.threecx_extension || 
            String(u.Extension) === agent.threecx_extension ||
            String(u.ExtensionNumber) === agent.threecx_extension
          );
          if (ext) {
            foundExtension = ext;
            foundInEndpoint = ep;
            console.log(`[NativeAI] Agent ${agent.threecx_extension} verified successfully via ${ep}!`);
            break; // Stop searching once found
          }
        }
      } catch (epError) {
        // Ignore 404s or permission errors for individual endpoints
      }
    }
    
    if (foundExtension) {
      agent.status = 'active';
      // 3CX typically uses 'Id' or 'Id' might not exist on some entities, fallback gracefully
      agent.threecx_dn_id = foundExtension.Id || foundExtension.Id_ || null;
      agent.last_verified_at = new Date();
      await agent.save();
      return { success: true, message: `Agent verified successfully via ${foundInEndpoint}`, extension: foundExtension };
    }
    
    // Fallback or not found
    agent.status = 'error';
    await agent.save();
    return { success: false, message: 'Extension not found on 3CX server across all known endpoints.' };
  } catch (err) {
    agent.status = 'error';
    await agent.save();
    throw new Error('Verification failed: ' + err.message);
  }
}

module.exports = {
  getNative3cxToken,
  listAgents,
  createAgent,
  getAgent,
  updateAgent,
  deleteAgent,
  verifyAgent
};
