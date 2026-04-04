// app/biotech/api/compounds/route.ts
// Compound lookup API - PubChem + FDA

export const runtime = 'edge';

import { searchPubChem } from '../../lib/api-clients';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  
  if (!name) {
    return Response.json(
      { error: 'Compound name required' },
      { status: 400 }
    );
  }

  try {
    const compound = await searchPubChem(name);
    
    if (!compound) {
      return Response.json(
        { error: 'Compound not found' },
        { status: 404 }
      );
    }

    return Response.json({
      compound,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Compound API error:', error);
    return Response.json(
      { error: 'Failed to fetch compound data', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST for AI summarization
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'summarize') {
    const { text, type } = await request.json();
    
    // Check for Groq API key
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return Response.json(
        { error: 'AI summarization not configured' },
        { status: 503 }
      );
    }

    try {
      const { summarizeWithGroq } = await import('../../lib/api-clients');
      const summary = await summarizeWithGroq(text, type || 'compound', groqKey);
      
      return Response.json({ summary });
    } catch (error) {
      return Response.json(
        { error: 'Summarization failed', message: (error as Error).message },
        { status: 500 }
      );
    }
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
