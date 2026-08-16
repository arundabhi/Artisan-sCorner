import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { updateQuantity, removeFromCart, syncServerCart } from '../store/slices/cartSlice.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { items, subtotal } = useSelector((state) => state.cart);

  const syncCartToBackend = async (updatedItems) => {
    if (!isAuthenticated) return;
    try {
      const syncPayload = updatedItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }));
      const res = await api.post('/cart', { items: syncPayload });
      dispatch(syncServerCart(res.data));
    } catch (err) {
      console.error('Failed to sync cart to server:', err.message);
    }
  };

  const handleQtyChange = (productId, newQty, stockLimit) => {
    const finalQty = Math.min(Math.max(1, newQty), stockLimit);
    dispatch(updateQuantity({ productId, quantity: finalQty }));
    
    // Sync to backend
    const updatedItems = items.map((item) =>
      item.product._id === productId ? { ...item, quantity: finalQty } : item
    );
    syncCartToBackend(updatedItems);
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
    toast.success('Item removed from cart');
    
    // Sync to backend
    const updatedItems = items.filter((item) => item.product._id !== productId);
    syncCartToBackend(updatedItems);
  };

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-serif font-bold text-artisanal-900">Shopping Cart</h1>
        <p className="text-sm text-charcoal-muted mt-1">Review your handcrafted selections.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-artisanal-200 rounded-3xl space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="bg-artisanal-100 p-4 rounded-full w-fit mx-auto text-artisanal-400">
            <ShoppingBag size={36} />
          </div>
          <h3 className="text-xl font-serif font-bold text-artisanal-900">Your cart is empty</h3>
          <p className="text-sm text-charcoal-muted max-w-xs mx-auto">
            Choose from woodcrafts, ceramics, leatherwares, and wellness items to start filling your cart.
          </p>
          <Link
            to="/products"
            className="bg-artisanal-500 hover:bg-artisanal-600 text-white font-semibold px-6 py-3 rounded-full text-xs shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            Go to Catalog <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT: Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.product._id}
                className="bg-white border border-artisanal-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Product image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-artisanal-100 flex-shrink-0">
                  <img
                    src={item.product.images[0]?.url || 'https://res.cloudinary.com/demo/image/upload/v1502432214/product-placeholder.png'}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name / Vendor info */}
                <div className="flex-grow space-y-1 text-center sm:text-left">
                  {item.product.store && (
                    <span className="text-xs font-semibold text-artisanal-500 uppercase">
                      {item.product.store.name}
                    </span>
                  )}
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="block text-base font-serif font-semibold text-artisanal-900 hover:text-artisanal-600 transition-colors"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-charcoal-muted font-medium">SKU: {item.product.sku}</p>
                </div>

                {/* Quantity select */}
                <div className="flex items-center border border-artisanal-300 rounded-xl bg-artisanal-50 overflow-hidden w-28 flex-shrink-0">
                  <button
                    onClick={() => handleQtyChange(item.product._id, item.quantity - 1, item.product.stock)}
                    className="p-2.5 text-charcoal hover:bg-artisanal-150 focus:outline-none"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="flex-1 text-center font-bold text-xs">{item.quantity}</span>
                  <button
                    onClick={() => handleQtyChange(item.product._id, item.quantity + 1, item.product.stock)}
                    className="p-2.5 text-charcoal hover:bg-artisanal-150 focus:outline-none"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Pricing / Delete */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:gap-2 w-full sm:w-auto flex-shrink-0">
                  <div className="text-right">
                    <span className="text-base font-bold text-artisanal-900 block">${(item.price * item.quantity).toFixed(2)}</span>
                    <span className="text-xs text-charcoal-muted font-medium">${item.price.toFixed(2)} each</span>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.product._id)}
                    className="text-charcoal-muted hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Summary card */}
          <div className="bg-white border border-artisanal-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-serif font-bold text-lg text-artisanal-900 border-b border-artisanal-150 pb-3">
              Order Summary
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-muted">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-bold text-artisanal-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-charcoal-muted">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-xs text-charcoal-muted">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>
              
              <div className="text-[11px] bg-artisanal-100 p-3 rounded-lg text-artisanal-700 leading-normal">
                Includes platform commissions to support vendor tools, security protocols, and hosting services.
              </div>

              <div className="border-t border-artisanal-150 pt-4 flex justify-between items-baseline">
                <span className="font-serif font-bold text-base text-artisanal-900">Estimated Total</span>
                <span className="font-bold text-2xl text-artisanal-900">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(isAuthenticated ? '/checkout' : '/login?redirect=/checkout')}
              className="w-full bg-clay hover:bg-clay-dark text-white rounded-xl py-3.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>
            <div className="text-center">
              <Link to="/products" className="text-xs font-semibold text-artisanal-600 hover:underline">
                Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Cart;
