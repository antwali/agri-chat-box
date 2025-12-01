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
        query_embedding = self.llm_client.generate_embedding(query)
        
        # Search - try knn first, fallback to script_score
        try:
            search_body = {
                "size": top_k,
                "query": {
                    "knn": {
                        "embedding": {
                            "vector": query_embedding,
                            "k": top_k
                        }
                    }
                },
                "_source": ["text", "doc_id", "chunk_id", "metadata"]
            }
            response = self.client.search(index=self.index_name, body=search_body)
        except Exception:
            # Fallback to script_score for compatibility
            search_body = {
                "size": top_k,
                "query": {
                    "match_all": {}
                },
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {"query_vector": query_embedding}
                    }
                },
                "_source": ["text", "doc_id", "chunk_id", "metadata"]
            }
            response = self.client.search(index=self.index_name, body=search_body)
        
        results = []
        for hit in response['hits']['hits']:
            score = hit['_score']
            if score >= self.settings.similarity_threshold:
                results.append({
                    'text': hit['_source']['text'],
                    'doc_id': hit['_source']['doc_id'],
                    'chunk_id': hit['_source'].get('chunk_id', 0),
                    'metadata': hit['_source'].get('metadata', {}),
                    'score': score
                })
        
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

