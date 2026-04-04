// app/biotech/api/research/route.ts
// Research feed API - Europe PMC + ClinicalTrials.gov

export const runtime = 'edge';

import { searchEuropePMC, searchClinicalTrials } from '../../lib/api-clients';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const type = searchParams.get('type') || 'papers'; // 'papers' or 'trials'
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 50);

  try {
    if (type === 'papers') {
      const { papers, total } = await searchEuropePMC(
        query || getDefaultQuery(category),
        category,
        page,
        pageSize
      );
      
      return Response.json({
        type: 'papers',
        items: papers,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        generatedAt: new Date().toISOString(),
      });
    } else {
      const { trials, total } = await searchClinicalTrials(
        query || 'longevity',
        category === 'recruiting' ? 'recruiting' : 'all',
        page,
        pageSize
      );
      
      return Response.json({
        type: 'trials',
        items: trials,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        generatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Research API error:', error);
    return Response.json(
      { error: 'Failed to fetch research data', message: (error as Error).message },
      { status: 500 }
    );
  }
}

function getDefaultQuery(category: string): string {
  const queries: Record<string, string> = {
    longevity: 'longevity aging lifespan',
    'gene-therapy': 'gene therapy CRISPR editing',
    nootropics: 'nootropic cognitive enhancement',
    clinical: 'clinical trial therapeutic',
    all: 'biotech longevity gene therapy',
  };
  return queries[category] || queries.all;
}
