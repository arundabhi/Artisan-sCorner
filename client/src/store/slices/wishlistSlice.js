import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  loading: false,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlist: (state, action) => {
      state.products = action.payload || [];
    },
    addToWishlist: (state, action) => {
      const product = action.payload;
      if (!state.products.some(p => p._id === product._id)) {
        state.products.push(product);
      }
    },
    removeFromWishlist: (state, action) => {
      const productId = action.payload;
      state.products = state.products.filter(p => p._id !== productId);
    },
    clearWishlist: (state) => {
      state.products = [];
    }
  },
});

export const { setWishlist, addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;

export default wishlistSlice.reducer;
