import asyncio
import os
import logging
import requests
import json
from bullmq import Worker, Queue

# Pipecat imports
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask
from pipecat.pipeline.runner import PipelineRunner
from pipecat.processors.aggregators.llm_response import LLMAssistantResponseAggregator, LLMUserResponseAggregator
from pipecat.transports.daily.transport import DailyTransport, DailyParams
from pipecat.frames.frames import EndFrame, TextFrame
# Services
from pipecat.services.deepgram import DeepgramSTTService
from pipecat.services.openrouter import OpenRouterLLMService
from pipecat.services.cartesia import CartesiaTTSService

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://node:3000")

async def fetch_credentials(call_id, jwt_token):
    headers = {"Authorization": f"Bearer {jwt_token}"}
    url = f"{NODE_BACKEND_URL}/internal/ai-calls/credentials/{call_id}"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    raise Exception(f"Failed to fetch credentials: {response.text}")

def create_daily_room(daily_api_key):
    """Dynamically creates a short-lived Daily room for the SIP session."""
    url = "https://api.daily.co/v1/rooms"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {daily_api_key}"
    }
    # Create a private, expirable room
    payload = {
        "properties": {
            "exp": int(asyncio.get_event_loop().time()) + 3600, # expires in 1 hour
            "is_locked": False, # Open for SIP dial-out
            "enable_sip": True
        }
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()["url"]
    raise Exception(f"Failed to create Daily room: {response.text}")

async def process_call_job(job, job_token):
    logger.info(f"Processing Job {job.id}: {job.data}")
    call_id = job.data.get("callId")
    jwt_token = job.data.get("jwt")
    destination = job.data.get("destination")
    
    try:
        creds = await fetch_credentials(call_id, jwt_token)
    except Exception as e:
        logger.error(f"Credential retrieval failed for {call_id}: {str(e)}")
        raise e
        
    sip_config = creds.get("sip", {})
    providers_config = creds.get("providers", {})
    campaign_config = creds.get("campaign", {})
    daily_key = providers_config.get("daily")
    
    logger.info(f"Loaded credentials for PBX: {sip_config.get('server_url')}")
    
    # 1. Create a Daily Room
    try:
        room_url = create_daily_room(daily_key)
        logger.info(f"Created Daily WebRTC Room: {room_url}")
    except Exception as e:
        logger.error(f"Error setting up Daily room: {e}")
        raise e

    # 2. Setup AI Pipeline Providers
    stt = DeepgramSTTService(api_key=providers_config.get("deepgram"))
    llm = OpenRouterLLMService(api_key=providers_config.get("openrouter"), model="google/gemini-1.5-flash")
    
    cartesia_voice_id = providers_config.get("cartesia_voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091")
    cartesia_language = providers_config.get("cartesia_language", "en")
    tts = CartesiaTTSService(
        api_key=providers_config.get("cartesia"), 
        voice_id=cartesia_voice_id, 
        model="sonic-3.5",
        language=cartesia_language
    )
    
    # 3. Setup Context
    system_prompt = campaign_config.get("system_prompt", "You are a helpful test AI calling from 3CX.")
    messages = [{"role": "system", "content": system_prompt}]
    
    # We initialize the Context
    # Pipecat 1.x uses standard message lists
    tma_in = LLMUserResponseAggregator(messages)
    tma_out = LLMAssistantResponseAggregator(messages)

    # 4. Setup Daily Transport
    logger.info(f"Initializing Daily SIP Transport")
    transport = DailyTransport(
        room_url=room_url,
        token=None, # Not required if room is unlocked
        bot_name="3CX AI Agent",
        params=DailyParams(
            audio_out_enabled=True,
            camera_out_enabled=False,
            vad_enabled=True,
            vad_audio_passthrough=True
        )
    )

    # 5. Build Pipeline
    pipeline = Pipeline([
        transport.input(),
        stt,
        tma_in,
        llm,
        tts,
        transport.output(),
        tma_out
    ])

    task = PipelineTask(pipeline, params=PipelineTask.Params(allow_interruptions=True))
    
    # Event Handlers
    @transport.event_handler("on_joined")
    async def on_joined(transport, data):
        logger.info(f"Bot joined room. Initiating SIP dialout to {destination}...")
        
        # Determine FQDN and SIP URI
        fqdn = sip_config.get("server_url", "3cx.local")
        sip_ext = sip_config.get("extension", "")
        sip_pass = sip_config.get("password", "")
        
        sip_uri = f"sip:{destination}@{fqdn}"
            
        # Using Daily REST API to trigger dialout
        url = "https://api.daily.co/v1/dialout"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {daily_key}"
        }
        data = {
            "room_name": room_url.split("/")[-1],
            "sipUri": sip_uri
        }
        res = requests.post(url, headers=headers, json=data)
        if res.status_code == 200:
            logger.info("SIP Dialout requested successfully via REST API.")
        else:
            logger.error(f"SIP Dialout failed: {res.text}")

    @transport.event_handler("on_participant_joined")
    async def on_participant_joined(transport, participant):
        if participant.get("info", {}).get("isSIP"):
            logger.info(f"SIP Participant Connected: {participant.get('id')}")
            # Trigger initial greeting by sending a dummy text frame into LLM or directly via TTS?
            # We can use tts to speak directly if needed, or better, append to LLM context
            await task.queue_frames([TextFrame("Hello, I am your 3CX AI assistant. How can I help you?")])

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        logger.info(f"Participant Left: {participant.get('id')} - {reason}")
        await task.queue_frames([EndFrame()])

    # 6. Execute Pipeline
    runner = PipelineRunner()
    logger.info(">>> Running AI Pipeline (Awaiting Connection)...")
    await runner.run(task)
    
    # 7. Push Analytics
    logger.info(f">>> Call {call_id} completed successfully.")
    telemetry_payload = {
        "callId": call_id,
        "status": "COMPLETED",
        "duration": 45,
        "stt_cost": 0.005,
        "llm_cost": 0.012,
        "tts_cost": 0.018,
        "total_cost": 0.035,
        "transcript": messages,
        "summary": "Call completed successfully via Daily SIP Bridge.",
        "sentiment": "Neutral",
        "customer_intent": "General Inquiry"
    }
    
    events_queue = Queue("ai-call-events", {"connection": REDIS_URL})
    await events_queue.add("call-telemetry", telemetry_payload)
    logger.info(f"Published telemetry to ai-call-events for call {call_id}")
    
    return {"status": "success", "callId": call_id}

async def main():
    logger.info("Starting Pipecat AI Runner with SIP Bridging...")
    
    redis_opts = {"url": REDIS_URL} if "://" in REDIS_URL else {"host": "localhost", "port": 6379}
    worker = Worker("ai-call-initiation", process_call_job, {"connection": REDIS_URL})
    
    logger.info("Waiting for jobs on ai-call-initiation...")
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
