import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShoppingBag, ChevronLeft, Shield, Loader2 } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const checkoutSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(5, 'Contact phone number is required'),
});

const Checkout = () => {
  const { items, subtotal } = useSelector((state) => state.cart);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
  });

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-artisanal-200 rounded-3xl max-w-lg mx-auto">
        <h3 className="text-xl font-serif font-bold text-artisanal-900">Your cart is empty</h3>
        <Link to="/products" className="text-artisanal-500 underline mt-2 block">Go shopping</Link>
      </div>
    );
  }

  const handleAddressSubmit = async (data) => {
    setLoading(true);
    try {
      const shippingAddress = {
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
      };

      const res = await api.post('/orders', { shippingAddress });
      const { sessionUrl } = res.data;
      
      if (sessionUrl) {
        toast.loading('Redirecting to secure Stripe Checkout...');
        window.location.href = sessionUrl;
      } else {
        throw new Error('Payment session URL not returned from server');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to initialize order. Check item stock levels.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start py-4">
      
      {/* LEFT: Shipping Information */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-artisanal-200 rounded-3xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-serif font-bold text-artisanal-900 border-b border-artisanal-100 pb-4">
            Shipping Information
          </h2>

          <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted mb-2">Street Address</label>
              <input
                type="text"
                placeholder="e.g. 123 Maple Ln"
                className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                  errors.street ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
                }`}
                {...register('street')}
              />
              {errors.street && <span className="text-xs text-red-500 mt-1 block">{errors.street.message}</span>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-charcoal-muted mb-2">City</label>
                <input
                  type="text"
                  placeholder="Portland"
                  className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                    errors.city ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
                  }`}
                  {...register('city')}
                />
                {errors.city && <span className="text-xs text-red-500 mt-1 block">{errors.city.message}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-2">State</label>
                <input
                  type="text"
                  placeholder="OR"
                  className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                    errors.state ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
                  }`}
                  {...register('state')}
                />
                {errors.state && <span className="text-xs text-red-500 mt-1 block">{errors.state.message}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-muted mb-2">ZIP Code</label>
                <input
                  type="text"
                  placeholder="97201"
                  className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                    errors.postalCode ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
                  }`}
                  {...register('postalCode')}
                />
                {errors.postalCode && <span className="text-xs text-red-500 mt-1 block">{errors.postalCode.message}</span>}
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-charcoal-muted mb-2">Country</label>
                <input
                  type="text"
                  placeholder="United States"
                  className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                    errors.country ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
                  }`}
                  {...register('country')}
                />
                {errors.country && <span className="text-xs text-red-500 mt-1 block">{errors.country.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-muted mb-2">Contact Phone</label>
              <input
                type="text"
                placeholder="e.g. 503-555-0199"
                className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                  errors.phone ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
                }`}
                {...register('phone')}
              />
              {errors.phone && <span className="text-xs text-red-500 mt-1 block">{errors.phone.message}</span>}
            </div>

            <div className="pt-4 flex justify-between items-center">
              <Link to="/cart" className="flex items-center gap-1 text-sm font-semibold text-charcoal hover:underline">
                <ChevronLeft size={16} /> Return to Cart
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-clay hover:bg-clay-dark text-white rounded-xl px-8 py-3 text-sm font-semibold shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT: Cart Details Summary */}
      <div className="bg-white border border-artisanal-200 rounded-3xl p-6 shadow-sm space-y-6">
        <h3 className="font-serif font-bold text-lg text-artisanal-900 border-b border-artisanal-150 pb-3 flex items-center gap-2">
          <ShoppingBag size={18} /> Review Items
        </h3>

        <div className="divide-y divide-artisanal-100 max-h-96 overflow-y-auto pr-2">
          {items.map((item) => (
            <div key={item.product._id} className="py-4 flex gap-4 items-center">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-artisanal-100 flex-shrink-0">
                <img src={item.product.images[0]?.url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="text-xs font-semibold text-artisanal-900 truncate">{item.product.name}</h4>
                <p className="text-[10px] text-charcoal-muted">Qty: {item.quantity} • ${item.price.toFixed(2)} each</p>
              </div>
              <span className="text-sm font-semibold text-artisanal-900">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-artisanal-150 pt-4 space-y-2">
          <div className="flex justify-between text-xs text-charcoal-muted">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-charcoal-muted">
            <span>Shipping</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>
          <div className="flex justify-between text-xs text-charcoal-muted">
            <span>Tax</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>
          <div className="border-t border-artisanal-100 pt-3 flex justify-between items-baseline">
            <span className="font-serif font-bold text-base text-artisanal-900 font-medium">Order Total</span>
            <span className="font-bold text-xl text-artisanal-900">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2 items-center text-[10px] text-charcoal-muted/80 bg-artisanal-50 p-3 rounded-lg border">
          <Shield size={16} className="text-artisanal-500" />
          <span>SSL secure connection. Stripe checkout handles encryption at the gateway level.</span>
        </div>
      </div>

    </div>
  );
};

export default Checkout;
