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

module.exports = {
  marketplaceSearchTool,
  marketplaceStatsTool,
  marketplaceCategoriesTool,
};
