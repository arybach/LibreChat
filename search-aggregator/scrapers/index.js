const craigslistScraper = require('./craigslistScraper');
const facebookScraper = require('./facebookScraper');
const offerupScraper = require('./offerupScraper');
const ebayScraper = require('./ebayScraper');
const nextdoorScraper = require('./nextdoorScraper');
const walmartScraper = require('./walmartScraper');
const ikeaScraper = require('./ikeaScraper');
const wayfairScraper = require('./wayfairScraper');
const overstockScraper = require('./overstockScraper');

/**
 * Run all enabled scrapers
 */
async function runAllScrapers() {
  const results = {
    craigslist: { success: false, count: 0, error: null },
    facebook: { success: false, count: 0, error: null },
    offerup: { success: false, count: 0, error: null },
    ebay: { success: false, count: 0, error: null },
    nextdoor: { success: false, count: 0, error: null },
    walmart: { success: false, count: 0, error: null },
    ikea: { success: false, count: 0, error: null },
    wayfair: { success: false, count: 0, error: null },
    overstock: { success: false, count: 0, error: null },
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

  // Nextdoor scraper
  if (process.env.ENABLE_NEXTDOOR !== 'false') {
    try {
      console.log('🔍 Starting Nextdoor scraper...');
      const count = await nextdoorScraper.scrape(locations, categories);
      results.nextdoor = { success: true, count, error: null };
      console.log(`✅ Nextdoor: ${count} listings scraped`);
    } catch (error) {
      console.error('❌ Nextdoor scraper error:', error.message);
      results.nextdoor.error = error.message;
    }
  }

  // Walmart scraper
  if (process.env.ENABLE_WALMART !== 'false') {
    try {
      console.log('🔍 Starting Walmart scraper...');
      const count = await walmartScraper.scrape(locations, categories);
      results.walmart = { success: true, count, error: null };
      console.log(`✅ Walmart: ${count} listings scraped`);
    } catch (error) {
      console.error('❌ Walmart scraper error:', error.message);
      results.walmart.error = error.message;
    }
  }

  // IKEA scraper
  if (process.env.ENABLE_IKEA !== 'false') {
    try {
      console.log('🔍 Starting IKEA scraper...');
      const count = await ikeaScraper.scrape(locations, categories);
      results.ikea = { success: true, count, error: null };
      console.log(`✅ IKEA: ${count} listings scraped`);
    } catch (error) {
      console.error('❌ IKEA scraper error:', error.message);
      results.ikea.error = error.message;
    }
  }

  // Wayfair scraper
  if (process.env.ENABLE_WAYFAIR !== 'false') {
    try {
      console.log('🔍 Starting Wayfair scraper...');
      const count = await wayfairScraper.scrape(locations, categories);
      results.wayfair = { success: true, count, error: null };
      console.log(`✅ Wayfair: ${count} listings scraped`);
    } catch (error) {
      console.error('❌ Wayfair scraper error:', error.message);
      results.wayfair.error = error.message;
    }
  }

  // Overstock scraper
  if (process.env.ENABLE_OVERSTOCK !== 'false') {
    try {
      console.log('🔍 Starting Overstock scraper...');
      const count = await overstockScraper.scrape(locations, categories);
      results.overstock = { success: true, count, error: null };
      console.log(`✅ Overstock: ${count} listings scraped`);
    } catch (error) {
      console.error('❌ Overstock scraper error:', error.message);
      results.overstock.error = error.message;
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
  nextdoorScraper,
  walmartScraper,
  ikeaScraper,
  wayfairScraper,
  overstockScraper,
};
