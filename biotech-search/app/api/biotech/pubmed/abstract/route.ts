// app/api/biotech/pubmed/abstract/route.ts
// Fetch abstracts by PubMed ID

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pmids } = body;

    if (!pmids || !Array.isArray(pmids) || pmids.length === 0) {
      return Response.json(
        { error: 'Provide array of PubMed IDs (pmids)' },
        { status: 400 }
      );
    }

    if (pmids.length > 50) {
      return Response.json(
        { error: 'Maximum 50 IDs per request' },
        { status: 400 }
      );
    }

    const idString = pmids.join(',');
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${idString}&rettype=abstract&retmode=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`PubMed error: ${response.status}`);
    }

    const text = await response.text();
    
    // PubMed returns XML even with retmode=json for efetch, parse accordingly
    // For now return raw text, client can parse or we can add XML parsing
    return Response.json({
      pmids,
      raw: text.slice(0, 5000), // Limit size
      note: 'PubMed efetch returns XML. Use esummary for JSON.'
    });

  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch abstracts', message: (error as Error).message },
      { status: 500 }
    );
  }
}
