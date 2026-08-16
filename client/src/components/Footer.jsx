import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-artisanal-900 text-artisanal-200 border-t border-artisanal-800">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & About */}
          <div className="space-y-4">
            <span className="text-2xl font-serif font-bold text-white tracking-tight">
              Artisan's Corner
            </span>
            <p className="text-sm text-artisanal-300">
              A curated space dedicated to the craftsmanship of local creators. Bringing unique, slow-made goods directly to your home.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-serif font-semibold mb-4 text-lg">Shop Directory</h3>
            <ul className="space-y-2 text-sm text-artisanal-300">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/products?category=Kitchenware" className="hover:text-white transition-colors">Kitchenware</Link></li>
              <li><Link to="/products?category=Ceramics" className="hover:text-white transition-colors">Ceramics & Pottery</Link></li>
              <li><Link to="/products?category=Home Decor" className="hover:text-white transition-colors">Home Decor</Link></li>
            </ul>
          </div>

          {/* Becoming Seller */}
          <div>
            <h3 className="text-white font-serif font-semibold mb-4 text-lg">Our Platform</h3>
            <ul className="space-y-2 text-sm text-artisanal-300">
              <li><Link to="/become-vendor" className="hover:text-white transition-colors">Become a Seller</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Artisan Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Fulfillment Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-white font-serif font-semibold text-lg">Join the Circle</h3>
            <p className="text-sm text-artisanal-300">
              Receive updates on new collection drops, artisan spotlight interviews, and seasonal stories.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email..."
                className="w-full bg-artisanal-800 border border-artisanal-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-artisanal-500 text-white"
                required
              />
              <button type="submit" className="bg-artisanal-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-artisanal-600">
                Subscribe
              </button>
            </form>
          </div>

        </div>

        <div className="border-t border-artisanal-800 mt-12 pt-8 text-center text-xs text-artisanal-400 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Artisan's Corner Marketplace. All rights reserved.</p>
          <p className="flex items-center gap-1 justify-center">
            Handcrafted with <Heart size={12} className="text-clay fill-clay animate-pulse" /> for local commerce.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
