import axios from 'axios';

// Use the environment variable or default to localhost:8000
// In the browser, this will be http://localhost:8000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Log the API URL for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

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
  timeout: 120000, // 2 minutes timeout for LLM requests
});

// Add request interceptor to set JSON content type only for non-FormData requests
api.interceptors.request.use((config) => {
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

export const askQuestion = async (request: AskRequest): Promise<AskResponse> => {
  const response = await api.post('/ask', request);
  return response.data;
};

export const uploadDocument = async (file: File, metadata: any) => {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }
  
  // Don't set Content-Type header - let the browser set it with boundary
  const response = await api.post('/ingest', formData);
  return response.data;
};

export const listDocuments = async () => {
  const response = await api.get('/docs');
  return response.data;
};

export default api;
