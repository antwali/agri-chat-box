# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced UI with animations and modern design
- Toast notifications for user feedback
- Document sidebar for easy document management
- Message timestamps and copy functionality
- Export chat history feature
- Clear chat functionality
- Improved source citations with relevance bars
- Comprehensive documentation (ARCHITECTURE.md, API.md, CONTRIBUTING.md)
- Project structure documentation
- Environment variable template (.env.example)

### Changed
- Switched from vector similarity search to text-based search for better reliability
- Updated API endpoint from `/docs` to `/api/documents` to avoid FastAPI conflict
- Lowered similarity threshold for better document retrieval
- Improved error handling and user feedback
- Enhanced document listing with better metadata display

### Fixed
- Fixed documents not showing in UI (array handling)
- Fixed search returning no results
- Fixed API endpoint conflicts with FastAPI Swagger docs
- Improved OpenSearch connection handling
- Better error messages for network issues

## [1.0.0] - 2025-12-01

### Added
- Initial release
- Document upload (PDF, DOCX, TXT, MD)
- RAG-based question answering
- Source citations
- Docker Compose setup
- AWS Bedrock integration (Claude 3 Sonnet, Titan Embeddings)
- OpenSearch vector store
- React frontend with TypeScript
- FastAPI backend

[Unreleased]: https://github.com/your-username/agri-chat-box/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-username/agri-chat-box/releases/tag/v1.0.0

