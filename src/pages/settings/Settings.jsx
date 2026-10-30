import { readNotificationPreferences, saveNotificationPreferences } from '../../services/settingsPersistence';
import { changeAccountPassword } from '../../services/profileService';
import useSaveAction from '../../hooks/useSaveAction';
import { useProfile } from '../../context/ProfileContext';
import React, { useState, useEffect, useRef } from 'react';
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
  const { updateProfile, uploadAvatar, saving: profileSaving, error: profileError, avatarUrl } = useProfile();
  const [saveError, setSaveError] = useState('');
  const [farmSaving, setFarmSaving] = useState(false);
  const saveLock = useRef(false);
  const dirtyProfile = useRef(false);
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
    name: user?.full_name || '',
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

  useEffect(() => {
    dirtyProfile.current = false;
    setUserProfile({ name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '', role: user?.role || 'farmer' });
    setSaveError(''); setSuccessMsg('');
  }, [user?.id]);
  useEffect(() => {
    if (!dirtyProfile.current) setUserProfile({ name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '', role: user?.role || 'farmer' });
  }, [user]);
  const [handleSaveUser, handleSaveUserSaving] = useSaveAction(async e => {
    e.preventDefault();
    if (saveLock.current || profileSaving) return;
    saveLock.current = true; setSaveError(''); setSuccessMsg('');
    try {
      await updateProfile({ full_name: userProfile.name, phone: userProfile.phone });
      dirtyProfile.current = false;
      setSuccessMsg('Changes saved successfully.');
    } catch (error) { setSaveError(error.message); }
    finally { saveLock.current = false; }
  });
  const [handleAvatar, handleAvatarSaving] = useSaveAction(async event => {
    const file = event.target.files?.[0];
    if (!file || profileSaving) return;
    setSaveError(''); setSuccessMsg('');
    try { await uploadAvatar(file); setSuccessMsg('Profile picture saved successfully.'); }
    catch (error) { setSaveError(error.message); }
    event.target.value = '';
  });
  const [handleSaveFarm, handleSaveFarmSaving] = useSaveAction(async e => {
    e.preventDefault();
    if (saveLock.current) return;
    setSaveError(''); setSuccessMsg('');
    if (!farmSettings.name.trim() || !poultryTypes.length) { setSaveError('Enter your farm name and select at least one poultry type.'); return; }
    saveLock.current = true; setFarmSaving(true);
    try {
      await farmProfileService.updateFarm({ ...farmSettings, poultryTypes });
      await refreshAllData();
      setSuccessMsg('Changes saved successfully.');
    } catch (error) { setSaveError(error.message); }
    finally { saveLock.current = false; setFarmSaving(false); }
  });

  useEffect(() => {
    if (activeTab !== 'Notifications' || !user?.id) return;
    let active = true;
    readNotificationPreferences(user.id, notifSettings).then(values => { if (active) setNotifSettings(values); }).catch(error => { if (active) setSaveError(error.message); });
    return () => { active = false; };
  }, [user?.id, activeTab]);
  const [handleSaveNotification, notificationSaving] = useSaveAction(async () => {
    await saveNotificationPreferences(user.id, notifSettings);
    toast.success('Changes saved successfully.', { title: 'Preferences Updated' });
  });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [handlePassword, passwordSaving] = useSaveAction(async () => {
    if (passwords.next !== passwords.confirm) throw new Error('The new passwords do not match.');
    await changeAccountPassword(passwords.current, passwords.next, user.id);
    setPasswords({ current: '', next: '', confirm: '' });
    toast.success('Password updated successfully.', { title: 'Security Updated' });
  });

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

      {(saveError || profileError) && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{saveError || profileError}</div>}
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
      <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs max-w-3xl">
        {activeTab === 'Profile' && (
          <form onSubmit={handleSaveUser} className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Profile Settings</h3>
            <div className="flex flex-wrap items-center gap-4">
              {avatarUrl && <img src={avatarUrl} alt="Your profile" className="h-16 w-16 rounded-full object-cover" />}
              <label className="block min-w-0 text-sm font-semibold">Profile picture<input type="file" accept="image/jpeg,image/png,image/webp" disabled={profileSaving} onChange={handleAvatar} className="mt-2 block w-full max-w-full text-sm" /><span className="mt-1 block text-xs text-slate-500">JPEG, PNG, or WebP. Maximum 5 MB.</span></label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => { dirtyProfile.current = true; setUserProfile({ ...userProfile, name: e.target.value }); }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={userProfile.email}
                  readOnly aria-label="Verified account email"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={userProfile.phone}
                  onChange={(e) => { dirtyProfile.current = true; setUserProfile({ ...userProfile, phone: e.target.value }); }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
            <button type="submit" disabled={handleSaveUserSaving || (profileSaving || farmSaving)} className="disabled:opacity-60 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm">{handleSaveUserSaving ? 'Saving...' : <>
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </>}</button>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <button type="submit" disabled={handleSaveFarmSaving || (profileSaving || farmSaving)} className="disabled:opacity-60 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm">{handleSaveFarmSaving ? 'Saving...' : <>
              {farmSaving ? 'Saving...' : 'Save Changes'}
            </>}</button>
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
              disabled={notificationSaving}
              onClick={handleSaveNotification}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
            >
              {notificationSaving ? 'Saving...' : 'Save Notification Preferences'}
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
                <input type="password" autoComplete="current-password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">New Password</label>
                <input type="password" autoComplete="new-password" value={passwords.next} onChange={e => setPasswords({ ...passwords, next: e.target.value })} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <label className="block text-xs font-semibold text-slate-700">Confirm New Password<input type="password" autoComplete="new-password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm" /></label>
              <button
                type="button"
                disabled={passwordSaving}
                onClick={handlePassword}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm"
              >
                {passwordSaving ? 'Saving...' : 'Update Password'}
              </button>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-rose-600 mb-1 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                Refresh Cached Farm Data
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Reload your saved records from Supabase without deleting farm data.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Refresh Cached Farm Data?',
                    message: 'Reload your saved cloud records? This clears only local display caches.',
                    confirmText: 'Refresh Data',
                    cancelText: 'Keep Farm Data',
                    isDanger: true,
                  });
                  if (!ok) return;

                  resetAllData();
                  refreshAllData();
                  toast.success('Saved farm records reloaded.', { title: 'Data Refreshed' });
                }}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Saved Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
