# Agri-Chat - Simple Chatbox with RAG

A simple conversational chatbox using RAG (Retrieval-Augmented Generation) that lets you upload documents and ask questions about them.

## Features

- 📄 Upload documents (PDF, DOCX, TXT, MD)
- 💬 Natural language Q&A over your documents
- 📚 Source citations for answers
- 🔍 Document management (list, delete)
- 🚀 Simple setup - no S3 required!

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **LLM**: AWS Bedrock (Claude 3 Sonnet)
- **Embeddings**: AWS Bedrock (Titan)
- **Vector Store**: OpenSearch (local Docker)

## Quick Start

1. Set up AWS credentials
2. Create `.env` file with `AWS_REGION=us-east-1`
3. Run `docker-compose up --build`
4. Open http://localhost:3000

See [RUN.md](RUN.md) for complete setup instructions.

## License

MIT
