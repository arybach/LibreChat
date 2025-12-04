// Test marketplace tool directly
const createMarketplaceTools = require('./api/app/clients/tools/structured/Marketplace');

async function test() {
  console.log('Creating marketplace tools...');
  const tools = createMarketplaceTools();
  
  console.log(`\nCreated ${tools.length} tools:`);
  tools.forEach(tool => {
    console.log(`- ${tool.name}: ${tool.description.substring(0, 80)}...`);
  });
  
  console.log('\n\nTesting marketplace_search tool...');
  const searchTool = tools[0];
  
  try {
    const result = await searchTool._call({
      category: 'furniture',
      location: 'Miami',
      maxPrice: 500,
      limit: 5
    });
    
    console.log('\nSearch result:');
    console.log(result);
  } catch (error) {
    console.error('\nError calling tool:', error.message);
    console.error(error.stack);
  }
}

test().then(() => {
  console.log('\nTest completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
