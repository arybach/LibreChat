const { runAllScrapers } = require('./scrapers');
require('dotenv').config();

/**
 * Run scrapers once without starting the server
 * Useful for testing and manual execution
 */
async function main() {
  console.log('🚀 Starting one-time scrape...');
  console.log('Locations:', process.env.SEARCH_LOCATIONS || 'newyork');
  console.log('Categories:', process.env.SEARCH_CATEGORIES || 'furniture,apartments,motorcycles,autos');
  console.log('');

  try {
    const results = await runAllScrapers();
    
    console.log('\n📊 Scraping Results:');
    console.log('===================');
    
    for (const [platform, result] of Object.entries(results)) {
      if (result.success) {
        console.log(`✅ ${platform}: ${result.count} listings`);
      } else {
        console.log(`❌ ${platform}: ${result.error || 'failed'}`);
      }
    }
    
    const totalCount = Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0);
    console.log(`\n📈 Total: ${totalCount} listings scraped`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
