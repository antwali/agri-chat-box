from typing import List, Dict
from services.config import get_settings

class DocumentChunker:
    def __init__(self):
        self.settings = get_settings()
    
    def chunk_text(self, text: str, metadata: Dict = None) -> List[Dict]:
        """Split text into overlapping chunks."""
        chunks = []
        chunk_size = self.settings.chunk_size
        overlap = self.settings.chunk_overlap
        
        start = 0
        chunk_id = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk_text.rfind('.')
                last_newline = chunk_text.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > chunk_size // 2:
                    end = start + break_point + 1
                    chunk_text = text[start:end]
            
            chunks.append({
                'chunk_id': chunk_id,
                'text': chunk_text.strip(),
                'start_index': start,
                'end_index': end,
                'metadata': metadata or {}
            })
            
            chunk_id += 1
            start = end - overlap
        
        return chunks
