const {
  marketplaceSearchTool,
  marketplaceStatsTool,
  marketplaceCategoriesTool,
} = require('../marketplace');

/**
 * Create Marketplace toolkit
 * Provides tools to search for listings from multiple marketplaces
 */
function createMarketplaceTools() {
  return [marketplaceSearchTool, marketplaceStatsTool, marketplaceCategoriesTool];
}

module.exports = createMarketplaceTools;
