import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, Heart, User, Search, Menu, X, LogOut, LayoutDashboard, Store } from 'lucide-react';
import { logoutSuccess } from '../store/slices/authSlice.js';
import { clearCart } from '../store/slices/cartSlice.js';
import { clearWishlist } from '../store/slices/wishlistSlice.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.products);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(logoutSuccess());
      dispatch(clearCart());
      dispatch(clearWishlist());
      toast.success('Logged out successfully');
      navigate('/');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  const categories = ['Kitchenware', 'Ceramics', 'Home Decor', 'Leather Goods', 'Wellness'];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-artisanal-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-3xl font-serif font-bold tracking-tight text-gradient">
                Artisan's Corner
              </span>
            </Link>
          </div>

          {/* Search Bar Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input
              type="text"
              placeholder="Search handcrafted products..."
              className="w-full bg-artisanal-100 border border-artisanal-300 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:border-artisanal-500 text-sm transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-2.5 text-charcoal-muted hover:text-artisanal-500">
              <Search size={18} />
            </button>
          </form>

          {/* Icons & Actions */}
          <div className="hidden md:flex items-center gap-6">
            
            {/* Wishlist */}
            <Link to="/wishlist" className="relative text-charcoal-muted hover:text-artisanal-500 transition-colors p-1">
              <Heart size={22} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-clay text-white text-[10px] w-4.5 h-4.5 font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative text-charcoal-muted hover:text-artisanal-500 transition-colors p-1">
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-artisanal-500 text-white text-[10px] w-4.5 h-4.5 font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              {isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 focus:outline-none p-1 text-charcoal-muted hover:text-artisanal-500 transition-colors"
                  >
                    <User size={22} />
                    <span className="text-sm font-medium hidden lg:inline max-w-[120px] truncate">
                      {user?.name ? user.name.split(' ')[0] : ''}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-52 bg-white border border-artisanal-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 border-b border-artisanal-100">
                        <p className="text-xs text-charcoal-muted">Signed in as</p>
                        <p className="text-sm font-semibold truncate text-artisanal-900">{user?.email || ''}</p>
                      </div>

                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/dashboard/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal hover:bg-artisanal-50 transition-colors"
                        >
                          <LayoutDashboard size={16} /> Admin Panel
                        </Link>
                      )}

                      {user?.role === 'VENDOR' && (
                        <Link
                          to="/dashboard/seller"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal hover:bg-artisanal-50 transition-colors"
                        >
                          <Store size={16} /> Seller Dashboard
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal hover:bg-artisanal-50 transition-colors"
                      >
                        <User size={16} /> Edit Profile
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal hover:bg-artisanal-50 transition-colors"
                      >
                        <ShoppingBag size={16} /> My Orders
                      </Link>

                      {user?.role === 'BUYER' && (
                        <Link
                          to="/become-vendor"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-clay font-medium hover:bg-artisanal-50 transition-colors"
                        >
                          <Store size={16} /> Open Shop
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-artisanal-100 mt-1"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-charcoal hover:text-artisanal-500 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-artisanal-500 hover:bg-artisanal-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm hover:shadow transition-all"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>

          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <Link to="/cart" className="relative text-charcoal-muted p-1">
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-artisanal-500 text-white text-[10px] w-4.5 h-4.5 font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-charcoal-muted focus:outline-none p-1"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>

        </div>
      </div>

      {/* Categories Bar (Desktop) */}
      <div className="hidden md:block border-t border-artisanal-100 bg-artisanal-50/50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8 h-10">
          <Link to="/products" className="text-xs font-semibold tracking-wider uppercase text-charcoal hover:text-artisanal-500 transition-colors">
            All Creations
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${encodeURIComponent(cat)}`}
              className="text-xs font-medium tracking-wider uppercase text-charcoal-muted hover:text-artisanal-500 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-artisanal-200 bg-white py-4 px-6 space-y-4 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search handcrafted..."
              className="w-full bg-artisanal-100 border border-artisanal-300 rounded-full py-2 pl-4 pr-10 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-2.5 text-charcoal-muted">
              <Search size={18} />
            </button>
          </form>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold py-2 border-b border-artisanal-100"
            >
              All Creations
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${encodeURIComponent(cat)}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-charcoal-muted py-2 border-b border-artisanal-100"
              >
                {cat}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 py-2">
                  <User size={18} className="text-charcoal-muted" />
                  <span className="font-semibold text-charcoal">{user?.name || ''}</span>
                </div>
                
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/dashboard/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-charcoal py-2 pl-4 border-l-2 border-artisanal-500"
                  >
                    Admin Panel
                  </Link>
                )}

                {user?.role === 'VENDOR' && (
                  <Link
                    to="/dashboard/seller"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-charcoal py-2 pl-4 border-l-2 border-artisanal-500"
                  >
                    Seller Dashboard
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-charcoal py-2 pl-4 border-l-2 border-artisanal-200"
                >
                  My Profile
                </Link>

                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-charcoal py-2 pl-4 border-l-2 border-artisanal-200"
                >
                  My Orders
                </Link>

                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-charcoal py-2 pl-4 border-l-2 border-artisanal-200"
                >
                  My Wishlist ({wishlistCount})
                </Link>

                {user?.role === 'BUYER' && (
                  <Link
                    to="/become-vendor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-clay font-medium py-2 pl-4 border-l-2 border-clay"
                  >
                    Open Shop
                  </Link>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left text-sm text-red-600 py-3 border-t border-artisanal-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center border border-artisanal-300 py-2.5 rounded-full text-sm font-semibold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-artisanal-500 text-white py-2.5 rounded-full text-sm font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
