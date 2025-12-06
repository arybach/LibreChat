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
  create_search_alert: {
    name: 'create_search_alert' as const,
    description: `Create a personalized search alert that monitors marketplace listings and sends notifications when new items match.
- Required: userId, name, keywords
- Optional: categories, locations, platforms, minPrice, maxPrice, telegramChatId, whatsappPhone
- Returns: Alert confirmation with ID
- Use for: Setting up automatic notifications for specific items users are looking for
- Notifications: Sent via Telegram/WhatsApp 3 times per day (6am, 12pm, 6pm)
Example: userId="123" name="Cheap Sofas" keywords=["sofa","couch"] categories=["furniture"] maxPrice=300 telegramChatId="456789"`,
    schema: z.object({
      userId: z.string().describe('User ID from LibreChat'),
      name: z.string().describe('Friendly name for this alert'),
      keywords: z.union([z.string(), z.array(z.string())]).describe('Keywords to search for'),
      categories: z.array(z.enum(['furniture', 'apartments', 'motorcycles', 'autos', 'other'])).optional(),
      locations: z.array(z.string()).optional().describe('Locations to filter by'),
      platforms: z.array(z.string()).optional().describe('Platforms to monitor'),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      telegramChatId: z.string().optional().describe('Telegram chat ID for notifications'),
      whatsappPhone: z.string().optional().describe('WhatsApp phone number'),
    }),
  },
  list_search_alerts: {
    name: 'list_search_alerts' as const,
    description: `List all active search alerts for a user.
- Required: userId
- Returns: List of user's alerts with match counts and notification settings
- Use for: Showing user their configured alerts
Example: userId="123"`,
    schema: z.object({
      userId: z.string().describe('User ID from LibreChat'),
    }),
  },
  delete_search_alert: {
    name: 'delete_search_alert' as const,
    description: `Delete a search alert by ID.
- Required: userId, alertId
- Returns: Confirmation message
- Use for: Removing unwanted alerts
Example: userId="123" alertId="alert_abc123"`,
    schema: z.object({
      userId: z.string().describe('User ID from LibreChat'),
      alertId: z.string().describe('Alert ID to delete'),
    }),
  },
};
