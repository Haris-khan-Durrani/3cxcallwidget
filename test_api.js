const jwt = require('jsonwebtoken');
const axios = require('axios');
async function test() {
  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || 'secret');
  try {
    const res = await axios.get('http://localhost:3000/api/admin/widgets', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('FQDN:', res.data[0].fqdn_3cx);
    console.log('ID:', res.data[0].id);
  } catch(e) {
    console.error(e.message);
  }
}
test();
