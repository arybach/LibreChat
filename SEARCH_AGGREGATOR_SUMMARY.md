# Search Aggregator Project Summary

## Overview

A complete marketplace search aggregation system integrated with LibreChat that enables AI-powered conversational access to listings from Facebook Marketplace, Craigslist, OfferUp, and other platforms.

## Project Structure

```
LibreChat/
├── search-aggregator/              # New microservice
│   ├── server.js                   # Express server with cron scheduling
│   ├── package.json                # Dependencies
│   ├── Dockerfile                  # Container definition
│   ├── .env.example                # Configuration template
│   ├── README.md                   # Detailed documentation
│   ├── models/
│   │   └── Listing.js              # MongoDB schema
│   ├── controllers/
│   │   └── listingsController.js  # API endpoints
│   └── scrapers/
│       ├── index.js                # Orchestrator
│       ├── runOnce.js              # Manual execution
│       ├── craigslistScraper.js    # Craigslist implementation
│       ├── facebookScraper.js      # Facebook implementation
│       └── offerupScraper.js       # OfferUp implementation
│
├── api/
│   ├── models/
│   │   └── Listing.js              # Shared MongoDB model
│   └── app/clients/tools/
│       ├── marketplace.js          # LangChain tools
│       ├── structured/
│       │   └── Marketplace.js      # Toolkit wrapper
│       ├── index.js                # Tool registration
│       └── manifest.json           # Tool metadata
│
├── docker-compose.yml              # Updated with search_aggregator service
├── DEPLOYMENT_GUIDE.md             # Step-by-step deployment
├── setup-search-aggregator.sh      # Automated setup script
└── test-integration.sh             # Testing script
```

## Components

### 1. Search Aggregator Service (Node.js + Express)

**Purpose**: Autonomous microservice that scrapes marketplace listings and stores them in MongoDB

**Features**:
- Scheduled scraping via cron (default: daily at 6 AM)
- REST API for querying listings
- Support for multiple platforms and categories
- Automatic deduplication based on URL
- Configurable via environment variables

**Tech Stack**:
- Express.js for HTTP server
- node-cron for scheduling
- Cheerio for HTML parsing (Craigslist)
- Puppeteer for JavaScript-heavy sites (Facebook, OfferUp)
- Mongoose for MongoDB ODM
- Axios for HTTP requests

### 2. MongoDB Database Schema

**Listing Model**:
```javascript
{
  title: String,           // Required, indexed
  description: String,
  platform: String,        // 'facebook', 'craigslist', 'offerup', etc.
  category: String,        // 'furniture', 'apartments', 'motorcycles', 'autos'
  price: Number,
  currency: String,        // Default: 'USD'
  location: String,        // Text location, indexed
  coordinates: { lat, lng },
  url: String,            // Unique index
  imageUrls: [String],
  contactInfo: { name, phone, email },
  postedAt: Date,
  scrapedAt: Date,        // Indexed
  isActive: Boolean,      // Indexed
  metadata: Mixed
}
```

**Indexes**:
- Compound: `{ platform, category, isActive, scrapedAt }`
- Compound: `{ category, price, isActive }`
- Compound: `{ location, category, isActive }`

### 3. LibreChat Integration (LangChain Tools)

**Three Custom Tools**:

1. **marketplace_search**: Primary search tool
   - Filters: category, location, price range, keywords
   - Returns formatted listing results
   - Pagination support

2. **marketplace_stats**: Database statistics
   - Total listings count
   - Recent additions (24h)
   - Last update timestamp

3. **marketplace_categories**: Available data
   - Categories with counts and avg prices
   - Platforms with listing counts

**Tool Registration**:
- Added to `manifest.json` with metadata
- Exported from structured tools
- Automatically available to AI agents

### 4. Scrapers

**Craigslist Scraper** (Most Reliable):
- Uses HTTP requests + Cheerio
- Location mapping for regional sites
- Category mapping (furniture → fua, etc.)
- Respects rate limits with delays

