# 🚀 Search Aggregator - Quick Reference

## Installation (2 minutes)

```bash
# Clone and navigate to LibreChat
cd /projects/LibreChat

# Run automated setup
bash setup-search-aggregator.sh

# Test everything works
bash test-integration.sh
```

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **LibreChat** | http://localhost:3080 | Main chat interface |
| **Search API** | http://localhost:3001 | Search aggregator service |
| **Health Check** | http://localhost:3001/health | Service status |

## Quick Commands

### Service Management
```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down

# Restart search aggregator
docker-compose restart search_aggregator

# View logs
docker-compose logs -f search_aggregator

# Check status
docker-compose ps
```

### Manual Scraping
```bash
# Trigger scrape via API
curl -X POST http://localhost:3001/api/scrape/trigger

# Run scraper directly
docker-compose exec search_aggregator npm run scrape:once

# Watch scraping progress
docker-compose logs -f search_aggregator
```

### Database Queries
```bash
# Count listings
docker-compose exec mongodb mongosh LibreChat --eval "db.listings.countDocuments()"

# View recent listings
docker-compose exec mongodb mongosh LibreChat --eval "db.listings.find().sort({scrapedAt:-1}).limit(5).pretty()"

# Clear all listings (careful!)
docker-compose exec mongodb mongosh LibreChat --eval "db.listings.deleteMany({})"
```

### API Testing
```bash
# Get stats
curl http://localhost:3001/api/listings/stats | jq

# Search furniture under $500
curl "http://localhost:3001/api/listings/search?category=furniture&maxPrice=500" | jq

# Get categories
curl http://localhost:3001/api/listings/categories | jq

# Search by location
curl "http://localhost:3001/api/listings/search?location=New%20York&limit=10" | jq
```

## Example Conversations with LibreChat

### Simple Searches
```
You: "Find me furniture in New York"
You: "Show me cheap motorcycles"
You: "What apartments are available?"
```

### Filtered Searches
```
You: "Find furniture under $300 in Los Angeles"
You: "Show me motorcycles between $2000 and $5000"
You: "List apartments in Chicago under $1500/month"
```

### Information Queries
```
You: "What marketplace data do you have?"
You: "How many listings are there?"
You: "When was the last update?"
```

## Configuration Files

### Main Config: `.env`
```bash
SEARCH_AGGREGATOR_URL=http://search_aggregator:3001
SEARCH_LOCATIONS=New York,Los Angeles,Chicago
SEARCH_CATEGORIES=furniture,apartments,motorcycles,autos
CRON_SCHEDULE=0 6 * * *
```

### Service Config: `search-aggregator/.env`
```bash
MONGO_URI=mongodb://mongodb:27017/LibreChat
PORT=3001
MAX_RESULTS_PER_SEARCH=50
ENABLE_CRAIGSLIST=true
ENABLE_FACEBOOK=false
ENABLE_OFFERUP=false
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Service won't start | `docker-compose logs search_aggregator` |
| No listings found | `curl -X POST http://localhost:3001/api/scrape/trigger` |
| Tool not working in LibreChat | Verify `SEARCH_AGGREGATOR_URL` in .env, restart API |
| Scraper failing | Check logs, platforms may have changed, disable problematic scrapers |
| Database errors | Ensure MongoDB is running: `docker-compose ps mongodb` |
| Port 3001 in use | Change PORT in docker-compose.yml |

## Cron Schedule Examples

| Schedule | Description |
|----------|-------------|
| `0 6 * * *` | Daily at 6 AM (default) |
| `0 */4 * * *` | Every 4 hours |
| `0 8,20 * * *` | 8 AM and 8 PM |
| `0 0 * * 1` | Every Monday midnight |
| `*/15 * * * *` | Every 15 minutes (testing) |

## Platform Status

| Platform | Status | Reliability | Notes |
|----------|--------|-------------|-------|
| **Craigslist** | ✅ Working | High | Recommended for production |
| **Facebook** | ⚠️ Limited | Low | Requires auth, anti-bot measures |
| **OfferUp** | ⚠️ Limited | Low | Heavy JS rendering |

## Important Notes

⚠️ **Legal Compliance**: Always check platform Terms of Service before scraping

⚠️ **Rate Limiting**: Be respectful, add delays between requests

⚠️ **Production Use**: Consider official APIs for reliable data access

✅ **Best Practice**: Use Craigslist only for testing and proof-of-concept

## Documentation

| Document | Description |
|----------|-------------|
| `DEPLOYMENT_GUIDE.md` | Detailed deployment steps |
| `search-aggregator/README.md` | Service documentation |
| `SEARCH_AGGREGATOR_SUMMARY.md` | Technical overview |
| This file | Quick reference |

## Getting Help

1. Check logs: `docker-compose logs search_aggregator`
2. Run tests: `bash test-integration.sh`
3. Review documentation in the files above
4. Check GitHub issues

## Quick Verification Checklist

- [ ] Docker services running: `docker-compose ps`
- [ ] Search service healthy: `curl http://localhost:3001/health`
- [ ] MongoDB connected: `docker-compose logs mongodb`
- [ ] API accessible from LibreChat: `docker-compose exec api curl http://search_aggregator:3001/health`
- [ ] Listings in database: `curl http://localhost:3001/api/listings/stats`
- [ ] LibreChat accessible: `curl http://localhost:3080`
- [ ] Tool available in LibreChat: Ask "Find furniture in New York"

## Next Steps

1. ✅ Installation complete
2. ✅ Services running
3. ✅ Initial scrape done
4. 🎯 **Try it out**: Open http://localhost:3080 and ask about marketplace listings!
5. 📊 Monitor: Keep an eye on logs and adjust configuration
6. 🔧 Customize: Adjust locations, categories, and schedule to your needs

---

**Need more details?** See `DEPLOYMENT_GUIDE.md` or `SEARCH_AGGREGATOR_SUMMARY.md`
