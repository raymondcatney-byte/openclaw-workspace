export default function Home() {
  return (
    <main style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1>🔭 Polymarket Engine</h1>
      <p>Cloud-hosted search + anomaly detection for prediction markets.</p>
      
      <h2>API Endpoints</h2>
      <ul>
        <li><code>GET /api/markets?sector=ENERGY</code> - Search markets</li>
        <li><code>GET /api/market/0x...</code> - Market details</li>
        <li><code>GET /api/alerts</code> - Stored alerts</li>
        <li><code>GET /api/anomalies</code> - Real-time detection</li>
        <li><code>GET /api/sectors</code> - Sector stats</li>
      </ul>
      
      <h2>Setup</h2>
      <ol>
        <li>Create Supabase project</li>
        <li>Run schema.sql in SQL Editor</li>
        <li>Deploy to Vercel</li>
        <li>Set environment variables</li>
        <li>Trigger /api/cron/index?secret=CRON_SECRET</li>
      </ol>
      
      <p><a href="/api/sectors">Test API →</a></p>
    </main>
  );
}