**Facebook Scraper** (Experimental):
- Uses Puppeteer for JavaScript rendering
- Anti-bot measures make it challenging
- Consider Facebook Graph API for production
- Currently returns proof-of-concept data

**OfferUp Scraper** (Experimental):
- Heavy JavaScript rendering required
- Limited without official API
- Placeholder implementation provided

### 5. Docker Configuration

**New Service**:
```yaml
search_aggregator:
  container_name: search_aggregator
  build: ./search-aggregator
  ports: ["3001:3001"]
  environment:
    - MONGO_URI=mongodb://mongodb:27017/LibreChat
    - SEARCH_LOCATIONS=New York,Los Angeles,Chicago
    - CRON_SCHEDULE=0 6 * * *
  depends_on: [mongodb]
```

**LibreChat API Updated**:
- Added `SEARCH_AGGREGATOR_URL` environment variable
- Network connectivity to search_aggregator service

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/api/listings/search` | Search listings with filters |
| GET | `/api/listings/categories` | Get available categories & platforms |
| GET | `/api/listings/stats` | Database statistics |
| POST | `/api/scrape/trigger` | Manually trigger scraping |

## Configuration

### Environment Variables

**Search Aggregator** (`.env`):
```bash
MONGO_URI=mongodb://mongodb:27017/LibreChat
PORT=3001
SEARCH_LOCATIONS=New York,Los Angeles,Chicago
SEARCH_CATEGORIES=furniture,apartments,motorcycles,autos
CRON_SCHEDULE=0 6 * * *
MAX_RESULTS_PER_SEARCH=50
ENABLE_FACEBOOK=false
ENABLE_CRAIGSLIST=true
ENABLE_OFFERUP=false
```

**LibreChat** (main `.env`):
```bash
SEARCH_AGGREGATOR_URL=http://search_aggregator:3001
```

## Deployment Process

### Quick Start
```bash
# 1. Run automated setup
bash setup-search-aggregator.sh

# 2. Test integration
bash test-integration.sh

# 3. Access LibreChat
open http://localhost:3080
```

### Manual Deployment
```bash
# 1. Configure
cp search-aggregator/.env.example search-aggregator/.env
echo "SEARCH_AGGREGATOR_URL=http://search_aggregator:3001" >> .env

# 2. Build and start
docker-compose build search_aggregator
docker-compose up -d

# 3. Initial scrape
curl -X POST http://localhost:3001/api/scrape/trigger

# 4. Verify
curl http://localhost:3001/health
curl http://localhost:3001/api/listings/stats
```

## Usage Examples

### Direct API Queries

```bash
# Search furniture under $500 in NY
curl "http://localhost:3001/api/listings/search?category=furniture&location=New%20York&maxPrice=500"

# Get categories
curl "http://localhost:3001/api/listings/search?category=furniture&location=New%20York&maxPrice=500"

# Get statistics
curl "http://localhost:3001/api/listings/stats"
```

### AI Agent Conversations

**User**: "Find me cheap furniture in New York under $200"

**AI Response**:
```
Found 15 listings (showing 10):

1. Vintage Wooden Chair
   Platform: craigslist
   Price: $50
   Location: Brooklyn, NY
   URL: https://newyork.craigslist.org/...
   Posted: 2025-12-01

2. IKEA Bookshelf - Good Condition
   Platform: craigslist
   Price: $75
   Location: Manhattan, NY
   ...
