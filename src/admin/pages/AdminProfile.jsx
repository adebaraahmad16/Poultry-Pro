import React, { useState, useRef } from 'react';
import {
  User, ShieldCheck, Mail, Phone, Lock, Save, CheckCircle2,
  Key, Shield, Camera, Calendar, Laptop, AlertCircle, Eye, EyeOff,
  Upload, Image as ImageIcon, Sparkles
} from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';
import StatusBadge from '../components/StatusBadge';

export default function AdminProfile() {
  const { currentAdmin, updateAdminProfile } = useAdmin();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(currentAdmin?.name || 'Adebara Ahmad');
  const [email, setEmail] = useState(currentAdmin?.email || 'admin@poultrypro.ng');
  const [phone, setPhone] = useState(currentAdmin?.phone || '+234 803 123 4567');
  const [avatar, setAvatar] = useState(currentAdmin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pwError, setPwError] = useState('');
  const [photoNotice, setPhotoNotice] = useState('');

  // Handle local image file upload (PNG, JPG, WEBP, etc.)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPwError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPwError('Image size must be smaller than 5MB.');
      return;
    }

    setPwError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setAvatar(dataUrl);
        setPhotoNotice('New profile photo loaded! Click "Save Profile & Security Settings" below to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlPrompt = () => {
    const url = window.prompt('Enter new Avatar Image URL:', avatar);
    if (url && url.trim()) {
      setAvatar(url.trim());
      setPhotoNotice('New photo URL applied! Click "Save Profile & Security Settings" below.');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setPwError('');

    if (newPassword && newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setPwError('Password must be at least 8 characters long');
      return;
    }

    // Persist to AdminContext & localStorage
    updateAdminProfile({
      name,
      email,
      phone,
      avatar
    });

    setSuccess(true);
    setPhotoNotice('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccess(false), 3500);
  };

  const adminPermissions = [
    'Super Admin Platform Authority',
    'Manage Farmers, Farms & Accounts',
    'Configure Billing, Subscriptions & Gateways',
    'System Announcements & Notifications',
    'Audit Logs & Security Monitoring',
    'Landing Page CMS & Content Publishing'
  ];

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Administrator Profile & Security</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your personal administrative identity, profile photo, and security credentials.
          </p>
        </div>
        <StatusBadge variant="pro">
          <span className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Super Admin
          </span>
        </StatusBadge>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile photo and administrator details saved successfully!</span>
        </div>
      )}

      {photoNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-2xs">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{photoNotice}</span>
        </div>
      )}

      {pwError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{pwError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Profile Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />

            {/* Avatar with Camera Overlay */}
            <div className="relative group shrink-0">
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-600/30 shadow-md bg-slate-100"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-[#15803D] hover:bg-emerald-700 text-white rounded-xl shadow-md transition cursor-pointer active:scale-95"
                title="Upload Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-black text-slate-900">{name}</h2>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-2xs font-extrabold uppercase">
                  Sole Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {email}
              </p>

              {/* Photo Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-[#15803D] hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo File</span>
                </button>
                <button
                  type="button"
                  onClick={handleUrlPrompt}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Use Image URL</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-slate-400" /> Session: Active (IP 102.89.44.12)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Super Admin Workstation
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">Official Administrative Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">Official Phone Contact</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">Administrative Role</label>
              <input
                type="text"
                disabled
                value={currentAdmin?.role || 'Super Admin (Platform Owner)'}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Permissions & Security Box */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-700" />
                Assigned Role Permissions
              </h3>
              <p className="text-2xs text-slate-400 mt-0.5">Authorizations granted to your Super Admin account</p>
            </div>
            <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">Full Privileges</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {adminPermissions.map((perm, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{perm}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h4 className="font-bold text-slate-800">Two-Factor Authentication (2FA)</h4>
              <p className="text-2xs text-slate-400">Enforces Authenticator app TOTP verification on login</p>
            </div>
            <button
              type="button"
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                twoFactorEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {twoFactorEnabled ? '2FA Active' : '2FA Disabled'}
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              Update Administrator Password
            </h3>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-semibold"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Current Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Confirm New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Security Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
