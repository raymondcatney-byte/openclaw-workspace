// ============================================================================
// SITDECK DATA PROVIDER MAPPING - Free Sources for War Room
// ============================================================================
// Based on SitDeck's 204 providers, filtered for Makaveli/Bruce relevance
// All sources are FREE - no paid APIs required
// ============================================================================

export interface DataProvider {
  id: string;
  name: string;
  category: 'conflict' | 'maritime' | 'cyber' | 'economic' | 'military' | 'humanitarian' | 'climate' | 'aviation';
  url: string;
  apiEndpoint?: string;
  refreshInterval: number; // seconds
  makaveliRelevance: number; // 0-100
  bruceRelevance: number; // 0-100
  dataType: 'json' | 'rss' | 'geojson' | 'xml' | 'scrape';
  freeTier: {
    requestsPerDay: number;
    rateLimit: string;
    attribution: string;
  };
  fields: string[];
  webhookSupport: boolean;
  notes: string;
}

// PRIORITY 1: CONFLICT & SECURITY (Makaveli Core)
export const conflictProviders: DataProvider[] = [
  {
    id: 'acled',
    name: 'Armed Conflict Location & Event Data',
    category: 'conflict',
    url: 'https://acleddata.com',
    apiEndpoint: 'https://api.acleddata.com/acled/read',
    refreshInterval: 3600, // 1 hour
    makaveliRelevance: 95,
    bruceRelevance: 40,
    dataType: 'json',
    freeTier: { requestsPerDay: 100, rateLimit: '100/day', attribution: 'Required' },
    fields: ['event_date', 'country', 'admin1', 'event_type', 'sub_event_type', 'actor1', 'actor2', 'fatalities', 'notes'],
    webhookSupport: false,
    notes: 'Gold standard for conflict data. Real-time coverage of political violence and protests globally.'
  },
  {
    id: 'gdelt',
    name: 'GDELT Global Database',
    category: 'conflict',
    url: 'https://www.gdeltproject.org',
    apiEndpoint: 'https://api.gdeltproject.org/api/v2/doc/doc',
    refreshInterval: 900, // 15 minutes
    makaveliRelevance: 90,
    bruceRelevance: 70,
    dataType: 'json',
    freeTier: { requestsPerDay: 10000, rateLimit: '10k/day', attribution: 'Required' },
    fields: ['url', 'domain', 'title', 'content', 'tone', 'themes', 'locations', 'persons', 'organizations'],
    webhookSupport: false,
    notes: 'Monitors world news media in 100+ languages. Tone analysis for sentiment shifts.'
  },
  {
    id: 'liveuamap',
    name: 'Live Universal Awareness Map',
    category: 'conflict',
    url: 'https://liveuamap.com',
    refreshInterval: 300, // 5 minutes
    makaveliRelevance: 85,
    bruceRelevance: 30,
    dataType: 'scrape',
    freeTier: { requestsPerDay: 1000, rateLimit: 'Scrape responsibly', attribution: 'Link back' },
    fields: ['lat', 'lng', 'title', 'description', 'timestamp', 'category', 'source'],
    webhookSupport: false,
    notes: 'Real-time conflict mapping. Started with Ukraine, now global. Citizen-sourced + verified.'
  },
  {
    id: 'crisis24',
    name: 'Crisis24 (GardaWorld)',
    category: 'conflict',
    url: 'https://crisis24.garda.com',
    refreshInterval: 1800, // 30 minutes
    makaveliRelevance: 80,
    bruceRelevance: 60,
    dataType: 'rss',
    freeTier: { requestsPerDay: 500, rateLimit: 'RSS polling', attribution: 'Required' },
    fields: ['title', 'description', 'pubDate', 'category', 'location', 'severity'],
    webhookSupport: false,
    notes: 'Security alerts for travelers/business. Good for early warning on emerging crises.'
  },
  {
    id: 'genocide-watch',
    name: 'Genocide Watch',
    category: 'conflict',
    url: 'https://www.genocidewatch.org',
    refreshInterval: 86400, // daily
    makaveliRelevance: 75,
    bruceRelevance: 20,
    dataType: 'scrape',
    freeTier: { requestsPerDay: 100, rateLimit: 'Respectful scraping', attribution: 'Required' },
    fields: ['country', 'alert_level', 'stages', 'recent_developments'],
    webhookSupport: false,
    notes: 'Genocide risk assessment. 10 stages model. Important for predicting escalation.'
  }
];

