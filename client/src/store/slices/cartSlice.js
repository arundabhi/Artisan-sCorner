
import { createSlice } from '@reduxjs/toolkit';

const loadLocalCart = () => {
  try {
    const savedCart = localStorage.getItem('cart_items');

    if (!savedCart) {
      return [];
    }

    const parsed = JSON.parse(savedCart);

    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load cart:', err);
    return [];
  }
};

const calculateSubtotal = (items) => {
  return items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
};

const initialItems = loadLocalCart();

const initialState = {
  items: initialItems,
  subtotal: calculateSubtotal(initialItems),
  loading: false,
};

const saveLocalCart = (items) => {
  try {
    localStorage.setItem('cart_items', JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save cart:', err);
  }
};

const cartSlice = createSlice({
  name: 'cart',

  initialState,

  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;

      if (!product?._id) {
        console.error('Invalid product:', product);
        return;
      }

      const stock = Number(product.stock || 0);

      if (stock <= 0) {
        console.warn('Product is out of stock');
        return;
      }

      const existingItem = state.items.find(
        (item) => item.product?._id === product._id
      );

      if (existingItem) {
        existingItem.quantity = Math.min(
          existingItem.quantity + quantity,
          stock
        );

        // Keep price updated
        existingItem.price = product.price;
        existingItem.product = product;
      } else {
        state.items.push({
          product,
          price: Number(product.price),
          vendor: product.vendor,
          quantity: Math.min(quantity, stock),
        });
      }

      state.subtotal = calculateSubtotal(state.items);

      saveLocalCart(state.items);
    },

    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;

      const existingItem = state.items.find(
        (item) => item.product?._id === productId
      );

      if (!existingItem) {
        return;
      }

      const stock = Number(existingItem.product?.stock || 0);

      existingItem.quantity = Math.min(
        Math.max(1, Number(quantity)),
        stock
      );

      state.subtotal = calculateSubtotal(state.items);

      saveLocalCart(state.items);
    },

    removeFromCart: (state, action) => {
      const productId = action.payload;

      state.items = state.items.filter(
        (item) => item.product?._id !== productId
      );

      state.subtotal = calculateSubtotal(state.items);

      saveLocalCart(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;

      saveLocalCart([]);
    },

    syncServerCart: (state, action) => {
      const serverItems = action.payload?.items || [];

      state.items = serverItems.map((item) => ({
        product: item.product,
        price: item.price,
        vendor: item.vendor,
        quantity: item.quantity,
      }));

      state.subtotal = calculateSubtotal(state.items);

      saveLocalCart(state.items);
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  syncServerCart,
} = cartSlice.actions;

export default cartSlice.reducer;

