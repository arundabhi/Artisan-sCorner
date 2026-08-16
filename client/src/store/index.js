import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import cartReducer from './slices/cartSlice.js';
import wishlistReducer from './slices/wishlistSlice.js';
import api from '../api/axios.js';

const cartSyncMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  const cartActions = [
    'cart/addToCart',
    'cart/updateQuantity',
    'cart/removeFromCart',
    'cart/clearCart',
  ];

  if (cartActions.includes(action.type)) {
    const state = store.getState();
    const { isAuthenticated } = state.auth;
    const { items } = state.cart;

    if (isAuthenticated) {
      const syncPayload = items.map((item) => ({
        product: item.product?._id || item.product,
        quantity: item.quantity,
      }));

      api.post('/cart', { items: syncPayload }).catch((err) => {
        console.error('Failed to sync cart to backend via middleware:', err.message);
      });
    }
  }

  return result;
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cartSyncMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
