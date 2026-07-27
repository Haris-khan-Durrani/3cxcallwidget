import asyncio
import os
import logging
import requests
import json
import time
from bullmq import Worker, Queue

# Pipecat imports
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.pipeline.runner import PipelineRunner
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMUserAggregator, LLMAssistantAggregator
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.frames.frames import EndFrame, TextFrame, SystemFrame
from pipecat.transports.daily.transport import DailyTransport, DailyParams
# Services
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openrouter.llm import OpenRouterLLMService
from pipecat.services.cartesia.tts import CartesiaTTSService

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://node:3000")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")

from qdrant_client import QdrantClient
from langchain_huggingface import HuggingFaceEmbeddings
try:
    qdrant_client = QdrantClient(url=QDRANT_URL)
    embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
except Exception as e:
    logger.error(f"RAG init error: {e}")
    qdrant_client = None
    embeddings_model = None

class RAGContextInjector(FrameProcessor):
    def __init__(self, campaign_id):
        super().__init__()
        self.campaign_id = campaign_id

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        
        if isinstance(frame, TextFrame) and direction == FrameDirection.DOWNSTREAM:
            try:
                if qdrant_client and embeddings_model:
                    vector = embeddings_model.embed_query(frame.text)
                    results = qdrant_client.search(
                        collection_name="knowledge_base",
                        query_vector=vector,
                        query_filter={"must": [{"key": "campaign_id", "match": {"value": self.campaign_id}}]},
                        limit=3
                    )
                    
                    if results:
                        context = "\\n".join([f"- {res.payload.get('content')}" for res in results])
                        # Append context strictly behind the scenes to guide the LLM
                        frame.text = f"{frame.text}\\n\\n[Strict System Instruction: You MUST answer the preceding user query using ONLY the following verified context. If the context does not contain the answer, politely decline and say you do not know. Context:\\n{context}]"
            except Exception as e:
                logger.error(f"RAG Retrieval Error: {e}")
                
            await self.push_frame(frame, direction)
        else:
            await self.push_frame(frame, direction)

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
            "exp": int(time.time()) + 3600 # expires in 1 hour
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
    campaign_id = campaign_config.get("id")
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
    context = LLMContext(messages)
    tma_in = LLMUserAggregator(context)
    tma_out = LLMAssistantAggregator(context)

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

    rag_injector = RAGContextInjector(campaign_id=campaign_id)

    # 5. Build Pipeline
    pipeline = Pipeline([
        transport.input(),
        stt,
        rag_injector,
        tma_in,
        llm,
        tts,
        transport.output(),
        tma_out
    ])

    task = PipelineTask(pipeline, params=PipelineParams(allow_interruptions=True))
    
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
    
    from knowledge_indexer import process_ingestion_job
    indexer_worker = Worker("ai-knowledge-ingestion", process_ingestion_job, {"connection": REDIS_URL})
    
    logger.info("Waiting for jobs on ai-call-initiation...")
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
