const craigslistScraper = require('./craigslistScraper');
const facebookScraper = require('./facebookScraper');
const offerupScraper = require('./offerupScraper');
const ebayScraper = require('./ebayScraper');

/**
 * Run all enabled scrapers
 */
async function runAllScrapers() {
  const results = {
    craigslist: { success: false, count: 0, error: null },
    facebook: { success: false, count: 0, error: null },
    offerup: { success: false, count: 0, error: null },
    ebay: { success: false, count: 0, error: null },
  };

  const locations = (process.env.SEARCH_LOCATIONS || 'newyork').split(',');
  const categories = (process.env.SEARCH_CATEGORIES || 'furniture,apartments,motorcycles,autos').split(',');

  // Craigslist scraper
  if (process.env.ENABLE_CRAIGSLIST !== 'false') {
    try {
      console.log('🔍 Starting Craigslist scraper...');
      const count = await craigslistScraper.scrape(locations, categories);
      results.craigslist = { success: true, count, error: null };
      console.log(`✅ Craigslist: ${count} listings scraped`);
    } catch (error) {
      console.error('❌ Craigslist scraper error:', error.message);
      results.craigslist.error = error.message;
    }
  }

  // Facebook scraper
  if (process.env.ENABLE_FACEBOOK !== 'false') {
    try {
      console.log('🔍 Starting Facebook scraper...');
      const count = await facebookScraper.scrape(locations, categories);
      results.facebook = { success: true, count, error: null };
      console.log(`✅ Facebook: ${count} listings scraped`);
    } catch (error) {
      console.error('❌ Facebook scraper error:', error.message);
      results.facebook.error = error.message;
    }
  }

  // OfferUp scraper
  if (process.env.ENABLE_OFFERUP !== 'false') {
    try {
      console.log('🔍 Starting OfferUp scraper...');
      const count = await offerupScraper.scrape(locations, categories);
      results.offerup = { success: true, count, error: null };
      console.log(`✅ OfferUp: ${count} listings scraped`);
    } catch (error) {
      console.error('❌ OfferUp scraper error:', error.message);
      results.offerup.error = error.message;
    }
  }

  // eBay scraper
  if (process.env.ENABLE_EBAY !== 'false') {
    try {
      console.log('🔍 Starting eBay scraper...');
      const count = await ebayScraper.scrape(locations, categories);
      results.ebay = { success: true, count, error: null };
      console.log(`✅ eBay: ${count} listings scraped`);
    } catch (error) {
      console.error('❌ eBay scraper error:', error.message);
      results.ebay.error = error.message;
    }
  }

  return results;
}

module.exports = {
  runAllScrapers,
  craigslistScraper,
  facebookScraper,
  offerupScraper,
  ebayScraper,
};
