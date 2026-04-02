#!/bin/bash
# SETUP SCRIPT - Makaveli Free Dark Signals

echo "🔮 Setting up Makaveli Free Dark Signals..."
echo ""

# Check Node.js version
node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js 18+ required. You have $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create environment file
echo ""
echo "📝 Creating environment configuration..."

if [ ! -f .env ]; then
cat > .env << 'EOF'
# Makaveli Free Dark Signals Configuration

# TELEGRAM API (Required for Telegram intel)
# Get these from https://my.telegram.org/apps
TELEGRAM_API_ID=your_api_id_here
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_SESSION=

# RIPE ATLAS (Optional - works without key but slower)
RIPE_API_KEY=

# MARINE/AIS (Optional)
VESSELFINDER_API_KEY=

# Output directory
OUTPUT_DIR=./makaveli_intel
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Create output directory
mkdir -p makaveli_intel

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    SETUP COMPLETE                              "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Get Telegram API credentials:"
echo "   → Visit: https://my.telegram.org/apps"
echo "   → Create an app (any name works)"
echo "   → Copy api_id and api_hash to .env file"
echo ""
echo "2. Authenticate Telegram (first run only):"
echo "   npm run telegram:auth"
echo ""
echo "3. Test the connections:"
echo "   npm run test"
echo ""
echo "4. Run first collection:"
echo "   npm run collect"
echo ""
echo "5. (Optional) Set up automatic collection:"
echo "   npm run schedule"
echo ""
echo "═══════════════════════════════════════════════════════════════"