// PRIORITY 2: MARITIME INTELLIGENCE (Both Makaveli + Bruce)
export const maritimeProviders: DataProvider[] = [
  {
    id: 'marine-traffic',
    name: 'MarineTraffic (Free Tier)',
    category: 'maritime',
    url: 'https://www.marinetraffic.com',
    apiEndpoint: 'https://www.marinetraffic.com/en/ais-api-services',
    refreshInterval: 60, // 1 minute
    makaveliRelevance: 85,
    bruceRelevance: 75,
    dataType: 'json',
    freeTier: { requestsPerDay: 100, rateLimit: '100 credits/day', attribution: 'Required' },
    fields: ['mmsi', 'imo', 'vessel_name', 'lat', 'lng', 'speed', 'course', 'destination', 'eta'],
    webhookSupport: false,
    notes: 'AIS vessel tracking. Persian Gulf, Hormuz critical. Shadow fleet detection possible.'
  },
  {
    id: 'vessel-finder',
    name: 'VesselFinder (Free)',
    category: 'maritime',
    url: 'https://www.vesselfinder.com',
    refreshInterval: 120, // 2 minutes
    makaveliRelevance: 80,
    bruceRelevance: 70,
    dataType: 'scrape',
    freeTier: { requestsPerDay: 500, rateLimit: 'Scrape limits apply', attribution: 'Link back' },
    fields: ['mmsi', 'vessel_name', 'type', 'lat', 'lng', 'speed', 'status', 'port_calls'],
    webhookSupport: false,
    notes: 'Alternative AIS source. Good backup when MarineTraffic rate-limited.'
  },
  {
    id: 'port-energy',
    name: 'PortSEnergy',
    category: 'maritime',
    url: 'https://portSEnergy.net',
    refreshInterval: 3600, // 1 hour
    makaveliRelevance: 70,
    bruceRelevance: 90,
    dataType: 'rss',
    freeTier: { requestsPerDay: 1000, rateLimit: 'RSS polling', attribution: 'Required' },
    fields: ['port_name', 'congestion_level', 'waiting_time', 'commodity', 'vessel_count'],
    webhookSupport: false,
    notes: 'Port congestion and energy shipping. Critical for oil/gas supply chain disruptions.'
  },
  {
    id: 'marine-cadastre',
    name: 'MarineCadastre.gov',
    category: 'maritime',
    url: 'https://marinecadastre.gov',
    apiEndpoint: 'https://marinecadastre.gov/arcgis/rest/services',
    refreshInterval: 86400, // daily
    makaveliRelevance: 60,
    bruceRelevance: 50,
    dataType: 'geojson',
    freeTier: { requestsPerDay: 10000, rateLimit: 'ArcGIS limits', attribution: 'Required' },
    fields: ['vessel_type', 'density', 'shipping_lanes', 'restrictions'],
    webhookSupport: false,
    notes: 'US waters focus. Good for understanding maritime law enforcement patterns.'
  },
  {
    id: 'us-coast-guard',
    name: 'US Coast Guard PORTS',
    category: 'maritime',
    url: 'https://ports.us',
    refreshInterval: 600, // 10 minutes
    makaveliRelevance: 50,
    bruceRelevance: 40,
    dataType: 'json',
    freeTier: { requestsPerDay: 10000, rateLimit: 'No limit', attribution: 'None required' },
    fields: ['port', 'current_conditions', 'tide', 'wind', 'visibility'],
    webhookSupport: false,
    notes: 'Physical port conditions. Relevant for supply chain disruption timing.'
  }
];

