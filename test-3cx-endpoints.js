const { NativeAiAgent } = require('./db.js');
const axios = require('axios');
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function run() {
  const agent = await NativeAiAgent.findOne({ where: { threecx_extension: '102' } });
  if (!agent) { console.log('Agent 102 not found in DB'); return; }

  const tokenUrl = `https://${agent.fqdn_3cx.replace(/\/$/, '')}/connect/token`;
  const params = new URLSearchParams({
    client_id: agent.client_id_3cx,
    client_secret: agent.client_secret_3cx,
    grant_type: 'client_credentials'
  });

  const resp = await axios.post(tokenUrl, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    httpsAgent
  });
  const token = resp.data.access_token;
  console.log('Got token');

  const fqdn = `https://${agent.fqdn_3cx.replace(/\/$/, '')}`;
  
  const endpoints = ['/xapi/v1/Users', '/xapi/v1/System/Extensions', '/xapi/v1/Queues', '/xapi/v1/IVRs', '/xapi/v1/System/Agents', '/xapi/v1/Groups', '/xapi/v1/CallQueues'];
  for (const ep of endpoints) {
    try {
      const { data } = await axios.get(fqdn + ep, { headers: { Authorization: `Bearer ${token}` }, httpsAgent });
      console.log(`\nEndpoint ${ep}:`);
      if (Array.isArray(data)) {
        const item = data.find(i => i.Number === '102' || i.Extension === '102' || i.Number === 102 || i.ExtensionNumber === '102');
        if (item) console.log('FOUND 102!', item);
        else console.log(`Returns Array of length ${data.length}, but 102 not found.`);
        console.log('Sample item keys:', data[0] ? Object.keys(data[0]) : 'empty');
      } else {
        console.log('Returns Object', Object.keys(data));
      }
    } catch (e) {
      console.log(`Endpoint ${ep}: ERROR ${e.response?.status} - ${e.response?.data?.message || e.message}`);
    }
  }
}
run();
