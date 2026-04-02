'use client';

import { useProtocolConsultant } from '@/hooks/useProtocolConsultant';
import { useEffect, useRef } from 'react';

export default function ProtocolPage() {
  const { messages, consult, loading } = useProtocolConsultant();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value) return;
    consult(value);
    inputRef.current.value = '';
  };
  
  return (
    <div className="max-w-3xl mx-auto h-screen flex flex-col bg-black">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-emerald-500">Protocol Consultant</h1>
        <p className="text-xs text-gray-500">Wayne Protocol v2.1 • Stateless Mode</p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={\`flex \${m.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
            <div className={\`max-w-[80%] px-4 py-3 rounded-lg whitespace-pre-wrap \${
              m.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-200 border-l-2 border-emerald-500'
            }\`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-200" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Slept 6 hours, HRV 52, feel inflamed..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-20 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Try: "What\'s the hair protocol?" • "Can I mix NMN with caffeine?" • "HRV 42, wrecked, what now?"
        </p>
      </form>
    </div>
  );
}