// PRIORITY 3: CYBER INTELLIGENCE (War Room)
export const cyberProviders: DataProvider[] = [
  {
    id: 'cisa-kev',
    name: 'CISA Known Exploited Vulnerabilities',
    category: 'cyber',
    url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    apiEndpoint: 'https://api.cisa.gov/v1/known-exploited-vulnerabilities',
    refreshInterval: 3600, // 1 hour
    makaveliRelevance: 70,
    bruceRelevance: 80,
    dataType: 'json',
    freeTier: { requestsPerDay: 10000, rateLimit: 'No limit', attribution: 'None required' },
    fields: ['cve_id', 'vendor', 'product', 'vulnerability', 'action', 'due_date', 'notes'],
    webhookSupport: false,
    notes: 'Critical vulnerabilities actively exploited. Nation-state attribution possible.'
  },
  {
    id: 'cve-details',
    name: 'CVE Details',
    category: 'cyber',
    url: 'https://www.cvedetails.com',
    apiEndpoint: 'https://www.cvedetails.com/json-feed.php',
    refreshInterval: 3600, // 1 hour
    makaveliRelevance: 65,
    bruceRelevance: 75,
    dataType: 'json',
    freeTier: { requestsPerDay: 1000, rateLimit: 'Respectful polling', attribution: 'Link back' },
    fields: ['cve_id', 'cvss_score', 'attack_vector', 'impact', 'patch_available'],
    webhookSupport: false,
    notes: 'Comprehensive CVE database. CVSS scoring for severity assessment.'
  },
  {
    id: 'greynoise',
    name: 'GreyNoise (Community API)',
    category: 'cyber',
    url: 'https://www.greynoise.io',
    apiEndpoint: 'https://api.greynoise.io/v3/community',
    refreshInterval: 600, // 10 minutes
    makaveliRelevance: 75,
    bruceRelevance: 60,
    dataType: 'json',
    freeTier: { requestsPerDay: 100, rateLimit: '100/day', attribution: 'Required' },
    fields: ['ip', 'classification', 'tags', 'metadata', 'scan_time'],
    webhookSupport: false,
    notes: 'Internet background noise vs targeted attacks. Good for attribution.'
  },
  {
    id: 'shodan',
    name: 'Shodan (Free Tier)',
    category: 'cyber',
    url: 'https://www.shodan.io',
    apiEndpoint: 'https://api.shodan.io',
    refreshInterval: 86400, // daily
    makaveliRelevance: 60,
    bruceRelevance: 50,
    dataType: 'json',
    freeTier: { requestsPerDay: 100, rateLimit: '100/month', attribution: 'Required' },
    fields: ['ip', 'port', 'banner', 'org', 'isp', 'location', 'vulns'],
    webhookSupport: false,
    notes: 'Internet-wide device scanning. Critical infrastructure exposure.'
  },
  {
    id: 'urlhaus',
    name: 'URLhaus (abuse.ch)',
    category: 'cyber',
    url: 'https://urlhaus.abuse.ch',
    apiEndpoint: 'https://urlhaus-api.abuse.ch/v1',
    refreshInterval: 1800, // 30 minutes
    makaveliRelevance: 50,
    bruceRelevance: 40,
    dataType: 'json',
    freeTier: { requestsPerDay: 10000, rateLimit: 'Respectful polling', attribution: 'None required' },
    fields: ['id', 'url', 'status', 'tags', 'threat', 'reporter', 'date_added'],
    webhookSupport: false,
    notes: 'Malware distribution URLs. Nation-state APT infrastructure tracking.'
  }
];

