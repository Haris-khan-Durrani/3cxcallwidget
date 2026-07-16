<template>
  <AppLayout>
    <div class="page animate-fade-in">
      <div class="page-header">
        <div class="title-row">
          <h2>Developer Documentation</h2>
        </div>
        <p class="page-sub">Understand how call lifecycle events work and how to handle webhook payloads.</p>
      </div>

      <div class="docs-container">
        <!-- Call Lifecycle Overview -->
        <div class="card docs-card">
          <h3 class="docs-title">Call Lifecycle & Failover</h3>
          <p class="docs-text">
            When a customer requests a call through a widget, the system follows a specific state machine to ensure the call is routed properly.
          </p>
          <ul class="docs-list">
            <li><strong>Initiated:</strong> The customer submits their phone number. The system attempts to connect via the 3CX MakeCall API.</li>
            <li><strong>Ringing:</strong> The system is actively dialing the configured agents.</li>
            <li><strong>Answered:</strong> An agent picks up the call and connects to the customer.</li>
            <li><strong>Completed:</strong> The call finishes successfully after being answered.</li>
            <li><strong>Failed / Missed:</strong> If an agent misses the call, the system automatically <strong>fails over</strong> to the next available agent on the widget. The "Failed" status is only applied if <em>all</em> available agents miss the call, or if the maximum retry limit (3 attempts) is reached.</li>
            <li><strong>Offline Lead:</strong> If a customer requests contact outside of office hours or no agents are available, an offline lead is created.</li>
          </ul>

          <div class="premium-flow">
            <!-- Step 1 -->
            <div class="pf-step pf-start">
              <div class="pf-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></div>
              <div class="pf-content">
                <h4>1. Customer Calls</h4>
                <p>Visitor submits their number on the widget.</p>
                <div class="pf-webhook badge badge-blue">POST: Call Initiated</div>
              </div>
            </div>

            <div class="pf-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg></div>

            <!-- Step 2 -->
            <div class="pf-step pf-ringing">
              <div class="pf-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></div>
              <div class="pf-content">
                <h4>2. System Rings Agent</h4>
                <p>3CX actively calls the first available agent.</p>
              </div>
            </div>

            <div class="pf-split-container">
              <!-- Left Path (Success) -->
              <div class="pf-path pf-path-success">
                <div class="pf-path-header"><span class="pf-dot dot-green"></span> Agent Answers</div>
                <div class="pf-step pf-success">
                  <div class="pf-content">
                    <h4>3. Call Connected</h4>
                    <p>Agent and customer are talking.</p>
                    <div class="pf-webhook badge badge-green">POST: Call Answered</div>
                  </div>
                </div>
                <div class="pf-arrow-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg></div>
                <div class="pf-step pf-neutral">
                  <div class="pf-content">
                    <h4>4. Call Hangs Up</h4>
                    <p>The conversation finishes successfully.</p>
                    <div class="pf-webhook badge badge-gray">POST: Call Completed</div>
                  </div>
                </div>
              </div>

              <!-- Right Path (Fail) -->
              <div class="pf-path pf-path-fail">
                <div class="pf-path-header"><span class="pf-dot dot-red"></span> Agent Misses</div>
                <div class="pf-step pf-warning">
                  <div class="pf-content">
                    <h4>3. Failover Triggered</h4>
                    <p>System automatically rings the next agent.</p>
                    <div class="pf-mini-loop">↺ Loops until answered</div>
                  </div>
                </div>
                <div class="pf-arrow-small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg></div>
                <div class="pf-step pf-danger">
                  <div class="pf-content">
                    <h4>4. All Agents Missed</h4>
                    <p>Call is abandoned or all agents fail to answer.</p>
                    <div class="pf-webhook badge badge-red">POST: Call Failed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Webhook Triggers -->
        <div class="card docs-card">
          <h3 class="docs-title">Webhook Event Triggers</h3>
          <p class="docs-text">
            Webhooks are HTTP <code>POST</code> requests sent to your configured URLs when specific call events occur. 
          </p>
          <div class="trigger-grid">
            <div class="trigger-box">
              <span class="badge badge-blue">Call Initiated</span>
              <p>Sent immediately when a customer submits their number. Use this to create an initial lead in your CRM before the call even connects.</p>
            </div>
            <div class="trigger-box">
              <span class="badge badge-green">Call Answered</span>
              <p>Sent the moment the agent and customer connect. Use this to pop up the customer's CRM profile for the agent.</p>
            </div>
            <div class="trigger-box">
              <span class="badge badge-gray">Call Completed</span>
              <p>Sent when a successful call hangs up. Includes the call duration and a link to the recording.</p>
            </div>
            <div class="trigger-box">
              <span class="badge badge-red">Call Failed / Busy</span>
              <p>Sent <strong>only</strong> when the call ultimately fails (after all agent failovers have been exhausted or the call is abandoned).</p>
            </div>
            <div class="trigger-box">
              <span class="badge badge-yellow">Offline Lead</span>
              <p>Sent when a customer leaves a message outside office hours. Use this to trigger email follow-ups.</p>
            </div>
          </div>
        </div>

        <!-- JSON Payload Example -->
        <div class="card docs-card">
          <h3 class="docs-title">JSON Payload Structure</h3>
          <p class="docs-text">
            Every webhook sends a JSON body containing the full context of the call. Here is an example of what you will receive:
          </p>
          <pre class="code-block"><code>{
  "callId": 1205,
  "widgetId": "w_5a8b9c2",
  "widgetName": "Main Website Widget",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "customerEmail": "john@example.com",
  "agentExtension": "101, 102",  <span class="code-comment">// Comma-separated list of extensions that were rung</span>
  "status": "Completed",       <span class="code-comment">// Initiated, Ringing, Answered, Completed, Failed, Missed</span>
  "outcome": "Completed",      <span class="code-comment">// Can be 'Lead' for offline leads</span>
  "durationSeconds": 145,      <span class="code-comment">// Talk time in seconds</span>
  "retryCount": 1,             <span class="code-comment">// Number of failovers that occurred</span>
  "recordingId": "rec_99x",
  "recordingUrl": "https://yourdomain.com/api/admin/widgets/.../download?token=...",
  "timestamp": "2026-07-15T14:30:00.000Z"
}</code></pre>
        </div>

        <!-- Processing Examples -->
        <div class="card docs-card">
          <h3 class="docs-title">Handling Webhooks (Node.js Example)</h3>
          <p class="docs-text">
            Below is a simple Express.js snippet showing how you might receive and process these webhooks.
          </p>
          <pre class="code-block"><code>const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook/3cx-events', (req, res) => {
  const data = req.body;

  console.log(`Received ${data.status} event for ${data.customerName}`);

  if (data.status === 'Completed' && data.durationSeconds > 60) {
    // Create successful call log in CRM
    crm.logCall(data.customerPhone, data.recordingUrl);
  } else if (data.status === 'Failed') {
    // Create follow-up task for missed call
    crm.createTask(`Call back ${data.customerName}`, data.customerPhone);
  }

  res.status(200).send('OK');
});

