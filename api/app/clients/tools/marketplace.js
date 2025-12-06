const axios = require('axios');
const { z } = require('zod');
const { tool } = require('@langchain/core/tools');

const SEARCH_AGGREGATOR_URL = process.env.SEARCH_AGGREGATOR_URL || 'http://search-aggregator:3001';

/**
 * Marketplace Search Tool for LibreChat
 * Allows AI agents to search listings from Facebook, Craigslist, OfferUp, etc.
 */
const marketplaceSearchTool = tool(
  async ({ category, location, minPrice, maxPrice, search, limit = 10 }) => {
    try {
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (location) params.append('location', location);
      if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
      if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
      if (search) params.append('search', search);
      params.append('limit', limit.toString());
      params.append('sortBy', 'scrapedAt');
      params.append('sortOrder', 'desc');

      const response = await axios.get(
        `${SEARCH_AGGREGATOR_URL}/api/listings/search?${params.toString()}`,
        { timeout: 10000 }
      );

      if (!response.data.success) {
        return `Error searching listings: ${response.data.error}`;
      }

      const listings = response.data.data;
      const pagination = response.data.pagination;

      if (listings.length === 0) {
        return 'No listings found matching your criteria. Try adjusting your search parameters.';
      }

      // Format results for the AI
      let result = `Found ${pagination.total} listings (showing ${listings.length}):\n\n`;
      
      listings.forEach((listing, index) => {
        result += `${index + 1}. ${listing.title}\n`;
        result += `   Platform: ${listing.platform}\n`;
        result += `   Price: $${listing.price}\n`;
        result += `   Location: ${listing.location}\n`;
        result += `   URL: ${listing.url}\n`;
        if (listing.description) {
          result += `   Description: ${listing.description.substring(0, 100)}...\n`;
        }
        result += `   Posted: ${new Date(listing.scrapedAt).toLocaleDateString()}\n\n`;
      });

      if (pagination.hasMore) {
        result += `\n(${pagination.total - listings.length} more listings available)`;
      }

      return result;
    } catch (error) {
      console.error('Marketplace search tool error:', error);
      return `Error searching marketplace: ${error.message}. The search service may be unavailable.`;
    }
  },
  {
    name: 'marketplace_search',
    description: 
      'Search for listings from multiple marketplaces including Facebook Marketplace, Craigslist, and OfferUp. ' +
      'Use this tool to find furniture, apartments for rent, motorcycles, cars, and other items people are selling or renting. ' +
      'You can filter by category, location, price range, and search keywords.',
    schema: z.object({
      category: z
        .enum(['furniture', 'apartments', 'motorcycles', 'autos', 'other'])
        .optional()
        .describe('Category of items to search for'),
      location: z
        .string()
        .optional()
        .describe('Location to search in (e.g., "New York", "Los Angeles")'),
      minPrice: z
        .number()
        .optional()
        .describe('Minimum price filter'),
      maxPrice: z
        .number()
        .optional()
        .describe('Maximum price filter'),
      search: z
        .string()
        .optional()
        .describe('Search keywords to filter listings by title or description'),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe('Number of results to return (default: 10, max: 50)'),
    }),
  }
);

/**
 * Get Marketplace Statistics Tool
 */
const marketplaceStatsTool = tool(
  async () => {
    try {
      const response = await axios.get(`${SEARCH_AGGREGATOR_URL}/api/listings/stats`, {
        timeout: 5000,
      });

      if (!response.data.success) {
        return `Error getting stats: ${response.data.error}`;
      }

      const stats = response.data.stats;
      
      let result = 'Marketplace Statistics:\n\n';
      result += `Total Active Listings: ${stats.totalListings}\n`;
      result += `New Listings (24h): ${stats.recentListings}\n`;
      result += `Last Updated: ${stats.lastScrapedAt ? new Date(stats.lastScrapedAt).toLocaleString() : 'Never'}\n`;

      return result;
    } catch (error) {
      console.error('Marketplace stats tool error:', error);
      return `Error getting marketplace statistics: ${error.message}`;
    }
  },
  {
    name: 'marketplace_stats',
    description: 'Get statistics about the marketplace listings database, including total listings and last update time.',
    schema: z.object({}),
  }
);