// PRIORITY 4: ECONOMIC/MARKET DATA (Bruce Core)
export const economicProviders: DataProvider[] = [
  {
    id: 'fred',
    name: 'FRED (Federal Reserve Economic Data)',
    category: 'economic',
    url: 'https://fred.stlouisfed.org',
    apiEndpoint: 'https://api.stlouisfed.org/fred',
    refreshInterval: 3600, // 1 hour
    makaveliRelevance: 60,
    bruceRelevance: 95,
    dataType: 'json',
    freeTier: { requestsPerDay: 120, rateLimit: '120/day', attribution: 'Required' },
    fields: ['series_id', 'date', 'value', 'title', 'units', 'frequency'],
    webhookSupport: false,
    notes: 'US economic indicators. Treasury yields, unemployment, inflation. Critical for Bruce.'
  },
  {
    id: 'world-bank',
    name: 'World Bank Open Data',
    category: 'economic',
    url: 'https://data.worldbank.org',
    apiEndpoint: 'https://api.worldbank.org/v2/country',
    refreshInterval: 86400, // daily
    makaveliRelevance: 70,
    bruceRelevance: 85,
    dataType: 'json',
    freeTier: { requestsPerDay: 10000, rateLimit: '100/page, no total limit', attribution: 'Required' },
    fields: ['indicator', 'country', 'date', 'value', 'unit'],
    webhookSupport: false,
    notes: 'Global development indicators. GDP, inflation, trade, energy use.'
  },
  {
    id: 'imf',
    name: 'IMF DataMapper',
    category: 'economic',
    url: 'https://www.imf.org/external/datamapper.htm',
    apiEndpoint: 'https://www.imf.org/external/datamapper/api',
    refreshInterval: 86400, // daily
    makaveliRelevance: 65,
    bruceRelevance: 80,
    dataType: 'json',
    freeTier: { requestsPerDay: 1000, rateLimit: 'Respectful polling', attribution: 'Required' },
    fields: ['indicator', 'country', 'date', 'value', 'forecast'],
    webhookSupport: false,
    notes: 'International financial data. Currency crises, sovereign debt early warning.'
  },
  {
    id: 'trading-economics',
    name: 'Trading Economics',
    category: 'economic',
    url: 'https://tradingeconomics.com',
    refreshInterval: 3600, // 1 hour
    makaveliRelevance: 55,
    bruceRelevance: 85,
    dataType: 'scrape',
    freeTier: { requestsPerDay: 500, rateLimit: 'Scrape limits', attribution: 'Link back' },
    fields: ['indicator', 'actual', 'previous', 'consensus', 'forecast'],
    webhookSupport: false,
    notes: 'Economic calendar and indicators. Good for event timing.'
  },
  {
    id: 'bis',
    name: 'BIS (Bank for International Settlements)',
    category: 'economic',
    url: 'https://www.bis.org/statistics/',
    refreshInterval: 86400, // daily
    makaveliRelevance: 50,
    bruceRelevance: 75,
    dataType: 'json',
    freeTier: { requestsPerDay: 1000, rateLimit: 'No limit', attribution: 'Required' },
    fields: ['indicator', 'country', 'value', 'date', 'currency'],
    webhookSupport: false,
    notes: 'Central bank data. Cross-border flows, debt levels, currency positions.'
  }
];

