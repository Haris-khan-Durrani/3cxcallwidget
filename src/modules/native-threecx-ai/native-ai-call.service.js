const { NativeAiAgent, NativeAiCall } = require('../../../db');
const { getNative3cxToken } = require('./native-ai-agent.service');
const axios = require('axios');
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function initiateTestCall(agentId, clientPhone) {
  const agent = await NativeAiAgent.findByPk(agentId);
  if (!agent) throw new Error('Agent not found');

  if (agent.status !== 'active') {
    throw new Error('Agent must be verified and active before placing test calls.');
  }

  // Create the Call record
  const callRecord = await NativeAiCall.create({
    company_id: agent.company_id,
    agent_id: agent.id,
    client_phone: clientPhone,
    direction: 'outbound',
    status: 'initiated',
    started_at: new Date()
  });

  try {
    const token = await getNative3cxToken(agent);
    const fqdn = agent.fqdn_3cx.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Attempt makecall via Call Control
    // The exact makecall endpoint is typically /xapi/v1/CallControl/{extensionId}/makecall or similar.
    // If the extension is known, we use its Id.
    const dnId = agent.threecx_dn_id || agent.threecx_extension;
    const url = `https://${fqdn}/xapi/v1/CallControl/${dnId}/makecall`;
    
    const payload = {
      Destination: clientPhone
    };

    const response = await axios.post(url, payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      httpsAgent,
      timeout: 10000
    });

    callRecord.threecx_call_id = response.data?.Id || response.data?.CallId || null;
    callRecord.status = 'ringing';
    await callRecord.save();

    return {
      success: true,
      message: 'Test call initiated successfully',
      call_id: callRecord.threecx_call_id
    };
  } catch (err) {
    callRecord.status = 'failed';
    callRecord.error_message = err.response?.data?.error || err.message;
    await callRecord.save();
    
    throw new Error('Test call failed: ' + callRecord.error_message);
  }
}

module.exports = {
  initiateTestCall
};
