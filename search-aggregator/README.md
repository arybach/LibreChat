# Search Aggregator for LibreChat

A powerful search aggregation service that scrapes and indexes listings from multiple platforms including Facebook Marketplace, Craigslist, and OfferUp. Integrated with LibreChat to provide AI-powered conversational access to marketplace listings.

## Features

- 🔍 **Multi-Platform Scraping**: Aggregates listings from:
  - Craigslist
  - Facebook Marketplace
  - OfferUp
  - Easy to extend for additional platforms

- 📅 **Scheduled Scraping**: Automatic daily updates using cron jobs
- 🗄️ **MongoDB Storage**: Persistent storage with efficient indexing
- 🔌 **REST API**: Clean API for querying listings
- 🤖 **LibreChat Integration**: Natural language interface through AI agents
- 📊 **Categories Supported**:
  - Furniture
  - Apartments for rent
  - Motorcycles
  - Automobiles
  - Extensible for more categories

## Architecture

```
┌─────────────────┐
│   LibreChat     │
│   (AI Agent)    │
└────────┬────────┘
         │
         │ Marketplace Tool
         │
┌────────▼────────┐      ┌──────────────┐
│    Search       │◄────►│   MongoDB    │
│   Aggregator    │      └──────────────┘
└────────┬────────┘
         │
         │ Scrapers
         │
    ┌────┴─────┬─────────┬──────────┐
    │          │         │          │
┌───▼──┐  ┌───▼───┐ ┌───▼────┐ ┌───▼────┐
│ CL   │  │  FB   │ │ OfferUp│ │ Other  │
└──────┘  └───────┘ └────────┘ └────────┘
```

## Installation

### Standalone Setup

1. Install dependencies:
```bash
cd search-aggregator
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Run the service:
```bash
npm start
```

### Docker Setup (Recommended)

The service is integrated into the main LibreChat docker-compose configuration:

```bash
# From the LibreChat root directory
docker-compose up -d
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://mongodb:27017/LibreChat` |
| `PORT` | Service port | `3001` |
| `SEARCH_LOCATIONS` | Comma-separated list of locations | `New York,Los Angeles,Chicago` |
| `SEARCH_CATEGORIES` | Categories to scrape | `furniture,apartments,motorcycles,autos` |
| `CRON_SCHEDULE` | Cron expression for scheduled scraping | `0 6 * * *` (6 AM daily) |
| `MAX_RESULTS_PER_SEARCH` | Max results per search query | `50` |
| `ENABLE_FACEBOOK` | Enable Facebook Marketplace scraping | `true` |
| `ENABLE_CRAIGSLIST` | Enable Craigslist scraping | `true` |
| `ENABLE_OFFERUP` | Enable OfferUp scraping | `true` |

### Cron Schedule Examples

- `0 6 * * *` - Every day at 6 AM
- `0 */4 * * *` - Every 4 hours
- `0 0 * * 0` - Every Sunday at midnight
- `*/30 * * * *` - Every 30 minutes

## API Endpoints

### Search Listings
```http
GET /api/listings/search
```

**Query Parameters:**
- `category` - Filter by category (furniture, apartments, motorcycles, autos)
- `platform` - Filter by platform (facebook, craigslist, offerup)
- `location` - Filter by location (regex search)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `search` - Keyword search (searches title and description)
- `limit` - Number of results (default: 50)
- `skip` - Pagination offset
- `sortBy` - Sort field (default: scrapedAt)
- `sortOrder` - Sort direction: asc or desc (default: desc)

**Example:**
```bash
curl "http://localhost:3001/api/listings/search?category=furniture&maxPrice=500&location=new york&limit=10"
```

### Get Categories
```http
GET /api/listings/categories
```

Returns available categories and platforms with listing counts.

### Get Statistics
```http
GET /api/listings/stats
```

Returns database statistics including total listings and last update time.

### Manual Scrape Trigger
```http
POST /api/scrape/trigger
```

Manually trigger a scraping job (useful for testing).

### Health Check
```http
GET /health
```

Service health status.

## LibreChat Integration

The search aggregator is integrated into LibreChat as a custom tool. Users can interact with marketplace listings using natural language:

**Example Conversations:**

> **User:** "Find me cheap furniture in New York under $200"
> 
> **AI:** *Uses marketplace_search tool with parameters:*
> - category: furniture
> - location: New York
> - maxPrice: 200
> 
> *Returns formatted listings with titles, prices, and URLs*

> **User:** "Show me motorcycles for sale in Los Angeles"
> 
> **AI:** *Searches motorcycles category in LA and presents results*

