'use client';

import { useState } from 'react';
import { extractBiomarkers, ParsedBiomarkers } from '@/lib/protocol/parser';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const useProtocolConsultant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Protocol Consultant online. How did you sleep? What\'s your HRV?' }
  ]);
  const [loading, setLoading] = useState(false);
  
  const consult = async (input: string) => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    const biomarkers = extractBiomarkers(input);
    const enrichedInput = biomarkers.sleep || biomarkers.hrv 
      ? \`[Biomarkers detected: \${JSON.stringify(biomarkers)}] \${input}\`
      : input;
    
    try {
      const res = await fetch('/api/protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: enrichedInput })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Protocol system temporarily unavailable. Check Groq API key.' 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Protocol system temporarily unavailable. Check Groq API key.' 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  return { messages, consult, loading };
};