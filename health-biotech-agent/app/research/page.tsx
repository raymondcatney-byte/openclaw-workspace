'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  confidence?: number;
}

interface Source {
  title: string;
  url: string;
  credibility: number;
}

export default function ResearchPage() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Health & Biotech Research Agent online. Ask me anything about supplements, drugs, mechanisms, or health conditions.',
      confidence: 1.0
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
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
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: value,
          depth,
          sources: ['general', 'pubmed']
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
          content: data.answer,
          sources: data.sources,
          confidence: data.confidence
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Research system temporarily unavailable.' 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-500">Research Agent</h1>
            <p className="text-xs text-gray-500">Web search + synthesis + memory</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Depth:</label>
            <select 
              value={depth} 
              onChange={(e) => setDepth(e.target.value as any)}
              className="bg-gray-800 text-white text-xs rounded px-2 py-1 border border-gray-700"
            >
              <option value="quick">Quick</option>
              <option value="standard">Standard</option>
              <option value="deep">Deep</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${m.role === 'user' ? 'w-auto' : 'w-full'}`}>
                <div className={`px-4 py-3 rounded-lg whitespace-pre-wrap ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-200'
                }`}>
                  {m.content}
                </div>
                
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.sources.slice(0, 3).map((s, j) => (
                      <a
                        key={j}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-gray-900 text-gray-400 px-2 py-1 rounded hover:text-blue-400 truncate max-w-[200px]"
                        title={s.title}
                      >
                        {new URL(s.url).hostname} ({Math.round(s.credibility * 100)}%)
                      </a>
                    ))}
                  </div>
                )}
                
                {m.confidence && m.role === 'assistant' && i > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    Confidence: {Math.round(m.confidence * 100)}%
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200" />
                <span className="text-xs text-gray-400 ml-2">Researching...</span>
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
                placeholder="Ask about supplements, drugs, health conditions..."
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 pr-24 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 px-4 py-1.5 rounded text-sm font-medium transition-colors"
              >
                Research
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-600 mt-2">
            Try: "What does NMN do?" • "Metformin side effects" • "Best supplements for sleep"
          </p>
        </div>
      </div>
    </div>
  );
}