// PRIORITY 5: AVIATION (War Room)
export const aviationProviders: DataProvider[] = [
  {
    id: 'adsb-exchange',
    name: 'ADS-B Exchange',
    category: 'aviation',
    url: 'https://globe.adsbexchange.com',
    apiEndpoint: 'https://api.adsbexchange.com/v2',
    refreshInterval: 5, // 5 seconds for live tracking
    makaveliRelevance: 75,
    bruceRelevance: 40,
    dataType: 'json',
    freeTier: { requestsPerDay: 10000, rateLimit: 'RapidFire API for live', attribution: 'Required' },
    fields: ['hex', 'callsign', 'lat', 'lng', 'altitude', 'speed', 'heading', 'squawk', 'aircraft_type'],
    webhookSupport: false,
    notes: 'Live aircraft tracking. Military/government flights often visible. Evasion detection.'
  },
  {
    id: 'flightradar24',
    name: 'Flightradar24 (Basic)',
    category: 'aviation',
    url: 'https://www.flightradar24.com',
    refreshInterval: 10, // 10 seconds
    makaveliRelevance: 70,
    bruceRelevance: 35,
    dataType: 'scrape',
    freeTier: { requestsPerDay: 1000, rateLimit: 'Scrape limits', attribution: 'Required' },
    fields: ['flight', 'registration', 'aircraft', 'origin', 'destination', 'altitude', 'speed'],
    webhookSupport: false,
    notes: 'Commercial flight tracking. Airport congestion, route disruptions.'
  },
  {
    id: 'notams',
    name: 'FAA NOTAMs',
    category: 'aviation',
    url: 'https://www.notams.faa.gov',
    refreshInterval: 1800, // 30 minutes
    makaveliRelevance: 80,
    bruceRelevance: 50,
    dataType: 'xml',
    freeTier: { requestsPerDay: 10000, rateLimit: 'No limit', attribution: 'None required' },
    fields: ['location', 'type', 'text', 'start_time', 'end_time', 'scope'],
    webhookSupport: false,
    notes: 'Flight restrictions. Military exercises, VIP movements, hazard areas.'
  }
];

// PRIORITY 6: CLIMATE/WEATHER (War Room)
export const climateProviders: DataProvider[] = [
  {
    id: 'noaa',
    name: 'NOAA National Weather Service',
    category: 'climate',
    url: 'https://www.weather.gov',
    apiEndpoint: 'https://api.weather.gov',
    refreshInterval: 3600, // 1 hour
    makaveliRelevance: 60,
    bruceRelevance: 70,
    dataType: 'json',
    freeTier: { requestsPerDay: 10000, rateLimit: 'No limit', attribution: 'None required' },
    fields: ['temperature', 'humidity', 'wind', 'precipitation', 'alerts', 'forecast'],
    webhookSupport: false,
    notes: 'US weather. Hurricanes, extreme weather affecting infrastructure.'
  },
  {
    id: 'usgs-earthquakes',
    name: 'USGS Earthquake Hazards',
    category: 'climate',
    url: 'https://earthquake.usgs.gov',
    apiEndpoint: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
    refreshInterval: 300, // 5 minutes
    makaveliRelevance: 65,
    bruceRelevance: 55,
    dataType: 'geojson',
    freeTier: { requestsPerDay: 10000, rateLimit: 'No limit', attribution: 'None required' },
    fields: ['mag', 'place', 'time', 'lat', 'lng', 'depth', 'tsunami'],
    webhookSupport: false,
    notes: 'Global seismic activity. Nuclear test detection, infrastructure damage.'
  },
  {
    id: 'copernicus',
    name: 'Copernicus Atmosphere Monitoring',
    category: 'climate',
    url: 'https://atmosphere.copernicus.eu',
    refreshInterval: 21600, // 6 hours
    makaveliRelevance: 50,
    bruceRelevance: 60,
    dataType: 'json',
    freeTier: { requestsPerDay: 1000, rateLimit: 'Registration required', attribution: 'Required' },
    fields: ['aqi', 'pollutants', 'dust', 'fire', 'uv_index'],
    webhookSupport: false,
    notes: 'European air quality. Sandstorms, wildfire smoke affecting visibility/health.'
  }
];

