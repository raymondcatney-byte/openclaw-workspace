// app/biotech/api/intelligence/route.ts
// Intelligence feed API - Reddit + RSS + Patents

export const runtime = 'edge';

import { fetchRedditPosts, fetchRSSFeed, searchPatents, BIOTECH_FEEDS } from '../../lib/api-clients';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const type = searchParams.get('type') || 'all'; // 'all', 'reddit', 'rss', 'patent'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  try {
    const results: any = {
      generatedAt: new Date().toISOString(),
    };

    if (type === 'all' || type === 'reddit') {
      // Fetch from multiple subreddits
      const [longevityPosts, biohackerPosts] = await Promise.all([
        fetchRedditPosts('longevity', 'hot', Math.ceil(limit / 2)).catch(() => []),
        fetchRedditPosts('Biohackers', 'hot', Math.ceil(limit / 2)).catch(() => []),
      ]);
      
      results.reddit = [...longevityPosts, ...biohackerPosts]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    if (type === 'all' || type === 'rss') {
      // Fetch from RSS feeds
      const feedResults = await Promise.all(
        BIOTECH_FEEDS.map(feed => 
          fetchRSSFeed(feed.url, feed.name).catch(() => [])
        )
      );
      
      results.rss = feedResults
        .flat()
        .sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
        .slice(0, limit);
    }

    if (type === 'all' || type === 'patent') {
      results.patents = await searchPatents('longevity', limit).catch(() => []);
    }

    return Response.json(results);
  } catch (error) {
    console.error('Intelligence API error:', error);
    return Response.json(
      { error: 'Failed to fetch intelligence data', message: (error as Error).message },
      { status: 500 }
    );
  }
}