> **User:** "What listings do you have available?"
> 
> **AI:** *Uses marketplace_categories tool to show all available categories and platforms*

### Tool Usage

The marketplace tool is automatically available to AI agents in LibreChat. No additional configuration needed once the service is running.

**Available Tools:**
1. `marketplace_search` - Search listings with filters
2. `marketplace_stats` - Get database statistics
3. `marketplace_categories` - List available categories and platforms

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start in development mode with auto-reload
npm run dev

# Run a one-time scrape
npm run scrape:once
```

### Testing Scrapers

Each scraper can be tested individually:

```javascript
const { craigslistScraper } = require('./scrapers');

// Test Craigslist scraper
craigslistScraper.scrape(['newyork'], ['furniture'])
  .then(count => console.log(`Scraped ${count} listings`))
  .catch(err => console.error(err));
```

### Adding New Platforms

To add a new marketplace platform:

1. Create a new scraper file in `scrapers/`:
```javascript
// scrapers/newPlatformScraper.js
async function scrape(locations, categories) {
  // Implement scraping logic
  // Return count of listings scraped
}

module.exports = { scrape };
```

2. Register it in `scrapers/index.js`:
```javascript
const newPlatformScraper = require('./newPlatformScraper');

// Add to runAllScrapers function
```

3. Update the Listing model enum if needed:
```javascript
platform: {
  enum: ['facebook', 'craigslist', 'offerup', 'newplatform', 'other']
}
```

## Database Schema

### Listing Model

```javascript
{
  title: String,              // Listing title
  description: String,        // Full description
  platform: String,           // Source platform
  category: String,           // Item category
  price: Number,              // Price in local currency
  currency: String,           // Currency code (default: USD)
  location: String,           // Location text
  coordinates: {              // Optional coordinates
    lat: Number,
    lng: Number
  },
  url: String,                // Direct link to listing
  imageUrls: [String],        // Array of image URLs
  contactInfo: {              // Optional contact details
    name: String,
    phone: String,
    email: String
  },
  postedAt: Date,             // When originally posted
  scrapedAt: Date,            // When we scraped it
  isActive: Boolean,          // Active status
  metadata: Mixed             // Platform-specific data
}
```

### Indexes

Optimized indexes for common queries:
- `{ platform, category, isActive, scrapedAt }`
- `{ category, price, isActive }`
- `{ location, category, isActive }`

## Important Notes

### Legal & Ethical Considerations

⚠️ **Web Scraping Disclaimer:**
- Always review and comply with each platform's Terms of Service
- Respect robots.txt files
- Implement rate limiting to avoid overwhelming servers
- Facebook and OfferUp actively block scrapers - consider using official APIs
- Use scrapers responsibly for personal/educational purposes

### Platform-Specific Challenges

**Facebook Marketplace:**
- Requires authentication for most data
- Strong anti-bot measures
- Consider using Facebook Graph API for production use
- Current implementation is a proof of concept

**Craigslist:**
- Generally more scraper-friendly
- Respect their rate limits
- Regional site structure requires location mapping

**OfferUp:**
- Heavy JavaScript rendering
- May require Puppeteer or Selenium
- Limited without official API access

## Troubleshooting

### Service Won't Start

```bash
# Check MongoDB connection
docker-compose logs mongodb

# Check search aggregator logs
docker-compose logs search_aggregator
```

### No Listings Found

```bash
# Manually trigger a scrape
curl -X POST http://localhost:3001/api/scrape/trigger

# Check scrape results
curl http://localhost:3001/api/listings/stats
```

### LibreChat Can't Access Tool

1. Verify search_aggregator service is running:
```bash
docker-compose ps
```

2. Check environment variable in api service:
```bash
docker-compose exec api env | grep SEARCH_AGGREGATOR_URL
```

3. Test connectivity from api container:
```bash
docker-compose exec api wget -O- http://search_aggregator:3001/health
```

## Future Enhancements

- [ ] Add more marketplace platforms (LetGo, Mercari, etc.)
- [ ] Implement image recognition for better categorization
- [ ] Add price tracking and alerts
- [ ] Geolocation-based search
- [ ] Email notifications for new matching listings
- [ ] Advanced filtering (condition, brand, etc.)
- [ ] Machine learning for spam/duplicate detection
- [ ] GraphQL API
- [ ] Web dashboard for management
- [ ] Rate limiting and caching improvements

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check LibreChat documentation
- Review scraper logs for debugging

---

**Note:** This tool is for educational purposes. Always ensure compliance with platform Terms of Service and local regulations when scraping web data.
