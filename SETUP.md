# Setup Guide

This guide will help you get the Agri-Chat application up and running.

## Prerequisites

- Docker and Docker Compose installed
- AWS Account with Bedrock access enabled
- AWS CLI configured with credentials (`~/.aws/credentials`)

## Quick Start

1. **Clone the repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd agri-chat-box
   ```

2. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   AWS_REGION=us-east-1
   OPENSEARCH_ENDPOINT=  # Leave empty for local OpenSearch
   ```

   **Note:** Documents are stored locally in OpenSearch - no S3 bucket needed! For local development, leave `OPENSEARCH_ENDPOINT` empty to use the local OpenSearch instance from Docker.

3. **Start the application**
   
   **Note:** AWS Bedrock serverless foundation models are automatically enabled when first invoked. No manual activation is required. The application uses:
   - Claude 3 Sonnet: `anthropic.claude-3-sonnet-20240229-v1:0`
   - Titan Embeddings: `amazon.titan-embed-text-v1`
   
   For first-time Anthropic model users, you may be prompted to submit use case details when first invoking the model (this is handled automatically through the AWS console if prompted).
   ```bash
   docker-compose up --build
   ```

   This will start:
   - Backend API on http://localhost:8000
   - Frontend on http://localhost:3000
   - OpenSearch on http://localhost:9200

4. **Access the application**
   
   Open your browser and navigate to: http://localhost:3000

## Manual Setup (Without Docker)

### Backend Setup

1. **Create a virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables**
   ```bash
   export AWS_REGION=us-east-1
   ```

4. **Start the backend**
   ```bash
   uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend**
   ```bash
   npm start
   ```

### OpenSearch Setup

If not using Docker, you'll need to set up OpenSearch separately:

```bash
docker run -d -p 9200:9200 -e "discovery.type=single-node" -e "DISABLE_SECURITY_PLUGIN=true" opensearchproject/opensearch:2.11.0
```

## Usage

1. **Upload Documents**
   - Click the upload button in the chat interface
   - Select a document (PDF, DOCX, TXT, or MD)
   - Wait for the document to be processed and indexed

2. **Ask Questions**
   - Type your question in the input field
   - The system will retrieve relevant document chunks and generate an answer
   - Sources are displayed below each answer

3. **View Documents**
   - The number of loaded documents is shown at the bottom of the chat interface

## Troubleshooting

### AWS Bedrock Access Issues
- **Note:** AWS Bedrock serverless foundation models are automatically enabled when first invoked. No manual activation is required.
- For first-time Anthropic model users, you may need to submit use case details when first invoking the model (handled automatically through AWS console if prompted).
- Check that your AWS credentials are properly configured: `aws sts get-caller-identity`
- Verify the region matches: `AWS_REGION=us-east-1`
- Ensure your IAM user/role has permissions to invoke Bedrock models

### OpenSearch Connection Issues
- If using Docker, ensure the OpenSearch container is running
- Check that port 9200 is not already in use
- For local OpenSearch, the service name in Docker is `opensearch`

### Frontend Not Connecting to Backend
- Verify the backend is running on port 8000
- Check that `REACT_APP_API_URL` is set correctly (defaults to http://localhost:8000)
- Ensure CORS is properly configured in the backend

## API Endpoints

- `GET /` - Health check
- `GET /health` - Health status
- `POST /ask` - Ask a question
- `POST /ingest` - Upload a document
- `GET /api/documents` - List all documents
- `DELETE /api/documents/{doc_id}` - Delete a document

For detailed API documentation, see [docs/API.md](docs/API.md) or visit http://localhost:8000/docs

## Development

The application uses:
- **Backend**: FastAPI, Python 3.11
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **LLM**: AWS Bedrock (Claude 3 Sonnet)
- **Embeddings**: AWS Bedrock (Titan)
- **Vector Store**: OpenSearch

