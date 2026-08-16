import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Store, Search, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const AdminVendors = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const fetchStores = async () => {
    try {
      const res = await api.get('/admin/stores');
      setStores(res.data || []);
    } catch (err) {
      toast.error('Failed to load store applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleApproval = async (id, approveStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/stores/${id}/approve`, {
        isApproved: approveStatus,
      });
      // Refresh list
      await fetchStores();
      toast.success(`Store application successfully ${approveStatus ? 'Approved' : 'Rejected'}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update store status');
    } finally {
      setUpdatingId('');
    }
  };

  const filteredStores = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.owner && s.owner.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <Loader2 className="animate-spin text-artisanal-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      
      {/* Header */}
      <div>
        <Link to="/dashboard/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal hover:underline">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-serif font-bold text-artisanal-900 mt-2">Approve Vendors</h1>
        <p className="text-sm text-charcoal-muted mt-1">Review onboarding applications, audit credentials, and grant listing rights.</p>
      </div>

      {/* Filter */}
      <div className="bg-white border border-artisanal-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-charcoal-muted" />
        <input
          type="text"
          placeholder="Filter applications by store name or owner..."
          className="w-full bg-transparent focus:outline-none text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table grid */}
      {filteredStores.length === 0 ? (
        <div className="text-center py-20 bg-white border border-artisanal-200 rounded-3xl space-y-3">
          <AlertCircle size={32} className="mx-auto text-artisanal-400" />
          <h3 className="text-lg font-serif font-semibold text-artisanal-900">No applications found</h3>
          <p className="text-sm text-charcoal-muted">All clear! No seller applications are currently in queue.</p>
        </div>
      ) : (
        <div className="bg-white border border-artisanal-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-artisanal-100 text-charcoal-muted uppercase text-[10px] font-bold tracking-wider border-b border-artisanal-200">
                  <th className="py-4 px-6">Store</th>
                  <th className="py-4 px-6">Owner</th>
                  <th className="py-4 px-6">Story Description</th>
                  <th className="py-4 px-6">Approval Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-artisanal-100 text-sm">
                {filteredStores.map((s) => (
                  <tr key={s._id} className="hover:bg-artisanal-50/50 transition-colors">
                    {/* Logo & Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-artisanal-100 border flex-shrink-0">
                          <img src={s.logo?.url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="font-serif font-semibold text-artisanal-900 block">{s.name}</span>
                          <span className="text-[10px] text-charcoal-muted font-mono">{s.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Owner details */}
                    <td className="py-4 px-6">
                      {s.owner ? (
                        <div>
                          <span className="font-semibold text-charcoal block">{s.owner.name}</span>
                          <span className="text-xs text-charcoal-muted font-mono">{s.owner.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-bold">Orphaned owner</span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-4 px-6 max-w-xs truncate text-xs text-charcoal-muted leading-relaxed">
                      {s.description}
                    </td>

                    {/* Approval Status */}
                    <td className="py-4 px-6 font-medium">
                      {s.isApproved ? (
                        <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Active Approved
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          Pending Approval
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right">
                      {!s.isApproved ? (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={updatingId === s._id}
                            onClick={() => handleApproval(s._id, true)}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-1.5 hover:scale-105 transition-all cursor-pointer focus:outline-none"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            disabled={updatingId === s._id}
                            onClick={() => handleApproval(s._id, false)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 hover:scale-105 transition-all cursor-pointer focus:outline-none"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={updatingId === s._id}
                          onClick={() => handleApproval(s._id, false)}
                          className="text-xs font-bold text-red-500 hover:underline hover:text-red-600 focus:outline-none cursor-pointer"
                        >
                          Revoke Approval
                        </button>
                      )}
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

export default AdminVendors;
