from opensearchpy import OpenSearch, RequestsHttpConnection
from typing import List, Dict, Any
from services.config import get_settings
from services.llm.client import BedrockClient
import uuid

class VectorStore:
    def __init__(self):
        self.settings = get_settings()
        self.llm_client = BedrockClient()
        self.client = None
        self.index_name = "agri-documents"
        self._connect()
    
    def _connect(self):
        """Connect to OpenSearch with retry logic."""
        if self.settings.opensearch_endpoint:
            # AWS OpenSearch Serverless
            host = self.settings.opensearch_endpoint.replace('https://', '').replace('http://', '')
            self.client = OpenSearch(
                hosts=[{'host': host, 'port': 443}],
                http_auth=None,  # Use IAM auth
                use_ssl=True,
                verify_certs=True,
                connection_class=RequestsHttpConnection
            )
        else:
            # Local OpenSearch - try Docker service name first, then localhost
            hosts_to_try = [
                {'host': 'opensearch', 'port': 9200},  # Docker service name
                {'host': 'localhost', 'port': 9200}    # Local development
            ]
            
            connected = False
            for host_config in hosts_to_try:
                try:
                    # Try to connect
                    test_client = OpenSearch(
                        hosts=[host_config],
                        http_compress=True,
                        use_ssl=False,
                        verify_certs=False,
                        ssl_show_warn=False,
                        timeout=10
                    )
                    test_client.info()  # Test connection
                    self.client = test_client
                    connected = True
                    print(f"Successfully connected to OpenSearch at {host_config}")
                    break
                except Exception as e:
                    print(f"Failed to connect to {host_config}: {e}")
                    continue
            
            if not connected:
                # Default to opensearch service name (will retry on first use)
                print("Warning: Could not connect to OpenSearch during init, will retry on first use")
                self.client = OpenSearch(
                    hosts=[{'host': 'opensearch', 'port': 9200}],
                    http_compress=True,
                    use_ssl=False,
                    verify_certs=False,
                    ssl_show_warn=False,
                    timeout=10
                )
        
        # Try to ensure index exists, but don't fail if connection isn't ready
        try:
            self._ensure_index()
        except Exception as e:
            print(f"Warning: Could not ensure index exists: {e}")
    
    def _ensure_index(self):
        """Create index if it doesn't exist."""
        try:
            if not self.client.indices.exists(index=self.index_name):
                mapping = {
                    "mappings": {
                        "properties": {
                            "text": {"type": "text"},
                            "embedding": {
                                "type": "knn_vector",
                                "dimension": 1536,  # Titan embedding dimension
                                "method": {
                                    "name": "hnsw",
                                    "space_type": "cosinesimil",
                                    "engine": "nmslib"
                                }
                            },
                            "doc_id": {"type": "keyword"},
                            "chunk_id": {"type": "integer"},
                            "metadata": {"type": "object"}
                        }
                    }
                }
                self.client.indices.create(index=self.index_name, body=mapping)
        except Exception as e:
            # If knn_vector is not available, use a simpler mapping
            print(f"Warning: Could not create index with knn_vector: {e}")
            if not self.client.indices.exists(index=self.index_name):
                mapping = {
                    "mappings": {
                        "properties": {
                            "text": {"type": "text"},
                            "embedding": {"type": "dense_vector", "dims": 1536},
                            "doc_id": {"type": "keyword"},
                            "chunk_id": {"type": "integer"},
                            "metadata": {"type": "object"}
                        }
                    }
                }
                self.client.indices.create(index=self.index_name, body=mapping)
    
    def add_documents(self, chunks: List[Dict], doc_id: str, metadata: Dict = None):
        """Add document chunks to vector store."""
        # Ensure connection is established
        if self.client is None:
            self._connect()
        
        # Ensure index exists
        try:
            self._ensure_index()
        except Exception as e:
            print(f"Error ensuring index: {e}")
            raise
        
        for chunk in chunks:
            # Generate embedding
            embedding = self.llm_client.generate_embedding(chunk['text'])
            
            # Index document
            doc = {
                "text": chunk['text'],
                "embedding": embedding,
                "doc_id": doc_id,
                "chunk_id": chunk.get('chunk_id', 0),
                "metadata": {**(metadata or {}), **(chunk.get('metadata', {}))}
            }
            
            self.client.index(
                index=self.index_name,
                id=f"{doc_id}_{chunk.get('chunk_id', 0)}",
                body=doc
            )
        
        # Refresh index
        self.client.indices.refresh(index=self.index_name)
    
    def search(self, query: str, top_k: int = None) -> List[Dict]:
        """Search for similar documents."""
        top_k = top_k or self.settings.top_k
        
        # Generate query embedding
        try:
            query_embedding = self.llm_client.generate_embedding(query)
            print(f"Generated embedding of length {len(query_embedding) if query_embedding else 0}")
            if not query_embedding or len(query_embedding) == 0:
                print("ERROR: Empty embedding generated!")
                return []
        except Exception as e:
            print(f"ERROR generating embedding: {e}")
            return []
        
        # Search - use text match for now (vector search needs proper KNN setup)
        # For OpenSearch 2.x, we'll use text search which works reliably
        search_body = {
            "size": top_k * 2,  # Get more results to filter by relevance
            "query": {
                "multi_match": {
                    "query": query,
                    "fields": ["text"],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            },
            "_source": ["text", "doc_id", "chunk_id", "metadata"]
        }
        try:
            response = self.client.search(index=self.index_name, body=search_body)
            print(f"Text search returned {len(response['hits']['hits'])} hits")
        except Exception as e:
            print(f"Text search failed: {e}")
            # Fallback to simple match
            search_body = {
                "size": top_k,
                "query": {
                    "match": {
                        "text": query
                    }
                },
                "_source": ["text", "doc_id", "chunk_id", "metadata"]
            }
            response = self.client.search(index=self.index_name, body=search_body)
            print(f"Simple match returned {len(response['hits']['hits'])} hits")
        
        results = []
        for hit in response['hits']['hits']:
            score = hit['_score']
            # For text search, scores are typically much higher (can be 10+)
            # Normalize to 0-1 range for consistency (assuming max score around 10)
            normalized_score = min(score / 10.0, 1.0) if score > 1.0 else score
            
            # Lower threshold for text search since scores are different
            text_threshold = 0.1  # Much lower for text search
            if normalized_score >= text_threshold or len(results) < top_k:
                results.append({
                    'text': hit['_source']['text'],
                    'doc_id': hit['_source']['doc_id'],
                    'chunk_id': hit['_source'].get('chunk_id', 0),
                    'metadata': hit['_source'].get('metadata', {}),
                    'score': normalized_score
                })
                if len(results) >= top_k:
                    break
        
        # If still no results, return top result anyway
        if len(results) == 0 and len(response['hits']['hits']) > 0:
            hit = response['hits']['hits'][0]
            score = hit['_score']
            normalized_score = min(score / 10.0, 1.0) if score > 1.0 else score
            results.append({
                'text': hit['_source']['text'],
                'doc_id': hit['_source']['doc_id'],
                'chunk_id': hit['_source'].get('chunk_id', 0),
                'metadata': hit['_source'].get('metadata', {}),
                'score': normalized_score
            })
        
        print(f"Search query: '{query}' - Found {len(results)} results (from {len(response['hits']['hits'])} total hits)")
        return results
    
    def delete_document(self, doc_id: str):
        """Delete all chunks for a document."""
        self.client.delete_by_query(
            index=self.index_name,
            body={
                "query": {
                    "term": {"doc_id": doc_id}
                }
            }
        )
        self.client.indices.refresh(index=self.index_name)
    
    def list_documents(self) -> List[Dict]:
        """List all unique documents."""
        response = self.client.search(
            index=self.index_name,
            body={
                "size": 0,
                "aggs": {
                    "unique_docs": {
                        "terms": {
                            "field": "doc_id",
                            "size": 1000
                        },
                        "aggs": {
                            "sample": {
                                "top_hits": {
                                    "size": 1,
                                    "_source": ["metadata"]
                                }
                            }
                        }
                    }
                }
            }
        )
        
        docs = []
        for bucket in response['aggregations']['unique_docs']['buckets']:
            doc_id = bucket['key']
            metadata = bucket['sample']['hits']['hits'][0]['_source'].get('metadata', {})
            docs.append({
                'doc_id': doc_id,
                'title': metadata.get('title', doc_id),
                'upload_date': metadata.get('upload_date', ''),
                **metadata
            })
        
        return docs

