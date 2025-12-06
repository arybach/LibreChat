const mongoose = require('mongoose');

/**
 * SearchAlert model - User-defined search alerts with notification preferences
 */
const searchAlertSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      default: 'My Alert',
    },
    keywords: {
      type: [String],
      required: true,
      index: true,
    },
    categories: {
      type: [String],
      enum: ['furniture', 'apartments', 'motorcycles', 'autos', 'other'],
      default: ['furniture'],
    },
    locations: {
      type: [String],
      default: [],
    },
    platforms: {
      type: [String],
      enum: ['facebook', 'craigslist', 'offerup', 'ebay', 'nextdoor', 'walmart', 'ikea', 'wayfair', 'overstock', 'other'],
      default: ['facebook', 'craigslist'],
    },
    priceMin: {
      type: Number,
      default: 0,
    },
    priceMax: {
      type: Number,
      default: null,
    },
    notificationChannels: {
      telegram: {
        enabled: {
          type: Boolean,
          default: false,
        },
        chatId: {
          type: String,
          default: null,
        },
      },
      whatsapp: {
        enabled: {
          type: Boolean,
          default: false,
        },
        phoneNumber: {
          type: String,
          default: null,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastNotifiedAt: {
      type: Date,
      default: null,
    },
    matchCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for efficient alert querying
searchAlertSchema.index({ userId: 1, isActive: 1 });
searchAlertSchema.index({ keywords: 1, isActive: 1 });

module.exports = mongoose.model('SearchAlert', searchAlertSchema);
