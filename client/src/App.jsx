import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { authSuccess, authFailure, setLoading } from './store/slices/authSlice.js';
import { syncServerCart } from './store/slices/cartSlice.js';
import { setWishlist } from './store/slices/wishlistSlice.js';
import api from './api/axios.js';

// Layouts
import Layout from './layouts/Layout.jsx';

// Public Pages
import Home from './pages/Home.jsx';
import ProductListing from './pages/ProductListing.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import StoreProfile from './pages/StoreProfile.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Protected Buyer Pages
import Profile from './pages/Profile.jsx';
import BecomeVendor from './pages/BecomeVendor.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import OrdersList from './pages/OrdersList.jsx';
import OrderDetails from './pages/OrderDetails.jsx';
import Wishlist from './pages/Wishlist.jsx';

// Protected Seller Dashboard
import SellerDashboard from './pages/SellerDashboard.jsx';
import SellerProducts from './pages/SellerProducts.jsx';
import SellerProductForm from './pages/SellerProductForm.jsx';
import SellerOrders from './pages/SellerOrders.jsx';

// Protected Admin Dashboard
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminVendors from './pages/AdminVendors.jsx';
import AdminSettings from './pages/AdminSettings.jsx';

// Route Guards
import ProtectedRoute from './components/ProtectedRoute.jsx';

const App = () => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.loading);

  useEffect(() => {
    const bootCheckAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        // Authenticated
        dispatch(
          authSuccess({
            user: res.data.user,
            store: res.data.store,
          })
        );

        // Fetch user cart
        try {
          const cartRes = await api.get('/cart');
          dispatch(syncServerCart(cartRes.data));
        } catch (e) {
          console.error('Failed to restore server cart', e.message);
        }

        // Fetch user wishlist
        try {
          const wishlistRes = await api.get('/wishlist');
          dispatch(setWishlist(wishlistRes.data.products));
        } catch (e) {
          console.error('Failed to restore wishlist', e.message);
        }

      } catch (err) {
        // No active session cookie
        dispatch(authFailure(null));
      } finally {
        dispatch(setLoading(false));
      }
    };

    bootCheckAuth();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-artisanal-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'font-sans text-sm border border-artisanal-200',
          success: {
            iconTheme: {
              primary: '#a3845e',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Main Store Layout Wrapper */}
        <Route path="/" element={<Layout />}>
          {/* Public Pages */}
          <Route index element={<Home />} />
          <Route path="products" element={<ProductListing />} />
          <Route path="products/:slug" element={<ProductDetails />} />
          <Route path="stores/:slug" element={<StoreProfile />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Protected Buyer Routes */}
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="become-vendor"
            element={
              <ProtectedRoute>
                <BecomeVendor />
              </ProtectedRoute>
            }
          />
          <Route
            path="cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="checkout"
            element={
              <ProtectedRoute allowedRoles={['BUYER', 'VENDOR', 'ADMIN']}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="order-success"
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <OrdersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          {/* Protected Seller Dashboard Routes */}
          <Route
            path="dashboard/seller"
            element={
              <ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']}>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/seller/products"
            element={
              <ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']}>
                <SellerProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/seller/products/new"
            element={
              <ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']}>
                <SellerProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/seller/products/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']}>
                <SellerProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/seller/orders"
            element={
              <ProtectedRoute allowedRoles={['VENDOR', 'ADMIN']}>
                <SellerOrders />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Control Panel Routes */}
          <Route
            path="dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/admin/vendors"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminVendors />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
