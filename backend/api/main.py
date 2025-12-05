from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from services.config import get_settings
from services.orchestrator.rag_orchestrator import RAGOrchestrator
from services.ingestion.document_processor import DocumentProcessor
from services.retrieval.vector_store import VectorStore
import uuid

app = FastAPI(title="Agri-Chat API", version="1.0.0")

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
orchestrator = RAGOrchestrator()
doc_processor = DocumentProcessor()
vector_store = VectorStore()

# Request/Response models
class AskRequest(BaseModel):
    query: str
    sessionId: Optional[str] = None

class AskResponse(BaseModel):
    answer: str
    sources: List[dict]
    sessionId: str

class DocumentInfo(BaseModel):
    doc_id: str
    title: str
    upload_date: str

@app.get("/")
def root():
    return {"message": "Agri-Chat API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """Ask a question and get an answer using RAG."""
    try:
        result = orchestrator.process_query(request.query, request.sessionId)
        return AskResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest")
async def ingest_document(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None)
):
    """Upload and ingest a document."""
    try:
        # Read file content
        content = await file.read()
        
        # Parse metadata
        doc_metadata = {}
        if metadata:
            import json
            doc_metadata = json.loads(metadata)
        
        # Process document
        result = doc_processor.process_file(content, file.filename, doc_metadata)
        
        # Store in vector database
        vector_store.add_documents(
            result['chunks'],
            result['doc_id'],
            result['metadata']
        )
        
        return {
            "doc_id": result['doc_id'],
            "title": result['metadata']['title'],
            "chunks": len(result['chunks']),
            "status": "ingested"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents", response_model=List[DocumentInfo])
async def list_documents():
    """List all ingested documents."""
    try:
        docs = vector_store.list_documents()
        return [
            DocumentInfo(
                doc_id=doc['doc_id'],
                title=doc.get('title', doc['doc_id']),
                upload_date=doc.get('upload_date', '')
            )
            for doc in docs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document."""
    try:
        vector_store.delete_document(doc_id)
        return {"status": "deleted", "doc_id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/documents")
async def delete_all_documents():
    """Delete all documents."""
    try:
        vector_store.delete_all_documents()
        return {"status": "deleted", "message": "All documents deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

