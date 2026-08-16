import jwt from 'jsonwebtoken';
import { asyncHandler, ErrorResponse } from './error.js';
import { User } from '../models/user.model.js';
import { Store } from '../models/store.model.js';

// Protect Routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check cookies first
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // Fallback to Bearer token in headers
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret');

    // Get user from token and attach to request
    req.user = await User.findById(decoded.id || decoded._id);

    if (!req.user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (!req.user.isActive) {
      return next(new ErrorResponse('User account is deactivated', 403));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized, invalid token', 401));
  }
});

// Authorize Roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user ? req.user.role : 'anonymous'} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Require Approved Vendor
export const requireApprovedVendor = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== 'VENDOR') {
    return next(new ErrorResponse('Access denied. Vendors only.', 403));
  }

  // Find store owned by user
  const store = await Store.findOne({ owner: req.user._id });

  if (!store) {
    return next(new ErrorResponse('No store found for this vendor. Please create one.', 404));
  }

  if (!store.isApproved) {
    return next(new ErrorResponse('Your store is pending admin approval. You cannot list products yet.', 403));
  }

  if (store.status !== 'ACTIVE') {
    return next(new ErrorResponse('Your store is currently inactive.', 403));
  }

  // Attach store to request context for controllers
  req.store = store;
  next();
});
