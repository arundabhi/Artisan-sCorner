import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Users, ShoppingBag, ShieldAlert, Settings, ArrowRight, Loader2, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../api/axios.js';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/admin/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <Loader2 className="animate-spin text-artisanal-500" size={40} />
      </div>
    );
  }

  const { overview, revenueOverTime } = data || {
    overview: { grossSales: 0, platformEarnings: 0, vendorPayouts: 0, orderCount: 0, totalUsers: 0, totalVendors: 0, totalProducts: 0, pendingVendors: 0 },
    revenueOverTime: [],
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-artisanal-900">Admin Control Panel</h1>
        <p className="text-sm text-charcoal-muted mt-1">Monitor marketplace revenue, adjust settings, and moderate users.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Gross Sales */}
        <div className="bg-white border border-artisanal-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-charcoal-muted">
            <span className="text-xs uppercase font-bold tracking-wider">Gross Sales</span>
            <DollarSign size={18} />
          </div>
          <p className="text-2xl font-bold text-artisanal-900">${overview.grossSales.toFixed(2)}</p>
        </div>

        {/* Card 2: Platform Earnings */}
        <div className="bg-white border border-artisanal-200 rounded-2xl p-5 shadow-sm space-y-2 border-l-4 border-l-artisanal-500">
          <div className="flex justify-between items-center text-artisanal-600">
            <span className="text-xs uppercase font-bold tracking-wider">Platform Fee Revenue</span>
            <Award size={18} />
          </div>
          <p className="text-2xl font-bold text-artisanal-700">${overview.platformEarnings.toFixed(2)}</p>
        </div>

        {/* Card 3: Users / Vendors */}
        <div className="bg-white border border-artisanal-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-charcoal-muted">
            <span className="text-xs uppercase font-bold tracking-wider">Users / Vendors</span>
            <Users size={18} />
          </div>
          <p className="text-2xl font-bold text-artisanal-900">
            {overview.totalUsers} <span className="text-xs text-charcoal-muted font-normal">({overview.totalVendors} sellers)</span>
          </p>
        </div>

        {/* Card 4: Store Applications */}
        <div className="bg-white border border-artisanal-200 rounded-2xl p-5 shadow-sm space-y-2 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center text-amber-700">
            <span className="text-xs uppercase font-bold tracking-wider">Applications</span>
            <ShieldAlert size={18} />
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {overview.pendingVendors} <span className="text-xs text-charcoal-muted font-normal">pending</span>
          </p>
        </div>
      </div>

      {/* QUICK ADMIN ACTIONS */}
      <div className="bg-artisanal-900 text-white rounded-3xl p-6 border border-artisanal-800 flex flex-wrap gap-4 justify-between items-center">
        <div className="space-y-1">
          <h3 className="font-serif font-bold text-lg text-white">System Actions</h3>
          <p className="text-xs text-artisanal-300 font-light">Moderate onboarding queues, block accounts, or update commission percents.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard/admin/vendors"
            className="bg-white text-charcoal font-semibold px-5 py-2.5 rounded-xl text-xs hover:bg-artisanal-100 transition-colors"
          >
            Approve Vendors
          </Link>
          <Link
            to="/dashboard/admin/users"
            className="bg-white text-charcoal font-semibold px-5 py-2.5 rounded-xl text-xs hover:bg-artisanal-100 transition-colors"
          >
            Moderate Users
          </Link>
          <Link
            to="/dashboard/admin/settings"
            className="bg-artisanal-500 hover:bg-artisanal-600 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Settings size={14} /> Commission Settings
          </Link>
        </div>
      </div>

      {/* CHART GRAPH SECTION */}
      <div className="bg-white border border-artisanal-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-lg text-artisanal-900">Gross Marketplace Revenue (Last 30 Days)</h3>
        <div className="h-80 w-full text-xs font-semibold">
          {revenueOverTime.length === 0 ? (
            <div className="h-full flex items-center justify-center text-charcoal-muted">
              No sales transactions recorded in the last 30 days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1ece3" />
                <XAxis dataKey="date" stroke="#8e6c46" />
                <YAxis stroke="#8e6c46" />
                <Tooltip formatter={(value) => [`$${value}`, undefined]} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Gross Sales" stroke="#c86b45" strokeWidth={3} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="earnings" name="Platform Commission" stroke="#a3845e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
