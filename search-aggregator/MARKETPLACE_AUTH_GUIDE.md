# Marketplace Authentication Guide

## Overview

To enable authenticated scraping of Facebook Marketplace and OfferUp, you need to provide your browser cookies. This allows the scrapers to access listings as if they were logged in.

## How to Export Your Cookies

### Method 1: Using EditThisCookie (Chrome/Edge)
1. Install the [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/) extension
2. Log in to Facebook.com or OfferUp.com
3. Click the EditThisCookie icon
4. Click "Export" (clipboard icon)
5. Save the exported JSON to a file

### Method 2: Using Cookie-Editor (Firefox/Chrome)
1. Install [Cookie-Editor](https://cookie-editor.cgagnier.ca/)
2. Log in to the marketplace site
3. Click the extension icon
4. Click "Export" → "JSON"
5. Save the exported JSON

## Configuration

### Option 1: Environment File (Recommended for Docker)

Create cookie files:
```bash
# Create directory for marketplace cookies
mkdir -p /projects/LibreChat/marketplace-cookies

# Save your exported Facebook cookies
cat > /projects/LibreChat/marketplace-cookies/facebook.json << 'EOF'
[paste your Facebook cookies JSON here]
EOF

# Save your exported OfferUp cookies
cat > /projects/LibreChat/marketplace-cookies/offerup.json << 'EOF'
[paste your OfferUp cookies JSON here]
EOF
```

Update `.env`:
```bash
# Marketplace Authentication
FACEBOOK_COOKIES_FILE=/app/marketplace-cookies/facebook.json
OFFERUP_COOKIES_FILE=/app/marketplace-cookies/offerup.json
```

### Option 2: Direct Environment Variables

Alternatively, set cookies directly in `.env` (not recommended for long cookie strings):
```bash
FACEBOOK_COOKIES='[{"name":"cookie1","value":"val1"}...]'
OFFERUP_COOKIES='[{"name":"cookie1","value":"val1"}...]'
```

## Docker Compose Volume Mount

Add this to your `docker-compose.yml` under the `search_aggregator` service:

```yaml
search_aggregator:
  volumes:
    - ./marketplace-cookies:/app/marketplace-cookies:ro
  environment:
    - FACEBOOK_COOKIES_FILE=/app/marketplace-cookies/facebook.json
    - OFFERUP_COOKIES_FILE=/app/marketplace-cookies/offerup.json
```

## Security Notes

- **Never commit cookie files to git** - add `marketplace-cookies/` to `.gitignore`
- Cookies contain your session tokens - treat them like passwords
- Cookies typically expire after 30-90 days
- Use read-only (`:ro`) volume mount for added security

## Testing

After configuration, test the scrapers:

```bash
# Trigger a scrape
docker-compose exec search_aggregator curl -X POST http://localhost:3001/api/scrape/trigger

# Check logs
docker-compose logs search_aggregator
```

## Troubleshooting

**"Authentication failed" errors:**
- Your cookies may have expired - export fresh cookies
- Ensure JSON format is valid
- Check that cookie files are readable by the container

**"Access denied" from marketplace:**
- The platform may have detected automated access
- Try using cookies from a browser that's regularly used
- Add delays between requests (configure `SCRAPE_RATE_LIMIT_MS`)
