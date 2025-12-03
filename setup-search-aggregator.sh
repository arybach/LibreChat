#!/bin/bash

# Quick setup script for Search Aggregator
# Automates the initial configuration and deployment

set -e

echo "🚀 Search Aggregator Quick Setup"
echo "================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose not found"
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Step 1: Create .env if it doesn't exist
echo "📝 Step 1: Configuring environment"
if [ ! -f "search-aggregator/.env" ]; then
    cp search-aggregator/.env.example search-aggregator/.env
    echo "✓ Created search-aggregator/.env from template"
else
    echo "✓ search-aggregator/.env already exists"
fi

# Step 2: Check main .env
echo ""
echo "📝 Step 2: Checking main .env configuration"
if ! grep -q "SEARCH_AGGREGATOR_URL" .env 2>/dev/null; then
    echo "Adding SEARCH_AGGREGATOR_URL to .env..."
    echo "" >> .env
    echo "# Search Aggregator Configuration" >> .env
    echo "SEARCH_AGGREGATOR_URL=http://search_aggregator:3001" >> .env
    echo "✓ Updated .env with search aggregator settings"
else
    echo "✓ SEARCH_AGGREGATOR_URL already configured"
fi

# Step 3: Set default locations (ask user)
echo ""
echo "📍 Step 3: Configure search locations"
echo "Enter locations to search (comma-separated, or press Enter for default):"
echo "Default: New York,Los Angeles,Chicago"
read -r locations

if [ -n "$locations" ]; then
    if grep -q "SEARCH_LOCATIONS=" .env; then
        sed -i.bak "s/SEARCH_LOCATIONS=.*/SEARCH_LOCATIONS=$locations/" .env
    else
        echo "SEARCH_LOCATIONS=$locations" >> .env
    fi
    echo "✓ Set locations: $locations"
else
    echo "✓ Using default locations"
fi

# Step 4: Ask about scraping platforms
echo ""
echo "🔧 Step 4: Configure scraping platforms"
echo "Which platforms would you like to enable?"
echo "Note: Facebook and OfferUp have anti-bot measures and may not work reliably"
echo ""

read -p "Enable Craigslist? (recommended) [Y/n]: " enable_cl
enable_cl=${enable_cl:-Y}

read -p "Enable Facebook Marketplace? (experimental) [y/N]: " enable_fb
enable_fb=${enable_fb:-N}

read -p "Enable OfferUp? (experimental) [y/N]: " enable_ou
enable_ou=${enable_ou:-N}

# Update .env
[ "$enable_cl" = "Y" ] || [ "$enable_cl" = "y" ] && echo "ENABLE_CRAIGSLIST=true" >> .env || echo "ENABLE_CRAIGSLIST=false" >> .env
[ "$enable_fb" = "Y" ] || [ "$enable_fb" = "y" ] && echo "ENABLE_FACEBOOK=true" >> .env || echo "ENABLE_FACEBOOK=false" >> .env
[ "$enable_ou" = "Y" ] || [ "$enable_ou" = "y" ] && echo "ENABLE_OFFERUP=true" >> .env || echo "ENABLE_OFFERUP=false" >> .env

echo "✓ Platform configuration saved"

# Step 5: Build and start services
echo ""
echo "🏗️  Step 5: Building Docker containers"
echo "This may take several minutes..."
echo ""

docker-compose build search_aggregator

echo ""
echo "✓ Build complete"

# Step 6: Start services
echo ""
echo "🚀 Step 6: Starting services"
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Step 7: Health check
echo ""
echo "🏥 Step 7: Health check"
max_attempts=12
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3001/health | grep -q "healthy"; then
        echo "✓ Search Aggregator is healthy!"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Service failed to start. Check logs:"
        echo "   docker-compose logs search_aggregator"
        exit 1
    fi
    echo "  Attempt $attempt/$max_attempts..."
    sleep 5
done

# Step 8: Run initial scrape
echo ""
echo "🔍 Step 8: Running initial scrape"
read -p "Would you like to run an initial scrape now? [Y/n]: " run_scrape
run_scrape=${run_scrape:-Y}

if [ "$run_scrape" = "Y" ] || [ "$run_scrape" = "y" ]; then
    echo "Starting scrape... (this may take a few minutes)"
    curl -X POST http://localhost:3001/api/scrape/trigger 2>/dev/null
    echo ""
    echo "Scrape initiated. Monitor progress with:"
    echo "  docker-compose logs -f search_aggregator"
fi

# Success!
echo ""
echo "================================="
echo "✅ Setup Complete!"
echo "================================="
echo ""
echo "Your search aggregator is now running!"
echo ""
echo "📊 Service URLs:"
echo "  - LibreChat:        http://localhost:3080"
echo "  - Search Aggregator: http://localhost:3001"
echo "  - API Health:        http://localhost:3001/health"
echo ""
echo "🧪 Test the integration:"
echo "  bash test-integration.sh"
echo ""
echo "📖 Documentation:"
echo "  - DEPLOYMENT_GUIDE.md"
echo "  - search-aggregator/README.md"
echo ""
echo "🛠️  Useful commands:"
echo "  - View logs:       docker-compose logs -f search_aggregator"
echo "  - Check status:    docker-compose ps"
echo "  - Stop services:   docker-compose down"
echo "  - Restart:         docker-compose restart search_aggregator"
echo ""
echo "💬 Try asking LibreChat:"
echo '  "Find me cheap furniture in New York"'
echo '  "Show me apartments for rent in Los Angeles"'
echo ""
