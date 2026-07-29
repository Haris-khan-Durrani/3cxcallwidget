const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || '3cxwidget', 
  process.env.DB_USER || 'root', 
  process.env.DB_PASSWORD || '', 
  {
    host: process.env.DB_HOST || '127.0.0.1', 
    port: process.env.DB_PORT || 3306, 
    dialect: 'mysql', 
    logging: false
  }
);

const Widget = sequelize.define('Widget', {
  id: { type: DataTypes.UUID, primaryKey: true },
  fqdn_3cx: { type: DataTypes.STRING },
  client_id_3cx: { type: DataTypes.STRING },
  client_secret_3cx: { type: DataTypes.STRING }
});

const axios = require('axios');
const https = require('https');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function run() {
  try {
    const widget = await Widget.findOne();
    if (!widget) throw new Error('No widget found in DB. Please ensure a company is configured.');
    
    console.log('Found configured FQDN:', widget.fqdn_3cx);
    
    const tokenUrl = `https://${widget.fqdn_3cx}/connect/token`;
    const params = new URLSearchParams({
      client_id: widget.client_id_3cx,
      client_secret: widget.client_secret_3cx,
      grant_type: 'client_credentials'
    });
    
    console.log('Fetching OAuth token using existing credentials...');
    const resp = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      httpsAgent
    });
    const token = resp.data.access_token;
    console.log('Obtained token successfully.');
    
    const endpoints = [
      '/xapi/v1/openapi.json',
      '/xapi/v1/swagger.json',
      '/xapi/openapi.json',
      '/swagger/v1/swagger.json'
    ];
    let schema = null;
    let successfulUrl = null;
    
    for (const ep of endpoints) {
      const url = `https://${widget.fqdn_3cx}${ep}`;
      console.log(`Trying to fetch OpenAPI schema from: ${url}`);
      try {
        const resp2 = await axios.get(url, { 
          headers: { Authorization: `Bearer ${token}` }, 
          httpsAgent, 
          timeout: 10000 
        });
        
        if (resp2.data && typeof resp2.data === 'object') {
          schema = resp2.data;
          successfulUrl = url;
          console.log(`Success! Downloaded schema from ${url}`);
          break;
        }
      } catch (err) {
        console.log(`Failed: ${url} - HTTP ${err.response ? err.response.status : err.message}`);
      }
    }
    
    if (schema) {
      const docsDir = path.join(__dirname, '..', 'docs', 'openapi');
      if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
      const outPath = path.join(docsDir, '3cx-openapi.json');
      fs.writeFileSync(outPath, JSON.stringify(schema, null, 2));
      console.log(`\nSuccessfully saved OpenAPI schema to: ${outPath}`);
      console.log(`Please provide this file to the AI to proceed with Phase 1.`);
    } else {
      console.log('\nFailed to fetch OpenAPI schema from all known endpoints.');
    }
  } catch (err) {
    console.error('\nError:', err.message);
  } finally {
    await sequelize.close();
  }
}

run();
