const axios = require('axios');
const cheerio = require('cheerio');
const Listing = require('../models/Listing');

const categoryMap = {
  furniture: '3197', // Home & Garden > Furniture
  apartments: '10542', // Real Estate
  motorcycles: '6024', // eBay Motors > Motorcycles
  autos: '6001', // eBay Motors > Cars & Trucks
};

/**
 * Scrape eBay listings
 */
async function scrape(locations, categories) {
  let totalCount = 0;
  const maxResults = Number(process.env.MAX_RESULTS_PER_SEARCH || 50);

  for (const location of locations) {
    for (const category of categories) {
      const normalizedCategory = category.trim().toLowerCase();
      const ebayCategory = categoryMap[normalizedCategory];

      if (!ebayCategory) {
        console.warn(`⚠️  eBay: Unknown category: ${category}`);
        continue;
      }

      try {
        // eBay search URL with category and location
        const searchParams = new URLSearchParams({
          _nkw: category, // Search keyword
          _sacat: ebayCategory, // Category ID
          LH_ItemCondition: '3000', // Used condition (3000) - or use 1000 for new
          _sop: '10', // Sort by: newly listed
          _ipg: Math.min(maxResults, 200), // Items per page (max 200)
        });

        const url = `https://www.ebay.com/sch/i.html?${searchParams.toString()}`;
        console.log(`  eBay: Scraping ${category} in ${location}...`);

        const response = await axios.get(url, {
          timeout: Number(process.env.SCRAPE_TIMEOUT_MS || 30000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });

        const $ = cheerio.load(response.data);
        const listings = [];

        // eBay uses .s-item class for search results
        $('.s-item').slice(0, maxResults).each((i, element) => {
          try {
            const $el = $(element);
            
            // Skip sponsored or non-product items
            if ($el.hasClass('s-item--watch-at-corner') || $el.hasClass('s-item--ads')) {
              return;
            }

            const title = $el.find('.s-item__title').text().trim();
            const priceText = $el.find('.s-item__price').text().trim();
            const price = priceText ? parseFloat(priceText.replace(/[$,]/g, '').split(' ')[0]) : 0;
            const listingUrl = $el.find('.s-item__link').attr('href');
            const imageUrl = $el.find('.s-item__image-img').attr('src');
            const locationText = $el.find('.s-item__location').text().trim();
            const shippingText = $el.find('.s-item__shipping').text().trim();
            const conditionText = $el.find('.SECONDARY_INFO').text().trim();

            // Filter out ads and invalid items
            if (title && 
                listingUrl && 
                !title.toLowerCase().includes('shop on ebay') &&
                title !== 'New Listing') {
              
              listings.push({
                title,
                platform: 'ebay',
                category: normalizedCategory,
                price,
                location: locationText || location,
                url: listingUrl.split('?')[0], // Remove tracking params
                imageUrls: imageUrl ? [imageUrl] : [],
                description: `${conditionText ? conditionText + '. ' : ''}${shippingText}`,
                scrapedAt: new Date(),
                isActive: true,
              });
            }
          } catch (err) {
            console.error(`    ❌ eBay: Error parsing item:`, err.message);
          }
        });

        // Save listings to database
        if (listings.length > 0) {
          for (const listing of listings) {
            try {
              await Listing.findOneAndUpdate(
                { url: listing.url },
                listing,
                { upsert: true, new: true }
              );
            } catch (err) {
              console.error(`    ❌ eBay: Error saving listing:`, err.message);
            }
          }
          console.log(`    ✅ eBay: Found ${listings.length} items for ${category} in ${location}`);
          totalCount += listings.length;
        } else {
          console.log(`    ⚠️  eBay: No listings found for ${category} in ${location}`);
        }

        // Rate limiting - be nice to eBay
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`    ❌ eBay: Error scraping ${category} in ${location}:`, error.message);
        
        // Handle rate limiting
        if (error.response && error.response.status === 429) {
          console.log('    ⏸️  eBay: Rate limited, waiting 10 seconds...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }
  }

  return totalCount;
}

module.exports = {
  scrape,
  name: 'ebay',
};
