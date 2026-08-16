import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, RefreshCw } from 'lucide-react';
import api from '../api/axios.js';
import ProductCard from '../components/ProductCard.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';

const ProductListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [productsData, setProductsData] = useState({ products: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Read current URL filters
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = searchParams.get('page') || '1';

  // Temporary local state for range inputs
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  const [localSearch, setLocalSearch] = useState(search);

  const categories = ['Kitchenware', 'Ceramics', 'Home Decor', 'Leather Goods', 'Wellness'];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryStr = searchParams.toString();
        const res = await api.get(`/products?${queryStr}`);
        setProductsData(res.data);
      } catch (err) {
        console.error('Failed to load products list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  // Synchronize local search inputs with URL updates
  useEffect(() => {
    setLocalSearch(search);
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [search, minPrice, maxPrice]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1'); // Reset to page 1 on filter update
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleApplyPrice = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1');
    if (localMinPrice) newParams.set('minPrice', localMinPrice);
    else newParams.delete('minPrice');
    if (localMaxPrice) newParams.set('maxPrice', localMaxPrice);
    else newParams.delete('maxPrice');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', localSearch);
  };

  const handleResetFilters = () => {
    setSearchParams({});
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setLocalSearch('');
  };

  const handlePageChange = (pageNum) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', pageNum.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-artisanal-200">
        <div>
          <h1 className="text-3xl font-serif font-bold text-artisanal-900">
            {category ? `${category} Collection` : 'All Creations'}
          </h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Found {productsData.total} unique {productsData.total === 1 ? 'creation' : 'creations'}
          </p>
        </div>

        {/* Sorting and Search */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] md:max-w-xs">
            <input
              type="text"
              placeholder="Search in category..."
              className="w-full bg-white border border-artisanal-300 rounded-xl py-2 pl-3 pr-9 focus:outline-none focus:border-artisanal-500 text-sm"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-2.5 text-charcoal-muted">
              <Search size={16} />
            </button>
          </form>

          <select
            className="bg-white border border-artisanal-300 rounded-xl py-2 px-3 focus:outline-none focus:border-artisanal-500 text-sm font-medium"
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
          >
            <option value="newest">Newest Arrivals</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex items-center gap-1.5 bg-white border border-artisanal-300 rounded-xl py-2 px-3 text-sm font-semibold"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        
        {/* SIDEBAR FILTERS (Desktop) */}
        <aside className="hidden md:block w-64 flex-shrink-0 bg-white border border-artisanal-200 rounded-2xl p-6 space-y-6">
          
          {/* Categories */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Categories</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => updateParam('category', '')}
                className={`text-left text-sm transition-colors ${
                  category === '' ? 'font-bold text-artisanal-500' : 'text-charcoal hover:text-artisanal-500'
                }`}
              >
                All Crafts
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => updateParam('category', cat)}
                  className={`text-left text-sm transition-colors ${
                    category === cat ? 'font-bold text-artisanal-500' : 'text-charcoal hover:text-artisanal-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3 border-t border-artisanal-100 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Price Range</h3>
            <form onSubmit={handleApplyPrice} className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full bg-artisanal-50 border border-artisanal-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-artisanal-500"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                />
                <span className="text-charcoal-muted text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full bg-artisanal-50 border border-artisanal-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-artisanal-500"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-artisanal-100 hover:bg-artisanal-500 hover:text-white border border-artisanal-300 hover:border-artisanal-500 text-charcoal text-xs font-semibold py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Apply Price
              </button>
            </form>
          </div>

          {/* Rating */}
          <div className="space-y-3 border-t border-artisanal-100 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Rating</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => updateParam('minRating', '')}
                className={`text-left text-sm transition-colors ${
                  minRating === '' ? 'font-bold text-artisanal-500' : 'text-charcoal hover:text-artisanal-500'
                }`}
              >
                Any Rating
              </button>
              {[4, 3, 2, 1].map((stars) => (
                <button
                  key={stars}
                  onClick={() => updateParam('minRating', stars.toString())}
                  className={`text-left text-sm transition-colors ${
                    minRating === stars.toString() ? 'font-bold text-artisanal-500' : 'text-charcoal hover:text-artisanal-500'
                  }`}
                >
                  {stars} Stars & Above
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={handleResetFilters}
            className="w-full bg-artisanal-50 border border-artisanal-200 text-charcoal hover:text-red-500 hover:bg-red-50 hover:border-red-200 text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} /> Reset Filters
          </button>

        </aside>

        {/* PRODUCTS GRID */}
        <div className="flex-1 space-y-8">
          
          {loading ? (
            <SkeletonLoader count={6} />
          ) : productsData.products.length === 0 ? (
            <div className="text-center py-16 bg-white border border-artisanal-200 rounded-3xl space-y-3">
              <Filter size={32} className="mx-auto text-artisanal-400" />
              <h3 className="text-lg font-serif font-semibold text-artisanal-900">No creations found</h3>
              <p className="text-sm text-charcoal-muted max-w-xs mx-auto">Try widening your filters or checking your spelling for custom queries.</p>
              <button
                onClick={handleResetFilters}
                className="bg-artisanal-500 hover:bg-artisanal-600 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow transition-all cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsData.products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {productsData.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-artisanal-100">
              {Array.from({ length: productsData.pages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = pageNum === productsData.page;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center border transition-all ${
                      isCurrent
                        ? 'bg-artisanal-500 border-artisanal-500 text-white'
                        : 'bg-white border-artisanal-200 hover:border-artisanal-400 text-charcoal'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* MOBILE DRAWER FILTERS */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden bg-charcoal/40 backdrop-blur-sm flex justify-end">
          <div className="w-80 bg-white h-full p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-artisanal-100 pb-3">
              <h3 className="font-serif font-bold text-lg">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-charcoal-muted font-bold text-sm"
              >
                Close
              </button>
            </div>

            {/* Same sidebar sections but in drawer */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Categories</h3>
              <div className="flex flex-col gap-2">
                {['', ...categories].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      updateParam('category', cat);
                      setShowMobileFilters(false);
                    }}
                    className={`text-left text-sm py-1 ${
                      (cat === '' && category === '') || category === cat
                        ? 'font-bold text-artisanal-500'
                        : 'text-charcoal'
                    }`}
                  >
                    {cat === '' ? 'All Creations' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-artisanal-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">Price Range</h3>
              <form onSubmit={(e) => { handleApplyPrice(e); setShowMobileFilters(false); }} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full bg-artisanal-50 border border-artisanal-200 rounded-lg py-1.5 px-2 text-xs"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full bg-artisanal-50 border border-artisanal-200 rounded-lg py-1.5 px-2 text-xs"
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full bg-artisanal-500 text-white text-xs font-semibold py-2 rounded-lg">
                  Apply Price
                </button>
              </form>
            </div>

            <button
              onClick={() => {
                handleResetFilters();
                setShowMobileFilters(false);
              }}
              className="w-full bg-artisanal-100 text-charcoal text-xs font-semibold py-2 rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductListing;
