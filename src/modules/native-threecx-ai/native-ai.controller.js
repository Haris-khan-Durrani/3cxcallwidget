const agentService = require('./native-ai-agent.service');
const callService = require('./native-ai-call.service');

async function listAgents(req, res) {
  try {
    const agents = await agentService.listAgents(req.query.company_id);
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createAgent(req, res) {
  try {
    const agent = await agentService.createAgent(req.body);
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function getAgent(req, res) {
  try {
    const agent = await agentService.getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateAgent(req, res) {
  try {
    const agent = await agentService.updateAgent(req.params.id, req.body);
    res.json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function deleteAgent(req, res) {
  try {
    await agentService.deleteAgent(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function verifyAgent(req, res) {
  try {
    const result = await agentService.verifyAgent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function testCall(req, res) {
  try {
    const { client_phone } = req.body;
    if (!client_phone) {
      return res.status(400).json({ error: 'client_phone is required for testing' });
    }
    const callResult = await callService.initiateTestCall(req.params.id, client_phone);
    res.json(callResult);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  listAgents,
  createAgent,
  getAgent,
  updateAgent,
  deleteAgent,
  verifyAgent,
  testCall
};
