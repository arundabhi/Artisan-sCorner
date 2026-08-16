import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authStart, authSuccess, authFailure } from '../store/slices/authSlice.js';
import { syncServerCart } from '../store/slices/cartSlice.js';
import { setWishlist } from '../store/slices/wishlistSlice.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (data) => {
    setSubmitting(true);
    dispatch(authStart());
    try {
      // 1. Authenticate user
      const authRes = await api.post('/auth/login', data);
      
      // 2. Fetch user detail & store profile if seller
      const profileRes = await api.get('/auth/me');
      dispatch(authSuccess({
        user: profileRes.data.user,
        store: profileRes.data.store,
      }));

      // 3. Sync local cart items to DB
      const localCartItems = JSON.parse(localStorage.getItem('cart_items') || '[]');
      if (localCartItems.length > 0) {
        const cartSyncPayload = localCartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
        }));
        
        try {
          const cartRes = await api.post('/cart', { items: cartSyncPayload });
          dispatch(syncServerCart(cartRes.data));
        } catch (cartErr) {
          console.error('Failed to sync guest cart on login:', cartErr);
        }
      } else {
        // Sync whatever was on the server to Redux
        try {
          const cartRes = await api.get('/cart');
          dispatch(syncServerCart(cartRes.data));
        } catch (cartErr) {
          console.error('Failed to load server cart:', cartErr);
        }
      }

      // 4. Fetch buyer wishlist
      try {
        const wishlistRes = await api.get('/wishlist');
        dispatch(setWishlist(wishlistRes.data.products));
      } catch (wishlistErr) {
        console.error('Failed to fetch wishlist:', wishlistErr);
      }

      toast.success('Successfully logged in!');
      navigate(from, { replace: true });
    } catch (err) {
      const errMsg = err.message || 'Login failed';
      dispatch(authFailure(errMsg));
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-artisanal-200 shadow-xl overflow-hidden p-8 sm:p-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-artisanal-900 mb-2">Welcome Back</h2>
        <p className="text-sm text-charcoal-muted">Sign in to browse and checkout handcrafted items.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
            Email Address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 transition-colors ${
              errors.email ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
            }`}
            {...register('email')}
          />
          {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email.message}</span>}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-medium text-artisanal-600 hover:underline">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-artisanal-500 transition-colors ${
                errors.password ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-charcoal-muted hover:text-charcoal"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-artisanal-500 hover:bg-artisanal-600 text-white rounded-xl py-3.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="text-center mt-8 pt-6 border-t border-artisanal-100 text-sm">
        <span className="text-charcoal-muted">Don't have an account? </span>
        <Link to="/register" className="font-semibold text-artisanal-600 hover:underline">
          Register Here
        </Link>
      </div>
    </div>
  );
};

export default Login;
