import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfileSuccess, updateStoreSuccess } from '../store/slices/authSlice.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Store, Loader2, Upload } from 'lucide-react';

const becomeVendorSchema = z.object({
  name: z.string().min(3, 'Store name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  phone: z.string().min(5, 'Please enter a valid phone number'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

const BecomeVendor = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { store } = useSelector((state) => state.auth);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(becomeVendorSchema),
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('phone', data.phone);
    
    // Address object needs to be sent as structured JSON
    const address = {
      street: data.street,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
    };
    formData.append('address', JSON.stringify(address));

    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      const res = await api.post('/stores', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local Redux state
      dispatch(updateProfileSuccess({ role: 'VENDOR' }));
      dispatch(updateStoreSuccess(res.data));

      toast.success(res.message || 'Application submitted successfully!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.message || 'Onboarding failed');
    } finally {
      setSubmitting(false);
    }
  };

  // If store already exists, display current onboarding status
  if (store) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-artisanal-200 shadow-lg p-8 sm:p-10 text-center space-y-6">
        <div className="bg-artisanal-100 p-4 rounded-full w-fit mx-auto text-artisanal-600">
          <Store size={40} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-artisanal-900">Your Store Application</h2>
        <div className="p-4 rounded-xl max-w-md mx-auto border transition-colors bg-amber-50 border-amber-200 text-amber-800 text-sm">
          {!store.isApproved ? (
            <p>
              Your store application for <span className="font-semibold">{store.name}</span> is currently **Pending Approval**. Our administrators are reviewing your submission. You will gain listing access shortly.
            </p>
          ) : (
            <p className="text-green-800 bg-green-50 border-green-200">
              Your store <span className="font-semibold">{store.name}</span> is approved and active! Head to the **Seller Dashboard** to list products.
            </p>
          )}
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-white border border-artisanal-300 text-charcoal px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-artisanal-50"
          >
            Go Home
          </button>
          {store.isApproved && (
            <button
              onClick={() => navigate('/dashboard/seller')}
              className="bg-artisanal-500 hover:bg-artisanal-600 text-white px-6 py-2.5 rounded-full text-xs font-semibold shadow"
            >
              Seller Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-12 bg-white rounded-3xl border border-artisanal-200 shadow-xl overflow-hidden p-8 sm:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-artisanal-100 p-3 rounded-2xl text-artisanal-500">
          <Store size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-serif font-bold text-artisanal-900">Open Your Shop</h2>
          <p className="text-sm text-charcoal-muted">Submit your application to become an Artisan vendor.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Core details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Store Name
            </label>
            <input
              type="text"
              placeholder="e.g. Oak & Clay Studio"
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                errors.name ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...register('name')}
            />
            {errors.name && <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Contact Phone
            </label>
            <input
              type="text"
              placeholder="e.g. 555-555-WOOD"
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                errors.phone ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...register('phone')}
            />
            {errors.phone && <span className="text-xs text-red-500 mt-1 block">{errors.phone.message}</span>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
            Store Story / Description
          </label>
          <textarea
            rows={4}
            placeholder="Share your background as a craftsman. Describe the materials, sourcing policies, and techniques you employ..."
            className={`w-full bg-artisanal-50 border rounded-xl p-4 text-sm focus:outline-none focus:border-artisanal-500 ${
              errors.description ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
            }`}
            {...register('description')}
          />
          {errors.description && <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>}
        </div>

        {/* Address */}
        <div className="border-t border-artisanal-100 pt-6 space-y-4">
          <h3 className="font-serif font-bold text-lg text-artisanal-900">Store Address</h3>
          
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted mb-2">Street Address</label>
            <input
              type="text"
              placeholder="123 Artisan Ln"
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                errors.street ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...register('street')}
            />
            {errors.street && <span className="text-xs text-red-500 mt-1 block">{errors.street.message}</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-charcoal-muted mb-2">City</label>
              <input
                type="text"
                placeholder="Portland"
                className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                  errors.city ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
                }`}
                {...register('city')}
              />
              {errors.city && <span className="text-xs text-red-500 mt-1 block">{errors.city.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-muted mb-2">State</label>
              <input
                type="text"
                placeholder="OR"
                className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                  errors.state ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
                }`}
                {...register('state')}
              />
              {errors.state && <span className="text-xs text-red-500 mt-1 block">{errors.state.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-muted mb-2">ZIP Code</label>
              <input
                type="text"
                placeholder="97201"
                className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                  errors.postalCode ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
                }`}
                {...register('postalCode')}
              />
              {errors.postalCode && <span className="text-xs text-red-500 mt-1 block">{errors.postalCode.message}</span>}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-charcoal-muted mb-2">Country</label>
              <input
                type="text"
                placeholder="United States"
                className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                  errors.country ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
                }`}
                {...register('country')}
              />
              {errors.country && <span className="text-xs text-red-500 mt-1 block">{errors.country.message}</span>}
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="border-t border-artisanal-100 pt-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
            Store Logo
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-artisanal-100 rounded-full border border-artisanal-300 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <Store size={36} className="text-artisanal-400" />
              )}
            </div>
            
            <label className="border border-dashed border-artisanal-400 hover:border-artisanal-500 bg-artisanal-50/50 hover:bg-artisanal-50 text-charcoal px-5 py-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer">
              <Upload size={16} /> Choose Logo File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-clay hover:bg-clay-dark text-white rounded-xl py-3.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Submitting application...
            </>
          ) : (
            'Submit Store Application'
          )}
        </button>

      </form>
    </div>
  );
};

export default BecomeVendor;
