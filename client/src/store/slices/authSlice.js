import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  store: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.store = action.payload.store || null;
      state.loading = false;
    },
    authFailure: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.store = null;
      state.error = action.payload;
      state.loading = false;
    },
    updateProfileSuccess: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    updateStoreSuccess: (state, action) => {
      state.store = { ...state.store, ...action.payload };
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.store = null;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
});

export const {
  authStart,
  authSuccess,
  authFailure,
  updateProfileSuccess,
  updateStoreSuccess,
  logoutSuccess,
  setLoading,
} = authSlice.actions;

export default authSlice.reducer;
