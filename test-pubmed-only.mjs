// Test: Fetch live GLP-1 addiction research from PubMed
async function fetchPubMedResearch(query, maxResults = 5) {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=date`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const ids = searchData.esearchresult?.idlist || [];
  
  if (ids.length === 0) return [];
  
  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const summaryRes = await fetch(summaryUrl);
  const summaryData = await summaryRes.json();
  
  return ids.map((id) => ({
    id,
    title: summaryData.result?.[id]?.title || 'Untitled',
    source: summaryData.result?.[id]?.source || 'PubMed',
    pubDate: summaryData.result?.[id]?.pubdate || '',
    url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
  }));
}

const research = await fetchPubMedResearch('GLP-1 addiction 2024', 5);
console.log('📚 Live PubMed Results:\n');
research.forEach((r, i) => {
  console.log(`${i + 1}. ${r.title}`);
  console.log(`   ${r.source} | ${r.pubDate}`);
  console.log(`   ${r.url}\n`);
});
