import React, { useState, useRef, useEffect } from 'react';
import { askQuestion, uploadDocument, listDocuments, Message, Source } from './services/api';
import { Send, Upload, FileText, Loader2, X, Copy, Check, Trash2, Download, BookOpen, Clock, Sparkles, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './App.css';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [documents, setDocuments] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocuments();
    setSessionId(`session-${Date.now()}`);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const loadDocuments = async () => {
    try {
      const docs = await listDocuments();
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]); // Ensure it's always an array
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      setSessionId(`session-${Date.now()}`);
      showToast('Chat cleared', 'info');
    }
  };

  const exportChat = () => {
    const chatText = messages.map(m => 
      `${m.role === 'user' ? 'You' : 'Assistant'} (${formatTime(m.timestamp)}):\n${m.content}\n${m.sources?.length ? `Sources: ${m.sources.map(s => s.title).join(', ')}\n` : ''}---\n`
    ).join('\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Chat exported!', 'success');
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
    const questionText = input;
    setInput('');
    setLoading(true);

    try {
      const response = await askQuestion({
        query: questionText,
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
      showToast('Response received!', 'success');
    } catch (error: any) {
      console.error('Error asking question:', error);
      
      const userMessage = error?.code === 'ECONNABORTED' 
        ? 'Request timed out. The AI is taking longer than expected. Please try again.'
        : error?.code === 'ERR_NETWORK'
        ? 'Network error. Please check your connection and try again.'
        : `Sorry, I encountered an error: ${error?.response?.data?.detail || error?.message || 'Unknown error'}. Please try again.`;
      
      const errorMessage: Message = {
        role: 'assistant',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      showToast('Error getting response', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadDocument(file, {
        title: file.name,
      });
      await loadDocuments();
      setShowUpload(false);
      showToast(`Document "${file.name}" uploaded successfully!`, 'success');
    } catch (error: any) {
      console.error('Error uploading document:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error';
      showToast(`Upload failed: ${errorMessage}`, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <header className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Agri-Chat Assistant
            </h1>
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-gray-600">
            Ask questions about agricultural documents using AI-powered RAG
          </p>
        </header>

        <div className="flex gap-4">
          {/* Sidebar */}
          <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow-lg p-4 h-[calc(100vh-200px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Documents
                </h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="md:hidden text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {!Array.isArray(documents) || documents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No documents yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.doc_id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {doc.title}
                          </p>
                          {doc.upload_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(doc.upload_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Container */}
          <div className="flex-1 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Chat Header */}
            <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="md:hidden p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h3 className="font-semibold text-gray-800">Chat</h3>
                  <p className="text-xs text-gray-600">
                    {Array.isArray(documents) ? documents.length : 0} document{Array.isArray(documents) && documents.length !== 1 ? 's' : ''} loaded
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={exportChat}
                      className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
                      title="Export chat"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={clearChat}
                      className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
                      title="Clear chat"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-12 animate-fade-in">
                  <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
                    <FileText className="w-16 h-16 text-indigo-600" />
                  </div>
                  <p className="text-lg font-medium mb-2">Start a conversation</p>
                  <p className="text-sm">
                    {Array.isArray(documents) && documents.length > 0
                      ? `Ask questions about your ${documents.length} document${documents.length !== 1 ? 's' : ''}`
                      : 'Upload documents to get started'}
                  </p>
                  {(!Array.isArray(documents) || documents.length === 0) && (
                    <button
                      onClick={() => setShowUpload(true)}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Upload Your First Document
                    </button>
                  )}
                </div>
              )}

              {messages.map((message, idx) => {
                const messageId = `msg-${idx}`;
                return (
                  <div
                    key={idx}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    } animate-slide-up`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          {message.role === 'assistant' && (
                            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          )}
                          <span className="text-xs font-medium opacity-75">
                            {message.role === 'user' ? 'You' : 'Assistant'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs opacity-60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(message.timestamp)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(message.content, messageId)}
                            className="p-1 hover:bg-black/10 rounded transition-colors"
                            title="Copy message"
                          >
                            {copiedId === messageId ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {message.role === 'assistant' ? (
                        <div>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-300">
                              <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                Sources ({message.sources.length}):
                              </p>
                              <div className="space-y-2">
                                {message.sources.map((source: Source, sIdx: number) => (
                                  <div
                                    key={sIdx}
                                    className="text-xs p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <span className="font-medium text-gray-800">{source.title}</span>
                                        {source.score && (
                                          <div className="mt-1">
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                              <div
                                                className="bg-indigo-600 h-1.5 rounded-full transition-all"
                                                style={{ width: `${source.score * 100}%` }}
                                              />
                                            </div>
                                            <span className="text-gray-500 text-xs mt-0.5 block">
                                              {(source.score * 100).toFixed(0)}% relevance
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
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
                );
              })}

              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-gray-600 ml-2">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpload(!showUpload)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2 transition-colors"
                  title="Upload document"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </form>

              {/* Upload Section */}
              {showUpload && (
                <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 animate-slide-down">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Upload Document
                    </label>
                    <button
                      onClick={() => setShowUpload(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    accept=".pdf,.doc,.docx,.txt,.md"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer transition-colors"
                  />
                  {uploading && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading and processing document...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
