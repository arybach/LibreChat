const axios = require('axios');
const cheerio = require('cheerio');
const Listing = require('../models/Listing');

/**
 * IKEA scraper - Product search
 * Scrapes IKEA's online store for furniture deals
 */

const IKEA_BASE_URL = 'https://www.ikea.com/us/en';

// IKEA room/category mapping
const categoryMap = {
  'furniture': 'furniture',
  'autos': null,
  'motorcycles': null,
  'apartments': null,
  'other': 'all-products',
};

// IKEA stores by location (for in-store pickup info)
const locationStores = {
  'New York': 'New York Metro',
  'Los Angeles': 'Los Angeles',
  'Chicago': 'Chicago',
  'Miami': 'Miami',
  'San Francisco': 'San Francisco Bay Area',
  'Austin': 'Austin',
};

async function scrapeIKEA(locations, categories) {
  console.log('🔍 Scraping IKEA...');
  let totalListings = 0;

  for (const category of categories) {
    const ikeaCategory = categoryMap[category.trim()];
    if (!ikeaCategory) {
      console.log(`⚠️  Skipping category: ${category} (not applicable for IKEA)`);
      continue;
    }

    try {
      // IKEA search/category URL
      const url = `${IKEA_BASE_URL}/search/?q=${encodeURIComponent(ikeaCategory)}`;
      
      console.log(`🔍 Scraping IKEA: ${category}`);
      console.log(`   URL: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const listings = [];

      // IKEA product cards
      $('.plp-product-list__products .plp-fragment-wrapper, [data-testid="plp-product-card"]').each((i, elem) => {
        try {
          const $elem = $(elem);
          const title = $elem.find('.plp-price-module__product-name, [data-testid="plp-product-card__title"]').text().trim();
          const priceText = $elem.find('.plp-price__integer, [data-testid="plp-product-card__price"]').text().trim();
          const link = $elem.find('a').first().attr('href');
          const imageUrl = $elem.find('img').first().attr('src');

          if (!title || !link) return;

          // Parse price
          const priceMatch = priceText.match(/\$?([\d,]+)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

          const listing = {
            title,
            description: `IKEA ${category}`,
            platform: 'ikea',
            category: category.trim(),
            price,
            currency: 'USD',
            location: 'Online (IKEA) - Available at multiple stores',
            url: link.startsWith('http') ? link : `${IKEA_BASE_URL}${link}`,
            imageUrls: imageUrl ? [imageUrl] : [],
            postedAt: new Date(),
            scrapedAt: new Date(),
            isActive: true,
          };

          listings.push(listing);
        } catch (err) {
          console.error('Error parsing IKEA listing:', err.message);
        }
      });

      // Save to database
      for (const listing of listings) {
        try {
          await Listing.findOneAndUpdate(
            { url: listing.url },
            listing,
            { upsert: true, new: true }
          );
          totalListings++;
        } catch (err) {
          console.error('Error saving IKEA listing:', err.message);
        }
      }

      console.log(`   Found ${listings.length} listings`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ IKEA scrape failed for ${category}:`, error.message);
    }
  }

  return totalListings;
}

module.exports = {
  scrape: scrapeIKEA,
};
