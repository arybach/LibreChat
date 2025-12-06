const express = require('express');
const router = express.Router();
const SearchAlert = require('../models/SearchAlert');
const alertMatcher = require('../services/alertMatcher');

/**
 * Search Alerts API endpoints
 */

// Create new search alert
router.post('/alerts', async (req, res) => {
  try {
    const alert = new SearchAlert(req.body);
    await alert.save();
    res.status(201).json({ success: true, alert });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all alerts for a user
router.get('/alerts/:userId', async (req, res) => {
  try {
    const alerts = await SearchAlert.find({ userId: req.params.userId });
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single alert
router.get('/alerts/:userId/:alertId', async (req, res) => {
  try {
    const alert = await SearchAlert.findOne({
      _id: req.params.alertId,
      userId: req.params.userId,
    });
    
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    
    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update alert
router.put('/alerts/:userId/:alertId', async (req, res) => {
  try {
    const alert = await SearchAlert.findOneAndUpdate(
      { _id: req.params.alertId, userId: req.params.userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    
    res.json({ success: true, alert });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete alert
router.delete('/alerts/:userId/:alertId', async (req, res) => {
  try {
    const alert = await SearchAlert.findOneAndDelete({
      _id: req.params.alertId,
      userId: req.params.userId,
    });
    
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test alert with sample listing
router.post('/alerts/:userId/:alertId/test', async (req, res) => {
  try {
    const sampleListing = req.body.listing || {
      title: 'Test Furniture Item',
      description: 'Sample listing for testing',
      platform: 'craigslist',
      category: 'furniture',
      price: 100,
      location: 'New York',
      url: 'https://example.com',
    };

    const result = await alertMatcher.testAlert(req.params.alertId, sampleListing);
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
