const express = require('express');
const router = express.Router();
const nativeAiController = require('./native-ai.controller');
// We assume authenticateToken is exposed globally or passed in, but typically routes define their own or import it
// Here we will just use the controller functions, and authentication should be applied in server.js when mounting

router.get('/agents', nativeAiController.listAgents);
router.post('/agents', nativeAiController.createAgent);
router.get('/agents/:id', nativeAiController.getAgent);
router.patch('/agents/:id', nativeAiController.updateAgent);
router.delete('/agents/:id', nativeAiController.deleteAgent);

// Custom actions
router.post('/agents/:id/verify', nativeAiController.verifyAgent);
router.post('/agents/:id/test-call', nativeAiController.testCall);

module.exports = router;
