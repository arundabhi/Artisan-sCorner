import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Heart, Shield, RefreshCcw, Star, Plus, Minus, Loader2 } from 'lucide-react';
import { addToCart } from '../store/slices/cartSlice.js';
import api from '../api/axios.js';
import StarsRating from '../components/StarsRating.jsx';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.products);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState([]); // Orders this buyer can review this product under

  const isFavorited = wishlistItems.some((p) => p._id === product?._id);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Fetch Product
        const prodRes = await api.get(`/products/${slug}`);
        const prod = prodRes.data;
        setProduct(prod);
        setActiveImage(prod.images[0]?.url || '');

        // Fetch Reviews
        const revRes = await api.get(`/reviews/product/${prod._id}`);

        const reviewsData = revRes.data?.data?.reviews || [];
        setReviews(reviewsData);

        // Check review eligibility if buyer
        if (isAuthenticated && user.role !== 'ADMIN') {
          // Fetch buyer orders and check if any delivered order contains this product and is not reviewed yet
          const ordersRes = await api.get('/orders');
          const allOrders = ordersRes.data?.orders || [];

          const matchingOrders = allOrders.filter(order =>
            order.orderStatus === 'DELIVERED' &&
            order.items.some(item => item.product.toString() === prod._id.toString())
          );

          // For each matching order, check if we already reviewed
          const eligible = [];
          for (const order of matchingOrders) {
            // We search if a review already exists for this user + product + order
            const reviewed = (revRes.data?.data?.reviews || []).some(
              (rev) =>
                rev.user._id.toString() === user.id.toString() &&
                rev.order.toString() === order._id.toString()
            );
            if (!reviewed) {
              eligible.push(order);
            }
          }
          setEligibleOrders(eligible);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        toast.error('Product details not found');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [slug, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <Loader2 className="animate-spin text-artisanal-500" size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold font-serif text-artisanal-900">Creations not found</h3>
        <Link to="/products" className="text-artisanal-500 underline mt-2 block">Return to catalog</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    dispatch(addToCart({ product, quantity }));
    toast.success(`${quantity} x ${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    dispatch(addToCart({ product, quantity }));
    navigate('/cart');
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      await api.post(`/wishlist/${product._id}`);
      if (isFavorited) {
        dispatch({ type: 'wishlist/removeFromWishlist', payload: product._id });
        toast.success('Removed from wishlist');
      } else {
        dispatch({ type: 'wishlist/addToWishlist', payload: product });
        toast.success('Added to wishlist');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update wishlist');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (eligibleOrders.length === 0) {
      toast.error('You must purchase this product first to leave a review.');
      return;
    }

    setSubmittingReview(true);
    try {
      // Review under the first eligible order
      const targetOrder = eligibleOrders[0];

      const res = await api.post('/reviews', {
        product: product._id,
        order: targetOrder._id,
        rating: newRating,
        comment: newComment,
      });

      toast.success('Review submitted successfully!');

      // Update reviews list locally
      setReviews([
        {
          ...res.data.data,
          user: {
            name: user.name,
            avatar: user.avatar
          }
        },
        ...reviews
      ]);

      setNewComment('');
      setEligibleOrders(eligibleOrders.slice(1)); // Remove the order we just reviewed
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-16 py-4">

      {/* Product Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

        {/* LEFT: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-artisanal-200 shadow-md">
            <img
              src={activeImage || 'https://res.cloudinary.com/demo/image/upload/v1502432214/product-placeholder.png'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img.url)}
                  className={`w-20 h-20 bg-white rounded-xl overflow-hidden border flex-shrink-0 transition-all ${activeImage === img.url ? 'border-artisanal-500 ring-2 ring-artisanal-500/20' : 'border-artisanal-200'
                    }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Product Details */}
        <div className="space-y-6">
          <div className="space-y-2">
            {/* Vendor / Store link */}
            {product.store && (
              <Link
                to={`/stores/${product.store.slug}`}
                className="text-sm font-semibold tracking-widest text-artisanal-500 uppercase hover:underline"
              >
                {product.store.name}
              </Link>
            )}
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-artisanal-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars summary */}
            <div className="flex items-center gap-3">
              <StarsRating rating={product.rating} size={16} />
              <span className="text-sm font-medium text-charcoal">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-charcoal-muted">|</span>
              <span className="text-xs text-charcoal-muted font-medium">{product.numReviews} Reviews</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 py-2 border-y border-artisanal-200">
            <span className="text-3xl font-bold text-artisanal-900">${product.price.toFixed(2)}</span>
            {product.compareAtPrice > product.price && (
              <>
                <span className="text-sm text-charcoal-muted line-through font-medium">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-clay uppercase">
                  Save {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-charcoal-muted leading-relaxed whitespace-pre-wrap">
            {product.description}
          </p>

          {/* Stock status */}
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-charcoal-muted">Availability:</span>
            {product.stock === 0 ? (
              <span className="text-red-500 font-bold uppercase text-xs">Out of Stock</span>
            ) : product.stock <= 3 ? (
              <span className="text-clay font-bold uppercase text-xs">Only {product.stock} left in stock</span>
            ) : (
              <span className="text-green-600 font-bold uppercase text-xs">In Stock ({product.stock} available)</span>
            )}
          </div>

          {/* Action buttons */}
          {product.stock > 0 && (
            <div className="space-y-4 pt-4">

              {/* Quantity Select */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-charcoal-muted">Quantity:</span>
                <div className="flex items-center border border-artisanal-300 rounded-xl bg-white overflow-hidden w-32">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-charcoal hover:bg-artisanal-50 focus:outline-none"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="flex-1 text-center font-bold text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-3 text-charcoal hover:bg-artisanal-50 focus:outline-none"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Add / Buy / Wishlist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleAddToCart}
                  className="bg-white hover:bg-artisanal-100 border border-artisanal-400 text-artisanal-900 font-semibold px-6 py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <ShoppingBag size={18} /> Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="bg-clay hover:bg-clay-dark text-white font-semibold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  Buy It Now
                </button>
              </div>

            </div>
          )}

          {/* Product metadata */}
          <div className="pt-6 border-t border-artisanal-100 grid grid-cols-2 gap-4 text-xs text-charcoal-muted">
            <div>
              <span className="font-semibold text-charcoal block">Category</span>
              <span>{product.category}</span>
            </div>
            <div>
              <span className="font-semibold text-charcoal block">SKU</span>
              <span>{product.sku}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Reviews & Form Section */}
      <div className="border-t border-artisanal-200 pt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* LEFT/SIDE: Review Form or summary */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-bold text-artisanal-900">Buyer Reviews</h2>

          <div className="bg-white border border-artisanal-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-serif font-bold text-artisanal-900">{product.rating.toFixed(1)}</span>
              <div className="space-y-1">
                <StarsRating rating={product.rating} size={16} />
                <p className="text-xs text-charcoal-muted">Based on {product.numReviews} review{product.numReviews === 1 ? '' : 's'}</p>
              </div>
            </div>
          </div>

          {/* Add review form (Only visible if buyer has delivered purchase and hasn't reviewed it) */}
          {eligibleOrders.length > 0 && (
            <div className="bg-white border border-artisanal-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-serif font-bold text-lg text-artisanal-900">Write a Review</h3>
              <p className="text-xs text-charcoal-muted">You purchased this product in Order: <span className="font-semibold">{eligibleOrders[0].orderNumber}</span>. Share your experience.</p>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
                    Rating
                  </label>
                  <StarsRating rating={newRating} size={22} interactive={true} onChange={setNewRating} />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
                    Comment
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the texture, weight, craft quality..."
                    className="w-full bg-artisanal-50 border border-artisanal-200 rounded-xl p-3 text-sm focus:outline-none focus:border-artisanal-500"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-artisanal-500 hover:bg-artisanal-600 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                >
                  {submittingReview ? <Loader2 className="animate-spin" size={12} /> : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* RIGHT: Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center py-16 bg-white border border-artisanal-200 rounded-2xl space-y-2">
              <p className="text-charcoal-muted">No reviews yet for this creation.</p>
              <p className="text-xs text-charcoal-muted/70">Be the first to leave a review after purchasing.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-white border border-artisanal-200 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.user.avatar?.url || 'https://res.cloudinary.com/demo/image/upload/v1502432214/avatar-placeholder.png'}
                        alt={rev.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-semibold text-sm text-charcoal block">{rev.user.name}</span>
                        <span className="text-[10px] text-charcoal-muted">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {rev.isVerifiedPurchase && (
                      <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <StarsRating rating={rev.rating} size={14} />
                  </div>

                  <p className="text-sm text-charcoal-muted leading-relaxed font-light">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ProductDetails;
