interface Props {
  role: 'ai' | 'user';
  text: string;
}

export default function ChatBubble({ role, text }: Props) {
  const isAI = role === 'ai';
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-3`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isAI
            ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
            : 'bg-indigo-500 text-white rounded-tr-sm'
        }`}
      >
        {text}
      </div>
    </div>
  );
}
