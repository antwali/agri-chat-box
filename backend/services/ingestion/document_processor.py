from typing import Dict, List
import pypdf
from docx import Document
import markdown
from bs4 import BeautifulSoup
from services.ingestion.chunker import DocumentChunker
import uuid
from datetime import datetime

class DocumentProcessor:
    """Process various document formats and extract text."""
    
    def __init__(self):
        self.chunker = DocumentChunker()
    
    def process_file(self, file_content: bytes, filename: str, metadata: Dict = None) -> Dict:
        """Process a file and return chunks with metadata."""
        # Determine file type
        file_ext = filename.lower().split('.')[-1]
        
        # Extract text based on file type
        if file_ext == 'pdf':
            text = self._extract_pdf(file_content)
        elif file_ext in ['doc', 'docx']:
            text = self._extract_docx(file_content)
        elif file_ext == 'md':
            text = self._extract_markdown(file_content)
        elif file_ext in ['txt', 'text']:
            text = file_content.decode('utf-8')
        else:
            # Try to decode as text
            try:
                text = file_content.decode('utf-8')
            except:
                raise ValueError(f"Unsupported file type: {file_ext}")
        
        # Generate document ID
        doc_id = str(uuid.uuid4())
        
        # Prepare metadata
        doc_metadata = {
            'title': filename,
            'upload_date': datetime.utcnow().isoformat(),
            'file_type': file_ext,
            **(metadata or {})
        }
        
        # Chunk the text
        chunks = self.chunker.chunk_text(text, doc_metadata)
        
        return {
            'doc_id': doc_id,
            'chunks': chunks,
            'metadata': doc_metadata,
            'text': text
        }
    
    def _extract_pdf(self, content: bytes) -> str:
        """Extract text from PDF."""
        from io import BytesIO
        pdf_file = BytesIO(content)
        reader = pypdf.PdfReader(pdf_file)
        text_parts = []
        for page in reader.pages:
            text_parts.append(page.extract_text())
        return "\n".join(text_parts)
    
    def _extract_docx(self, content: bytes) -> str:
        """Extract text from DOCX."""
        from io import BytesIO
        docx_file = BytesIO(content)
        doc = Document(docx_file)
        text_parts = []
        for paragraph in doc.paragraphs:
            text_parts.append(paragraph.text)
        return "\n".join(text_parts)
    
    def _extract_markdown(self, content: bytes) -> str:
        """Extract text from Markdown."""
        text = content.decode('utf-8')
        # Convert markdown to HTML then extract text
        html = markdown.markdown(text)
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()

