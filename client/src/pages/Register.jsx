import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authStart, authSuccess, authFailure } from '../store/slices/authSlice.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    dispatch(authStart());
    try {
      const authRes = await api.post('/auth/register', data);
      
      const profileRes = await api.get('/auth/me');
      dispatch(authSuccess({
        user: profileRes.data.user,
        store: profileRes.data.store,
      }));

      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      const errMsg = err.message || 'Registration failed';
      dispatch(authFailure(errMsg));
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-artisanal-200 shadow-xl overflow-hidden p-8 sm:p-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-artisanal-900 mb-2">Create Account</h2>
        <p className="text-sm text-charcoal-muted">Join Artisan's Corner to discover unique creations.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
            Full Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 transition-colors ${
              errors.name ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
            }`}
            {...register('name')}
          />
          {errors.name && <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>}
        </div>

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

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            placeholder="123-456-7890"
            className="w-full bg-artisanal-50 border border-artisanal-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 transition-colors"
            {...register('phone')}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
            Password
          </label>
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
          className="w-full bg-artisanal-500 hover:bg-artisanal-600 text-white rounded-xl py-3.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="text-center mt-8 pt-6 border-t border-artisanal-100 text-sm">
        <span className="text-charcoal-muted">Already have an account? </span>
        <Link to="/login" className="font-semibold text-artisanal-600 hover:underline">
          Login Here
        </Link>
      </div>
    </div>
  );
};

export default Register;