/**
 * Get Marketplace Categories Tool
 */
const marketplaceCategoriesTool = tool(
  async () => {
    try {
      const response = await axios.get(`${SEARCH_AGGREGATOR_URL}/api/listings/categories`, {
        timeout: 5000,
      });

      if (!response.data.success) {
        return `Error getting categories: ${response.data.error}`;
      }

      const { categories, platforms } = response.data;
      
      let result = 'Available Marketplace Data:\n\n';
      
      result += 'Categories:\n';
      categories.forEach(cat => {
        result += `  - ${cat.name}: ${cat.count} listings (avg price: $${cat.avgPrice})\n`;
      });
      
      result += '\nPlatforms:\n';
      platforms.forEach(plat => {
        result += `  - ${plat.name}: ${plat.count} listings\n`;
      });

      return result;
    } catch (error) {
      console.error('Marketplace categories tool error:', error);
      return `Error getting marketplace categories: ${error.message}`;
    }
  },
  {
    name: 'marketplace_categories',
    description: 'Get available categories and platforms in the marketplace database with listing counts.',
    schema: z.object({}),
  }
);

/**
 * Create Search Alert Tool
 */
const createSearchAlertTool = tool(
  async ({ userId, name, keywords, categories, locations, platforms, minPrice, maxPrice, telegramChatId, whatsappPhone }) => {
    try {
      const alertData = {
        userId,
        name,
        keywords: Array.isArray(keywords) ? keywords : [keywords],
        categories: categories || ['furniture'],
        locations: locations || [],
        platforms: platforms || ['facebook', 'craigslist', 'ebay'],
        priceMin: minPrice || 0,
        priceMax: maxPrice || null,
        notificationChannels: {
          telegram: {
            enabled: !!telegramChatId,
            chatId: telegramChatId || null,
          },
          whatsapp: {
            enabled: !!whatsappPhone,
            phoneNumber: whatsappPhone || null,
          },
        },
        isActive: true,
      };

      const response = await axios.post(
        `${SEARCH_AGGREGATOR_URL}/api/alerts`,
        alertData,
        { timeout: 5000 }
      );

      if (!response.data.success) {
        return `Error creating alert: ${response.data.error}`;
      }

      const alert = response.data.alert;
      
      let result = `✅ Search alert created successfully!\n\n`;
      result += `Name: ${alert.name}\n`;
      result += `Keywords: ${alert.keywords.join(', ')}\n`;
      result += `Categories: ${alert.categories.join(', ')}\n`;
      result += `Price Range: $${alert.priceMin} - ${alert.priceMax || 'unlimited'}\n`;
      result += `Alert ID: ${alert._id}\n\n`;
      
      if (alert.notificationChannels.telegram.enabled) {
        result += `📱 Telegram notifications enabled\n`;
      }
      if (alert.notificationChannels.whatsapp.enabled) {
        result += `📱 WhatsApp notifications enabled\n`;
      }
      
      result += `\nYou'll receive notifications when new listings match your criteria!`;

      return result;
    } catch (error) {
      console.error('Create alert tool error:', error);
      return `Error creating search alert: ${error.message}`;
    }
  },
  {
    name: 'create_search_alert',
    description: 
      'Create a personalized search alert that monitors marketplace listings and sends notifications (via Telegram or WhatsApp) ' +
      'when new items matching the criteria appear. Users will be notified automatically 3 times per day when scrapers run.',
    schema: z.object({
      userId: z.string().describe('User ID from LibreChat'),
      name: z.string().describe('Friendly name for this alert (e.g., "Cheap Furniture NYC")'),
      keywords: z.union([z.string(), z.array(z.string())]).describe('Keywords to search for (e.g., ["sofa", "couch", "sectional"])'),
      categories: z.array(z.enum(['furniture', 'apartments', 'motorcycles', 'autos', 'other'])).optional().describe('Categories to monitor'),
      locations: z.array(z.string()).optional().describe('Locations to filter by (e.g., ["New York", "Brooklyn"])'),
      platforms: z.array(z.string()).optional().describe('Platforms to monitor (craigslist, facebook, ebay, ikea, walmart, etc.)'),
      minPrice: z.number().optional().describe('Minimum price'),
      maxPrice: z.number().optional().describe('Maximum price'),
      telegramChatId: z.string().optional().describe('Telegram chat ID for notifications'),
      whatsappPhone: z.string().optional().describe('WhatsApp phone number for notifications (format: +1234567890)'),
    }),
  }
);

