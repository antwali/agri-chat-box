import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Source[];
  timestamp: string;
}

export interface Source {
  docId: string;
  title: string;
  url: string;
  score: number;
}

export interface AskRequest {
  query: string;
  sessionId?: string;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
  sessionId: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const askQuestion = async (request: AskRequest): Promise<AskResponse> => {
  const response = await api.post('/ask', request);
  return response.data;
};

export const uploadDocument = async (file: File, metadata: any) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  
  const response = await api.post('/ingest', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const listDocuments = async () => {
  const response = await api.get('/docs');
  return response.data;
};

export default api;
