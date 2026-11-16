
import os

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

UPLOAD_DIR = os.getenv(
    "UPLOAD_DIR",
    os.path.join(BASE_DIR, "data", "uploads")
)

CHROMA_DIR = os.getenv(
    "CHROMA_DIR",
    os.path.join(BASE_DIR, "data", "chroma_db")
)

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "nomic-embed-text:latest"
)

OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://localhost:11434"
)

LLM_MODEL = os.getenv(
    "LLM_MODEL",
    "llama3.2:3b"
)

COLLECTION_NAME = "enterprise_documents"

CHUNK_SIZE = 800
CHUNK_OVERLAP = 120
TOP_K = 4

MAX_FILE_SIZE = 20 * 1024 * 1024

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)
