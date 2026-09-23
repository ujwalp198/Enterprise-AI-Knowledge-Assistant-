interface Citation {
  docId: string;
  docName: string;
  page: number;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export default function ChatMessage({ role, content, citations }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xl rounded-lg px-4 py-3 ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {citations && citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300 space-y-1">
            <p className="text-xs font-semibold text-gray-500">Sources:</p>
            {citations.map((c, i) => (
              <p key={i} className="text-xs text-gray-600">
                📄 {c.docName} — Page {c.page}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
