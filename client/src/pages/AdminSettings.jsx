import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Save, Loader2 } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [commission, setCommission] = useState(5);
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        setCommission(res.data.commissionPercent);
        setTax(res.data.taxPercent || 0);
        setShipping(res.data.shippingFee || 0);
      } catch (err) {
        toast.error('Failed to load marketplace settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        commissionPercent: Number(commission),
        taxPercent: Number(tax),
        shippingFee: Number(shipping),
      });
      toast.success('Marketplace configurations saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-artisanal-50">
        <Loader2 className="animate-spin text-artisanal-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-6 space-y-6">
      
      {/* Header */}
      <div>
        <Link to="/dashboard/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal hover:underline">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-serif font-bold text-artisanal-900 mt-2">Commission & Fees</h1>
        <p className="text-sm text-charcoal-muted mt-1">Configure platform rates and fee computations.</p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-artisanal-200 rounded-3xl p-8 shadow-md space-y-6">
        
        <div className="flex items-center gap-3 border-b border-artisanal-100 pb-4">
          <div className="bg-artisanal-100 p-2.5 rounded-xl text-artisanal-500">
            <Settings size={20} />
          </div>
          <h2 className="text-xl font-serif font-bold text-artisanal-900">Platform Margins</h2>
        </div>

        <div className="space-y-4">
          {/* Commission percentage */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Default Commission Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                className="w-full bg-artisanal-50 border border-artisanal-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-artisanal-500"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                required
              />
              <span className="absolute right-4 top-3 text-sm text-charcoal-muted font-bold">%</span>
            </div>
            <span className="text-[10px] text-charcoal-muted/70 mt-1 block">
              Calculates platform earnings dynamically during checkout splits. For example, 5% on a $100 item allocates $5 to the platform and $95 to the seller.
            </span>
          </div>

          {/* Tax rate */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Standard Tax Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                className="w-full bg-artisanal-50 border border-artisanal-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-artisanal-500"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                required
              />
              <span className="absolute right-4 top-3 text-sm text-charcoal-muted font-bold">%</span>
            </div>
          </div>

          {/* Shipping Fee */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Flat Shipping Fee ($)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                className="w-full bg-artisanal-50 border border-artisanal-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-artisanal-500"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                required
              />
              <span className="absolute right-4 top-3 text-sm text-charcoal-muted font-bold">$</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="pt-4 border-t border-artisanal-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-clay hover:bg-clay-dark text-white rounded-xl px-8 py-3.5 text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save Settings
          </button>
        </div>

      </form>

    </div>
  );
};

export default AdminSettings;
