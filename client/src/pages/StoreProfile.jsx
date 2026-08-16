import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Phone, MapPin, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/axios.js';
import ProductCard from '../components/ProductCard.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';

const StoreProfile = () => {
  const { slug } = useParams();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchStoreAndProducts = async () => {
      setLoading(true);
      try {
        const storeRes = await api.get(`/stores/${slug}`);
        const storeData = storeRes.data;
        setShop(storeData);

        // Fetch products by this store
        setLoadingProducts(true);
        const productsRes = await api.get(`/products?store=${storeData._id}`);
        setProducts(productsRes.data.products || []);
      } catch (err) {
        console.error('Failed to load store profile', err);
      } finally {
        setLoading(false);
        setLoadingProducts(false);
      }
    };
    fetchStoreAndProducts();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <Loader2 className="animate-spin text-artisanal-500" size={40} />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={32} className="mx-auto text-red-500 mb-2" />
        <h3 className="text-xl font-serif font-bold text-artisanal-900">Store profile not found</h3>
        <Link to="/products" className="text-artisanal-500 underline mt-2 block">Return to catalog</Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 py-4">
      {/* Store Banner */}
      <div className="bg-white border border-artisanal-200 rounded-3xl p-6 sm:p-10 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
        {/* Logo */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-artisanal-100 border shadow-inner flex-shrink-0 flex items-center justify-center">
          <img src={shop.logo?.url} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="space-y-4 flex-grow">
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-clay bg-clay/5 border border-clay/20 px-3 py-1 rounded-full">
              Artisan Maker
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-artisanal-900">{shop.name}</h1>
            <p className="text-sm text-charcoal-muted leading-relaxed max-w-xl font-light">{shop.description}</p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-xs font-semibold text-charcoal-muted">
            <span className="flex items-center gap-1.5">
              <Phone size={14} /> {shop.phone}
            </span>
            {shop.address && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {shop.address.city}, {shop.address.state}, {shop.address.country}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Store Products */}
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-artisanal-900 border-b border-artisanal-200 pb-3">
          Artisan's Creations
        </h2>

        {loadingProducts ? (
          <SkeletonLoader count={3} />
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white border border-artisanal-200 rounded-3xl">
            <p className="text-charcoal-muted">No products listed by this artisan yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreProfile;
