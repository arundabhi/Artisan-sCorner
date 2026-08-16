import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, CreditCard, MapPin, ShoppingBag, Truck, Check, Loader2 } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const OrderDetails = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        console.log(res.data);

        setOrder(res.data);
      } catch (err) {
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id]);

  const handleStatusChange = async (itemId, newStatus) => {
    setUpdatingItemId(itemId);
    try {
      const res = await api.patch(`/orders/${id}/item-status`, {
        itemId,
        status: newStatus,
      });

      setOrder(res.data);
      toast.success(`Delivery status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update delivery status');
    } finally {
      setUpdatingItemId('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <Loader2 className="animate-spin text-artisanal-500" size={40} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold font-serif text-artisanal-900">Order not found</h3>
        <Link to="/orders" className="text-artisanal-500 underline mt-2 block">Return to orders list</Link>
      </div>
    );
  }

  const isVendor = user?.role === 'VENDOR';
  const isAdmin = user?.role === 'ADMIN';

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

  return (
    <div className="space-y-8 py-4">
      {/* Back button */}
      <div>
        <Link
          to={isVendor && !order.buyer ? "/dashboard/seller" : "/orders"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal hover:underline"
        >
          <ArrowLeft size={14} /> Back to Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-serif font-bold text-artisanal-900 flex items-center gap-3">
              Order: <span className="font-mono">{order.orderNumber}</span>
            </h1>
            <p className="text-xs text-charcoal-muted mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className={`border text-xs uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-full ${getStatusColor(order.orderStatus)}`}>
            {order.orderStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* LEFT: Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-artisanal-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-serif font-bold text-artisanal-900 border-b border-artisanal-100 pb-3 flex items-center gap-2">
              <ShoppingBag size={18} /> Order Items
            </h2>

            <div className="divide-y divide-artisanal-100">
              {order.items.map((item) => (
                <div key={item._id} className="py-5 flex flex-col sm:flex-row items-center gap-6">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-artisanal-100 flex-shrink-0">
                    <img
                      src={
                        item.image?.match(/url:\s*['"]([^'"]+)['"]/)?.[1] ||
                        "/placeholder.png"
                      }
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-grow text-center sm:text-left min-w-0">
                    <h3 className="font-serif font-semibold text-artisanal-900 text-sm truncate">{item.productName}</h3>
                    <p className="text-xs text-charcoal-muted mt-0.5">Qty: {item.quantity} • ${item.unitPrice.toFixed(2)} each</p>

                    {/* Link to leave review if buyer & order delivered */}
                    {order.orderStatus === 'DELIVERED' && !isVendor && !isAdmin && (
                      <Link
                        to={`/products/${item.product?.slug || ''}`}
                        className="text-xs font-semibold text-artisanal-600 hover:underline mt-2 inline-block"
                      >
                        Write a review &rarr;
                      </Link>
                    )}
                  </div>

                  {/* Shipment Status & Update dropdown (For Vendor/Admin) */}
                  <div className="flex flex-col items-center sm:items-end gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-artisanal-900">${item.subtotal.toFixed(2)}</span>

                    {isAdmin || (isVendor && (item.vendor?.toString() === user?._id?.toString() || item.vendor === user?._id)) ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="bg-artisanal-50 border border-artisanal-300 rounded-lg py-1 px-2 text-xs focus:outline-none focus:border-artisanal-500 font-semibold"
                          value={item.deliveryStatus}
                          disabled={updatingItemId === item._id}
                          onChange={(e) => handleStatusChange(item._id, e.target.value)}
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
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Financials & Address */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white border border-artisanal-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-artisanal-900 border-b border-artisanal-150 pb-3 flex items-center gap-2">
              <MapPin size={18} /> Shipping Address
            </h3>
            {order.shippingAddress ? (
              <div className="text-sm text-charcoal-muted space-y-1 font-light leading-relaxed">
                <p className="font-bold text-charcoal">{order.buyer?.name || 'Customer'}</p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="pt-2 text-xs font-semibold text-charcoal">Phone: {order.shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-charcoal-muted">Address details not available.</p>
            )}
          </div>

          {/* Payment & Breakdown */}
          <div className="bg-white border border-artisanal-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-artisanal-900 border-b border-artisanal-150 pb-3 flex items-center gap-2">
              <CreditCard size={18} /> Payment & Billing
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Subtotal</span>
                <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Shipping</span>
                <span>${order.shippingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>

              {/* Commission Splits (Only shown to Vendor / Admin) */}
              {(isVendor || isAdmin) && (
                <div className="bg-artisanal-100 p-3 rounded-xl border border-artisanal-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-artisanal-700">
                    <span>Marketplace Commission</span>
                    <span>-${order.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-bold border-t border-artisanal-200 pt-1.5">
                    <span>Net Vendor Payout</span>
                    <span>+${order.vendorPayout.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="border-t border-artisanal-100 pt-3 flex justify-between items-baseline">
                <span className="font-serif font-bold text-base text-artisanal-900 font-medium">Grand Total</span>
                <span className="font-bold text-xl text-artisanal-900">${order.totalAmount.toFixed(2)}</span>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs font-semibold">
                <span className="text-charcoal-muted">Payment status:</span>
                <span className={order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600'}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetails;
