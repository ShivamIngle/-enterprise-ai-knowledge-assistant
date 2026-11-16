
import os
import uuid
import logging
import time
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from prometheus_client import (
    Counter,
    Histogram,
    generate_latest,
    CONTENT_TYPE_LATEST
)

from app.config import UPLOAD_DIR, MAX_FILE_SIZE
from app.pdf_processor import process_pdf
from app.vector_store import store_chunks, get_all_documents
from app.rag_engine import generate_answer


# ==================================================
# LOGGING CONFIGURATION
# ==================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


# ==================================================
# APPLICATION CONFIGURATION
# ==================================================

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="Enterprise AI Knowledge Assistant",
    description="RAG-based Enterprise PDF Question Answering System",
    version="1.0.0"
)

# Serve frontend static files
app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "static")),
    name="static"
)


# ==================================================
# PROMETHEUS METRICS
# ==================================================

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"]
)


# ==================================================
# PROMETHEUS MONITORING MIDDLEWARE
# ==================================================

@app.middleware("http")
async def prometheus_metrics_middleware(
    request: Request,
    call_next
):

    start_time = time.perf_counter()

    method = request.method
    endpoint = request.url.path

    # Avoid counting Prometheus scrape requests
    if endpoint == "/metrics":
        return await call_next(request)

    try:
        response = await call_next(request)

        status_code = str(response.status_code)

    except Exception:

        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status="500"
        ).inc()

        REQUEST_LATENCY.labels(
            method=method,
            endpoint=endpoint
        ).observe(
            time.perf_counter() - start_time
        )

        raise

    REQUEST_COUNT.labels(
        method=method,
        endpoint=endpoint,
        status=status_code
    ).inc()

    REQUEST_LATENCY.labels(
        method=method,
        endpoint=endpoint
    ).observe(
        time.perf_counter() - start_time
    )

    return response


# ==================================================
# PROMETHEUS METRICS ENDPOINT
# ==================================================

@app.get("/metrics", include_in_schema=False)
def metrics():

    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


# ==================================================
# REQUEST MODEL
# ==================================================

class ChatRequest(BaseModel):
    question: str


# ==================================================
# ROOT / FRONTEND ENDPOINT
# ==================================================

@app.get("/", include_in_schema=False)
async def home():

    return FileResponse(
        BASE_DIR / "templates" / "index.html"
    )


# ==================================================
# HEALTH CHECK
# ==================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "application": "Enterprise AI Knowledge Assistant"
    }


# ==================================================
# LIST UPLOADED DOCUMENTS
# ==================================================

@app.get("/api/documents")
def documents():

    return {
        "documents": get_all_documents()
    }


# ==================================================
# PDF UPLOAD ENDPOINT
# ==================================================

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    file_bytes = await file.read(MAX_FILE_SIZE + 1)

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File exceeds the 20 MB upload limit."
        )

    if not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file."
        )

    document_id = str(uuid.uuid4())

    safe_filename = os.path.basename(file.filename)

    file_path = Path(UPLOAD_DIR) / f"{document_id}.pdf"

    try:

        # Extract and split PDF content
        chunks = process_pdf(file_bytes)

        if not chunks:
            raise HTTPException(
                status_code=422,
                detail="No readable text found in PDF. Scanned PDFs require OCR."
            )

        # Generate embeddings and store in ChromaDB
        count = store_chunks(
            chunks,
            document_id,
            safe_filename
        )

        # Save original PDF
        file_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        with open(file_path, "wb") as output:
            output.write(file_bytes)

        logger.info(
            "PDF uploaded: %s | Chunks: %s",
            safe_filename,
            count
        )

        return {
            "message": "PDF uploaded and processed successfully.",
            "document_id": document_id,
            "filename": safe_filename,
            "chunks_created": count
        }

    except HTTPException:
        raise

    except Exception:

        logger.exception("PDF processing failed")

        raise HTTPException(
            status_code=500,
            detail="Unable to process PDF."
        )


# ==================================================
# AI CHAT ENDPOINT
# ==================================================

@app.post("/api/chat")
def chat(request: ChatRequest):

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    if len(question) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Question is too long."
        )

    try:

        logger.info("Question received")

        result = generate_answer(question)

        return result

    except Exception:

        logger.exception("AI answer generation failed")

        raise HTTPException(
            status_code=503,
            detail="Unable to generate answer. Check Ollama service."
        )
