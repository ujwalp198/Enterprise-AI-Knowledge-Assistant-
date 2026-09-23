import { useState, useEffect, useRef } from 'react';
import { askQuestion, type QueryResult } from '../services/chat.service';
import { listDocuments } from '../services/document.service';
import ChatMessage from '../components/ChatMessage';
import FileUploader from '../components/FileUploader';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: QueryResult['citations'];
}

interface DocumentSummary {
  id: string;
  originalName: string;
  status: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadDocuments() {
    const docs = await listDocuments();
    setDocuments(docs);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocuments();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const question = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const result = await askQuestion(question);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.answer, citations: result.citations },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong answering that.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar: documents */}
      <div className="w-72 border-r bg-gray-50 p-4 flex flex-col">
        <h2 className="font-semibold mb-3">Documents</h2>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="mb-3 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700"
        >
          {showUploader ? 'Cancel' : '+ Upload Document'}
        </button>
        {showUploader && (
          <div className="mb-4">
            <FileUploader
              onUploadSuccess={() => {
                setShowUploader(false);
                loadDocuments();
              }}
            />
          </div>
        )}
        <div className="flex-1 overflow-y-auto space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="text-sm bg-white border rounded p-2">
              <p className="truncate">{doc.originalName}</p>
              <span
                className={`text-xs ${
                  doc.status === 'ready' ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {doc.status}
              </span>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-xs text-gray-400">No documents uploaded yet</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-10">
              Ask a question about your uploaded documents
            </p>
          )}
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} content={m.content} citations={m.citations} />
          ))}
          {loading && <p className="text-gray-400 text-sm">Thinking...</p>}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-4 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="flex-1 border rounded px-3 py-2 resize-none"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
