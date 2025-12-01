import React, { useState, useRef, useEffect } from 'react';
import { askQuestion, uploadDocument, listDocuments, Message, Source } from './services/api';
import { Send, Upload, FileText, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [documents, setDocuments] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocuments();
    // Generate session ID
    setSessionId(`session-${Date.now()}`);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDocuments = async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await askQuestion({
        query: input,
        sessionId,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }
    } catch (error: any) {
      console.error('Error asking question:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        code: error?.code,
        timeout: error?.code === 'ECONNABORTED' ? 'Request timed out' : 'No timeout',
        url: error?.config?.url,
        baseURL: error?.config?.baseURL
      });
      
      // Show user-friendly error message
      const userMessage = error?.code === 'ECONNABORTED' 
        ? 'Request timed out. The AI is taking longer than expected. Please try again.'
        : error?.code === 'ERR_NETWORK'
        ? 'Network error. Please check your connection and try again. The backend might be processing your request - check the console for details.'
        : `Sorry, I encountered an error: ${error?.response?.data?.detail || error?.message || 'Unknown error'}. Please try again.`;
      
      const errorMessage: Message = {
        role: 'assistant',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadDocument(file, {
        title: file.name,
      });
      console.log('Upload successful:', result);
      await loadDocuments();
      setShowUpload(false);
      alert('Document uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading document:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error';
      console.error('Error details:', {
        message: errorMessage,
        status: error?.response?.status,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL
      });
      alert(`Failed to upload document: ${errorMessage}. Please check the browser console for details.`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌾 Agri-Chat Assistant
          </h1>
          <p className="text-gray-600">
            Ask questions about agricultural documents using AI-powered RAG
          </p>
        </header>

        {/* Main Chat Container */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-12">
                <FileText className="mx-auto mb-4 w-16 h-16 text-gray-300" />
                <p className="text-lg">Start a conversation by asking a question</p>
                <p className="text-sm mt-2">
                  {documents.length > 0
                    ? `${documents.length} document(s) available`
                    : 'Upload documents to get started'}
                </p>
              </div>
            )}

            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <p className="text-xs font-semibold mb-2">Sources:</p>
                          <div className="space-y-1">
                            {message.sources.map((source: Source, sIdx: number) => (
                              <div key={sIdx} className="text-xs">
                                <span className="font-medium">{source.title}</span>
                                {source.score && (
                                  <span className="text-gray-500 ml-2">
                                    ({(source.score * 100).toFixed(0)}% match)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about agricultural documents..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
              <button
                type="button"
                onClick={() => setShowUpload(!showUpload)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
              </button>
            </form>

            {/* Upload Section */}
            {showUpload && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Upload Document (PDF, DOCX, TXT, MD)
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.txt,.md"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {uploading && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            )}

            {/* Documents List */}
            {documents.length > 0 && (
              <div className="mt-4 text-xs text-gray-600">
                <span className="font-semibold">{documents.length} document(s) loaded</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
