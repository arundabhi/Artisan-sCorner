import Product from '../models/Product.js';

/**
 * Service to retrieve products with pagination, search, sorting, and filters.
 * @param {Object} queryParams - Express req.query object.
 * @returns {Promise<{products: Array, page: number, pages: number, total: number}>}
 */
export const queryProducts = async (queryParams) => {
  const {
    page = 1,
    limit = 9,
    search,
    category,
    minPrice,
    maxPrice,
    minRating,
    vendor,
    store,
    sort,
  } = queryParams;

  const query = { isActive: true };

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Vendor or Store filtering
  if (vendor) {
    query.vendor = vendor;
  }
  if (store) {
    query.store = store;
  }

  // Price range filtering
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }

  // Rating filtering
  if (minRating !== undefined) {
    query.rating = { $gte: Number(minRating) };
  }

  // Page index parsing
  const pageIndex = Math.max(1, Number(page));
  const limitValue = Math.max(1, Number(limit));
  const skip = (pageIndex - 1) * limitValue;

  // Sorting
  let sortOption = { createdAt: -1 }; // Default newest first
  if (sort) {
    switch (sort) {
      case 'priceAsc':
        sortOption = { price: 1 };
        break;
      case 'priceDesc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
  }

  // Execute database query with lean parsing for performance
  const products = await Product.find(query)
    .populate('store', 'name slug logo')
    .populate('vendor', 'name')
    .sort(sortOption)
    .skip(skip)
    .limit(limitValue)
    .lean();

  const total = await Product.countDocuments(query);

  return {
    products,
    page: pageIndex,
    pages: Math.ceil(total / limitValue),
    total,
  };
};
