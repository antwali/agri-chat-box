from typing import Dict, List, Any
from services.llm.client import BedrockClient
from services.retrieval.vector_store import VectorStore
from services.config import get_settings

class RAGOrchestrator:
    """Orchestrates RAG workflow: retrieval -> generation."""
    
    def __init__(self):
        self.settings = get_settings()
        self.llm_client = BedrockClient()
        self.vector_store = VectorStore()
    
    def process_query(self, query: str, session_id: str = None) -> Dict[str, Any]:
        """Process a user query using RAG."""
        # Retrieve relevant documents
        retrieved_docs = self.vector_store.search(query)
        
        # Build context from retrieved documents
        context = self._build_context(retrieved_docs)
        
        # Generate response with context
        system_prompt = """You are a helpful agricultural assistant. Answer questions based on the provided context documents. 
If the context doesn't contain enough information, say so. Always cite sources when possible."""
        
        user_prompt = f"""Context documents:
{context}

User question: {query}

Please provide a helpful answer based on the context above. If you reference information from the context, mention which document it came from."""
        
        answer = self.llm_client.generate_response(user_prompt, system_prompt)
        
        # Format sources
        sources = [
            {
                'docId': doc['doc_id'],
                'title': doc['metadata'].get('title', doc['doc_id']),
                'url': doc['metadata'].get('url', ''),
                'score': doc['score']
            }
            for doc in retrieved_docs
        ]
        
        return {
            'answer': answer,
            'sources': sources,
            'sessionId': session_id or 'default'
        }
    
    def _build_context(self, docs: List[Dict]) -> str:
        """Build context string from retrieved documents."""
        if not docs:
            return "No relevant documents found."
        
        context_parts = []
        for i, doc in enumerate(docs, 1):
            title = doc['metadata'].get('title', doc['doc_id'])
            context_parts.append(f"[Document {i}: {title}]\n{doc['text']}\n")
        
        return "\n".join(context_parts)

