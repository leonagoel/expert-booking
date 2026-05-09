const Expert = require('../models/Expert');

// GET /api/experts
const getExperts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 6,
      category,
      search,
      sortBy = 'rating',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { specialization: { $regex: search.trim(), $options: 'i' } },
        { tags: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = {};
    const allowedSort = ['rating', 'experience', 'hourlyRate', 'reviewCount'];
    sortOptions[allowedSort.includes(sortBy) ? sortBy : 'rating'] = sortOrder;

    const [experts, total] = await Promise.all([
      Expert.find(query)
        .select('-availableSlots')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Expert.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: experts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalExperts: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/experts/:id
const getExpertById = async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id);

    if (!expert || !expert.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found',
      });
    }

    // Group slots by date and only return future dates
    const today = new Date().toISOString().split('T')[0];
    const groupedSlots = {};

    expert.availableSlots.forEach((slot) => {
      if (slot.date >= today) {
        if (!groupedSlots[slot.date]) {
          groupedSlots[slot.date] = [];
        }
        groupedSlots[slot.date].push({
          _id: slot._id,
          time: slot.time,
          isBooked: slot.isBooked,
        });
      }
    });

    // Sort slots within each date
    Object.keys(groupedSlots).forEach((date) => {
      groupedSlots[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    const expertObj = expert.toObject();
    delete expertObj.availableSlots;

    res.json({
      success: true,
      data: {
        ...expertObj,
        slotsByDate: groupedSlots,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/experts/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Expert.distinct('category', { isActive: true });
    res.json({ success: true, data: ['All', ...categories.sort()] });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExperts, getExpertById, getCategories };
