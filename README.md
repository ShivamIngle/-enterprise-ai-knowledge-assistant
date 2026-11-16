
# Enterprise AI Knowledge Assistant

A Retrieval-Augmented Generation (RAG) based Enterprise AI Knowledge Assistant that allows users to upload PDF documents and ask questions using natural language.

The application processes uploaded documents, creates embeddings, stores document chunks in ChromaDB, retrieves relevant context, and generates answers using a locally hosted Large Language Model through Ollama.

## Key Features

- PDF document upload and processing
- Text extraction using PyPDF
- Document chunking and embedding generation
- Vector storage and similarity-based retrieval using ChromaDB
- Context-aware question answering using Ollama
- FastAPI backend and web-based interface
- Health-check and Prometheus metrics endpoints
- Docker containerization
- Kubernetes deployment
- Prometheus monitoring and Grafana dashboards

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Python, FastAPI |
| LLM Runtime | Ollama |
| Language Model | llama3.2:3b |
| Embedding Model | nomic-embed-text |
| Vector Database | ChromaDB |
| PDF Processing | PyPDF |
| API Server | Uvicorn |
| Containerization | Docker |
| Orchestration | Kubernetes |
| Monitoring | Prometheus |
| Visualization | Grafana |
| CI/CD | GitHub Actions |

## Architecture

```text
              User
                |
                v
       Web Application
                |
                v
          FastAPI Backend
                |
         PDF Upload / Chat
                |
                v
        PDF Text Extraction
                |
                v
         Text Chunking
                |
                v
       Ollama Embeddings
                |
                v
           ChromaDB
          Vector Store
                |
                v
       Similarity Retrieval
                |
                v
        Relevant Context
                |
                v
         Ollama LLM
                |
                v
         Generated Answer
                |
                v
              User
```

## Project Structure

```text
enterprise-ai-assistant/
│
├── app/
│   ├── main.py
│   ├── config.py
│   ├── pdf_processor.py
│   ├── embeddings.py
│   ├── vector_store.py
│   ├── rag_engine.py
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── style.css
│       └── app.js
│
├── data/
│   ├── uploads/
│   └── chroma_db/
│
├── k8s/
│   └── Kubernetes manifests
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Prerequisites

Install the following tools:

- Python 3.11
- Docker Desktop
- Ollama
- Kubernetes enabled in Docker Desktop
- kubectl
- Git

## Ollama Setup

Install Ollama and download the required models:

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

Make sure the Ollama service is running.

Configure the Ollama connection in `app/config.py` for your environment.

## Local Installation

Clone the repository:

```bash
git clone https://github.com/ShivamIngle/-enterprise-ai-knowledge-assistant.git
cd -enterprise-ai-knowledge-assistant
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI application:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open the application:

http://localhost:8000

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Web application |
| GET | `/health` | Application health check |
| GET | `/api/documents` | List uploaded documents |
| POST | `/api/upload` | Upload a PDF document |
| POST | `/api/chat` | Ask questions about documents |
| GET | `/metrics` | Prometheus metrics |

### Example Chat Request

```json
{
  "question": "What is the annual paid leave policy?"
}
```

## Docker Deployment

Build the Docker image:

```bash
docker build -t enterprise-ai-assistant:latest .
```

Run the container:

```bash
docker run -p 8000:8000 enterprise-ai-assistant:latest
```

For Ollama connectivity, configure the container to reach the Ollama service running on the host machine.

## Kubernetes Deployment

Make sure Docker Desktop Kubernetes is enabled.

Apply the application manifests:

```bash
kubectl apply -f k8s/
```

Check the deployment:

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

Access the application using port forwarding:

```bash
kubectl port-forward service/enterprise-ai-assistant 8093:8000
```

Open:

http://localhost:8093

## Monitoring

The application exposes Prometheus metrics at:

```text
/metrics
```

Prometheus collects application metrics, including:

- HTTP request count
- HTTP request latency
- Application process metrics
- Python runtime metrics

Grafana is used to visualize monitoring information through dashboards.

## CI/CD

GitHub Actions is used to automate:

1. Python application validation.
2. Docker image build.
3. Docker image publishing to GitHub Container Registry (GHCR).

Workflow configuration:

```text
.github/workflows/ci-cd.yml
```

## Future Improvements

- Automated deployment to a remote Kubernetes cluster
- Authentication and role-based access control
- Support for additional document formats
- Improved RAG evaluation and retrieval quality
- Centralized application logging

## Author

**Shivam Ingle**

GitHub: https://github.com/ShivamIngle

Project: Enterprise AI Knowledge Assistant
