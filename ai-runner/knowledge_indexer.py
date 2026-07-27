import os
import logging
import asyncio
from bullmq import Worker
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")

COLLECTION_NAME = "knowledge_base"

# Initialize Qdrant Client
try:
    qdrant = QdrantClient(url=QDRANT_URL)
    if not qdrant.collection_exists(COLLECTION_NAME):
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
    logger.info("Connected to Qdrant.")
except Exception as e:
    logger.error(f"Failed to connect to Qdrant: {e}")

# Initialize local embeddings (all-MiniLM-L6-v2 is fast and produces 384-dimensional vectors)
embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

async def process_ingestion_job(job, token):
    campaign_id = job.data.get("campaignId")
    files = job.data.get("files", [])
    
    logger.info(f"Processing ingestion for campaign: {campaign_id}, files: {[f.get('name') for f in files]}")

    try:
        # Delete existing knowledge base for this campaign
        qdrant.delete(
            collection_name=COLLECTION_NAME,
            points_selector={"filter": {"must": [{"key": "campaign_id", "match": {"value": campaign_id}}]}}
        )

        points = []
        import uuid
        
        for f in files:
            file_path = f.get("path")
            file_name = f.get("name")
            
            if not os.path.exists(file_path):
                logger.error(f"File not found: {file_path}")
                continue

            # Load PDF
            loader = PyPDFLoader(file_path)
            docs = loader.load()

            # Split text
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            chunks = text_splitter.split_documents(docs)

            for doc in chunks:
                vector = embeddings_model.embed_query(doc.page_content)
                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "campaign_id": campaign_id,
                        "content": doc.page_content,
                        "source": file_name
                    }
                )
                points.append(point)

        # Upsert in batches
        batch_size = 100
        for i in range(0, len(points), batch_size):
            qdrant.upsert(
                collection_name=COLLECTION_NAME,
                points=points[i:i + batch_size]
            )

        logger.info(f"Successfully indexed {len(points)} chunks for campaign {campaign_id}")

    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        raise e

async def main():
    worker = Worker("ai-knowledge-ingestion", process_ingestion_job, {"connection": REDIS_URL})
    logger.info("Knowledge Ingestion worker started...")
    # Keep the worker running
    import asyncio
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    asyncio.run(main())
