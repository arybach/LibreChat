require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const mongoose = require('mongoose');
const { runAllScrapers } = require('./scrapers');
const { searchListings, getCategories, getStats } = require('./controllers/listingsController');
const alertsRouter = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 6,12,18 * * *'; // Default: 6 AM, 12 PM, 6 PM daily

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'search-aggregator',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/listings/search', searchListings);
app.get('/api/listings/categories', getCategories);
app.get('/api/listings/stats', getStats);

// Search alerts routes
app.use('/api', alertsRouter);

// Manual trigger for scraping
app.post('/api/scrape/trigger', async (req, res) => {
  try {
    console.log('Manual scrape triggered');
    const results = await runAllScrapers();
    res.json({
      success: true,
      message: 'Scraping completed',
      results,
    });
  } catch (error) {
    console.error('Error during manual scrape:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Schedule automatic scraping
if (process.env.NODE_ENV !== 'test') {
  console.log(`📅 Scheduling scraper to run: ${CRON_SCHEDULE}`);
  
  cron.schedule(CRON_SCHEDULE, async () => {
    console.log('⏰ Scheduled scrape started:', new Date().toISOString());
    try {
      const results = await runAllScrapers();
      console.log('✅ Scheduled scrape completed:', results);
    } catch (error) {
      console.error('❌ Scheduled scrape failed:', error);
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Search Aggregator Service running on port ${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - GET    /health`);
  console.log(`   - GET    /api/listings/search`);
  console.log(`   - GET    /api/listings/categories`);
  console.log(`   - GET    /api/listings/stats`);
  console.log(`   - POST   /api/scrape/trigger`);
  console.log(`   - POST   /api/alerts`);
  console.log(`   - GET    /api/alerts/:userId`);
  console.log(`   - PUT    /api/alerts/:userId/:alertId`);
  console.log(`   - DELETE /api/alerts/:userId/:alertId`);
  console.log(`   - POST   /api/alerts/:userId/:alertId/test`);
});

module.exports = app;
