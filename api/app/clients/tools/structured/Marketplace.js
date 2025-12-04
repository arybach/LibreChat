const { tool } = require('@langchain/core/tools');
const { marketplaceToolkit } = require('@librechat/api');

/**
 * Create Marketplace toolkit
 * Provides tools to search for listings from multiple marketplaces
 */
function createMarketplaceTools() {
  const {
    marketplaceSearchTool,
    marketplaceStatsTool,
    marketplaceCategoriesTool,
  } = require('../marketplace');
  
  return [marketplaceSearchTool, marketplaceStatsTool, marketplaceCategoriesTool];
}

module.exports = createMarketplaceTools;
