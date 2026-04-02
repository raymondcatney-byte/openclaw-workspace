'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  warnings?: any[];
}

export default function ProtocolPage() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Protocol Consultant online. How did you sleep? What\'s your HRV?'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value || loading) return;
    
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: value }]);
    inputRef.current.value = '';
    
    try {
      const res = await fetch('/api/protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: value,
          checkInteractions: true
        })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${data.error}` 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          warnings: data.interactionWarnings
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Protocol system temporarily unavailable.' 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-emerald-500">Protocol Consultant</h1>
          <p className="text-xs text-gray-500">Wayne Protocol v2.1 • Knowledge graph + memory</p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%]">
                <div className={`px-4 py-3 rounded-lg whitespace-pre-wrap ${
                  m.role === 'user' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-gray-800 text-gray-200 border-l-2 border-emerald-500'
                }`}>
                  {m.content}
                </div>
                
                {m.warnings && m.warnings.length > 0 && (
                  <div className="mt-2 p-3 bg-red-900/30 border border-red-700/50 rounded">
                    <p className="text-xs font-semibold text-red-400 mb-1">⚠️ Interaction Warnings</p>
                    {m.warnings.map((w, j) => (
                      <div key={j} className="text-xs text-red-300">
                        {w.substances.join(' + ')}: {w.warnings[0]?.recommendation}
                      </div>
                    ))}
                  </div>
                )}
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
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Slept 6 hours, HRV 52, taking NMN and creatine..."
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 pr-20 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 px-4 py-1.5 rounded text-sm font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-600 mt-2">
            Try: "HRV 42, wrecked" • "Can I take NMN with metformin?" • "What's the hair protocol?"
          </p>
        </div>
      </div>
    </div>
  );
}