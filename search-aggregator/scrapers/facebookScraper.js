const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const Listing = require('../models/Listing');

async function loadFacebookCookies() {
  try {
    if (process.env.FACEBOOK_COOKIES_FILE) {
      const cookiesJson = await fs.readFile(process.env.FACEBOOK_COOKIES_FILE, 'utf8');
      return JSON.parse(cookiesJson);
    }
    if (process.env.FACEBOOK_COOKIES) {
      return JSON.parse(process.env.FACEBOOK_COOKIES);
    }
    return null;
  } catch (error) {
    console.warn('⚠️  Failed to load Facebook cookies:', error.message);
    return null;
  }
}

async function scrapeGroups(browser, cookies) {
  let totalCount = 0;
  const maxResults = Number(process.env.MAX_RESULTS_PER_SEARCH || 50);
  const groupIds = process.env.FACEBOOK_GROUP_IDS 
    ? process.env.FACEBOOK_GROUP_IDS.split(',').map(id => id.trim())
    : [];

  if (groupIds.length === 0) {
    console.log('  ℹ️  No Facebook groups configured');
    return 0;
  }

  console.log(`  📱 Scraping ${groupIds.length} Facebook groups...`);

  for (const groupId of groupIds) {
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      if (cookies) {
        const cleanCookies = cookies.map(c => {
          const { partitionKey, storeId, firstPartyDomain, expirationDate, ...rest } = c;
          return { ...rest, ...(expirationDate ? { expires: expirationDate } : {}) };
        });
        await page.setCookie(...cleanCookies);
      }

      const groupUrl = `https://www.facebook.com/groups/${groupId}`;
      console.log(`    Scraping group: ${groupId}`);
      
      await page.goto(groupUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('[role="article"]', { timeout: 10000 }).catch(() => {});

      // Scroll to load posts
      await page.evaluate(async () => {
        for (let i = 0; i < 3; i++) {
          window.scrollBy(0, window.innerHeight);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      });

      const listings = await page.evaluate((max, gid) => {
        const items = [];
        const posts = document.querySelectorAll('[role="article"]');
        
        for (let i = 0; i < Math.min(posts.length, max); i++) {
          try {
            const post = posts[i];
            const textEls = post.querySelectorAll('[dir="auto"]');
            let text = Array.from(textEls).map(el => el.textContent).join(' ');
            
            const priceMatch = text.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
            
            const linkEl = post.querySelector('a[href*="/posts/"], a[href*="/permalink/"]');
            const href = linkEl?.getAttribute('href');
            const url = href?.startsWith('http') ? href : (href ? `https://www.facebook.com${href.split('?')[0]}` : null);
            
            const images = Array.from(post.querySelectorAll('img[src*="scontent"]'))
              .map(img => img.src).filter(src => !src.includes('emoji'));
            
            const title = text.substring(0, 100).trim();
            
            if (title && url && title.length > 10) {
              items.push({
                title,
                price,
                url,
                imageUrls: images.slice(0, 3),
                platform: 'facebook-group',
                category: 'general',
                location: `Group ${gid}`,
                description: text.substring(0, 500),
              });
            }
          } catch (err) {}
        }
        return items;
      }, maxResults, groupId);

      console.log(`    ✅ Found ${listings.length} posts`);

      for (const listing of listings) {
        try {
          await Listing.findOneAndUpdate(
            { url: listing.url },
            { ...listing, scrapedAt: new Date(), isActive: true },
            { upsert: true, new: true }
          );
          totalCount++;
        } catch (err) {
          if (err.code !== 11000) console.error('Error saving:', err.message);
        }
      }

      await page.close();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`  ❌ Error scraping group ${groupId}:`, error.message);
    }
  }

  return totalCount;
}

async function scrapeMarketplace(browser, cookies, locations, categories) {
  let totalCount = 0;
  const maxResults = Number(process.env.MAX_RESULTS_PER_SEARCH || 50);

  console.log('  🏪 Scraping Facebook Marketplace...');

  for (const location of locations) {
    for (const category of categories) {
      try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        if (cookies) {
          const cleanCookies = cookies.map(c => {
            const { partitionKey, storeId, firstPartyDomain, expirationDate, ...rest } = c;
            return { ...rest, ...(expirationDate ? { expires: expirationDate } : {}) };
          });
          await page.setCookie(...cleanCookies);
        }

        const searchQuery = encodeURIComponent(category);
        const url = `https://www.facebook.com/marketplace/category/search/?query=${searchQuery}`;
        
        console.log(`    Searching: ${category}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('div[class*="marketplace"]', { timeout: 10000 }).catch(() => {});

        await page.evaluate(async () => {
          for (let i = 0; i < 3; i++) {
            window.scrollBy(0, window.innerHeight);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        });

        const listings = await page.evaluate((max, cat, loc) => {
          const items = [];
          const selectors = ['a[href*="/marketplace/item/"]', 'div[data-testid="marketplace-item"]'];
          
          let elements = [];
          for (const sel of selectors) {
            elements = document.querySelectorAll(sel);
            if (elements.length > 0) break;
          }
          
          for (let i = 0; i < Math.min(elements.length, max); i++) {
            try {
              const el = elements[i];
              const linkEl = el.tagName === 'A' ? el : el.querySelector('a');
              const href = linkEl?.getAttribute('href');
              const url = href?.startsWith('http') ? href : (href ? `https://www.facebook.com${href.split('?')[0]}` : null);
              
              const text = el.textContent || '';
              const lines = text.trim().split('\n').filter(l => l.trim());
              const title = lines[0] || 'Untitled';
              
              const priceLine = lines.find(l => l.includes('$'));
              const priceMatch = priceLine?.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
              const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
              
              const img = el.querySelector('img');
              
              if (title && url && title.length > 3) {
                items.push({
                  title: title.substring(0, 200),
                  price,
                  url,
                  imageUrls: img?.src ? [img.src] : [],
                  platform: 'facebook',
                  category: cat,
                  location: loc,
                });
              }
            } catch (err) {}
          }
          return items;
        }, maxResults, category, location);

        console.log(`    ✅ Found ${listings.length} items`);

        for (const listing of listings) {
          try {
            await Listing.findOneAndUpdate(
              { url: listing.url },
              { ...listing, scrapedAt: new Date(), isActive: true },
              { upsert: true, new: true }
            );
            totalCount++;
          } catch (err) {
            if (err.code !== 11000) console.error('Error saving:', err.message);
          }
        }

        await page.close();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
      }
    }
  }

  return totalCount;
}

async function scrape(locations, categories) {
  const cookies = await loadFacebookCookies();

  if (!cookies) {
    console.warn('⚠️  No Facebook authentication - results will be limited');
    return 0;
  }

  console.log('✅ Using authenticated Facebook session');

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    let totalCount = 0;
    totalCount += await scrapeMarketplace(browser, cookies, locations, categories);
    totalCount += await scrapeGroups(browser, cookies);

    await browser.close();
    console.log(`✅ Facebook complete: ${totalCount} listings`);
    return totalCount;
    
  } catch (error) {
    console.error('❌ Facebook error:', error);
    return 0;
  }
}

module.exports = { scrape };
