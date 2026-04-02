// app/api/biotech/chembl/[id]/route.ts
// Single molecule details from ChEMBL

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id || !id.startsWith('CHEMBL')) {
      return Response.json(
        { error: 'Invalid ChEMBL ID' },
        { status: 400 }
      );
    }

    // Fetch molecule details
    const url = `https://www.ebi.ac.uk/chembl/api/data/molecule/${id}.json`;
    const response = await fetch(url, { next: { revalidate: 86400 } }); // Cache 24h
    
    if (!response.ok) {
      return Response.json(
        { error: 'Molecule not found' },
        { status: 404 }
      );
    }

    const data = await response.json();

    // Fetch additional bioactivity data
    const activitiesUrl = `https://www.ebi.ac.uk/chembl/api/data/activity?molecule_chembl_id=${id}&limit=20&format=json`;
    const activitiesResponse = await fetch(activitiesUrl, { next: { revalidate: 86400 } });
    const activitiesData = await activitiesResponse.json();

    return Response.json({
      molecule: data,
      bioactivities: activitiesData.activities || [],
      source: 'ChEMBL',
      cached: false
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
      }
    });

  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch molecule', message: (error as Error).message },
      { status: 500 }
    );
  }
}