```

**User**: "What about motorcycles in Los Angeles?"

**AI**: Uses marketplace_search with category=motorcycles, location=Los Angeles

## Technical Decisions

### Why Microservice Architecture?
- **Isolation**: Scraping failures don't affect LibreChat
- **Scalability**: Can scale scraper independently
- **Maintenance**: Update scrapers without touching LibreChat
- **Resource Management**: Separate resource limits

### Why MongoDB?
- Already used by LibreChat
- Flexible schema for varied listing data
- Good indexing for search queries
- No additional infrastructure needed

### Why LangChain Tools?
- Native LibreChat integration
- Automatic schema validation (Zod)
- Standardized tool interface
- AI can reason about when to use tools

### Why Cron over Queue?
- Simpler for scheduled tasks
- No additional infrastructure (Redis, RabbitMQ)
- Sufficient for daily scraping
- Can upgrade to queue system if needed

## Limitations & Considerations

### Legal & Ethical
- ⚠️ Web scraping may violate Terms of Service
- Check each platform's robots.txt
- Respect rate limits
- Consider official APIs for production

### Technical Challenges
- **Facebook**: Strong anti-bot measures, requires authentication
- **OfferUp**: JavaScript rendering, limited without API
- **Rate Limiting**: Aggressive scraping may get IP banned
- **Site Changes**: Scrapers break when sites update HTML structure

### Performance
- Scraping can be slow (5-10 minutes for all platforms)
- Large result sets consume memory
- MongoDB storage grows over time (implement cleanup)
- Puppeteer is resource-intensive

## Production Recommendations

1. **Use Official APIs**:
   - Facebook Graph API
   - eBay Finding API
   - Zillow for real estate

2. **Add Infrastructure**:
   - Redis for caching
   - Job queue (Bull, BullMQ)
   - Proxy rotation
   - Rate limiting

3. **Monitoring**:
   - Logging (Winston, Bunyan)
   - Error tracking (Sentry)
   - Performance monitoring
   - Alerts for scraper failures

4. **Security**:
   - API authentication
   - Rate limiting
   - Input validation
   - Don't expose scraper service publicly

5. **Maintenance**:
   - Regular scraper updates
   - Database cleanup jobs
   - Monitor for site changes
   - Backup strategy

## Future Enhancements

- [ ] More platforms (Mercari, Letgo, Nextdoor)
- [ ] Image recognition for categorization
- [ ] Price tracking and alerts
- [ ] Geolocation-based search
- [ ] Email/SMS notifications
- [ ] Web dashboard
- [ ] GraphQL API
- [ ] Machine learning for spam detection
- [ ] Duplicate detection
- [ ] Advanced filters (condition, brand, etc.)

## Testing

### Unit Tests
```bash
cd search-aggregator
npm test
```

### Integration Tests
```bash
bash test-integration.sh
```

### Manual Testing
```bash
# Test scraper
docker-compose exec search_aggregator npm run scrape:once

# Test API
curl http://localhost:3001/api/listings/search?limit=5

# Test LibreChat tool
# Open LibreChat and ask: "Find furniture in New York"
```

## Troubleshooting

### Common Issues

1. **Service won't start**: Check MongoDB is running
2. **No listings**: Run manual scrape, check logs
3. **LibreChat can't find tool**: Verify SEARCH_AGGREGATOR_URL
4. **Scraper fails**: Sites may have changed HTML structure
5. **429 errors**: Being rate limited, increase delays

### Debug Commands
```bash
# Logs
docker-compose logs -f search_aggregator

# Container status
docker-compose ps

# Database check
docker-compose exec mongodb mongosh LibreChat --eval "db.listings.countDocuments()"

# Network test
docker-compose exec api curl http://search_aggregator:3001/health
```

## Documentation Files

- `search-aggregator/README.md` - Service documentation
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- `setup-search-aggregator.sh` - Automated setup
- `test-integration.sh` - Testing script
- This file - Project summary

## License & Credits

Built as an extension to [LibreChat](https://github.com/danny-avila/LibreChat)

MIT License - Use responsibly and ensure compliance with platform Terms of Service.

---

**Status**: ✅ Complete and ready for localhost deployment

**Next Steps**: 
1. Run `bash setup-search-aggregator.sh`
2. Test with `bash test-integration.sh`
3. Open LibreChat and try marketplace queries
4. Monitor logs and adjust configuration as needed
