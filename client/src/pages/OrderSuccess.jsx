import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice.js';
import api from '../api/axios.js';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'AC-SAMPLE-123';
  const sessionId = searchParams.get('session_id');
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearCart());
    
    if (sessionId) {
      const verifyPayment = async () => {
        try {
          await api.get('/payments/verify', {
            params: { session_id: sessionId }
          });
        } catch (err) {
          console.error('Failed to verify Stripe payment session:', err);
        }
      };
      verifyPayment();
    }
  }, [sessionId, dispatch]);

  return (
    <div className="max-w-md mx-auto my-16 bg-white border border-artisanal-200 shadow-xl rounded-3xl p-8 sm:p-10 text-center space-y-6">
      
      {/* Icon */}
      <div className="text-green-500 flex justify-center animate-bounce">
        <CheckCircle2 size={64} className="fill-green-50" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-artisanal-900">Order Completed!</h1>
        <p className="text-sm text-charcoal-muted leading-relaxed">
          Thank you for supporting local craft makers. Your payment was securely confirmed.
        </p>
      </div>

      {/* Order Info */}
      <div className="bg-artisanal-50 border border-artisanal-200 rounded-2xl p-5 space-y-1">
        <span className="text-xs text-charcoal-muted uppercase font-bold tracking-wider block">Order Number</span>
        <span className="text-lg font-mono font-bold text-artisanal-900">{orderNumber}</span>
      </div>

      <p className="text-xs text-charcoal-muted/70 max-w-xs mx-auto leading-normal">
        A receipt has been dispatched to your email address. You can track this shipment status from your account panel.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-4">
        <Link
          to="/orders"
          className="bg-artisanal-500 hover:bg-artisanal-600 text-white rounded-xl py-3.5 text-sm font-semibold shadow flex items-center justify-center gap-2"
        >
          <ShoppingBag size={16} /> Track My Orders
        </Link>
        <Link
          to="/products"
          className="text-xs font-semibold text-charcoal hover:underline flex items-center justify-center gap-1"
        >
          Continue Shopping <ArrowRight size={12} />
        </Link>
      </div>

    </div>
  );
};

export default OrderSuccess;
