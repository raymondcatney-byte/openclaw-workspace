import 'dotenv/config';
import { initDatabase } from '../src/database/index.js';

async function setup() {
  console.log('🚀 Setting up MiroFish Phase 1...\n');
  
  // Check environment
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not set!');
    console.log('Get one at: https://console.groq.com/keys');
    process.exit(1);
  }
  
  console.log('✅ GROQ_API_KEY found');
  
  // Initialize database
  await initDatabase();
  
  console.log('\n🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('  1. Run dry scan: npm run scan:dry');
  console.log('  2. Check output, then run live: npm run scan');
  console.log('  3. View database: npm run db:studio');
}

setup().catch(console.error);
