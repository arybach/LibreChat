const axios = require('axios');
const cheerio = require('cheerio');
const Listing = require('../models/Listing');

/**
 * Nextdoor scraper - For Sale section
 * Note: Nextdoor requires authentication and has strict anti-bot measures
 * This is a basic scraper that may need cookie authentication similar to Facebook
 */

const NEXTDOOR_BASE_URL = 'https://nextdoor.com';

// Location mapping - Nextdoor uses neighborhood/city URLs
const locationMap = {
  'New York': 'new-york-ny',
  'Los Angeles': 'los-angeles-ca',
  'Chicago': 'chicago-il',
  'Miami': 'miami-fl',
  'San Francisco': 'san-francisco-ca',
  'Austin': 'austin-tx',
};

// Category mapping - Nextdoor uses simple categories in For Sale
const categoryMap = {
  'furniture': 'furniture',
  'autos': 'vehicles',
  'motorcycles': 'vehicles',
  'apartments': 'housing', // Rentals/housing
  'other': 'general',
};

async function scrapeNextdoor(locations, categories) {
  console.log('⚠️  Nextdoor scraper is experimental - requires authentication');
  console.log('   Set NEXTDOOR_COOKIES_FILE in .env to enable authenticated scraping');
  
  let totalListings = 0;

  // Check if cookies file is provided
  const cookiesFile = process.env.NEXTDOOR_COOKIES_FILE;
  if (!cookiesFile) {
    console.log('⚠️  NEXTDOOR_COOKIES_FILE not set. Skipping Nextdoor scraping.');
    console.log('   Export cookies from browser and set path in .env');
    return 0;
  }

  // Load cookies if available
  let cookies = '';
  try {
    const fs = require('fs');
    const cookieData = JSON.parse(fs.readFileSync(cookiesFile, 'utf-8'));
    cookies = cookieData.map(c => `${c.name}=${c.value}`).join('; ');
  } catch (error) {
    console.error('❌ Failed to load Nextdoor cookies:', error.message);
    return 0;
  }

  for (const location of locations) {
    const locationSlug = locationMap[location.trim()];
    if (!locationSlug) {
      console.log(`⚠️  Unknown location for Nextdoor: ${location}`);
      continue;
    }

    for (const category of categories) {
      const categorySlug = categoryMap[category.trim()] || 'general';
      
      try {
        // Nextdoor For Sale URL structure: https://nextdoor.com/for_sale_and_free/{city}/
        const url = `${NEXTDOOR_BASE_URL}/for_sale_and_free/${locationSlug}/`;
        
        console.log(`🔍 Scraping Nextdoor: ${location} - ${category}`);
        console.log(`   URL: ${url}`);

        const response = await axios.get(url, {
          headers: {
            'Cookie': cookies,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': NEXTDOOR_BASE_URL,
          },
          timeout: 15000,
        });

        const $ = cheerio.load(response.data);
        
        // Parse listings - Nextdoor's structure may vary
        // This is a placeholder implementation that needs to be adjusted based on actual HTML
        const listings = [];
        
        // Example selector - needs to be updated based on actual Nextdoor HTML
        $('.post-card, .for-sale-post, [data-testid="for-sale-item"]').each((i, elem) => {
          try {
            const title = $(elem).find('.post-title, h3, [data-testid="post-title"]').text().trim();
            const priceText = $(elem).find('.price, [data-testid="price"]').text().trim();
            const description = $(elem).find('.post-body, .description').text().trim();
            const link = $(elem).find('a').first().attr('href');
            const imageUrl = $(elem).find('img').first().attr('src');

            if (!title || !link) return;

            // Parse price
            const priceMatch = priceText.match(/\$?([\d,]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

            const listing = {
              title,
              description: description.substring(0, 500),
              platform: 'nextdoor',
              category: category.trim(),
              price,
              currency: 'USD',
              location: location.trim(),
              url: link.startsWith('http') ? link : `${NEXTDOOR_BASE_URL}${link}`,
              imageUrls: imageUrl ? [imageUrl] : [],
              postedAt: new Date(), // Nextdoor doesn't always show exact dates
              scrapedAt: new Date(),
              isActive: true,
            };

            listings.push(listing);
          } catch (err) {
            console.error('Error parsing Nextdoor listing:', err.message);
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
            console.error('Error saving Nextdoor listing:', err.message);
          }
        }

        console.log(`   Found ${listings.length} listings`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Nextdoor scrape failed for ${location} - ${category}:`, error.message);
      }
    }
  }

  return totalListings;
}

module.exports = {
  scrape: scrapeNextdoor,
};
