import { NewsItem, SentimentAnalysis } from '../types/index.js';

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

export async function getNewsForQuery(query: string): Promise<NewsItem[]> {
  if (!NEWSAPI_KEY) {
    console.log('  No NEWSAPI_KEY, using mock news data');
    return getMockNews(query);
  }
  
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=10&apiKey=${NEWSAPI_KEY}`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.articles.map((article: any) => ({
      title: article.title,
      source: article.source.name,
      url: article.url,
      publishedAt: new Date(article.publishedAt),
      sentiment: 0, // Would use sentiment analysis API
      relevance: 0.8,
    }));
    
  } catch (error) {
    console.error('Error fetching news:', error);
    return getMockNews(query);
  }
}

function getMockNews(query: string): NewsItem[] {
  // Generate relevant mock news based on query keywords
  const q = query.toLowerCase();
  const isPolitical = q.includes('election') || q.includes('vance') || q.includes('trump') || q.includes('biden');
  const isCrypto = q.includes('bitcoin') || q.includes('crypto') || q.includes('btc') || q.includes('eth');
  const isBaseball = q.includes('baseball') || q.includes('mlb') || q.includes('cy young') || q.includes('mvp') || 
                     q.includes('world series') || q.includes('dodgers') || q.includes('yankees') || 
                     q.includes('win total') || q.includes('division');
  
  if (isPolitical) {
    return [
      {
        title: 'JD Vance gains momentum in early 2028 polling',
        source: 'Political Wire',
        url: 'https://example.com/1',
        publishedAt: new Date(),
        sentiment: 0.3,
        relevance: 0.9,
      },
      {
        title: 'Republican establishment divided on 2028 nominee',
        source: 'The Hill',
        url: 'https://example.com/2',
        publishedAt: new Date(Date.now() - 86400000),
        sentiment: -0.1,
        relevance: 0.85,
      },
    ];
  }
  
  if (isCrypto) {
    return [
      {
        title: 'Bitcoin ETFs see record inflows this week',
        source: 'CoinDesk',
        url: 'https://example.com/3',
        publishedAt: new Date(),
        sentiment: 0.6,
        relevance: 0.9,
      },
      {
        title: 'Regulatory concerns weigh on crypto markets',
        source: 'CryptoNews',
        url: 'https://example.com/4',
        publishedAt: new Date(Date.now() - 86400000),
        sentiment: -0.3,
        relevance: 0.75,
      },
    ];
  }
  
  if (isBaseball) {
    return [
      {
        title: 'MLB Opening Day rosters set, surprise prospects make teams',
        source: 'ESPN',
        url: 'https://example.com/mlb1',
        publishedAt: new Date(),
        sentiment: 0.2,
        relevance: 0.9,
      },
      {
        title: 'Pitching velocity up league-wide, offense down in spring training',
        source: 'Baseball Prospectus',
        url: 'https://example.com/mlb2',
        publishedAt: new Date(Date.now() - 86400000),
        sentiment: -0.1,
        relevance: 0.85,
      },
      {
        title: 'Injury updates: Several aces dealing with spring setbacks',
        source: 'MLB Trade Rumors',
        url: 'https://example.com/mlb3',
        publishedAt: new Date(Date.now() - 172800000),
        sentiment: -0.2,
        relevance: 0.8,
      },
    ];
  }
  
  return [
    {
      title: 'Market sentiment remains mixed on key issues',
      source: 'Market Watch',
      url: 'https://example.com/5',
      publishedAt: new Date(),
      sentiment: 0,
      relevance: 0.5,
    },
  ];
}

export function analyzeSentiment(news: NewsItem[]): SentimentAnalysis {
  if (news.length === 0) {
    return { overall: 0, magnitude: 0, sources: [] };
  }
  
  const sentiments = news.map(n => n.sentiment);
  const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  const magnitude = Math.abs(avgSentiment);
  
  return {
    overall: avgSentiment,
    magnitude,
    sources: [...new Set(news.map(n => n.source))],
  };
}
