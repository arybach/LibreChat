const SearchAlert = require('../models/SearchAlert');
const notificationService = require('./notificationService');

/**
 * Alert matching service - Checks new listings against user search alerts
 */

class AlertMatcher {
  /**
   * Check if a listing matches an alert's criteria
   */
  matchesAlert(listing, alert) {
    // Check if alert is active
    if (!alert.isActive) {
      return false;
    }

    // Check category match
    if (alert.categories.length > 0 && !alert.categories.includes(listing.category)) {
      return false;
    }

    // Check platform match
    if (alert.platforms.length > 0 && !alert.platforms.includes(listing.platform)) {
      return false;
    }

    // Check location match (if specified)
    if (alert.locations.length > 0) {
      const locationMatch = alert.locations.some(loc => 
        listing.location.toLowerCase().includes(loc.toLowerCase())
      );
      if (!locationMatch) {
        return false;
      }
    }

    // Check price range
    if (alert.priceMin > 0 && listing.price < alert.priceMin) {
      return false;
    }
    if (alert.priceMax !== null && listing.price > alert.priceMax) {
      return false;
    }

    // Check keyword match in title or description
    const searchText = `${listing.title} ${listing.description}`.toLowerCase();
    const keywordMatch = alert.keywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );

    return keywordMatch;
  }

  /**
   * Process new listings and send notifications for matches
   */
  async processNewListings(listings) {
    if (!listings || listings.length === 0) {
      return { processed: 0, matched: 0, notified: 0 };
    }

    console.log(`🔍 Processing ${listings.length} new listings for alert matching...`);

    // Fetch all active alerts
    const alerts = await SearchAlert.find({ isActive: true });
    
    if (alerts.length === 0) {
      console.log('ℹ️  No active search alerts found');
      return { processed: listings.length, matched: 0, notified: 0 };
    }

    console.log(`📋 Found ${alerts.length} active search alerts`);

    let matchCount = 0;
    let notificationCount = 0;

    // Check each listing against all alerts
    for (const listing of listings) {
      for (const alert of alerts) {
        if (this.matchesAlert(listing, alert)) {
          matchCount++;
          
          console.log(`✅ Match found: "${listing.title}" matches alert "${alert.name}"`);

          // Send notifications
          try {
            const results = await notificationService.sendMultiChannel(alert, listing);
            
            if (results.telegram.sent || results.whatsapp.sent) {
              notificationCount++;
              
              // Update alert stats
              alert.lastNotifiedAt = new Date();
              alert.matchCount += 1;
              await alert.save();
              
              console.log(`📨 Notifications sent for alert "${alert.name}"`);
            }
          } catch (error) {
            console.error(`❌ Failed to send notification for alert "${alert.name}":`, error.message);
          }
        }
      }
    }

    console.log(`✅ Alert matching complete: ${matchCount} matches, ${notificationCount} notifications sent`);

    return {
      processed: listings.length,
      matched: matchCount,
      notified: notificationCount,
    };
  }

  /**
   * Test alert with sample listing
   */
  async testAlert(alertId, sampleListing) {
    const alert = await SearchAlert.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    const matches = this.matchesAlert(sampleListing, alert);
    
    if (matches) {
      const results = await notificationService.sendMultiChannel(alert, sampleListing);
      return { matches: true, notificationsSent: results };
    }

    return { matches: false, notificationsSent: null };
  }
}

module.exports = new AlertMatcher();
