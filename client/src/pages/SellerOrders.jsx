import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag, Eye, Calendar, DollarSign, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const [updatingItemId, setUpdatingItemId] = useState('');

  const handleStatusChange = async (orderId, itemId, newStatus) => {
    setUpdatingItemId(itemId);
    try {
      const res = await api.patch(`/orders/${orderId}/item-status`, {
        itemId,
        status: newStatus,
      });

      // Filter items to only keep this vendor's items (unless admin)
      const updatedOrder = res.data;
      if (user && user.role !== 'ADMIN') {
        updatedOrder.items = updatedOrder.items.filter(
          (item) => item.vendor.toString() === user._id.toString() || item.vendor === user._id.toString()
        );
      }

      setOrders((prevOrders) =>
        prevOrders.map((o) => (o._id === orderId ? updatedOrder : o))
      );
      toast.success(`Delivery status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update delivery status');
    } finally {
      setUpdatingItemId('');
    }
  };

  useEffect(() => {
    const fetchSellerOrders = async () => {
      try {
        const res = await api.get('/orders/vendor');
        setOrders(res.data?.orders || []);
      } catch (err) {
        toast.error('Failed to load vendor orders');
      } finally {
        setLoading(false);
      }
    };
    fetchSellerOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'SHIPPED':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'CONFIRMED':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'PROCESSING':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-charcoal bg-artisanal-100 border-artisanal-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <Loader2 className="animate-spin text-artisanal-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-serif font-bold text-artisanal-900">Ship Orders</h1>
        <p className="text-sm text-charcoal-muted mt-1">Review payouts, print shipping slips, and update logistics.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-artisanal-200 rounded-3xl space-y-4 shadow-sm max-w-xl mx-auto">
          <div className="bg-artisanal-100 p-4 rounded-full w-fit mx-auto text-artisanal-400">
            <ShoppingBag size={36} />
          </div>
          <h3 className="text-xl font-serif font-bold text-artisanal-900">No orders found</h3>
          <p className="text-sm text-charcoal-muted max-w-xs mx-auto">
            You haven't received any customer purchases yet. When a buyer checks out, order logs will populate here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white border border-artisanal-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-6"
            >
              {/* Top Banner: Number, Date, Status */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-artisanal-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-base text-artisanal-900">{order.orderNumber}</span>
                  <span className={`border text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${getStatusColor(order.paymentStatus === 'PAID' ? 'CONFIRMED' : 'PROCESSING')}`}>
                    Payment: {order.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-charcoal-muted font-medium">
                  <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Middle Section: Items list & Payout details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Items */}
                <div className="md:col-span-2 space-y-3">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-artisanal-100 flex-shrink-0">
                        <img src={
                          item.image?.match(/url:\s*['"]([^'"]+)['"]/)?.[1] ||
                          "/placeholder.png"
                        } alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-artisanal-900 truncate">{item.productName}</h4>
                        <p className="text-[10px] text-charcoal-muted">Qty: {item.quantity} • ${item.unitPrice.toFixed(2)} each</p>
                      </div>
                      {user && (user.role === 'ADMIN' || item.vendor?.toString() === user._id?.toString() || item.vendor === user._id) ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="bg-artisanal-50 border border-artisanal-300 rounded-lg py-1 px-2 text-[10px] focus:outline-none focus:border-artisanal-500 font-semibold"
                            value={item.deliveryStatus}
                            disabled={updatingItemId === item._id}
                            onChange={(e) => handleStatusChange(order._id, item._id, e.target.value)}
                          >
                            <option value="PROCESSING">Processing</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                          {updatingItemId === item._id && <Loader2 size={12} className="animate-spin text-charcoal-muted" />}
                        </div>
                      ) : (
                        <span className={`border text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${getStatusColor(item.deliveryStatus)}`}>
                          {item.deliveryStatus}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="bg-artisanal-50/50 p-4 rounded-xl border border-artisanal-200 space-y-2 text-xs">
                  <div className="flex justify-between text-charcoal-muted">
                    <span>Subtotal Share</span>
                    <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-charcoal-muted">
                    <span>Platform Commission</span>
                    <span>-${order.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-bold border-t border-artisanal-200 pt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={14} /> Net Payout
                    </span>
                    <span>+${order.vendorPayout.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom details links */}
              <div className="flex justify-end pt-2">
                <Link
                  to={`/orders/${order._id}`}
                  className="bg-white hover:bg-artisanal-50 border border-artisanal-300 text-charcoal font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Eye size={14} /> View Details <ArrowRight size={12} />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
