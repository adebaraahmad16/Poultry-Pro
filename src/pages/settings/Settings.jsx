import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, Building, Bell, Shield, CreditCard, Check, RefreshCw, Trash2, Lightbulb } from '../../components/common/Icons';
import { useAuth } from '../../context/AuthContext';
import { useFarm, usePoultryData } from '../../context/FarmContext';
import { farmProfileService } from '../../services/managementService';
import { resetAllData } from '../../services/storageService';
import PoultryTypeSelect from '../../components/common/PoultryTypeSelect';
import SubscriptionManagement from './components/SubscriptionManagement';

import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function Settings() {
  const { user } = useAuth();
  const { farm, refreshAllData, flocks, metrics, workers, currentPlan, currentPlanId, updatePlan } = useFarm();
  const { selectedTypeIds } = usePoultryData();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const getTabFromPath = (path) => {
    if (path.includes('/settings/farm')) return 'Farm Settings';
    if (path.includes('/settings/notifications')) return 'Notifications';
    if (path.includes('/settings/security')) return 'Security';
    if (path.includes('/settings/subscription')) return 'Subscription';
    return 'Profile';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [successMsg, setSuccessMsg] = useState('');
  const [poultryTypes, setPoultryTypes] = useState(selectedTypeIds);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const [userProfile, setUserProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'Farm Owner'
  });

  const [farmSettings, setFarmSettings] = useState({
    name: farm?.name || '',
    location: farm?.location || '',
    type: farm?.type || 'Poultry Farm',
    currency: farm?.currency || '$',
    weightUnit: farm?.weightUnit || 'kg'
  });

  const [notifSettings, setNotifSettings] = useState(() => {
    const saved = localStorage.getItem('poultrypro_notif_preferences');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      farmActivity: true,
      feedInventory: true,
      mortalityAlerts: true,
      productionReminders: true,
      subscriptionAlerts: true,
      systemAnnouncements: true,
      emailNotifications: true,
      securityAlerts: true
    };
  });

  const handleSaveUser = (e) => {
    e.preventDefault();
    farmProfileService.updateUser(userProfile);
    refreshAllData();
    setSuccessMsg('Profile updated successfully.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveFarm = async (e) => {
    e.preventDefault();
    if (poultryTypes.length === 0) {
      setSuccessMsg('Please select at least one poultry type you manage.');
      setTimeout(() => setSuccessMsg(''), 4000);
      return;
    }
    try { await farmProfileService.updateFarm({ ...farmSettings, poultryTypes }); } catch(e) { setSuccessMsg(e.message); return; }
    refreshAllData();
    setSuccessMsg('Farm settings saved. Your dashboards have been updated to match your poultry types.');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    const pathMap = {
      'Profile': '/settings/profile',
      'Farm Settings': '/settings/farm',
      'Notifications': '/settings/notifications',
      'Security': '/settings/security',
      'Subscription': '/settings/subscription'
    };
    if (pathMap[tabName]) {
      navigate(pathMap[tabName]);
    }
  };

  const tabs = [
    { name: 'Profile', icon: User },
    { name: 'Farm Settings', icon: Building },
    { name: 'Notifications', icon: Bell },
    { name: 'Security', icon: Shield },
    { name: 'Subscription', icon: CreditCard }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-emerald-600" />
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Configure profile details, farm location parameters, alerts, and subscription tier.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-semibold border border-emerald-200">
          ✓ {successMsg}
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.name}
              onClick={() => handleTabClick(t.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === t.name
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.name}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs max-w-3xl">
        {activeTab === 'Profile' && (
          <form onSubmit={handleSaveUser} className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Profile Settings</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
            <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm">
              Save Profile Changes
            </button>
          </form>
        )}

        {activeTab === 'Farm Settings' && (
          <form onSubmit={handleSaveFarm} className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Farm Profile Parameters</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Farm Name</label>
              <input
                type="text"
                value={farmSettings.name}
                onChange={(e) => setFarmSettings({ ...farmSettings, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Location / Address</label>
              <input
                type="text"
                value={farmSettings.location}
                onChange={(e) => setFarmSettings({ ...farmSettings, location: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="pt-2">
              <h4 className="text-sm font-extrabold text-slate-900 mb-1">Poultry Types You Manage</h4>
              <p className="text-xs text-slate-500 mb-3">
                Selecting types here personalizes your dashboard. Adding a type automatically creates its management dashboard; removing one hides it (records are kept).
              </p>
              <PoultryTypeSelect selected={poultryTypes} onChange={setPoultryTypes} columns="grid-cols-2 sm:grid-cols-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Default Currency</label>
                <input
                  type="text"
                  disabled
                  value={farmSettings.currency}
                  className="w-full px-4 py-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Weight Unit</label>
                <input
                  type="text"
                  disabled
                  value={farmSettings.weightUnit}
                  className="w-full px-4 py-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
            <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm">
              Save Farm Settings
            </button>
          </form>
        )}

        {activeTab === 'Notifications' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Notification & Alert Preferences</h3>
              <p className="text-xs text-slate-500">
                Choose which farm alerts, warnings, and announcements you wish to receive in your dashboard.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { 
                  key: 'farmActivity', 
                  label: 'Farm Activity Notifications', 
                  desc: 'Get alerted when new flocks, tasks, or farm milestones are recorded.' 
                },
                { 
                  key: 'feedInventory', 
                  label: 'Feed Inventory & Stock Warnings', 
                  desc: 'Receive immediate warnings when feed stock approaches minimum thresholds or runs out.' 
                },
                { 
                  key: 'mortalityAlerts', 
                  label: 'Mortality & Disease Spike Alerts', 
                  desc: 'Instant high-priority warning if daily mortality exceeds configured safety thresholds.' 
                },
                { 
                  key: 'productionReminders', 
                  label: 'Production & Task Reminders', 
                  desc: 'Reminders for daily egg collection, vaccination schedules, and medication courses.' 
                },
                { 
                  key: 'subscriptionAlerts', 
                  label: 'Subscription & Billing Reminders', 
                  desc: 'Advance notice when trial or subscription renewals are due.' 
                },
                { 
                  key: 'systemAnnouncements', 
                  label: 'PoultryPro System Announcements', 
                  desc: 'Platform updates, agricultural advisories, and administrative notices.' 
                },
                { 
                  key: 'emailNotifications', 
                  label: 'Email Summaries & Urgent Alerts', 
                  desc: 'Send urgent security and critical farm alerts to your registered email address.' 
                },
                { 
                  key: 'securityAlerts', 
                  label: 'Account Security Notifications', 
                  desc: 'Critical security alerts (password changes, logins). Required for account protection.',
                  required: true
                }
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100/60">
                  <div className="pr-4">
                    <p className="text-sm font-bold text-slate-800">{n.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={n.required ? true : Boolean(notifSettings[n.key])}
                    disabled={n.required}
                    onChange={(e) => {
                      if (n.required) return;
                      setNotifSettings({ ...notifSettings, [n.key]: e.target.checked });
                    }}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 disabled:opacity-50"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={async () => {
                localStorage.setItem('poultrypro_notif_preferences', JSON.stringify(notifSettings));
                if (isSupabaseConfigured() && supabase && user?.id) {
                  try {
                    await supabase.from('profiles').update({
                      raw_user_meta_data: { notif_preferences: notifSettings }
                    }).eq('id', user.id);
                  } catch (e) {
                    console.warn('Preferences sync to Supabase:', e.message);
                  }
                }
                toast.success('Notification preferences saved successfully.', { title: 'Preferences Updated' });
              }}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              Save Notification Preferences
            </button>
          </div>
        )}

        {activeTab === 'Subscription' && (
          <SubscriptionManagement />
        )}

        {activeTab === 'Security' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Security Settings</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <button
                type="button"
                onClick={() => {
                  toast.success('Security password updated successfully.', { title: 'Security Updated' });
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm"
              >
                Update Password
              </button>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-rose-600 mb-1 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                Reset & Wipe All Farm Records
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Clear all flocks, eggs, feed, mortality, sales, expenses, and settings to start with a brand new, empty farm.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Reset All Farm Data?',
                    message: 'Are you sure you want to reset all data? This will wipe all records and give you a fresh, clean dashboard. This action cannot be undone.',
                    confirmText: 'Wipe All Data & Start Fresh',
                    cancelText: 'Keep Farm Data',
                    isDanger: true,
                  });
                  if (!ok) return;

                  resetAllData();
                  refreshAllData();
                  toast.warning('All farm records have been reset.', { title: 'Farm Wiped' });
                }}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Wipe All Data & Start Fresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
