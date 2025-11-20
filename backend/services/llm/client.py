import boto3
import json
from typing import List, Dict, Any
from services.config import get_settings

class BedrockClient:
    def __init__(self):
        self.settings = get_settings()
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=self.settings.aws_region
        )
    
    def generate_response(self, prompt: str, system: str = "") -> str:
        """Generate response using Claude."""
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": self.settings.max_tokens,
            "temperature": self.settings.temperature,
            "system": system,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        })
        
        response = self.bedrock_runtime.invoke_model(
            modelId=self.settings.bedrock_model_id,
            body=body
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text']
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using Titan."""
        body = json.dumps({
            "inputText": text
        })
        
        response = self.bedrock_runtime.invoke_model(
            modelId=self.settings.bedrock_embedding_model,
            body=body
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['embedding']
