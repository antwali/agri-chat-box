# 🌾 Agri-Chat - AI-Powered Document Q&A

A modern, production-ready RAG (Retrieval-Augmented Generation) application that lets you upload documents and ask questions about them using AI. Built with React, FastAPI, AWS Bedrock, and OpenSearch.

## ✨ Features

- 📄 **Document Upload**: Support for PDF, DOCX, TXT, and MD files
- 💬 **Natural Language Q&A**: Ask questions in plain English
- 📚 **Source Citations**: Every answer includes references to source documents
- 🔍 **Document Management**: List, view, and manage uploaded documents
- 🎨 **Modern UI**: Beautiful, responsive interface with animations
- 🚀 **Easy Setup**: Docker Compose setup - no complex infrastructure needed
- 🔒 **Local Storage**: Documents stored locally in OpenSearch (no S3 required)

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   React     │─────▶│   FastAPI    │─────▶│  OpenSearch │
│  Frontend   │      │   Backend    │      │ Vector Store│
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ AWS Bedrock  │
                     │  (Claude 3)  │
                     └──────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python 3.11
- **LLM**: AWS Bedrock (Claude 3 Sonnet)
- **Embeddings**: AWS Bedrock (Titan Embeddings)
- **Vector Store**: OpenSearch 2.11 (Docker)
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- AWS Account with Bedrock access
- AWS CLI configured with credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agri-chat-box
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env and set AWS_REGION=us-east-1
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📖 Documentation

- **[RUN.md](RUN.md)** - Detailed setup and running instructions
- **[SETUP.md](SETUP.md)** - Setup guide and troubleshooting
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture details
- **[API.md](docs/API.md)** - API documentation

## 🎯 Usage

1. **Upload a document**
   - Click the upload button (📤)
   - Select a PDF, DOCX, TXT, or MD file
   - Wait for processing confirmation

2. **Ask questions**
   - Type your question in the chat input
   - Press Enter or click Send
   - View the AI-generated answer with source citations

3. **Manage documents**
   - View all documents in the sidebar
   - See document count in the chat header
   - Export chat history

## 📁 Project Structure

```
agri-chat-box/
├── backend/              # FastAPI backend
│   ├── api/             # API routes
│   ├── services/        # Business logic
│   │   ├── ingestion/  # Document processing
│   │   ├── retrieval/  # Vector search
│   │   ├── llm/        # AWS Bedrock client
│   │   └── orchestrator/ # RAG orchestration
│   └── requirements.txt
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.tsx     # Main component
│   │   └── services/   # API client
│   └── package.json
├── data/                # Sample documents
├── docs/                # Documentation
├── docker-compose.yml   # Docker configuration
├── .env.example         # Environment template
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
AWS_REGION=us-east-1
OPENSEARCH_ENDPOINT=  # Leave empty for local OpenSearch
```

### AWS Bedrock Setup

AWS Bedrock models are automatically enabled on first use. For first-time Anthropic users:

1. Visit: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/playgrounds/chat
2. Select Claude 3 Sonnet and send a test message
3. Fill out the use case form if prompted

See [RUN.md](RUN.md) for detailed setup instructions.

## 🧪 Testing

```bash
# Test AWS Bedrock connection
python test_bedrock.py

# Check backend health
curl http://localhost:8000/health

# Check OpenSearch
curl http://localhost:9200
```

## 🐛 Troubleshooting

### Common Issues

- **Port conflicts**: Check if ports 3000, 8000, or 9200 are in use
- **AWS Bedrock access**: Ensure models are enabled (see RUN.md)
- **OpenSearch connection**: Wait a few seconds after startup
- **Frontend errors**: Check browser console and backend logs

See [SETUP.md](SETUP.md) for detailed troubleshooting.

## 📝 API Endpoints

- `GET /health` - Health check
- `GET /api/documents` - List all documents
- `POST /ingest` - Upload a document
- `POST /ask` - Ask a question
- `DELETE /api/documents/{doc_id}` - Delete a document

Full API documentation: http://localhost:8000/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- AWS Bedrock for LLM capabilities
- OpenSearch for vector search
- FastAPI and React communities

---

**Need help?** Check the [documentation](RUN.md) or open an issue.
