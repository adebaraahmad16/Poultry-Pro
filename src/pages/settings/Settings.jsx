import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, Building, Bell, Shield, CreditCard, Check, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFarm, usePoultryData } from '../../context/FarmContext';
import { farmProfileService } from '../../services/managementService';
import { resetAllData } from '../../services/storageService';
import PoultryTypeSelect from '../../components/common/PoultryTypeSelect';

export default function Settings() {
  const { user } = useAuth();
  const { farm, refreshAllData, flocks, metrics, workers, currentPlan, currentPlanId, updatePlan } = useFarm();
  const { selectedTypeIds } = usePoultryData();
  const location = useLocation();
  const navigate = useNavigate();

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

  const [notifSettings, setNotifSettings] = useState({
    vaccinations: true,
    lowFeed: true,
    payments: true,
    mortality: true
  });

  const handleSaveUser = (e) => {
    e.preventDefault();
    farmProfileService.updateUser(userProfile);
    refreshAllData();
    setSuccessMsg('Profile updated successfully.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveFarm = (e) => {
    e.preventDefault();
    if (poultryTypes.length === 0) {
      setSuccessMsg('Please select at least one poultry type you manage.');
      setTimeout(() => setSuccessMsg(''), 4000);
      return;
    }
    farmProfileService.updateFarm({ ...farmSettings, poultryTypes });
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
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Notification & Warning Alerts</h3>
            {[
              { label: 'Vaccination Schedule Reminders', desc: 'Get alerted 24 hours before a scheduled vaccine dose.', key: 'vaccinations' },
              { label: 'Low Feed Inventory Warnings', desc: 'Alert when feed stock drops below minimum threshold bags.', key: 'lowFeed' },
              { label: 'Pending Customer Payment Reminders', desc: 'Notify on open unpaid customer invoices.', key: 'payments' },
              { label: 'Mortality Rate Spike Alerts', desc: 'Alert if daily mortality exceeds 1% of flock size.', key: 'mortality' }
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{n.label}</p>
                  <p className="text-xs text-slate-500">{n.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifSettings[n.key]}
                  onChange={(e) => setNotifSettings({ ...notifSettings, [n.key]: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Subscription' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">Active Subscription & Usage Limits</h3>
              <p className="text-xs text-slate-500">Monitor your farm plan tier, flock & bird limits, and upgrade as your farm grows.</p>
            </div>

            {/* Current Active Plan Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-full tracking-wider">
                      {currentPlan.badge} Active
                    </span>
                    <span className="text-xs font-semibold text-emerald-300">{currentPlan.priceFormatted} / {currentPlan.period}</span>
                  </div>
                  <h4 className="text-2xl font-black text-white mt-2">PoultryPro {currentPlan.name} Plan</h4>
                  <p className="text-xs text-slate-300 mt-1">{currentPlan.tagline}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30">
                    Status: Active
                  </span>
                </div>
              </div>

              {/* Live Quotas Usage Meters */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Flocks Quota */}
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                    <span className="text-slate-300">Flocks (Batches)</span>
                    <span className="text-white">
                      {flocks.length} / {currentPlan.limits.maxFlocks === Infinity ? 'Unlimited' : currentPlan.limits.maxFlocks}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        flocks.length >= currentPlan.limits.maxFlocks && currentPlan.limits.maxFlocks !== Infinity
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: currentPlan.limits.maxFlocks === Infinity
                          ? '20%'
                          : `${Math.min(100, (flocks.length / currentPlan.limits.maxFlocks) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Birds Quota */}
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                    <span className="text-slate-300">Total Bird Capacity</span>
                    <span className="text-white">
                      {metrics.totalBirds.toLocaleString()} / {currentPlan.limits.maxBirds === Infinity ? 'Unlimited' : currentPlan.limits.maxBirds.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        metrics.totalBirds >= currentPlan.limits.maxBirds && currentPlan.limits.maxBirds !== Infinity
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: currentPlan.limits.maxBirds === Infinity
                          ? '20%'
                          : `${Math.min(100, (metrics.totalBirds / currentPlan.limits.maxBirds) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Staff Accounts Quota */}
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                    <span className="text-slate-300">Staff Accounts</span>
                    <span className="text-white">
                      {workers.length || 1} / {currentPlan.limits.maxUsers}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, ((workers.length || 1) / currentPlan.limits.maxUsers) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Flock Definition Banner */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong className="font-extrabold block text-amber-950 mb-1">💡 What counts as a Flock?</strong>
              A flock refers to a distinct batch or group of birds (e.g., <em>Broiler Batch A — 500 birds</em>), not individual birds. For instance, on the <strong>Free plan (2 flocks)</strong>, you can manage up to 500 total birds divided between 2 active batches.
            </div>

            {/* Plan Switcher & Upgrades */}
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-3">Available PoultryPro Subscription Tiers</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'FREE', name: 'Free Tier', price: '₦0/mo', flocks: '2 Flocks', birds: 'Up to 500 Birds', pdf: '—' },
                  { id: 'BASIC', name: 'Basic Tier', price: '₦5,000/mo', flocks: '10 Flocks', birds: 'Up to 5,000 Birds', pdf: '✓ PDF Exports' },
                  { id: 'PRO', name: 'Pro Enterprise', price: '₦15,000/mo', flocks: 'Unlimited', birds: 'Unlimited Birds', pdf: '✓ PDF & CSV' }
                ].map((tier) => {
                  const isCurrent = currentPlanId === tier.id;
                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isCurrent ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-sm text-slate-900">{tier.name}</span>
                          <span className="text-xs font-black text-emerald-700">{tier.price}</span>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-slate-600 font-medium">
                          <p>• {tier.flocks}</p>
                          <p>• {tier.birds}</p>
                          <p>• {tier.pdf}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          updatePlan(tier.id);
                          setSuccessMsg(`Switched to ${tier.name} (${tier.price}) successfully.`);
                          setTimeout(() => setSuccessMsg(''), 3000);
                        }}
                        disabled={isCurrent}
                        className={`mt-4 w-full py-2 rounded-lg text-xs font-extrabold transition-all ${
                          isCurrent
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isCurrent ? 'Current Active Plan' : `Switch to ${tier.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
                  setSuccessMsg('Security password updated successfully.');
                  setTimeout(() => setSuccessMsg(''), 3000);
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
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset all data? This will wipe all records and give you a fresh, clean dashboard.')) {
                    resetAllData();
                    refreshAllData();
                    setSuccessMsg('All farm records wiped. You now have a fresh, clean farm.');
                    setTimeout(() => setSuccessMsg(''), 4000);
                  }
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
