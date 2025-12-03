# Marketplace Tool Setup & Usage Guide

## ✅ What's Already Configured

Your LibreChat instance has the Marketplace Search tool fully integrated:

- ✅ Search aggregator running (881 listings: 800 Craigslist + 81 Facebook)
- ✅ Tool registered in manifest.json
- ✅ Tool loader implemented in handleTools.js
- ✅ Agents enabled in librechat.yaml

## 🎯 How to Use the Marketplace Tool

### Step 1: Access LibreChat
Open your browser to: http://localhost:3080

### Step 2: Create an Agent with Marketplace Tool

1. **Click "Agents"** in the left sidebar (icon with robot head)
2. **Click "+ New Agent"** button
3. Configure your agent:
   - **Name**: "Marketplace Assistant" (or any name)
   - **Description**: "Searches for items on Craigslist, Facebook Marketplace, and OfferUp"
   - **Model**: Select "Ollama ROCm" → "qwen3:8b"
   
4. **Scroll down to "Tools" section**
   - Find and **check** the box for **"Marketplace Search"**
   - You should see: "Search for listings from Facebook Marketplace, Craigslist, and OfferUp..."

5. **Click "Create" or "Save"**

### Step 3: Test the Tool

1. **Start a new conversation**
2. **Select your "Marketplace Assistant" agent** from the dropdown
3. **Try these queries:**

```
Show me the most recent furniture ads in Miami
```

```
Find motorcycles for sale under $5000
```

```
Search for apartments in New York
```

```
What furniture is available in Los Angeles?
```

## 🔍 What Should Happen

When working correctly, you'll see:

1. **Tool Execution**: A section showing the tool was called with parameters
2. **Tool Results**: Formatted list of listings with:
   - Title
   - Platform (facebook/craigslist/facebook-group)
   - Price
   - Location
   - URL
   - Description
   - Posted date

3. **AI Response**: The agent will summarize the results in natural language

## 📊 Available Data

Your database currently has:
- **Total Listings**: 881
- **Platforms**: 
  - Craigslist: 800 listings (New York, LA, Chicago, Miami)
  - Facebook Marketplace: 64 listings (Miami)
  - Facebook Groups: 17 listings (4 Miami groups)
- **Categories**: furniture, autos, motorcycles, apartments, other
- **Last Updated**: Check with: `curl http://localhost:3001/api/listings/stats`

## 🛠️ Troubleshooting

### Tool Not Appearing
1. Verify agents are enabled:
   ```bash
   grep -A5 "interface:" librechat.yaml
   # Should show: agents: true
   ```

2. Check agents endpoint config:
   ```bash
   grep -A5 "agents:" librechat.yaml | grep -v "interface"
   # Should show capabilities including "tools"
   ```

3. Restart API:
   ```bash
   docker-compose restart api
   ```

### Tool Appears But Doesn't Work
1. Check search aggregator is running:
   ```bash
   docker-compose ps search_aggregator
   # Should show: Up
   ```

2. Test the API directly:
   ```bash
   curl -s 'http://localhost:3001/api/listings/search?limit=3' | python3 -m json.tool
   ```

3. Check API logs:
   ```bash
   docker-compose logs --tail=50 api | grep -i marketplace
   ```

### "No listings found"
1. Verify data in database:
   ```bash
   curl http://localhost:3001/api/listings/stats
   ```

2. Trigger a fresh scrape:
   ```bash
   curl -X POST http://localhost:3001/api/scrape/trigger
   ```

3. Check specific platforms:
   ```bash
   curl 'http://localhost:3001/api/listings/search?platform=facebook'
   curl 'http://localhost:3001/api/listings/search?platform=craigslist'
   ```

## 🎨 Available Tool Functions

The Marketplace toolkit includes 3 tools:

### 1. marketplace_search
Main search tool with parameters:
- `category`: furniture, apartments, motorcycles, autos, other
- `location`: New York, Los Angeles, Chicago, Miami, etc.
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `search`: Keywords to search in title/description
- `limit`: Number of results (default: 10, max: 50)

### 2. marketplace_stats
Get database statistics:
- Total listings count
- Recent listings (24h)
- Last scrape timestamp

### 3. marketplace_categories
List available categories and platforms with counts

## 📝 Example Agent Prompts

Create different specialized agents:

**Furniture Finder:**
```
Name: Furniture Finder
Description: Helps find furniture deals from multiple marketplaces
Tools: [✓] Marketplace Search
System Prompt: "You are a furniture shopping assistant. When users ask about furniture, 
use the marketplace_search tool to find relevant listings. Always include price, location, 
and condition information."
```

**Car Shopper:**
```
Name: Car Shopper
Description: Searches for vehicles across marketplaces
Tools: [✓] Marketplace Search
System Prompt: "You are a car shopping assistant. Focus on autos and motorcycles categories. 
Highlight good deals and help users filter by price range."
```

**Apartment Hunter:**
```
Name: Apartment Hunter
Description: Finds rental listings
Tools: [✓] Marketplace Search
System Prompt: "You help people find apartments. Always search the 'apartments' category 
and filter by location. Mention proximity to landmarks when possible."
```

## 🔄 Adding More Data

### Trigger Manual Scrape
```bash
curl -X POST http://localhost:3001/api/scrape/trigger
```

### Add New Locations
Edit `.env`:
```bash
SEARCH_LOCATIONS=New York,Los Angeles,Chicago,Miami,San Francisco,Austin
```

Then restart:
```bash
docker-compose restart search_aggregator
```

### Add Facebook Groups
Edit `.env`:
```bash
FACEBOOK_GROUP_IDS=group1,group2,group3
```

Update cookies if needed and restart.

## 📚 API Endpoints

Direct API access (outside of agents):

```bash
# Search furniture in Miami
curl 'http://localhost:3001/api/listings/search?category=furniture&location=Miami&limit=10'

# Get statistics
curl 'http://localhost:3001/api/listings/stats'

# List categories
curl 'http://localhost:3001/api/listings/categories'

# Filter by price
curl 'http://localhost:3001/api/listings/search?minPrice=100&maxPrice=500'

# Search keywords
curl 'http://localhost:3001/api/listings/search?search=couch'
```

## 🚀 Next Steps

1. **Test the marketplace tool** in LibreChat UI
2. **Add more Facebook groups** (see EXPORT_FACEBOOK_COOKIES.md)
3. **Add OfferUp scraper** (see search-aggregator/scrapers/offerupScraper.js)
4. **Schedule regular scraping** (add cron job or use the API's scheduled scraper)
5. **Expand locations** (edit SEARCH_LOCATIONS in .env)

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs search_aggregator api`
2. Verify services: `docker-compose ps`
3. Test direct API: `curl http://localhost:3001/api/listings/stats`
4. Review configuration: `cat librechat.yaml`

Your marketplace search system is ready! 🎉
