import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Folder, HelpCircle, ArrowRight, Loader2, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import api from '../api/axios.js';

const SellerDashboard = () => {
  const navigate = useNavigate();

  const [timeframe, setTimeframe] = useState('30');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics/vendor?range=${timeframe}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load seller analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <Loader2 className="animate-spin text-artisanal-500" size={40} />
      </div>
    );
  }

  const { overview, salesOverTime, topProducts } = data || {
    overview: { totalSales: 0, totalEarnings: 0, platformCommission: 0, orderCount: 0, productCount: 0 },
    salesOverTime: [],
    topProducts: [],
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header and selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-artisanal-900">Seller Dashboard</h1>
          <p className="text-sm text-charcoal-muted mt-1">Review your shop's performance, revenue, and listings.</p>
        </div>

        <select
          className="bg-white border border-artisanal-300 rounded-xl py-2 px-3 focus:outline-none focus:border-artisanal-500 text-sm font-semibold shadow-sm"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Card 1: Gross Sales */}
        <div className="bg-white border border-artisanal-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-charcoal-muted">
            <span className="text-xs uppercase font-bold tracking-wider">Gross Sales</span>
            <DollarSign size={18} />
          </div>
          <p className="text-2xl font-bold text-artisanal-900">${overview.totalSales.toFixed(2)}</p>
        </div>

        {/* Card 2: Net Earnings */}
        <div className="bg-white border border-artisanal-200 rounded-2xl p-5 shadow-sm space-y-2 border-l-4 border-l-green-500">
          <div className="flex justify-between items-center text-green-700">
            <span className="text-xs uppercase font-bold tracking-wider">Net Earnings</span>
            <DollarSign size={18} />
          </div>
          <p className="text-2xl font-bold text-green-700">${overview.totalEarnings.toFixed(2)}</p>
        </div>

        {/* Card 3: Commission Paid */}
        <div className="bg-white border border-artisanal-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-charcoal-muted">
            <span className="text-xs uppercase font-bold tracking-wider">Commission</span>
            <HelpCircle size={18} />
          </div>
          <p className="text-2xl font-bold text-artisanal-900">${overview.platformCommission.toFixed(2)}</p>
        </div>

        {/* Card 4: Orders */}
        <div className="bg-white border border-artisanal-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-charcoal-muted">
            <span className="text-xs uppercase font-bold tracking-wider">Orders</span>
            <ShoppingBag size={18} />
          </div>
          <p className="text-2xl font-bold text-artisanal-900">{overview.orderCount}</p>
        </div>

        {/* Card 5: Products */}
        <div className="bg-white border border-artisanal-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-charcoal-muted">
            <span className="text-xs uppercase font-bold tracking-wider">Listings</span>
            <Folder size={18} />
          </div>
          <p className="text-2xl font-bold text-artisanal-900">{overview.productCount}</p>
        </div>
      </div>

      {/* QUICK LINKS GRID */}
      <div className="bg-artisanal-100 rounded-3xl p-6 border border-artisanal-200 flex flex-wrap gap-4 justify-between items-center">
        <h3 className="font-serif font-bold text-lg text-artisanal-900">Manage Store Settings</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard/seller/products"
            className="bg-white hover:bg-artisanal-50 text-charcoal border border-artisanal-300 font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors"
          >
            Manage Products
          </Link>
          <Link
            to="/dashboard/seller/products/new"
            className="bg-clay hover:bg-clay-dark text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-sm transition-all"
          >
            Add New Product
          </Link>
          <Link
            to="/dashboard/seller/orders"
            className="bg-white hover:bg-artisanal-50 text-charcoal border border-artisanal-300 font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors"
          >
            Ship Orders
          </Link>
        </div>
      </div>

      {/* CHARTS GRAPH SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales over time Line Chart */}
        <div className="lg:col-span-2 bg-white border border-artisanal-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-lg text-artisanal-900">Sales & Net Income Over Time</h3>
          <div className="h-80 w-full text-xs font-semibold">
            {salesOverTime.length === 0 ? (
              <div className="h-full flex items-center justify-center text-charcoal-muted">
                No sales recorded in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1ece3" />
                  <XAxis dataKey="date" stroke="#8e6c46" />
                  <YAxis stroke="#8e6c46" />
                  <Tooltip formatter={(value) => [`$${value}`, undefined]} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" name="Gross Sales" stroke="#c86b45" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="earnings" name="Net Earnings" stroke="#4caf50" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-white border border-artisanal-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-lg text-artisanal-900 flex items-center gap-1.5">
            <BarChart2 size={18} /> Top Products ($)
          </h3>
          <div className="h-80 w-full text-xs font-semibold">
            {topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-charcoal-muted">
                No product sales recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1ece3" />
                  <XAxis type="number" stroke="#8e6c46" />
                  <YAxis dataKey="name" type="category" stroke="#8e6c46" width={80} tickFormatter={(name) => name.substring(0, 10) + '...'} />
                  <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                  <Bar dataKey="sales" name="Sales Volume" fill="#a3845e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SellerDashboard;