app.listen(3000);</code></pre>
        </div>

      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '../components/AppLayout.vue'
</script>

<style scoped>
.page { padding: 32px 40px; width: 100%; }
.page-header { margin-bottom: 32px; }
.title-row { display: flex; align-items: center; gap: 12px; }
.page-sub { color: var(--text2); font-size: 13px; margin-top: 6px; }

.docs-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1400px;
  width: 100%;
}
.docs-card {
  padding: 24px;
}
.docs-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: var(--text1);
}
.docs-text {
  color: var(--text2);
  line-height: 1.6;
  margin-bottom: 16px;
}
.docs-list {
  padding-left: 20px;
  color: var(--text2);
  line-height: 1.6;
}
.docs-list li {
  margin-bottom: 8px;
}
.docs-list strong {
  color: var(--text1);
}

.trigger-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}
.trigger-box {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}
.trigger-box p {
  margin: 10px 0 0 0;
  font-size: 13px;
  color: var(--text2);
  line-height: 1.5;
}

.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  overflow-x: auto;
  line-height: 1.5;
}
.code-comment {
  color: #6a9955;
}

/* Badges for trigger grid */
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
.badge-green { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
.badge-gray { background: rgba(107, 114, 128, 0.1); color: #6b7280; border: 1px solid rgba(107, 114, 128, 0.2); }
.badge-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
.badge-yellow { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }

/* Premium Flow Diagram */
.premium-flow { margin-top: 32px; background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 32px; display: flex; flex-direction: column; align-items: center; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02); }

.pf-step { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; display: flex; align-items: flex-start; gap: 16px; width: 100%; max-width: 400px; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.pf-step:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: rgba(128,128,128,0.3); }

.pf-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pf-icon svg { width: 22px; height: 22px; }

.pf-content h4 { margin: 0 0 6px 0; font-size: 15px; color: var(--text1); font-weight: 700; }
.pf-content p { margin: 0; font-size: 13px; color: var(--text2); line-height: 1.5; }

.pf-webhook { margin-top: 12px; display: inline-block; box-shadow: 0 2px 6px rgba(0,0,0,0.05); font-size: 10.5px; letter-spacing: 0.5px; }

/* Step Styles */
.pf-start .pf-icon { background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #2563eb; }
.pf-ringing .pf-icon { background: linear-gradient(135deg, #f5f3ff, #ede9fe); color: #7c3aed; }
.pf-success { border-left: 4px solid #10b981; }
.pf-neutral { border-left: 4px solid #6b7280; }
.pf-warning { border-left: 4px solid #f59e0b; }
.pf-danger { border-left: 4px solid #ef4444; }

.pf-arrow { display: flex; align-items: center; justify-content: center; height: 40px; color: var(--border); }
.pf-arrow svg { width: 24px; height: 24px; color: rgba(128,128,128,0.4); }
.pf-arrow-small { display: flex; align-items: center; justify-content: center; height: 30px; }
.pf-arrow-small svg { width: 18px; height: 18px; color: rgba(128,128,128,0.3); }

/* Split Container */
.pf-split-container { display: flex; gap: 32px; width: 100%; margin-top: 40px; position: relative; justify-content: center; }

/* The horizontal connector line */
.pf-split-container::before { 
  content: ''; 
  position: absolute; 
  top: -24px; 
  left: 25%; 
  right: 25%; 
  height: 24px; 
  border-left: 2px dashed var(--border); 
  border-top: 2px dashed var(--border); 
  border-right: 2px dashed var(--border); 
  border-radius: 12px 12px 0 0; 
  opacity: 0.5; 
}

/* Vertical line coming down into the split */
.pf-split-container::after {
  content: '';
  position: absolute;
  top: -40px;
  left: 50%;
  width: 2px;
  height: 16px;
  background: var(--border);
  opacity: 0.5;
  transform: translateX(-50%);
}

.pf-path { flex: 1; display: flex; flex-direction: column; align-items: center; background: rgba(128,128,128,0.03); padding: 32px 24px; border-radius: 16px; border: 1px dashed var(--border); max-width: 480px; }
.pf-path-header { margin-bottom: 20px; font-size: 13px; font-weight: 700; color: var(--text1); text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; background: var(--bg2); padding: 6px 16px; border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.02); z-index: 2; }

.pf-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-green { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.5); }
.dot-red { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5); }

.pf-mini-loop { margin-top: 10px; font-size: 11px; font-weight: 600; color: #f59e0b; background: rgba(245,158,11,0.1); padding: 4px 8px; border-radius: 4px; display: inline-block; }

@media (max-width: 768px) {
  .pf-split-container { flex-direction: column; }
  .pf-split-container::before { display: none; }
  .pf-path { width: 100%; }
}
</style>