/**
 * List User's Search Alerts Tool
 */
const listSearchAlertsTool = tool(
  async ({ userId }) => {
    try {
      const response = await axios.get(`${SEARCH_AGGREGATOR_URL}/api/alerts/${userId}`, {
        timeout: 5000,
      });

      if (!response.data.success) {
        return `Error listing alerts: ${response.data.error}`;
      }

      const alerts = response.data.alerts;

      if (alerts.length === 0) {
        return 'You have no active search alerts. Use create_search_alert to set one up!';
      }

      let result = `Your Search Alerts (${alerts.length}):\n\n`;
      
      alerts.forEach((alert, index) => {
        result += `${index + 1}. ${alert.name} ${alert.isActive ? '✅' : '❌'}\n`;
        result += `   ID: ${alert._id}\n`;
        result += `   Keywords: ${alert.keywords.join(', ')}\n`;
        result += `   Categories: ${alert.categories.join(', ')}\n`;
        result += `   Price Range: $${alert.priceMin} - ${alert.priceMax || 'unlimited'}\n`;
        result += `   Matches Found: ${alert.matchCount}\n`;
        if (alert.lastNotifiedAt) {
          result += `   Last Notification: ${new Date(alert.lastNotifiedAt).toLocaleString()}\n`;
        }
        result += `   Notifications: `;
        const channels = [];
        if (alert.notificationChannels.telegram?.enabled) channels.push('Telegram');
        if (alert.notificationChannels.whatsapp?.enabled) channels.push('WhatsApp');
        result += channels.length > 0 ? channels.join(', ') : 'None';
        result += '\n\n';
      });

      return result;
    } catch (error) {
      console.error('List alerts tool error:', error);
      return `Error listing search alerts: ${error.message}`;
    }
  },
  {
    name: 'list_search_alerts',
    description: 'List all search alerts for a user, showing their status, match counts, and notification settings.',
    schema: z.object({
      userId: z.string().describe('User ID from LibreChat'),
    }),
  }
);

/**
 * Delete Search Alert Tool
 */
const deleteSearchAlertTool = tool(
  async ({ userId, alertId }) => {
    try {
      const response = await axios.delete(
        `${SEARCH_AGGREGATOR_URL}/api/alerts/${userId}/${alertId}`,
        { timeout: 5000 }
      );

      if (!response.data.success) {
        return `Error deleting alert: ${response.data.error}`;
      }

      return `✅ Search alert deleted successfully!`;
    } catch (error) {
      console.error('Delete alert tool error:', error);
      if (error.response?.status === 404) {
        return 'Alert not found. It may have already been deleted.';
      }
      return `Error deleting search alert: ${error.message}`;
    }
  },
  {
    name: 'delete_search_alert',
    description: 'Delete a search alert by its ID.',
    schema: z.object({
      userId: z.string().describe('User ID from LibreChat'),
      alertId: z.string().describe('Alert ID to delete'),
    }),
  }
);

module.exports = {
  marketplaceSearchTool,
  marketplaceStatsTool,
  marketplaceCategoriesTool,
  createSearchAlertTool,
  listSearchAlertsTool,
  deleteSearchAlertTool,
};
