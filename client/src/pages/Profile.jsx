import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileSuccess } from '../store/slices/authSlice.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { User, Key, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Form 1: Profile Info
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  // Form 2: Password
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data) => {
    setUpdatingProfile(true);
    try {
      const res = await api.put('/auth/profile', data);
      dispatch(updateProfileSuccess(res.data));
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setUpdatingPassword(true);
    try {
      await api.put('/auth/password', data);
      toast.success('Password updated successfully');
      resetPasswordForm();
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
      
      {/* Edit Profile Card */}
      <div className="bg-white border border-artisanal-200 rounded-3xl p-8 shadow-md space-y-6">
        <div className="flex items-center gap-3 border-b border-artisanal-100 pb-4">
          <div className="bg-artisanal-100 p-2.5 rounded-xl text-artisanal-500">
            <User size={20} />
          </div>
          <h2 className="text-xl font-serif font-bold text-artisanal-900">Personal Details</h2>
        </div>

        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Full Name
            </label>
            <input
              type="text"
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                profileErrors.name ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...registerProfile('name')}
            />
            {profileErrors.name && <span className="text-xs text-red-500 mt-1 block">{profileErrors.name.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-artisanal-100/60 border border-artisanal-200 rounded-xl px-4 py-3 text-sm text-charcoal-muted cursor-not-allowed"
            />
            <span className="text-[10px] text-charcoal-muted/70 mt-1 block">Account emails cannot be updated dynamically.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. 555-555-5555"
              className="w-full bg-artisanal-50 border border-artisanal-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500"
              {...registerProfile('phone')}
            />
          </div>

          <button
            type="submit"
            disabled={updatingProfile}
            className="w-full bg-artisanal-500 hover:bg-artisanal-600 text-white rounded-xl py-3.5 text-sm font-semibold shadow transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {updatingProfile ? <Loader2 className="animate-spin" size={16} /> : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-artisanal-200 rounded-3xl p-8 shadow-md space-y-6">
        <div className="flex items-center gap-3 border-b border-artisanal-100 pb-4">
          <div className="bg-artisanal-100 p-2.5 rounded-xl text-artisanal-500">
            <Key size={20} />
          </div>
          <h2 className="text-xl font-serif font-bold text-artisanal-900">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              Old Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                passwordErrors.oldPassword ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...registerPassword('oldPassword')}
            />
            {passwordErrors.oldPassword && <span className="text-xs text-red-500 mt-1 block">{passwordErrors.oldPassword.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted mb-2">
              New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full bg-artisanal-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-artisanal-500 ${
                passwordErrors.newPassword ? 'border-red-400 focus:border-red-400' : 'border-artisanal-200'
              }`}
              {...registerPassword('newPassword')}
            />
            {passwordErrors.newPassword && <span className="text-xs text-red-500 mt-1 block">{passwordErrors.newPassword.message}</span>}
          </div>

          <button
            type="submit"
            disabled={updatingPassword}
            className="w-full bg-artisanal-500 hover:bg-artisanal-600 text-white rounded-xl py-3.5 text-sm font-semibold shadow transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {updatingPassword ? <Loader2 className="animate-spin" size={16} /> : 'Update Password'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default Profile;