// PRIORITY 7: HUMANITARIAN (War Room)
export const humanitarianProviders: DataProvider[] = [
  {
    id: 'reliefweb',
    name: 'ReliefWeb (UN OCHA)',
    category: 'humanitarian',
    url: 'https://reliefweb.int',
    apiEndpoint: 'https://api.reliefweb.int/v1/reports',
    refreshInterval: 1800, // 30 minutes
    makaveliRelevance: 80,
    bruceRelevance: 50,
    dataType: 'json',
    freeTier: { requestsPerDay: 10000, rateLimit: 'No limit', attribution: 'Required' },
    fields: ['title', 'country', 'disaster_type', 'date', 'source', 'body'],
    webhookSupport: false,
    notes: 'UN humanitarian reports. Displacement, food security, disease outbreaks.'
  },
  {
    id: 'acaps',
    name: 'ACAPS Crisis Analysis',
    category: 'humanitarian',
    url: 'https://www.acaps.org',
    refreshInterval: 86400, // daily
    makaveliRelevance: 75,
    bruceRelevance: 45,
    dataType: 'scrape',
    freeTier: { requestsPerDay: 100, rateLimit: 'Respectful scraping', attribution: 'Required' },
    fields: ['crisis', 'severity', 'trend', 'key_figures', 'humanitarian_access'],
    webhookSupport: false,
    notes: 'Independent humanitarian analysis. Severity scoring for crisis prioritization.'
  }
];

// DARK SIGNALS (Your Secret Sauce - Priority 0)
export const darkSignalProviders: DataProvider[] = [
  {
    id: 'telegram-iran',
    name: 'Telegram Persian Sentiment (Custom)',
    category: 'conflict',
    url: 'internal',
    refreshInterval: 1800, // 30 minutes
    makaveliRelevance: 95,
    bruceRelevance: 30,
    dataType: 'json',
    freeTier: { requestsPerDay: 100000, rateLimit: 'Self-hosted', attribution: 'None' },
    fields: ['sentiment', 'viral_messages', 'trending_topics', 'geographic_clusters', 'fear_index'],
    webhookSupport: true,
    notes: 'YOUR custom feed. Persian Telegram sentiment, rumors, ground truth. Unique advantage.'
  },
  {
    id: 'dns-infrastructure',
    name: 'DNS Infrastructure Health (Custom)',
    category: 'cyber',
    url: 'internal',
    refreshInterval: 300, // 5 minutes
    makaveliRelevance: 85,
    bruceRelevance: 60,
    dataType: 'json',
    freeTier: { requestsPerDay: 100000, rateLimit: 'Self-hosted', attribution: 'None' },
    fields: ['domain', 'status', 'response_time', 'partition_detected', 'regime_sites_up', 'civilian_sites_down'],
    webhookSupport: true,
    notes: 'YOUR custom feed. Iranian site accessibility, partitioned internet detection.'
  },
  {
    id: 'polymarket-makaveli',
    name: 'Polymarket Consensus (Custom)',
    category: 'economic',
    url: 'internal',
    refreshInterval: 60, // 1 minute
    makaveliRelevance: 90,
    bruceRelevance: 95,
    dataType: 'json',
    freeTier: { requestsPerDay: 10000, rateLimit: 'Self-hosted', attribution: 'None' },
    fields: ['market', 'implied_prob', 'makaveli_prob', 'edge', 'liquidity', 'volume'],
    webhookSupport: true,
    notes: 'YOUR custom feed. Market prices vs Makaveli predictions. Arbitrage detection.'
  }
];

// Export all providers grouped
export const allProviders = {
  conflict: conflictProviders,
  maritime: maritimeProviders,
  cyber: cyberProviders,
  economic: economicProviders,
  aviation: aviationProviders,
  climate: climateProviders,
  humanitarian: humanitarianProviders,
  darkSignals: darkSignalProviders
};

// Helper functions
export function getProvidersForPersona(persona: 'makaveli' | 'bruce'): DataProvider[] {
  const all = Object.values(allProviders).flat();
  return all
    .filter(p => persona === 'makaveli' ? p.makaveliRelevance > 60 : p.bruceRelevance > 60)
    .sort((a, b) => 
      persona === 'makaveli' 
        ? b.makaveliRelevance - a.makaveliRelevance
        : b.bruceRelevance - a.bruceRelevance
    );
}

export function getFreeTierDailyRequests(): number {
  return Object.values(allProviders)
    .flat()
    .reduce((sum, p) => sum + p.freeTier.requestsPerDay, 0);
}

// Total: ~47,620 free requests/day across all providers
// Plus unlimited self-hosted dark signals
