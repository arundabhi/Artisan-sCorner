import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Calendar, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data?.orders || []);
      } catch (err) {
        toast.error('Failed to load orders history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FAILED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-artisanal-100 text-charcoal';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CONFIRMED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PROCESSING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-artisanal-200 text-charcoal';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-4 animate-pulse">
        <div className="h-8 bg-artisanal-200 rounded w-1/4"></div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-white border border-artisanal-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-serif font-bold text-artisanal-900">My Orders</h1>
        <p className="text-sm text-charcoal-muted mt-1">Track shipping details and review past purchases.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-artisanal-200 rounded-3xl space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="bg-artisanal-100 p-4 rounded-full w-fit mx-auto text-artisanal-400">
            <ShoppingBag size={36} />
          </div>
          <h3 className="text-xl font-serif font-bold text-artisanal-900">No orders found</h3>
          <p className="text-sm text-charcoal-muted max-w-xs mx-auto">
            You haven't placed any orders yet. Discover handcrafted creations to place your first order.
          </p>
          <Link
            to="/products"
            className="bg-artisanal-500 hover:bg-artisanal-600 text-white font-semibold px-6 py-3 rounded-full text-xs shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white border border-artisanal-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Info: Number, Date, Amount */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-artisanal-900">{order.orderNumber}</span>
                  <span className={`border text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${getStatusBadge(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-charcoal-muted font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} /> Total Amount: <span className="font-bold text-charcoal">${order.totalAmount.toFixed(2)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingBag size={14} /> {order.items.reduce((s, i) => s + i.quantity, 0)} Items
                  </span>
                </div>
              </div>

              {/* Right actions: view / status */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Payment Badge */}
                <span className={`border text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full ${getPaymentBadge(order.paymentStatus)}`}>
                  Payment: {order.paymentStatus}
                </span>

                <Link
                  to={`/orders/${order._id}`}
                  className="bg-white hover:bg-artisanal-50 border border-artisanal-300 text-charcoal font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Eye size={14} /> Order Details
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersList;
