const axios = require('axios');
const cheerio = require('cheerio');
const Listing = require('../models/Listing');

const categoryMap = {
  furniture: 'fua',
  apartments: 'apa',
  motorcycles: 'mca',
  autos: 'cta',
};

const locationMap = {
  'new york': 'newyork',
  'los angeles': 'losangeles',
  'chicago': 'chicago',
  'san francisco': 'sfbay',
  'seattle': 'seattle',
  'boston': 'boston',
  'default': 'newyork',
};

/**
 * Scrape Craigslist listings
 */
async function scrape(locations, categories) {
  let totalCount = 0;
  const maxResults = Number(process.env.MAX_RESULTS_PER_SEARCH || 50);

  for (const location of locations) {
    const normalizedLocation = location.trim().toLowerCase();
    const craigslistLocation = locationMap[normalizedLocation] || locationMap.default;

    for (const category of categories) {
      const normalizedCategory = category.trim().toLowerCase();
      const craigslistCategory = categoryMap[normalizedCategory];

      if (!craigslistCategory) {
        console.warn(`⚠️  Unknown category: ${category}`);
        continue;
      }

      try {
        const url = `https://${craigslistLocation}.craigslist.org/search/${craigslistCategory}`;
        console.log(`  Scraping: ${url}`);

        const response = await axios.get(url, {
          timeout: Number(process.env.SCRAPE_TIMEOUT_MS || 30000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        const $ = cheerio.load(response.data);
        const listings = [];

        $('.cl-static-search-result').slice(0, maxResults).each((i, element) => {
          try {
            const $el = $(element);
            const title = $el.find('.title').text().trim();
            const priceText = $el.find('.price').text().trim();
            const price = priceText ? parseFloat(priceText.replace(/[$,]/g, '')) : 0;
            const linkEl = $el.find('a.main');
            const href = linkEl.attr('href');
            const listingUrl = href?.startsWith('http') ? href : `https://${craigslistLocation}.craigslist.org${href}`;
            const locationText = $el.find('.location').text().trim();
            const imageUrl = $el.find('img').attr('src');

            if (title && listingUrl) {
              listings.push({
                title,
                platform: 'craigslist',
                category: normalizedCategory,
                price,
                location: locationText || location,
                url: listingUrl,
                imageUrls: imageUrl ? [imageUrl] : [],
                scrapedAt: new Date(),
                isActive: true,
              });
            }
          } catch (err) {
            console.error('Error parsing listing:', err.message);
          }
        });

        // Save to database (update if exists, insert if new)
        for (const listing of listings) {
          try {
            await Listing.findOneAndUpdate(
              { url: listing.url },
              listing,
              { upsert: true, new: true },
            );
            totalCount++;
          } catch (err) {
            // Ignore duplicate key errors
            if (err.code !== 11000) {
              console.error('Error saving listing:', err.message);
            }
          }
        }

        // Small delay to be respectful
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
