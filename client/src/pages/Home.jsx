import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Hammer, ShieldCheck, Heart, Coffee, Star } from 'lucide-react';
import api from '../api/axios.js';
import ProductCard from '../components/ProductCard.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/products/featured');
        setFeaturedProducts(res.data || []);
      } catch (err) {
        console.error('Failed to load featured products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const categories = [
    { name: 'Kitchenware', count: 'WW-DESK', icon: <Coffee size={24} className="text-clay" />, url: '/products?category=Kitchenware', img: 'https://tse3.mm.bing.net/th/id/OIP.3M37jmiw6e95lBaQfxhLJwHaE7?w=400' },
    { name: 'Ceramics', count: 'CR-MUG', icon: <Star size={24} className="text-clay" />, url: '/products?category=Ceramics', img: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400' },
    { name: 'Home Decor', count: 'HD-PILLOW', icon: <Heart size={24} className="text-clay" />, url: '/products?category=Home Decor', img: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400' },
    { name: 'Leather Goods', count: 'LG-WALLET', icon: <ShieldCheck size={24} className="text-clay" />, url: '/products?category=Leather Goods', img: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400' },
  ];

  return (
    <div className="space-y-20 pb-16">

      {/* 1. HERO SECTION */}
      <section className="relative rounded-3xl overflow-hidden bg-artisanal-900 text-white min-h-[500px] flex items-center p-8 sm:p-16">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1600"
            alt="Handcrafted workshop background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <span className="bg-clay text-white text-xs uppercase font-bold tracking-widest px-3 py-1.5 rounded-full">
            The Art of Slow Living
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
            Handcrafted details. <br />Made to be cherished.
          </h1>
          <p className="text-lg text-artisanal-200 font-light">
            Discover a curated marketplace connecting you directly with local artisans, potters, weavers, and leatherworkers. Every item has a soul and a story.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              to="/products"
              className="bg-clay hover:bg-clay-dark text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
            >
              Explore Creations <ArrowRight size={16} />
            </Link>
            <Link
              to="/become-vendor"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-8 py-4 rounded-full backdrop-blur-sm transition-all text-sm"
            >
              Become an Artisan
            </Link>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES */}
      <section className="space-y-8">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-3xl font-serif font-bold mb-3 text-artisanal-900">Creations by Craft</h2>
          <p className="text-sm text-charcoal-muted">Filter our catalog by the material and craft technique used by our artisans.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={cat.url}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-artisanal-100 flex items-end p-6 border border-artisanal-200/60 shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-artisanal-950 via-artisanal-950/20 to-transparent"></div>
              <div className="relative z-10 w-full text-white space-y-1">
                <div className="bg-white/20 p-2 rounded-lg w-fit backdrop-blur-sm mb-2 text-white">
                  {cat.icon}
                </div>
                <h3 className="text-xl font-serif text-white font-bold">{cat.name}</h3>
                <span className="text-xs text-artisanal-200 block">Explore craft &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-md">
            <h2 className="text-3xl font-serif font-bold mb-3 text-artisanal-900">Featured Collections</h2>
            <p className="text-sm text-charcoal-muted">Unique collections highlighted by our editors for their exceptional quality and narrative.</p>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-artisanal-600 hover:text-artisanal-800 flex items-center gap-1.5"
          >
            View All Creations <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <SkeletonLoader count={3} />
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-artisanal-200">
            <p className="text-charcoal-muted">No featured products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. BRAND VALUES */}
      <section className="bg-artisanal-100/60 rounded-3xl p-8 sm:p-12 border border-artisanal-200 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="bg-artisanal-200 p-3 rounded-2xl w-fit">
            <Hammer size={24} className="text-artisanal-700" />
          </div>
          <h3 className="text-lg font-serif font-semibold text-artisanal-900">Direct-to-Artisan</h3>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            By cutting out corporate intermediaries, we return 95% of the purchase price directly into the local woodshops, ceramic wheels, and weaving looms of our creators.
          </p>
        </div>
        <div className="space-y-3">
          <div className="bg-artisanal-200 p-3 rounded-2xl w-fit">
            <ShieldCheck size={24} className="text-artisanal-700" />
          </div>
          <h3 className="text-lg font-serif font-semibold text-artisanal-900">Sustainably Sourced</h3>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            All woodcrafts are made using fallen timber or sustainably managed woodlands. Ceramics utilize raw non-toxic glazes. Fast fashion is banned.
          </p>
        </div>
        <div className="space-y-3">
          <div className="bg-artisanal-200 p-3 rounded-2xl w-fit">
            <Heart size={24} className="text-artisanal-700" />
          </div>
          <h3 className="text-lg font-serif font-semibold text-artisanal-900">Built to Last</h3>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Each bowl, wallet, and rug is designed with lifetime endurance. We reject cheap plastics, mass factory mold casting, and disposable planned obsolescence.
          </p>
        </div>
      </section>

    </div>
  );
};

export default Home;
