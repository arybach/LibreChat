// This file will need to be copied from the api/models directory
// It's a symbolic link or we can reference it directly
const mongoose = require('mongoose');

const listingSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    platform: {
      type: String,
      required: true,
      enum: ['facebook', 'craigslist', 'offerup', 'ebay', 'nextdoor', 'walmart', 'ikea', 'wayfair', 'overstock', 'letgo', 'other'],
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['furniture', 'apartments', 'motorcycles', 'autos', 'other'],
      index: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    location: {
      type: String,
      default: '',
      index: true,
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    url: {
      type: String,
      required: true,
      unique: true,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    contactInfo: {
      type: {
        name: String,
        phone: String,
        email: String,
      },
      default: {},
    },
    postedAt: {
      type: Date,
      default: null,
    },
    scrapedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

listingSchema.index({ platform: 1, category: 1, isActive: 1, scrapedAt: -1 });
listingSchema.index({ category: 1, price: 1, isActive: 1 });
listingSchema.index({ location: 1, category: 1, isActive: 1 });

const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);

module.exports = Listing;
