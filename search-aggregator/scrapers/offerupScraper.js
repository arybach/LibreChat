const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const Listing = require('../models/Listing');

/**
 * Load OfferUp cookies from file or environment variable
 */
async function loadOfferUpCookies() {
  try {
    // Try loading from file first
    if (process.env.OFFERUP_COOKIES_FILE) {
      const cookiesJson = await fs.readFile(process.env.OFFERUP_COOKIES_FILE, 'utf8');
      return JSON.parse(cookiesJson);
    }
    
    // Fall back to environment variable
    if (process.env.OFFERUP_COOKIES) {
      return JSON.parse(process.env.OFFERUP_COOKIES);
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️  Failed to load OfferUp cookies:', error.message);
    return null;
  }
}

/**
 * Scrape OfferUp listings
 * Supports authenticated sessions via cookies for better results
 */
async function scrape(locations, categories) {
  let totalCount = 0;
  const cookies = await loadOfferUpCookies();
  
  if (!cookies) {
    console.warn('⚠️  OfferUp scraping without authentication - results may be limited');
    console.warn('⚠️  See MARKETPLACE_AUTH_GUIDE.md for authentication setup');
  } else {
    console.log('✅ Using authenticated OfferUp session');
  }

  // OfferUp typically requires an API or mobile app approach
  // This is a placeholder showing the structure
  
  for (const location of locations) {
    for (const category of categories) {
      try {
        // OfferUp search URL structure (approximate)
        const searchUrl = `https://offerup.com/search/?q=${encodeURIComponent(category)}&location=${encodeURIComponent(location)}`;
        
        console.log(`  Attempting to scrape: ${searchUrl}`);
        
        // Build headers with cookies if available
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        };
        
        if (cookies && Array.isArray(cookies)) {
          // Convert cookie array to Cookie header string
          const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
          headers['Cookie'] = cookieString;
          console.log('  ✅ Using authenticated OfferUp session');
        }
        
        const response = await axios.get(searchUrl, {
          timeout: Number(process.env.SCRAPE_TIMEOUT_MS || 30000),
          headers,
        });

        const $ = cheerio.load(response.data);
        const listings = [];

        // OfferUp uses JavaScript rendering, so cheerio may not work well
        // This is a simplified example
        $('[data-testid="item-card"]').each((i, element) => {
          try {
            const $el = $(element);
            const title = $el.find('[data-testid="item-title"]').text().trim();
            const priceText = $el.find('[data-testid="item-price"]').text().trim();
            const price = priceText ? parseFloat(priceText.replace(/[$,]/g, '')) : 0;
            const href = $el.find('a').attr('href');
            const url = href?.startsWith('http') ? href : `https://offerup.com${href}`;
            const imageUrl = $el.find('img').attr('src');

            if (title && url) {
              listings.push({
                title,
                platform: 'offerup',
                category,
                price,
                location,
                url,
                imageUrls: imageUrl ? [imageUrl] : [],
                scrapedAt: new Date(),
                isActive: true,
              });
            }
          } catch (err) {
            console.error('Error parsing listing:', err.message);
          }
        });

        // Save to database
        for (const listing of listings) {
          try {
            await Listing.findOneAndUpdate(
              { url: listing.url },
              listing,
              { upsert: true, new: true },
            );
            totalCount++;
          } catch (err) {
            if (err.code !== 11000) {
              console.error('Error saving listing:', err.message);
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Error scraping ${category} in ${location}:`, error.message);
      }
    }
  }

  return totalCount;
}

module.exports = {
  scrape,
};
