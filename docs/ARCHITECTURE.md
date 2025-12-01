# Architecture Overview

## System Architecture

Agri-Chat is built using a microservices architecture with three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  React 19 + TypeScript + Tailwind CSS                       │
│  - User Interface                                           │
│  - Document Upload                                          │
│  - Chat Interface                                          │
│  - Source Display                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
│  FastAPI + Python 3.11                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Ingestion   │  │  Retrieval   │  │ Orchestrator │     │
│  │  Service     │  │  Service     │  │  Service     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────┬──────────────────┬──────────────────┬───────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Document    │  │  OpenSearch  │  │  AWS Bedrock │
│  Processing  │  │  Vector DB   │  │  LLM Service │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Component Details

### Frontend (React)

- **Location**: `frontend/`
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Key Features**:
  - Real-time chat interface
  - Document upload with drag-and-drop
  - Source citation display
  - Responsive design

### Backend (FastAPI)

- **Location**: `backend/`
- **Framework**: FastAPI (Python 3.11)
- **Structure**:
  - `api/main.py` - API routes and endpoints
  - `services/` - Business logic modules
    - `ingestion/` - Document processing and chunking
    - `retrieval/` - Vector search and similarity matching
    - `llm/` - AWS Bedrock client for LLM and embeddings
    - `orchestrator/` - RAG workflow orchestration

### Vector Store (OpenSearch)

- **Purpose**: Store document embeddings and enable semantic search
- **Index**: `agri-documents`
- **Schema**:
  - `text` - Document chunk text
  - `embedding` - 1536-dimensional vector (Titan embeddings)
  - `doc_id` - Document identifier
  - `chunk_id` - Chunk identifier within document
  - `metadata` - Document metadata (title, upload date, etc.)

### LLM Service (AWS Bedrock)

- **LLM Model**: Claude 3 Sonnet (`anthropic.claude-3-sonnet-20240229-v1:0`)
- **Embedding Model**: Titan Embeddings (`amazon.titan-embed-text-v1`)
- **Usage**:
  - Generate embeddings for document chunks
  - Generate embeddings for user queries
  - Generate answers based on retrieved context

## Data Flow

### Document Upload Flow

```
1. User uploads document (PDF/DOCX/TXT/MD)
   ↓
2. Frontend sends to /ingest endpoint
   ↓
3. Backend processes document:
   - Extract text
   - Split into chunks (1000 chars, 200 overlap)
   - Generate embeddings for each chunk
   ↓
4. Store chunks in OpenSearch with embeddings
   ↓
5. Return success to frontend
```

### Question-Answering Flow (RAG)

```
1. User asks question
   ↓
2. Frontend sends to /ask endpoint
   ↓
3. Backend RAG Orchestrator:
   a. Generate embedding for query
   b. Search OpenSearch for similar chunks
   c. Retrieve top-k relevant chunks
   ↓
4. Build context from retrieved chunks
   ↓
5. Send context + question to Claude 3 Sonnet
   ↓
6. Generate answer with source citations
   ↓
7. Return answer + sources to frontend
```

## Technology Choices

### Why OpenSearch?

- Open-source and self-hostable
- Built-in vector search capabilities
- Easy Docker deployment
- Good performance for semantic search

### Why AWS Bedrock?

- Managed service (no infrastructure to manage)
- Access to state-of-the-art models (Claude 3)
- Cost-effective pay-per-use pricing
- Automatic scaling

### Why FastAPI?

- High performance (async support)
- Automatic API documentation
- Type hints and validation
- Easy to test and maintain

### Why React?

- Modern, component-based architecture
- Great developer experience
- Large ecosystem
- Excellent performance

## Security Considerations

- AWS credentials stored in `~/.aws/credentials` (not in code)
- CORS configured for specific origins
- No sensitive data in environment variables
- Documents stored locally (not in cloud storage)

## Scalability

### Current Setup (Development)

- Single OpenSearch node
- Single backend instance
- Single frontend instance

### Production Considerations

- Use managed OpenSearch service (AWS OpenSearch Service)
- Add load balancer for backend
- Use CDN for frontend
- Implement caching layer
- Add monitoring and logging

## Performance Optimizations

- Document chunking for efficient retrieval
- Vector search for semantic similarity
- Top-k retrieval to limit context size
- Async API endpoints for better concurrency
- Frontend optimizations (lazy loading, code splitting)

## Future Enhancements

- [ ] Support for more file formats
- [ ] Multi-language support
- [ ] User authentication
- [ ] Document versioning
- [ ] Advanced search filters
- [ ] Export chat history
- [ ] Real-time collaboration

