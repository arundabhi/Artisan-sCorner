import React from 'react';
import { useSelector } from 'react-redux';
import { Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';

const Wishlist = () => {
  const wishlistItems = useSelector((state) => state.wishlist.products);

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-serif font-bold text-artisanal-900">My Wishlist</h1>
        <p className="text-sm text-charcoal-muted mt-1">Your bookmarked and saved handcrafted items.</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-20 bg-white border border-artisanal-200 rounded-3xl space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="bg-artisanal-100 p-4 rounded-full w-fit mx-auto text-artisanal-400">
            <Heart size={36} />
          </div>
          <h3 className="text-xl font-serif font-bold text-artisanal-900">Your wishlist is empty</h3>
          <p className="text-sm text-charcoal-muted max-w-xs mx-auto">
            Browse our artisan collections and add items you love to your personal bookmark list.
          </p>
          <Link
            to="/products"
            className="bg-artisanal-500 hover:bg-artisanal-600 text-white font-semibold px-6 py-3 rounded-full text-xs shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            Start Exploring <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlistItems.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
