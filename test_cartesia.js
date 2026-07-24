const crypto = require('crypto');
const { AIProviderCredential } = require('./db.js');
const { decrypt } = require('./utils/encryption.js');
const axios = require('axios');

async function testModels() {
  const creds = await AIProviderCredential.findAll({ where: { provider_name: 'cartesia' } });
  if (!creds.length) { console.log('No cartesia key'); process.exit(0); }
  const key = decrypt(creds[0].encrypted_api_key, creds[0].encryption_iv, creds[0].encryption_auth_tag);
  
  const models = ['sonic-english', 'sonic', 'sonic-multilingual', 'sonic-3', 'sonic-3.5', 'sonic-latest'];
  for (const m of models) {
    try {
      const res = await axios.post('https://api.cartesia.ai/tts/bytes', {
        model_id: m,
        transcript: 'test',
        voice: { mode: 'id', id: 'a0e99841-438c-4a64-b679-ae501e7d6091' },
        output_format: { container: 'wav', encoding: 'pcm_s16le', sample_rate: 16000 }
      }, {
        headers: { 'X-API-Key': key, 'Cartesia-Version': '2024-06-10' }
      });
      console.log('SUCCESS with model:', m);
    } catch (e) {
      let msg = e.response?.data;
      if (Buffer.isBuffer(msg)) msg = msg.toString('utf-8');
      if (typeof msg === 'object') msg = JSON.stringify(msg);
      console.error('FAIL with model:', m, msg);
    }
  }
  process.exit(0);
}
testModels();
