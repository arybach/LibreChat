const cheerio = require('cheerio');
const Listing = require('../models/Listing');
const scraperService = require('../utils/scraperService');

/**
 * Wayfair scraper - Online furniture retailer
 * One of the largest furniture e-commerce sites
 */

const WAYFAIR_BASE_URL = 'https://www.wayfair.com';

const categoryMap = {
  'furniture': 'furniture',
  'autos': null,
  'motorcycles': null,
  'apartments': null,
  'other': 'all-products',
};

async function scrapeWayfair(locations, categories) {
  console.log('🔍 Scraping Wayfair...');
  let totalListings = 0;

  for (const category of categories) {
    const wayfairCategory = categoryMap[category.trim()];
    if (!wayfairCategory) {
      console.log(`⚠️  Skipping category: ${category} (not applicable for Wayfair)`);
      continue;
    }

    try {
      const url = `${WAYFAIR_BASE_URL}/keyword.php?keyword=${encodeURIComponent(wayfairCategory)}&command=dosearch&new_keyword_search=true`;
      
      console.log(`🔍 Scraping Wayfair: ${category}`);

      const response = await scraperService.fetch(url, { timeout: 15000 });

      const $ = cheerio.load(response.data);
      const listings = [];

      $('[data-enzyme-id="ProductCard"], .ProductCard').each((i, elem) => {
        try {
          const $elem = $(elem);
          const title = $elem.find('.ProductCard__name, [data-enzyme-id="ProductCardName"]').text().trim();
          const priceText = $elem.find('.ProductCard__price, [data-enzyme-id="ProductCardPrice"]').text().trim();
          const link = $elem.find('a').first().attr('href');
          const imageUrl = $elem.find('img').first().attr('src');

          if (!title || !link) return;

          const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

          const listing = {
            title,
            description: `Wayfair ${category}`,
            platform: 'wayfair',
            category: category.trim(),
            price,
            currency: 'USD',
            location: 'Online (Wayfair)',
            url: link.startsWith('http') ? link : `${WAYFAIR_BASE_URL}${link}`,
            imageUrls: imageUrl ? [imageUrl] : [],
            postedAt: new Date(),
            scrapedAt: new Date(),
            isActive: true,
          };

          listings.push(listing);
        } catch (err) {
          console.error('Error parsing Wayfair listing:', err.message);
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
          console.error('Error saving Wayfair listing:', err.message);
        }
      }

      console.log(`   Found ${listings.length} listings`);
      await scraperService.delay(2000);

    } catch (error) {
      console.error(`❌ Wayfair scrape failed for ${category}:`, error.message);
    }
  }

  return totalListings;
}

module.exports = {
  scrape: scrapeWayfair,
};
