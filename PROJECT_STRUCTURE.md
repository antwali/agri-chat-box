# Project Structure

This document describes the organization of the Agri-Chat repository.

## Directory Structure

```
agri-chat-box/
├── backend/                    # FastAPI backend application
│   ├── api/                   # API routes and endpoints
│   │   └── main.py            # FastAPI application entry point
│   ├── services/              # Business logic modules
│   │   ├── config.py          # Configuration management
│   │   ├── ingestion/         # Document processing
│   │   │   ├── chunker.py     # Text chunking logic
│   │   │   └── document_processor.py  # Document processing
│   │   ├── llm/               # LLM client
│   │   │   └── client.py      # AWS Bedrock client
│   │   ├── orchestrator/      # RAG orchestration
│   │   │   └── rag_orchestrator.py  # RAG workflow
│   │   └── retrieval/         # Vector search
│   │       └── vector_store.py # OpenSearch integration
│   ├── Dockerfile             # Backend container definition
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # React frontend application
│   ├── public/                # Static assets
│   ├── src/                   # Source code
│   │   ├── App.tsx            # Main React component
│   │   ├── App.css            # Component styles
│   │   ├── services/          # API client
│   │   │   └── api.ts         # API service
│   │   └── index.tsx          # Entry point
│   ├── Dockerfile             # Frontend container definition
│   ├── package.json           # Node.js dependencies
│   └── tailwind.config.js     # Tailwind CSS configuration
│
├── data/                      # Sample data and documents
│   └── sample-docs/           # Example documents for testing
│       └── sample-agriculture-guide.txt
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── API.md                 # API documentation
│   └── README.md              # Documentation index
│
├── infrastructure/            # Infrastructure as code
│   ├── aws-cdk/               # AWS CDK definitions
│   └── terraform/             # Terraform configurations
│
├── tests/                     # Test suites
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── evaluation/            # Evaluation tests
│
├── docker-compose.yml         # Docker Compose configuration
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── README.md                 # Main project README
├── RUN.md                    # Running instructions
├── SETUP.md                  # Setup guide
├── CONTRIBUTING.md           # Contribution guidelines
└── PROJECT_STRUCTURE.md       # This file
```

## Key Files

### Configuration Files

- **docker-compose.yml**: Defines all services (backend, frontend, OpenSearch)
- **.env.example**: Template for environment variables
- **backend/services/config.py**: Application configuration

### Entry Points

- **backend/api/main.py**: FastAPI application entry point
- **frontend/src/index.tsx**: React application entry point

### Core Services

- **Document Processing**: `backend/services/ingestion/`
- **Vector Search**: `backend/services/retrieval/`
- **LLM Integration**: `backend/services/llm/`
- **RAG Orchestration**: `backend/services/orchestrator/`

### Frontend Components

- **Main App**: `frontend/src/App.tsx`
- **API Client**: `frontend/src/services/api.ts`

## Naming Conventions

- **Python**: snake_case for files and functions
- **TypeScript/React**: PascalCase for components, camelCase for functions
- **Files**: lowercase with hyphens for documentation

## Adding New Features

1. **Backend**: Add to appropriate service in `backend/services/`
2. **Frontend**: Add components in `frontend/src/`
3. **API**: Add routes in `backend/api/main.py`
4. **Documentation**: Update relevant `.md` files

## Dependencies

- **Backend**: See `backend/requirements.txt`
- **Frontend**: See `frontend/package.json`
- **Infrastructure**: Docker Compose for local development
