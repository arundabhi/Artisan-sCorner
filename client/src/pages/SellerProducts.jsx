import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, FolderPlus, Eye, Search, AlertCircle, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const SellerProducts = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSearch, setFilterSearch] = useState('');
  const [togglingId, setTogglingId] = useState('');

  const fetchMyProducts = async () => {
    try {
      const res = await api.get('/products/vendor/me');
      setProducts(res.data?.products || []);
    } catch (err) {
      toast.error('Failed to load products list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleToggleActive = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      await api.patch(`/products/${id}`, {
        isActive: !currentStatus,
      });
      // Update local state
      setProducts(products.map((p) => (p._id === id ? { ...p, isActive: !currentStatus } : p)));
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to update product status');
    } finally {
      setTogglingId('');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This action removes associated Cloudinary images.`)) {
      return;
    }
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
      toast.success('Product deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(filterSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(filterSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <Loader2 className="animate-spin text-artisanal-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-artisanal-900">Manage Products</h1>
          <p className="text-sm text-charcoal-muted mt-1">Add, update, or remove handcrafted listings.</p>
        </div>

        <Link
          to="/dashboard/seller/products/new"
          className="bg-clay hover:bg-clay-dark text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Search Filter input */}
      <div className="bg-white border border-artisanal-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-charcoal-muted" />
        <input
          type="text"
          placeholder="Filter by name, category, or SKU..."
          className="w-full bg-transparent focus:outline-none text-sm"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
        />
      </div>

      {/* Table grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-artisanal-200 rounded-3xl space-y-4 shadow-sm max-w-xl mx-auto">
          <AlertCircle size={32} className="mx-auto text-artisanal-400" />
          <h3 className="text-lg font-serif font-bold text-artisanal-900">No products found</h3>
          <p className="text-sm text-charcoal-muted max-w-xs mx-auto">
            {products.length === 0
              ? "You haven't listed any creations yet. Click the button above to add your first product."
              : 'No products match your search filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-artisanal-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-artisanal-100 text-charcoal-muted uppercase text-[10px] font-bold tracking-wider border-b border-artisanal-200">
                  <th className="py-4 px-6">Image</th>
                  <th className="py-4 px-6">Details</th>
                  <th className="py-4 px-6">SKU</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-artisanal-100 text-sm">
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-artisanal-50/50 transition-colors">
                    {/* Image */}
                    <td className="py-4 px-6">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-artisanal-100 border flex-shrink-0">
                        <img src={p.images[0]?.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>

                    {/* Details */}
                    <td className="py-4 px-6">
                      <Link
                        to={`/products/${p.slug}`}
                        className="font-serif font-semibold text-artisanal-900 hover:text-artisanal-600 block"
                      >
                        {p.name}
                      </Link>
                      <span className="text-[11px] text-charcoal-muted bg-artisanal-100 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                        {p.category}
                      </span>
                    </td>

                    {/* SKU */}
                    <td className="py-4 px-6 font-mono text-xs">{p.sku}</td>

                    {/* Price */}
                    <td className="py-4 px-6 font-bold text-artisanal-900">${p.price.toFixed(2)}</td>

                    {/* Stock */}
                    <td className="py-4 px-6 font-medium">
                      {p.stock === 0 ? (
                        <span className="text-red-500 font-bold">Out</span>
                      ) : (
                        <span>{p.stock} units</span>
                      )}
                    </td>

                    {/* Status Active toggle */}
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(p._id, p.isActive)}
                        disabled={togglingId === p._id}
                        className={`focus:outline-none flex items-center transition-colors ${
                          p.isActive ? 'text-green-600 hover:text-green-700' : 'text-charcoal-muted hover:text-charcoal'
                        }`}
                      >
                        {p.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        to={`/products/${p.slug}`}
                        className="text-charcoal-muted hover:text-artisanal-500 p-1.5 inline-block hover:bg-artisanal-100 rounded-lg transition-all"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/dashboard/seller/products/${p._id}/edit`}
                        className="text-charcoal-muted hover:text-artisanal-600 p-1.5 inline-block hover:bg-artisanal-100 rounded-lg transition-all"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(p._id, p.name)}
                        className="text-charcoal-muted hover:text-red-500 p-1.5 inline-block hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
