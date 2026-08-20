import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, CreditCard, MapPin, ShoppingBag, Truck, Check, Loader2, Star } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const OrderDetails = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);

  const isVendor = user?.role === 'VENDOR';
  const isAdmin = user?.role === 'ADMIN';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState('');

  // Review states
  const [reviewedMap, setReviewedMap] = useState({});
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);

        // Fetch review eligibility for each item if buyer and order is delivered
        const isBuyer = user?.role === 'BUYER' || (!isVendor && !isAdmin);
        if (res.data.orderStatus === 'DELIVERED' && isBuyer) {
          const statusMap = {};
          await Promise.all(
            res.data.items.map(async (item) => {
              try {
                const productId = item.product?._id || item.product;
                if (productId) {
                  const revRes = await api.get(`/reviews/product/${productId}`);
                  const reviewsList = revRes.reviews || revRes.data?.reviews || [];
                  const alreadyReviewed = reviewsList.some(
                    (rev) =>
                      (rev.user?._id || rev.user)?.toString() === (user?.id || user?._id)?.toString() &&
                      rev.order?.toString() === res.data._id.toString()
                  );
                  statusMap[item._id] = alreadyReviewed;
                }
              } catch (err) {
                console.error('Error checking review status for item:', item._id, err);
              }
            })
          );
          setReviewedMap(statusMap);
        }
      } catch (err) {
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      fetchOrderDetails();
    }
  }, [id, user]);

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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModalItem) return;

    setSubmittingReview(true);
    try {
      const productId = reviewModalItem.product?._id || reviewModalItem.product;
      await api.post('/reviews', {
        product: productId,
        order: order._id,
        rating: reviewRating,
        comment: reviewComment,
      });

      toast.success('Review submitted successfully!');
      setReviewedMap((prev) => ({
        ...prev,
        [reviewModalItem._id]: true,
      }));
      setReviewModalItem(null);
      setReviewRating(5);
      setReviewComment('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
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

                    {/* Link/Button to leave review if buyer & order delivered */}
                    {order.orderStatus === 'DELIVERED' && !isVendor && !isAdmin && (
                      reviewedMap[item._id] ? (
                        <span className="text-xs font-semibold text-green-600 flex items-center gap-1 mt-2 justify-center sm:justify-start">
                          <Check size={12} /> Reviewed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewModalItem(item);
                            setReviewRating(5);
                            setReviewComment('');
                          }}
                          className="text-xs font-semibold text-artisanal-600 hover:underline mt-2 inline-block text-left"
                        >
                          Write a review &rarr;
                        </button>
                      )
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

      {/* Review Submission Modal */}
      {reviewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-artisanal-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-serif font-bold text-artisanal-900">
              Review {reviewModalItem.productName}
            </h3>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={
                          star <= reviewRating
                            ? 'text-amber-500 fill-amber-500 cursor-pointer transition-colors duration-150'
                            : 'text-artisanal-300 hover:text-amber-400 cursor-pointer transition-colors duration-150'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
                  Comment
                </label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Describe the material characteristics, quality, texture, and your overall experience..."
                  className="w-full bg-artisanal-50 border border-artisanal-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-artisanal-500 transition-colors"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalItem(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-charcoal bg-artisanal-100 hover:bg-artisanal-200 rounded-xl transition-colors"
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-artisanal-600 hover:bg-artisanal-700 rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-colors"
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
