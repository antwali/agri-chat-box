import boto3
import json

def test_bedrock():
    """Test if Bedrock is accessible."""
    
    # Initialize client
    bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
    
    try:
        # Test Claude 3 Sonnet
        print("Testing Claude 3 Sonnet...")
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 100,
                "messages": [
                    {"role": "user", "content": "Say hello in one word"}
                ]
            })
        )
        
        result = json.loads(response['body'].read())
        print(f"✅ Claude 3 works! Response: {result['content'][0]['text']}")
        
    except Exception as e:
        error_str = str(e)
        
        if "AccessDeniedException" in error_str or "ValidationException" in error_str:
            print("❌ Need to enable model access")
            print("\nGo to: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/playgrounds/chat")
            print("1. Select Claude 3 Sonnet")
            print("2. Send a test message")
            print("3. Fill out use case form if prompted")
            print("4. Try this script again")
        else:
            print(f"❌ Error: {e}")
    
    # Test Titan Embeddings
    try:
        print("\nTesting Titan Embeddings...")
        response = bedrock.invoke_model(
            modelId='amazon.titan-embed-text-v1',
            body=json.dumps({
                "inputText": "Hello world"
            })
        )
        
        result = json.loads(response['body'].read())
        print(f"✅ Titan Embeddings works! Vector dimension: {len(result['embedding'])}")
        
    except Exception as e:
        print(f"❌ Titan error: {e}")

if __name__ == "__main__":
    test_bedrock()