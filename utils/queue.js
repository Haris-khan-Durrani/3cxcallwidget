const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const initiationQueue = new Queue('ai-call-initiation', { 
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true
    }
});

const processingQueue = new Queue('ai-call-processing', { connection });
const eventsQueue = new Queue('ai-call-events', { connection });

// Backend worker to process telemetry/webhook events from Pipecat
const eventsWorker = new Worker('ai-call-events', async job => {
    console.log(`[BullMQ] Received event from pipecat:`, job.data);
    const { callId, status, transcript, recording_url, summary, sentiment, customer_intent, duration, stt_cost, llm_cost, tts_cost, total_cost } = job.data;
    
    // Process the telemetry (this mirrors the old webhook endpoint logic)
    const { AICallRecord } = require('../db');
    if (callId) {
        const record = await AICallRecord.findByPk(callId);
        if (record) {
            record.status = status || 'Completed';
            record.ended_at = new Date();
            if (duration) record.duration_seconds = duration;
            if (transcript) record.transcript = transcript;
            if (recording_url) record.recording_url = recording_url;
            if (summary) record.summary = summary;
            if (sentiment) record.sentiment = sentiment;
            if (customer_intent) record.customer_intent = customer_intent;
            if (stt_cost !== undefined) record.stt_cost = stt_cost;
            if (llm_cost !== undefined) record.llm_cost = llm_cost;
            if (tts_cost !== undefined) record.tts_cost = tts_cost;
            if (total_cost !== undefined) record.total_cost = total_cost;
            
            await record.save();
            console.log(`[BullMQ] Updated AICallRecord ${callId} with full Analytics and Cost Tracking`);
        }
    }
}, { connection });

eventsWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] eventsWorker failed for job ${job.id}:`, err);
});

module.exports = {
    initiationQueue,
    processingQueue,
    eventsQueue
};
