# AgroCortex 🌾: Multi-Agent Agricultural AI Pipeline

AgroCortex is a production-ready, edge-compatible AI orchestration system designed to diagnose plant diseases and generate dynamic, context-aware treatment plans. Built heavily around **LangGraph** for multi-agent workflows and **Local LLM Inference** to ensure data privacy and reduce token costs, it diverges from standard linear prompt chains to provide a robust, reasoning-based diagnostic pipeline.

## 🧠 Core Engineering Architecture

### 1. Multi-Agent Orchestration (LangGraph)
Instead of rigid `SequentialChains`, AgroCortex utilizes a directed acyclic graph (DAG) architecture via LangGraph to coordinate three distinct agents:
- **Vision Agent**: Parses image bytes and extracts bounding boxes/confidence scores.
- **RAG Agent**: Triggers an asynchronous vector search against Qdrant if specific disease flags are raised.
- **Decision Agent**: Synthesizes computer vision outputs, IoT sensor telemetry (pH, temperature), and retrieved academic literature into a structured mitigation strategy.

### 2. Robust RAG Ingestion Pipeline
The knowledge-base ingestion is optimized for semantic retrieval and minimal context loss:
- **Semantic Chunking**: Employs `RecursiveCharacterTextSplitter` (chunk_size=1000, overlap=200) to respect paragraph and sentence boundaries, preventing critical treatment protocols from being severed across vectors.
- **Multi-Format Parsing**: Built-in document loaders for extracting raw text from PDFs, DOCX, MD, and TXT files.
- **Local Embedding**: Uses Ollama's `nomic-embed-text` to map chunks into 768-dimensional space, indexed in Qdrant using COSINE distance.

### 3. Vision System & Heuristic Fallback
A dual-layer computer vision pipeline guarantees high recall:
- **Primary Detection**: YOLOv8-based object detection tailored for specific blight and leaf spot classifications.
- **Heuristic Fallback (HSV Space)**: In instances where the deep learning model confidence is low, the pipeline automatically falls back to deterministic HSV color space analysis (e.g., detecting chlorosis via yellow pixel ratios > 3%, or necrosis via dark patch density).

### 4. Frontend Performance & Testing
- **Route-Based Code Splitting**: Implemented `React.lazy` and `Suspense` for aggressive chunking of the frontend bundle, drastically reducing the Time to Interactive (TTI).
- **Test Coverage**: An extensive test suite (75+ tests) built on Vitest and React Testing Library (RTL). Configured with a `happy-dom` environment to resolve Node ESM compatibility issues seamlessly.

## 🚀 Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Orchestration** | LangGraph, FastAPI | Async non-blocking endpoints with cyclic graph capabilities. |
| **LLM Engine** | Ollama (llama3.2) | 4-bit quantized local inference; zero latency/cost for external API calls. |
| **Vector DB** | Qdrant (Rust-based) | High-throughput HNSW indexing, minimal memory footprint. |
| **Embeddings** | nomic-embed-text | Optimized for retrieval tasks, generating dense 768-d vectors locally. |
| **Frontend** | Vite, React, Vitest | Fast HMR, strict type-checking, and comprehensive RTL integration. |

## 🛠️ Quick Start

### Prerequisites
- Docker & Docker Compose
- Ollama (`brew install ollama`)

### 1. Pull Local Models
```bash
ollama pull llama3.2
ollama pull nomic-embed-text
ollama serve
```

### 2. Boot the Infrastructure
```bash
git clone https://github.com/saciducak/Topraks-z-Tar-m-icin-production-ready-agent.git
cd Topraks-z-Tar-m-icin-production-ready-agent

docker-compose up --build -d
```

### 3. Ingest Knowledge Base
To populate Qdrant with the latest agricultural literature (chunked and vectorized):
```bash
cd backend
python3 -m src.scripts.ingest
```

## 📡 Endpoints Overview

- `POST /api/v1/analyze`: Core pipeline trigger. Accepts multipart image + JSON sensor telemetry.
- `POST /api/v1/chat`: Conversational memory endpoint for follow-up mitigation questions.
- `GET /api/v1/models/status`: Health check for YOLO weights, Ollama socket, and Qdrant readiness.

---
*Built with a focus on local inference, architectural modularity, and deterministic fallback mechanisms.*
