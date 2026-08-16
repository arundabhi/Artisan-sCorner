import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Store } from "../models/store.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinary.service.js";
import { ROLES } from "../constants.js";

const generateUniqueSlug = async (name, excludeProductId = null) => {
  const baseSlug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const query = { slug };
    if (excludeProductId) {
      query._id = { $ne: excludeProductId };
    }
    const existing = await Product.findOne(query);
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  return slug;
};

/**
 * @desc Create a new product
 * @route POST /api/v1/products
 * @access Private (approved vendor only)
 */
const createProduct = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VENDOR) {
    throw new ApiError(403, "Only approved vendors can create products");
  }

  const store = await Store.findOne({
    owner: req.user._id,
    isApproved: true,
  });

  if (!store) {
    throw new ApiError(403, "You must have an approved store to add products");
  }

  const {
    name,
    description,
    category,
    price,
    compareAtPrice,
    stock,
    sku,
  } = req.body;

  if (!name?.trim() || !description?.trim() || !category?.trim()) {
    throw new ApiError(400, "Name, description and category are required");
  }

  const numericPrice = Number(price);
  const numericStock = Number(stock);

  if (Number.isNaN(numericPrice) || numericPrice <= 0) {
    throw new ApiError(400, "Price must be a valid positive number");
  }

  if (Number.isNaN(numericStock) || numericStock < 0) {
    throw new ApiError(400, "Stock must be a valid non-negative number");
  }

  if (
    compareAtPrice !== undefined &&
    (Number.isNaN(Number(compareAtPrice)) || Number(compareAtPrice) < numericPrice)
  ) {
    throw new ApiError(
      400,
      "Compare-at price must be a number greater than or equal to the price"
    );
  }

  const imageFiles = req.files || [];
  if (!imageFiles.length) {
    throw new ApiError(400, "At least one product image is required");
  }

  const uploadedImages = [];
  for (const file of imageFiles) {
    const uploaded = await uploadOnCloudinary(file.path);
    if (uploaded?.url) {
      uploadedImages.push({
        url: uploaded.secure_url || uploaded.url,
        publicId: uploaded.public_id || "test_public_id",
      });
    }
  }

  if (!uploadedImages.length) {
    throw new ApiError(500, "Failed to upload product images");
  }

  const slug = await generateUniqueSlug(name);

  const product = await Product.create({
    vendor: req.user._id,
    store: store._id,
    name: name.trim(),
    slug,
    description,
    category,
    price: numericPrice,
    compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
    images: uploadedImages,
    stock: numericStock,
    sku,
    isActive: true,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product created successfully"));
});

/**
 * @desc Get products with pagination, filtering and sorting
 * @route GET /api/v1/products
 * @access Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    vendor,
    minPrice,
    maxPrice,
    minRating,
    sort = "-createdAt",
  } = req.query;

  const filter = { isActive: true };

  if (category) filter.category = category;
  if (vendor && mongoose.isValidObjectId(vendor)) filter.vendor = vendor;
  if (minRating) filter.rating = { $gte: Number(minRating) };

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("vendor", "name")
      .populate("store", "name slug logo")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Products fetched successfully"
    )
  );
});

/**
 * @desc Get a single product by ID
 * @route GET /api/v1/products/:productId
 * @access Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  let product;

  if (mongoose.isValidObjectId(productId)) {
    product = await Product.findById(productId)
      .populate("vendor", "name")
      .populate("store", "name slug logo")
      .lean();
  } else {
    product = await Product.findOne({ slug: productId, isActive: true })
      .populate("vendor", "name")
      .populate("store", "name slug logo")
      .lean();
  }

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/**
 * @desc Get a single product by slug
 * @route GET /api/v1/products/slug/:slug
 * @access Public
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug, isActive: true })
    .populate("vendor", "name")
    .populate("store", "name slug logo")
    .lean();

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/**
 * @desc Update a product (owner vendor only)
 * @route PATCH /api/v1/products/:productId
 * @access Private (vendor - owner only)
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.vendor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own products");
  }

  const allowedFields = [
    "name",
    "description",
    "category",
    "price",
    "compareAtPrice",
    "stock",
    "sku",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  }

  if (req.body.price !== undefined) {
    const numericPrice = Number(req.body.price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      throw new ApiError(400, "Price must be a valid positive number");
    }
    product.price = numericPrice;
  }

  if (req.body.stock !== undefined) {
    const numericStock = Number(req.body.stock);
    if (Number.isNaN(numericStock) || numericStock < 0) {
      throw new ApiError(400, "Stock must be a valid non-negative number");
    }
    product.stock = numericStock;
  }

  if (req.body.name && req.body.name.trim() !== product.name) {
    product.slug = await generateUniqueSlug(req.body.name, product._id);
  }

  // Support adding new images without removing existing ones
  const imageFiles = req.files || [];
  if (imageFiles.length) {
    for (const file of imageFiles) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded?.url) {
        product.images.push({
          url: uploaded.secure_url || uploaded.url,
          publicId: uploaded.public_id || "test_public_id",
        });
      }
    }
  }

  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product updated successfully"));
});

/**
 * @desc Delete a product (owner vendor only)
 * @route DELETE /api/v1/products/:productId
 * @access Private (vendor - owner only)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.vendor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own products");
  }

  for (const imageUrl of product.images || []) {
    try {
      await deleteFromCloudinary(imageUrl);
    } catch (error) {
      // Non-fatal: continue cleanup even if one image fails to delete
    }
  }

  await product.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Product deleted successfully"));
});

/**
 * @desc Get all products belonging to the logged-in vendor
 * @route GET /api/v1/products/vendor/me
 * @access Private (vendor)
 */
const getVendorProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find({ vendor: req.user._id })
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments({ vendor: req.user._id }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Vendor products fetched successfully"
    )
  );
});

/**
 * @desc Get featured products
 * @route GET /api/v1/products/featured
 * @access Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate("vendor", "name")
    .populate("store", "name slug logo")
    .sort("-createdAt")
    .limit(Number(limit))
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, products, "Featured products fetched successfully"));
});

/**
 * @desc Full-text search products by name/description
 * @route GET /api/v1/products/search
 * @access Public
 */
const searchProducts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q?.trim()) {
    throw new ApiError(400, "Search query is required");
  }

  const filter = {
    isActive: true,
    $or: [
      { name: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ],
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("vendor", "name")
      .populate("store", "name slug logo")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Search results fetched successfully"
    )
  );
});

/**
 * @desc Get products by category
 * @route GET /api/v1/products/category/:category
 * @access Public
 */
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 20, sort = "-createdAt" } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const filter = { category, isActive: true };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("vendor", "name")
      .populate("store", "name slug logo")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Products fetched successfully"
    )
  );
});

/**
 * @desc Toggle a product's active status (owner vendor only)
 * @route PATCH /api/v1/products/:productId/toggle-status
 * @access Private (vendor - owner only)
 */
const toggleProductStatus = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.vendor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only modify your own products");
  }

  product.isActive = !product.isActive;
  await product.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        product,
        `Product ${product.isActive ? "activated" : "deactivated"} successfully`
      )
    );
});

export {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  getFeaturedProducts,
  searchProducts,
  getProductsByCategory,
  toggleProductStatus,
};
