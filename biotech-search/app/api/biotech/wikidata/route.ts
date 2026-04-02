// app/api/biotech/wikidata/route.ts
// SPARQL query proxy for Wikidata with caching

export const runtime = 'edge';

const COMMON_QUERIES: Record<string, string> = {
  peptides: `
    SELECT DISTINCT ?compound ?compoundLabel ?smiles ?type ?typeLabel
    WHERE {
      ?compound wdt:P31 wd:Q8054 ;  # protein
                wdt:P279+ wd:Q21145876 .  # peptide
      OPTIONAL { ?compound wdt:P233 ?smiles }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    LIMIT 50
  `,
  nootropics: `
    SELECT DISTINCT ?compound ?compoundLabel ?description
    WHERE {
      ?compound wdt:P31 wd:Q11173 ;  # chemical compound
                wdt:P366 ?use .
      ?use wdt:P279* wd:Q12140 .  # pharmaceutical drug
      FILTER(CONTAINS(LCASE(?compoundLabel), "nootropic") ||
             CONTAINS(LCASE(?description), "cognitive"))
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    LIMIT 50
  `,
  supplements: `
    SELECT DISTINCT ?compound ?compoundLabel ?description ?pubchem
    WHERE {
      ?compound wdt:P31 wd:Q11173 ;
                wdt:P279 wd:Q113145171 .  # dietary supplement
      OPTIONAL { ?compound wdt:P662 ?pubchem }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    LIMIT 50
  `
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, queryType, customSparql } = body;

    let sparql: string;

    if (customSparql) {
      sparql = customSparql;
    } else if (queryType && COMMON_QUERIES[queryType]) {
      sparql = COMMON_QUERIES[queryType];
    } else if (query) {
      // Dynamic search query
      sparql = `
        SELECT DISTINCT ?item ?itemLabel ?description
        WHERE {
          ?item rdfs:label ?label .
          FILTER(CONTAINS(LCASE(?label), "${query.toLowerCase()}"))
          FILTER(LANG(?label) = "en")
          OPTIONAL { ?item schema:description ?description . FILTER(LANG(?description) = "en") }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
        }
        LIMIT 20
      `;
    } else {
      return Response.json(
        { error: 'Provide query, queryType, or customSparql' },
        { status: 400 }
      );
    }

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'BiotechSearch/1.0 (research@example.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Wikidata error: ${response.status}`);
    }

    const data = await response.json();

    return Response.json({
      query: queryType || 'custom',
      results: data.results?.bindings || [],
      count: data.results?.bindings?.length || 0
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });

  } catch (error) {
    return Response.json(
      { error: 'Wikidata query failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available query types
  return Response.json({
    availableQueries: Object.keys(COMMON_QUERIES),
    description: 'Use POST with queryType to run predefined queries, or provide customSparql'
  });
}
