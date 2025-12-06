const axios = require('axios');
const cheerio = require('cheerio');
const Listing = require('../models/Listing');

/**
 * Walmart Marketplace scraper
 * Uses Walmart's public search API
 */

const WALMART_API_BASE = 'https://www.walmart.com/search';

// Category mapping for Walmart
const categoryMap = {
  'furniture': 'furniture',
  'autos': 'auto-parts-accessories',
  'motorcycles': 'motorcycle-parts-accessories',
  'apartments': null, // Walmart doesn't sell apartments
  'other': 'all',
};

async function scrapeWalmart(locations, categories) {
  console.log('🔍 Scraping Walmart Marketplace...');
  let totalListings = 0;

  for (const category of categories) {
    const walmartCategory = categoryMap[category.trim()];
    if (!walmartCategory) {
      console.log(`⚠️  Skipping category: ${category} (not applicable for Walmart)`);
      continue;
    }

    try {
      // Walmart search URL
      const url = `${WALMART_API_BASE}?q=${encodeURIComponent(walmartCategory)}&sort=price_low`;
      
      console.log(`🔍 Scraping Walmart: ${category}`);
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

      // Walmart uses data-item-id for products
      $('[data-item-id]').each((i, elem) => {
        try {
          const $elem = $(elem);
          const title = $elem.find('[data-automation-id="product-title"]').text().trim();
          const priceText = $elem.find('[data-automation-id="product-price"]').text().trim();
          const link = $elem.find('a').first().attr('href');
          const imageUrl = $elem.find('img').first().attr('src');

          if (!title || !link) return;

          // Parse price
          const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

          const listing = {
            title,
            description: `Walmart ${category}`,
            platform: 'walmart',
            category: category.trim(),
            price,
            currency: 'USD',
            location: 'Online (Walmart)',
            url: link.startsWith('http') ? link : `https://www.walmart.com${link}`,
            imageUrls: imageUrl ? [imageUrl] : [],
            postedAt: new Date(),
            scrapedAt: new Date(),
            isActive: true,
          };

          listings.push(listing);
        } catch (err) {
          console.error('Error parsing Walmart listing:', err.message);
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
          console.error('Error saving Walmart listing:', err.message);
        }
      }

      console.log(`   Found ${listings.length} listings`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Walmart scrape failed for ${category}:`, error.message);
    }
  }

  return totalListings;
}

module.exports = {
  scrape: scrapeWalmart,
};
