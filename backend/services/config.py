from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # AWS
    aws_region: str = "us-east-1"
    opensearch_endpoint: str = ""
    
    # Bedrock
    bedrock_model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    bedrock_embedding_model: str = "amazon.titan-embed-text-v1"
    
    # Retrieval
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k: int = 5
    similarity_threshold: float = 0.7
    
    # LLM
    max_tokens: int = 2000
    temperature: float = 0.1
    
    # API
    api_key: str = "dev-key"
    cors_origins: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra environment variables

@lru_cache()
def get_settings():
    return Settings()
