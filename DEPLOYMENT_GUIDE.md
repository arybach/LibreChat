# Search Aggregator Deployment Guide

## Quick Start (Localhost)

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available
- 10GB free disk space

### Step 1: Clone and Configure

```bash
# Navigate to LibreChat directory
cd /projects/LibreChat

# Copy environment example
cp search-aggregator/.env.example search-aggregator/.env

# Edit configuration (optional)
nano search-aggregator/.env
```

### Step 2: Update Main Environment

Add to your main `.env` file in the LibreChat root:

```bash
# Search Aggregator Configuration
SEARCH_AGGREGATOR_URL=http://search_aggregator:3001
SEARCH_LOCATIONS=New York,Los Angeles,Chicago,San Francisco
SEARCH_CATEGORIES=furniture,apartments,motorcycles,autos
CRON_SCHEDULE=0 6 * * *
MAX_RESULTS_PER_SEARCH=50
ENABLE_FACEBOOK=false
ENABLE_CRAIGSLIST=true
ENABLE_OFFERUP=false
```

**Important:** Facebook and OfferUp scrapers are disabled by default due to anti-bot measures. Craigslist is more reliable for testing.

### Step 3: Build and Start Services

```bash
# Build all services including search aggregator
docker-compose build

# Start all services
docker-compose up -d

# Watch logs
docker-compose logs -f search_aggregator
```

### Step 4: Verify Installation

```bash
# Check service health
curl http://localhost:3001/health

# Expected output:
# {
#   "status": "healthy",
#   "service": "search-aggregator",
#   "timestamp": "2025-12-02T..."
# }

# Check LibreChat is running
curl http://localhost:3080

# Verify MongoDB connection
docker-compose exec search_aggregator curl http://localhost:3001/api/listings/stats
```

### Step 5: Run Initial Scrape

```bash
# Trigger first scrape manually
curl -X POST http://localhost:3001/api/scrape/trigger

# This may take a few minutes depending on settings
# Watch progress:
docker-compose logs -f search_aggregator
```

### Step 6: Test LibreChat Integration

1. Open LibreChat in your browser: `http://localhost:3080`
2. Create a new chat
3. Make sure the Agents endpoint is enabled
4. Try a query like:
   - "Find me furniture for sale in New York"
   - "Show me apartments under $2000 in Chicago"
   - "What marketplace listings do you have?"

The AI should use the `marketplace_search` tool to query the database.

## Configuration Options

### Location Mapping

Craigslist uses specific subdomain names. Common mappings:

```
New York -> newyork
Los Angeles -> losangeles
San Francisco -> sfbay
Chicago -> chicago
Boston -> boston
Seattle -> seattle
```

For full list, visit: https://www.craigslist.org/about/sites

### Category Customization

Add more categories by:

1. Updating the Listing model enum in `api/models/Listing.js`
2. Adding category mappings in scrapers
3. Updating `.env` `SEARCH_CATEGORIES`

### Scraping Frequency

Adjust `CRON_SCHEDULE` to control when scraping runs:

| Schedule | Description |
|----------|-------------|
| `0 6 * * *` | 6 AM daily |
| `0 */6 * * *` | Every 6 hours |
| `0 0 * * 1` | Monday midnight |
| `*/15 * * * *` | Every 15 minutes (testing only) |

## Production Considerations

### Security

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Authentication**: Consider adding API authentication
3. **Firewall**: Don't expose port 3001 publicly
4. **HTTPS**: Use reverse proxy (nginx) with SSL

### Performance

1. **Database Indexes**: Already optimized, but monitor performance
2. **Caching**: Consider Redis for frequently accessed data
3. **Scaling**: Run multiple scraper instances with job queues
4. **Resource Limits**: Set Docker resource limits

```yaml
# In docker-compose.yml
search_aggregator:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
```

### Monitoring

```bash
# View logs
docker-compose logs -f search_aggregator

# Check container stats
docker stats search_aggregator

# Monitor database size
docker-compose exec mongodb mongo LibreChat --eval "db.listings.stats()"
```

### Backup

```bash
# Backup MongoDB listings
docker-compose exec mongodb mongodump --db LibreChat --collection listings --out /backup

# Restore
docker-compose exec mongodb mongorestore --db LibreChat /backup/LibreChat
```

## Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs search_aggregator

# Common issues:
# 1. MongoDB not ready - wait 30 seconds and retry
# 2. Port 3001 in use - change PORT in docker-compose.yml
# 3. Build failed - run: docker-compose build --no-cache search_aggregator
```

### No listings being scraped

```bash
# Test scraper manually
docker-compose exec search_aggregator node -e "
const { craigslistScraper } = require('./scrapers');
craigslistScraper.scrape(['newyork'], ['furniture'])
  .then(count => console.log('Scraped:', count))
  .catch(err => console.error('Error:', err));
"

# Check if sites are blocking (403/429 errors)
# Solution: Adjust delays, use proxies, or switch platforms
```

### LibreChat can't find tool

```bash
# Verify environment variable
docker-compose exec api env | grep SEARCH_AGGREGATOR_URL

# Test connectivity
docker-compose exec api curl http://search_aggregator:3001/health

# Restart LibreChat API
docker-compose restart api
```

### Memory issues

```bash
# Check memory usage
docker stats

# Reduce MAX_RESULTS_PER_SEARCH
# Limit concurrent scrapers
# Add memory limits to docker-compose.yml
```

## Alternative Platforms

### Using Official APIs (Recommended for Production)

Instead of scraping, consider official APIs:

1. **Facebook Marketplace**: Use Facebook Graph API
   - Requires app registration
   - Better reliability
   - Rate limits but legal

2. **eBay**: eBay Finding API
   - Free tier available
   - Well documented

3. **Real Estate**: Zillow, Realtor.com APIs
   - For apartment searches

### Proxy Services

For large-scale scraping:
- ScraperAPI
- Bright Data
- Oxylabs

Add proxy configuration in scraper files.

## Maintenance

### Regular Tasks

1. **Clean old listings** (monthly):
```bash
# Remove listings older than 30 days
docker-compose exec search_aggregator node -e "
const mongoose = require('mongoose');
const Listing = require('./models/Listing');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  const result = await Listing.deleteMany({ scrapedAt: { \$lt: date } });
  console.log('Deleted:', result.deletedCount);
  process.exit(0);
});
"
```

2. **Reindex database** (as needed):
```bash
docker-compose exec mongodb mongo LibreChat --eval "db.listings.reIndex()"
```

3. **Update scrapers** when sites change:
```bash
# Edit scraper files in search-aggregator/scrapers/
# Rebuild and restart
docker-compose build search_aggregator
docker-compose restart search_aggregator
```

## Uninstalling

```bash
# Stop and remove search aggregator
docker-compose stop search_aggregator
docker-compose rm search_aggregator

# Remove from docker-compose.yml (the search_aggregator service)

# Optional: Remove listings from database
docker-compose exec mongodb mongo LibreChat --eval "db.listings.drop()"

# Remove from LibreChat tools
# Revert changes to api/app/clients/tools/
```

## Getting Help

- Check logs: `docker-compose logs search_aggregator`
- Review README: `search-aggregator/README.md`
- Test API directly: `curl http://localhost:3001/api/listings/stats`
- Verify MongoDB: `docker-compose exec mongodb mongo LibreChat --eval "db.listings.count()"`

---

**Next Steps:**
1. Test with real queries through LibreChat
2. Adjust locations and categories to your needs
3. Set appropriate scraping schedule
4. Monitor performance and storage
5. Consider API alternatives for production use
