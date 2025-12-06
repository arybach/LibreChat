const axios = require('axios');

/**
 * Scraping utility with API support
 * Supports ScraperAPI and Bright Data for anti-bot bypass
 */

class ScraperService {
  constructor() {
    this.scraperApiKey = process.env.SCRAPER_API_KEY;
    this.brightDataUsername = process.env.BRIGHT_DATA_USERNAME;
    this.brightDataPassword = process.env.BRIGHT_DATA_PASSWORD;
    
    // ScraperAPI endpoint
    this.scraperApiUrl = 'http://api.scraperapi.com';
    
    // Default headers
    this.defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  /**
   * Fetch URL with automatic fallback to scraping API if needed
   */
  async fetch(url, options = {}) {
    const { timeout = 15000, retries = 2 } = options;
    
    // Try direct fetch first
    try {
      console.log(`   Fetching: ${url}`);
      const response = await axios.get(url, {
        headers: { ...this.defaultHeaders, ...options.headers },
        timeout,
      });
      return response;
    } catch (error) {
      // If rate limited (429) or blocked, try scraping API
      if (error.response?.status === 429 || error.response?.status === 403) {
        console.log(`   ⚠️  Rate limited/blocked, trying scraping API...`);
        return await this.fetchWithScraperApi(url, options);
      }
      throw error;
    }
  }

  /**
   * Fetch using ScraperAPI
   */
  async fetchWithScraperApi(url, options = {}) {
    if (!this.scraperApiKey) {
      console.warn('   ⚠️  SCRAPER_API_KEY not set, cannot bypass rate limiting');
      throw new Error('Rate limited and no scraping API available');
    }

    try {
      const params = new URLSearchParams({
        api_key: this.scraperApiKey,
        url: url,
        render: 'false', // Set to 'true' for JavaScript-heavy sites
        country_code: 'us',
      });

      console.log(`   Using ScraperAPI for: ${url}`);
      
      const response = await axios.get(`${this.scraperApiUrl}?${params.toString()}`, {
        timeout: options.timeout || 30000,
      });

      return response;
    } catch (error) {
      console.error(`   ❌ ScraperAPI failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch using Bright Data proxy
   */
  async fetchWithBrightData(url, options = {}) {
    if (!this.brightDataUsername || !this.brightDataPassword) {
      throw new Error('Bright Data credentials not configured');
    }

    const proxyUrl = `http://${this.brightDataUsername}:${this.brightDataPassword}@brd.superproxy.io:22225`;

    try {
      const response = await axios.get(url, {
        proxy: {
          host: 'brd.superproxy.io',
          port: 22225,
          auth: {
            username: this.brightDataUsername,
            password: this.brightDataPassword,
          },
        },
        headers: { ...this.defaultHeaders, ...options.headers },
        timeout: options.timeout || 30000,
      });

      return response;
    } catch (error) {
      console.error(`   ❌ Bright Data failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rate limiting helper
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ScraperService();
