import { z } from 'zod';

export const marketplaceToolkit = {
  marketplace_search: {
    name: 'marketplace_search' as const,
    description: `Search for real listings across multiple marketplace platforms (Facebook Marketplace, Craigslist, eBay).
- Required: category (one of: furniture, apartments, motorcycles, autos)
- Optional: location (city name, e.g., "Miami", "New York")
- Optional: priceMin (minimum price in dollars)
- Optional: priceMax (maximum price in dollars)
- Returns: JSON array of listings with title, price, location, URL, platform, and date
- Use for: Finding items for sale, rental properties, vehicles
- Platforms: Searches across Facebook Marketplace, Craigslist, and eBay
Example: category="furniture" location="Miami" priceMax=500`,
    schema: z.object({
      category: z
        .enum(['furniture', 'apartments', 'motorcycles', 'autos'])
        .describe('The category of items to search for'),
      location: z.string().optional().describe('City or area to search in (e.g., "Miami")'),
      priceMin: z.number().min(0).optional().describe('Minimum price in dollars'),
      priceMax: z.number().min(0).optional().describe('Maximum price in dollars'),
    }),
  },
  marketplace_stats: {
    name: 'marketplace_stats' as const,
    description: `Get statistics about the marketplace database.
- Returns: Total listing count, counts by category, counts by platform, date range
- Use for: Understanding available data, checking database status
Example: (no parameters needed)`,
    schema: z.object({}),
  },
  marketplace_categories: {
    name: 'marketplace_categories' as const,
    description: `Get available categories and platforms in the marketplace database.
- Returns: List of categories, list of platforms, total counts
- Use for: Discovering valid search categories and platforms
Example: (no parameters needed)`,
    schema: z.object({}),
  },
};
