const Listing = require('../models/Listing');

/**
 * Search listings with filters
 */
async function searchListings(req, res) {
  try {
    const {
      category,
      platform,
      location,
      minPrice,
      maxPrice,
      search,
      limit = 50,
      skip = 0,
      sortBy = 'scrapedAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }
    if (platform) {
      query.platform = platform;
    }
    if (location) {
      query.location = new RegExp(location, 'i');
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = Number(maxPrice);
      }
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const listings = await Listing.find(query)
      .sort(sort)
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();

    const total = await Listing.countDocuments(query);

    res.json({
      success: true,
      data: listings,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: total > Number(skip) + Number(limit),
      },
    });
  } catch (error) {
    console.error('Error searching listings:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get available categories with counts
 */
async function getCategories(req, res) {
  try {
    const categories = await Listing.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const platforms = await Listing.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      categories: categories.map((c) => ({
        name: c._id,
        count: c.count,
        avgPrice: Math.round(c.avgPrice || 0),
      })),
      platforms: platforms.map((p) => ({
        name: p._id,
        count: p.count,
      })),
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get statistics about listings
 */
async function getStats(req, res) {
  try {
    const totalListings = await Listing.countDocuments({ isActive: true });
    const latestScrape = await Listing.findOne().sort({ scrapedAt: -1 }).lean();

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentListings = await Listing.countDocuments({
      scrapedAt: { $gte: last24Hours },
    });

    res.json({
      success: true,
      stats: {
        totalListings,
        recentListings,
        lastScrapedAt: latestScrape?.scrapedAt || null,
      },
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  searchListings,
  getCategories,
  getStats,
};
