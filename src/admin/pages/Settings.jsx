import useSaveAction from '../../hooks/useSaveAction';
import { SUPPORT_CONTACT } from '../../config/supportContact';
import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Save, CheckCircle2, Shield, CreditCard,
  Clock, AlertTriangle, Bell, Monitor, Database, Globe, Lock,
  Mail, Phone, RefreshCw, Eye, EyeOff, Info, Check, ShieldCheck,
  FileText, Sliders, Moon, Sun, Smartphone, User
} from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';

export default function Settings() {
  const { platformSettings, updateSettings } = useAdmin();
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState(platformSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Sync state if platformSettings changes
  React.useEffect(() => {
    if (platformSettings) {
      setForm(prev => ({ ...platformSettings, ...prev }));
    }
  }, [platformSettings]);

  const [handleSave, handleSaveSaving] = useSaveAction(async (e) => {
    e.preventDefault();
    await updateSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  });

  const tabs = [
    { id: 'general', label: 'General & Brand', icon: Globe },
    { id: 'account', label: 'Account & Contact', icon: User },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'subscription', label: 'Subscription Defaults', icon: Sliders },
    { id: 'payment', label: 'Payment Gateways', icon: CreditCard },
    { id: 'notification', label: 'Notifications & Alerts', icon: Bell },
    { id: 'appearance', label: 'Appearance & UI', icon: Monitor },
    { id: 'data', label: 'Data & Privacy', icon: Database }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Platform Global Settings
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized management for PoultryPro Nigeria — Section 15 Architecture & Configuration.
              </p>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Platform settings saved & persisted successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <label className="block p-2 sm:hidden text-sm font-semibold">Settings section<select aria-label="Settings section" className="mt-2 w-full rounded-xl border p-3 bg-white" value={activeTab} onChange={e => setActiveTab(e.target.value)}>{tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}</select></label><div className="hidden sm:flex flex-wrap gap-1.5 pb-1 text-xs font-bold">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#15803D] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Form Container */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">Platform Identity & Localization</h3>
              <p className="text-xs text-slate-500 mt-1">Configure your brand identity, localization formats, and registration rules.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Platform Brand Name</label>
                <input
                  type="text"
                  required
                  value={form.platformName || ''}
                  onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Platform Tagline</label>
                <input
                  type="text"
                  value={form.platformTagline || ''}
                  onChange={(e) => setForm({ ...form, platformTagline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Platform Meta Description</label>
                <textarea
                  rows={2}
                  value={form.platformDescription || ''}
                  onChange={(e) => setForm({ ...form, platformDescription: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Default Currency Symbol</label>
                <input
                  type="text"
                  required
                  value={form.defaultCurrency || '₦'}
                  onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-emerald-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Standard Nigerian Naira symbol (₦)</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Currency ISO Code</label>
                <input
                  type="text"
                  value={form.currencyCode || 'NGN'}
                  onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-emerald-600 uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Default Timezone</label>
                <select
                  value={form.timezone || 'Africa/Lagos (WAT)'}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                >
                  <option value="Africa/Lagos (WAT)">Africa/Lagos (WAT / UTC+1)</option>
                  <option value="Africa/Accra (GMT)">Africa/Accra (GMT / UTC+0)</option>
                  <option value="Africa/Nairobi (EAT)">Africa/Nairobi (EAT / UTC+3)</option>
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Date Display Format</label>
                <select
                  value={form.dateFormat || 'DD/MM/YYYY'}
                  onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 15/10/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/15/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                  <option value="D MMM YYYY">D MMM YYYY (e.g. 15 Oct 2026)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Farmer Public Sign-Up Status</label>
                <select
                  value={form.allowRegistrations ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, allowRegistrations: e.target.value === 'true' })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                >
                  <option value="true">Open (Public Registration Active)</option>
                  <option value="false">Closed (Invite & Admin Created Only)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6 sm:col-span-2">
                <input
                  type="checkbox"
                  id="maintenanceModeCheckbox"
                  checked={!!form.maintenanceMode}
                  onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="maintenanceModeCheckbox" className="font-bold text-slate-800 cursor-pointer">
                  Enable Maintenance Mode (Restricts Farmer Access)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Account & Contact Settings */}
        {activeTab === 'account' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">Admin Contact & Escalation Channels</h3>
              <p className="text-xs text-slate-500 mt-1">Official contact endpoints used in farmer communications, receipts, and alert escalations.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Primary Administrative Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={form.adminContactEmail || 'admin@poultrypro.ng'}
                    onChange={(e) => setForm({ ...form, adminContactEmail: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Official Administrative Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={form.adminContactPhone || '+234 803 123 4567'}
                    onChange={(e) => setForm({ ...form, adminContactPhone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">System Alert Notifications Inbox</label>
                <div className="relative">
                  <Bell className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={form.adminNotificationEmail || 'alerts@poultrypro.ng'}
                    onChange={(e) => setForm({ ...form, adminNotificationEmail: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Technical Escalation Email</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={SUPPORT_CONTACT.email}
                    readOnly
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-900 leading-relaxed">
                Personal admin account credentials (passwords, avatar, full name) can also be individually updated in the <strong>Admin Profile</strong> page accessible via the top-right profile avatar.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Sessions */}
        {activeTab === 'security' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-700" />
                  Security, Sessions & Access Control
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure multi-factor authentication, session timeouts, and password hardening policies.</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-2xs font-extrabold uppercase">
                SOC2 Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Admin Session Idle Timeout</label>
                <select
                  value={form.sessionTimeoutMinutes || 60}
                  onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                >
                  <option value={15}>15 Minutes (Strict)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes (Standard)</option>
                  <option value={120}>2 Hours</option>
                  <option value={480}>8 Hours (Full Shift)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Two-Factor Authentication (2FA)</label>
                <select
                  value={form.twoFactorRequired ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, twoFactorRequired: e.target.value === 'true' })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                >
                  <option value="false">Optional (Admin Discretion)</option>
                  <option value="true">Enforced (All Administrators Required)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Minimum Password Length</label>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={form.passwordMinLength || 8}
                  onChange={(e) => setForm({ ...form, passwordMinLength: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Max Failed Login Attempts</label>
                <select
                  value={form.maxLoginAttempts || 5}
                  onChange={(e) => setForm({ ...form, maxLoginAttempts: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                >
                  <option value={3}>3 Attempts (Lockout)</option>
                  <option value={5}>5 Attempts (Recommended)</option>
                  <option value={10}>10 Attempts</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Account Lockout Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={form.lockoutDurationMinutes || 15}
                  onChange={(e) => setForm({ ...form, lockoutDurationMinutes: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-3 pt-4 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requireSpecialChars"
                    checked={form.requireSpecialChars ?? true}
                    onChange={(e) => setForm({ ...form, requireSpecialChars: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="requireSpecialChars" className="font-semibold text-slate-700 cursor-pointer">
                    Require Special Characters & Numbers in Passwords
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRevokeSessions"
                    checked={form.autoRevokeSessions ?? true}
                    onChange={(e) => setForm({ ...form, autoRevokeSessions: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="autoRevokeSessions" className="font-semibold text-slate-700 cursor-pointer">
                    Auto-revoke Concurrent Sessions on Password Reset
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Subscription Settings */}
        {activeTab === 'subscription' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-700" />
                Subscription Lifecycle & Automation
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure default onboarding plans, renewal reminder windows, and grace periods.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Default Plan for New Farmers</label>
                <select
                  value={form.defaultFreePlan || 'Free Tier'}
                  onChange={(e) => setForm({ ...form, defaultFreePlan: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                >
                  <option value="Free Tier">Free Tier (Up to 500 birds)</option>
                  <option value="Standard Trial">Standard Trial (14-day Pro Access)</option>
                  <option value="Basic">Basic Plan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Free Trial Duration (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={form.trialDurationDays || 14}
                  onChange={(e) => setForm({ ...form, trialDurationDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Renewal Reminder Notice (Days Prior)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.renewalReminderDays || 7}
                  onChange={(e) => setForm({ ...form, renewalReminderDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">In-app & SMS/Email notification sent before card charge</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Subscription Grace Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={form.gracePeriodDays || 3}
                  onChange={(e) => setForm({ ...form, gracePeriodDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Farmer access remains active during grace retry period</span>
              </div>

              <div className="sm:col-span-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoDowngrade"
                    checked={form.autoDowngradeOnExpiry ?? true}
                    onChange={(e) => setForm({ ...form, autoDowngradeOnExpiry: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="autoDowngrade" className="font-semibold text-slate-700 cursor-pointer">
                    Automatically downgrade unpaid accounts to Free Tier instead of blocking farm records
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Payment Gateways */}
        {activeTab === 'payment' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                Payment Gateway Integrations (Nigeria)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure Paystack and Flutterwave credentials for farmer subscription checkouts.</p>
            </div>

            <div className="space-y-5 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-extrabold text-slate-900 text-sm">Paystack Nigeria (Live Gateway)</span>
                  </div>
                  <span className="text-2xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">Primary</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Paystack Public Key</label>
                  <input
                    type="text"
                    value={form.paystackPublicKey || ''}
                    onChange={(e) => setForm({ ...form, paystackPublicKey: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Paystack Secret Key (Masked)</label>
                  <div className="relative">
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      value={form.paystackSecretKeyMasked || 'sk_live_********************44c1'}
                      onChange={(e) => setForm({ ...form, paystackSecretKeyMasked: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-emerald-600 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="font-extrabold text-slate-900 text-sm">Flutterwave Africa (Secondary Gateway)</span>
                  </div>
                  <span className="text-2xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">Backup</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Flutterwave Public Key</label>
                  <input
                    type="text"
                    value={form.flutterwavePublicKey || ''}
                    onChange={(e) => setForm({ ...form, flutterwavePublicKey: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Flutterwave Secret Key (Masked)</label>
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={form.flutterwaveSecretKeyMasked || 'FLWSECK_LIVE-*****************-X'}
                    onChange={(e) => setForm({ ...form, flutterwaveSecretKeyMasked: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1.5">Payment Verification Mode</label>
                  <select
                    value={form.paymentVerificationMode || 'Automated Webhooks'}
                    onChange={(e) => setForm({ ...form, paymentVerificationMode: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                  >
                    <option value="Automated Webhooks">Automated Webhooks (Instant Activation)</option>
                    <option value="Manual Verification">Manual Verification (Admin Approval Required)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1.5">Farmer Refund Policy Window (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={form.refundWindowDays || 7}
                    onChange={(e) => setForm({ ...form, refundWindowDays: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Notifications & Alerts */}
        {activeTab === 'notification' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-700" />
                Notification Preferences & Alerts
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure automated system dispatches, farmer event emails, and broadcast announcements.</p>
            </div>

            <div className="space-y-4 text-xs">
              {[
                { key: 'emailAlertsEnabled', label: 'Email Alerts Channel', desc: 'Send transactional and administrative alerts via SMTP/SendGrid' },
                { key: 'inAppAlertsEnabled', label: 'In-App Notification Center', desc: 'Push notifications to admin & farmer in-app bell dropdown' },
                { key: 'newFarmerSignupAlerts', label: 'Farmer Registration Notifications', desc: 'Dispatch instant alerts when a new Nigerian farmer signs up' },
                { key: 'paymentReceivedAlerts', label: 'Payment Success Notifications', desc: 'Notify finance team immediately upon successful card or bank subscription payment' },
                { key: 'subscriptionExpiryReminderAlerts', label: 'Subscription Expiry Automated Reminders', desc: 'Trigger automated email and SMS prompts before farmer renewals' },
                { key: 'systemAnnouncements', label: 'System Announcements Broadcast', desc: 'Allow super admins to broadcast banner announcements across farmer dashboards' }
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex-wrap gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{label}</h4>
                    <p className="text-2xs sm:text-xs text-slate-500">{desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form[key] ?? true}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="w-5 h-5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 7: Appearance & UI */}
        {activeTab === 'appearance' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-emerald-700" />
                Platform Appearance & Layout Preferences
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure UI density, sidebar default behaviors, and brand color palette.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Color Theme Preference</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Light Mode', icon: Sun },
                    { id: 'dark', label: 'Dark Mode', icon: Moon },
                    { id: 'system', label: 'System Default', icon: Monitor }
                  ].map((theme) => {
                    const ThemeIcon = theme.icon;
                    const isSelected = (form.defaultTheme || 'light') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setForm({ ...form, defaultTheme: theme.id })}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 font-bold transition text-xs cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ThemeIcon className="w-5 h-5" />
                        <span>{theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Table Information Density</label>
                <select
                  value={form.density || 'comfortable'}
                  onChange={(e) => setForm({ ...form, density: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                >
                  <option value="comfortable">Comfortable (Spacious padding)</option>
                  <option value="compact">Compact (High density data grids)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Admin Sidebar Default State</label>
                <select
                  value={form.sidebarDefaultExpanded ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, sidebarDefaultExpanded: e.target.value === 'true' })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                >
                  <option value="true">Expanded (Labels & Icons visible)</option>
                  <option value="false">Collapsed (Icon-only rail)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Primary Brand Accent</label>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#15803D] border border-slate-200 shrink-0 shadow-2xs"></div>
                  <div>
                    <span className="font-mono font-bold text-slate-800 text-sm">#15803D</span>
                    <span className="text-[11px] text-slate-400 block">PoultryPro Signature Agro-Green</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Data & Privacy */}
        {activeTab === 'data' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-700" />
                Data Retention, Privacy & Compliance (NDPR / GDPR)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Audit trail retention, farmer data portability, and Nigeria Data Protection Regulation compliance.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Audit Log Retention (Days)</label>
                <select
                  value={form.dataRetentionDays || 365}
                  onChange={(e) => setForm({ ...form, dataRetentionDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                >
                  <option value={90}>90 Days (3 Months)</option>
                  <option value={180}>180 Days (6 Months)</option>
                  <option value={365}>365 Days (1 Year - Standard)</option>
                  <option value={730}>730 Days (2 Years)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Privacy Policy URL</label>
                <input
                  type="text"
                  value={form.privacyPolicyUrl || 'https://poultrypro.ng/privacy'}
                  onChange={(e) => setForm({ ...form, privacyPolicyUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">Terms of Service URL</label>
                <input
                  type="text"
                  value={form.termsOfServiceUrl || 'https://poultrypro.ng/terms'}
                  onChange={(e) => setForm({ ...form, termsOfServiceUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="space-y-3 pt-4 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowDataExport"
                    checked={form.allowFarmerDataExport ?? true}
                    onChange={(e) => setForm({ ...form, allowFarmerDataExport: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="allowDataExport" className="font-semibold text-slate-700 cursor-pointer">
                    Allow Farmers to Export Full Flocks, Feed & Finance Data (CSV/PDF)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymizeAccounts"
                    checked={form.anonymizeDeletedAccounts ?? true}
                    onChange={(e) => setForm({ ...form, anonymizeDeletedAccounts: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="anonymizeAccounts" className="font-semibold text-slate-700 cursor-pointer">
                    Anonymize Records upon Farmer Account Deletion Request
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dailyBackups"
                    checked={form.automaticDailyBackups ?? true}
                    onChange={(e) => setForm({ ...form, automaticDailyBackups: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="dailyBackups" className="font-semibold text-slate-700 cursor-pointer">
                    Enable Automated Nightly Database Backups to Cloud Storage
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Button Footer */}
        <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
          <p className="text-2xs text-slate-400">
            Changes to platform parameters will take effect immediately across all active sessions.
          </p>
          <button disabled={handleSaveSaving}
            type="submit"
            className="px-6 py-3 bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
          >{handleSaveSaving ? 'Saving...' : <>
            <Save className="w-4 h-4" />
            <span>Save Platform Settings</span>
          </>}</button>
        </div>
      </form>
    </div>
  );
}
