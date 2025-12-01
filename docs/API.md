# API Documentation

## Base URL

- Development: `http://localhost:8000`
- Production: (configure as needed)

## Authentication

Currently, no authentication is required. For production, implement API key or OAuth2.

## Endpoints

### Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy"
}
```

---

### Root

**GET** `/`

Get API information.

**Response:**
```json
{
  "message": "Agri-Chat API",
  "status": "running"
}
```

---

### List Documents

**GET** `/api/documents`

Get a list of all uploaded documents.

**Response:**
```json
[
  {
    "doc_id": "uuid-here",
    "title": "document.pdf",
    "upload_date": "2025-12-01T00:00:00"
  }
]
```

---

### Upload Document

**POST** `/ingest`

Upload and process a document.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: File (PDF, DOCX, TXT, MD)
  - `metadata`: JSON string (optional)
    ```json
    {
      "title": "Document Title",
      "description": "Optional description"
    }
    ```

**Response:**
```json
{
  "doc_id": "uuid-here",
  "title": "document.pdf",
  "chunks": 42,
  "status": "ingested"
}
```

**Example (curl):**
```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@document.pdf" \
  -F 'metadata={"title":"My Document"}'
```

---

### Ask Question

**POST** `/ask`

Ask a question about uploaded documents.

**Request:**
```json
{
  "query": "What is crop rotation?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "answer": "Crop rotation is a fundamental practice...",
  "sources": [
    {
      "docId": "uuid-here",
      "title": "document.pdf",
      "url": "",
      "score": 0.85
    }
  ],
  "sessionId": "session-id"
}
```

**Example (curl):**
```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is crop rotation?",
    "sessionId": "my-session"
  }'
```

---

### Delete Document

**DELETE** `/api/documents/{doc_id}`

Delete a document and all its chunks.

**Response:**
```json
{
  "status": "deleted",
  "doc_id": "uuid-here"
}
```

**Example (curl):**
```bash
curl -X DELETE http://localhost:8000/api/documents/uuid-here
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message here"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Interactive API Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider:
- Per-IP rate limiting
- Per-user rate limiting
- Request throttling

## Best Practices

1. **Session Management**: Use consistent `sessionId` for related queries
2. **Error Handling**: Always check response status codes
3. **File Size**: Keep uploaded files under 10MB for best performance
4. **Query Length**: Keep queries concise for better results

