const axios = require('axios');
const cheerio = require('cheerio');
const Listing = require('../models/Listing');

/**
 * Overstock scraper - Discount furniture and home goods
 */

const OVERSTOCK_BASE_URL = 'https://www.overstock.com';

const categoryMap = {
  'furniture': 'furniture',
  'autos': null,
  'motorcycles': null,
  'apartments': null,
  'other': 'home-garden',
};

async function scrapeOverstock(locations, categories) {
  console.log('🔍 Scraping Overstock...');
  let totalListings = 0;

  for (const category of categories) {
    const overstockCategory = categoryMap[category.trim()];
    if (!overstockCategory) {
      console.log(`⚠️  Skipping category: ${category} (not applicable for Overstock)`);
      continue;
    }

    try {
      const url = `${OVERSTOCK_BASE_URL}/search?keywords=${encodeURIComponent(overstockCategory)}`;
      
      console.log(`🔍 Scraping Overstock: ${category}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const listings = [];

      $('.product-card, [data-cy="product-card"]').each((i, elem) => {
        try {
          const $elem = $(elem);
          const title = $elem.find('.product-name, [data-cy="product-name"]').text().trim();
          const priceText = $elem.find('.product-price, [data-cy="product-price"]').text().trim();
          const link = $elem.find('a').first().attr('href');
          const imageUrl = $elem.find('img').first().attr('src');

          if (!title || !link) return;

          const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

          const listing = {
            title,
            description: `Overstock ${category}`,
            platform: 'overstock',
            category: category.trim(),
            price,
            currency: 'USD',
            location: 'Online (Overstock)',
            url: link.startsWith('http') ? link : `${OVERSTOCK_BASE_URL}${link}`,
            imageUrls: imageUrl ? [imageUrl] : [],
            postedAt: new Date(),
            scrapedAt: new Date(),
            isActive: true,
          };

          listings.push(listing);
        } catch (err) {
          console.error('Error parsing Overstock listing:', err.message);
        }
      });

      for (const listing of listings) {
        try {
          await Listing.findOneAndUpdate(
            { url: listing.url },
            listing,
            { upsert: true, new: true }
          );
          totalListings++;
        } catch (err) {
          console.error('Error saving Overstock listing:', err.message);
        }
      }

      console.log(`   Found ${listings.length} listings`);
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Overstock scrape failed for ${category}:`, error.message);
    }
  }

  return totalListings;
}

module.exports = {
  scrape: scrapeOverstock,
};
