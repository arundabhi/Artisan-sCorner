import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { addToCart } from '../store/slices/cartSlice.js';
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice.js';
import StarsRating from './StarsRating.jsx';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const wishlistItems = useSelector((state) => state.wishlist.products);
  const isFavorited = wishlistItems.some((p) => p._id === product._id);

  const discountPercent =
    product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to edit your wishlist');
      return;
    }
    try {
      const res = await api.post(`/wishlist/${product._id}`);
      if (isFavorited) {
        dispatch(removeFromWishlist(product._id));
        toast.success('Removed from wishlist');
      } else {
        dispatch(addToWishlist(product));
        toast.success('Added to wishlist');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update wishlist');
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-artisanal-200 overflow-hidden hover-lift flex flex-col h-full relative">
      
      {/* Badge (Featured / Sale) */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {discountPercent > 0 && (
          <span className="bg-clay text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shadow-sm">
            Sale -{discountPercent}%
          </span>
        )}
        {product.isFeatured && (
          <span className="bg-artisanal-500 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shadow-sm">
            Featured
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleToggleWishlist}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm border border-artisanal-200 text-charcoal hover:text-clay hover:scale-110 shadow-sm transition-all focus:outline-none"
      >
        <Heart size={16} className={isFavorited ? 'fill-clay text-clay' : ''} />
      </button>

      {/* Image Gallery */}
      <Link to={`/products/${product.slug}`} className="block overflow-hidden relative pt-[100%] bg-artisanal-100">
        <img
          src={product.images[0]?.url || 'https://res.cloudinary.com/demo/image/upload/v1502432214/product-placeholder.png'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Quick View overlay */}
        <div className="absolute inset-0 bg-artisanal-900/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <span className="bg-white/95 backdrop-blur-sm text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Eye size={14} /> View Details
          </span>
        </div>
      </Link>

      {/* Info */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Vendor Store */}
        {product.store && (
          <Link
            to={`/stores/${product.store.slug}`}
            className="text-xs font-semibold tracking-wider text-artisanal-500 uppercase hover:underline mb-1 block"
          >
            {product.store.name}
          </Link>
        )}

        {/* Product Title */}
        <Link to={`/products/${product.slug}`} className="flex-1">
          <h3 className="text-base font-serif font-semibold text-artisanal-900 group-hover:text-artisanal-700 transition-colors line-clamp-1 mb-1">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <StarsRating rating={product.rating} size={13} />
          <span className="text-[11px] text-charcoal-muted font-medium">({product.numReviews})</span>
        </div>

        {/* Stock status */}
        <div className="mb-4">
          {product.stock === 0 ? (
            <span className="text-[11px] font-bold text-red-500 uppercase tracking-wide">Out of stock</span>
          ) : product.stock <= 3 ? (
            <span className="text-[11px] font-bold text-clay uppercase tracking-wide">Only {product.stock} left!</span>
          ) : (
            <span className="text-[11px] font-medium text-green-600 uppercase tracking-wide">In Stock</span>
          )}
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-artisanal-100">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-artisanal-900">${product.price.toFixed(2)}</span>
            {product.compareAtPrice > product.price && (
              <span className="text-xs text-charcoal-muted line-through font-medium">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`p-2 rounded-full transition-all focus:outline-none ${
              product.stock === 0
                ? 'bg-artisanal-200 text-artisanal-400 cursor-not-allowed'
                : 'bg-artisanal-100 hover:bg-artisanal-500 text-charcoal-muted hover:text-white border border-artisanal-300 hover:border-artisanal-500'
            }`}
          >
            <ShoppingCart size={16} />
          </button>
        </div>

      </div>

    </div>
  );
};

export default ProductCard;
