import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Search, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const AdminUsers = () => {
  const currentAdmin = useSelector((state) => state.auth.user);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data?.users || []);
      } catch (err) {
        toast.error('Failed to load users list');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/users/${id}/status`, {
        isActive: !currentStatus,
      });
      setUsers(users.map((u) => (u._id === id ? { ...u, isActive: !currentStatus } : u)));
      toast.success(`User account successfully ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setUpdatingId('');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'VENDOR':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BUYER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-artisanal-100 text-charcoal';
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-3xl font-serif font-bold text-artisanal-900 mt-2">Moderate Users</h1>
        <p className="text-sm text-charcoal-muted mt-1">Review accounts, assign permissions, and restrict access.</p>
      </div>

      {/* Filter */}
      <div className="bg-white border border-artisanal-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-charcoal-muted" />
        <input
          type="text"
          placeholder="Filter users by name or email..."
          className="w-full bg-transparent focus:outline-none text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-artisanal-200 rounded-3xl space-y-3">
          <Users size={32} className="mx-auto text-artisanal-400" />
          <h3 className="text-lg font-serif font-semibold text-artisanal-900">No users found</h3>
          <p className="text-sm text-charcoal-muted">Verify your query terms or clear filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-artisanal-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-artisanal-100 text-charcoal-muted uppercase text-[10px] font-bold tracking-wider border-b border-artisanal-200">
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6 text-right">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-artisanal-100 text-sm">
                {filteredUsers.map((u) => {
                  const isSelf = u._id === currentAdmin?.id;
                  return (
                    <tr key={u._id} className="hover:bg-artisanal-50/50 transition-colors">
                      {/* User */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar?.url || 'https://res.cloudinary.com/demo/image/upload/v1502432214/avatar-placeholder.png'}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border"
                          />
                          <span className="font-semibold text-artisanal-900">{u.name} {isSelf && '(You)'}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 font-mono text-xs">{u.email}</td>

                      {/* Phone */}
                      <td className="py-4 px-6 text-charcoal-muted">{u.phone || 'N/A'}</td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <span className={`border text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${getRoleColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Toggle status */}
                      <td className="py-4 px-6 text-right">
                        <button
                          disabled={isSelf || updatingId === u._id}
                          onClick={() => handleToggleStatus(u._id, u.isActive)}
                          className={`focus:outline-none ml-auto flex items-center justify-end ${
                            isSelf
                              ? 'text-artisanal-300 cursor-not-allowed'
                              : u.isActive
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-charcoal-muted hover:text-charcoal'
                          }`}
                        >
                          {u.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
