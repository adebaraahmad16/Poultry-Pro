import { useAuth } from './AuthContext';
import { usePlanCatalog } from '../components/subscriptions/usePlanCatalog';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { inventoryService } from '../services/businessService';
import { taskService, notificationService } from '../services/managementService';
import { PLANS } from '../constants/plans';
import { POULTRY_TYPE_MAP, getPoultryTypeByFlockType } from '../constants/poultryTypes';
import { subscriptionService } from '../services/subscriptionService';
import { localDate } from '../../shared/dailyRecords';
import { availableTypeIds, poultryTypeId, scopeFarmData, selectionKey, restoreSelection } from '../../shared/poultryScope';
import { setSelectedFarmId, setSelectedPoultryType } from '../services/farmScope';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';
import { loadAllFarmData, getFarmSubscription } from '../services/supabase/farmDataService.js';
import { 
  fetchNotifications, 
  evaluateFarmSmartAlerts, 
  subscribeToNotificationChanges 
} from '../services/notificationStore.js';

const FarmContext = createContext(null);
const readSelection = key => { try { return localStorage.getItem(key); } catch { return null; } };

export const FarmProvider = ({ children }) => {
  usePlanCatalog();
  const { isLoggedIn, loading: authLoading, user } = useAuth();
  const [farm, setFarm] = useState({});
  const [flocks, setFlocks] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [eggs, setEggs] = useState([]);
  const [mortality, setMortality] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [medications, setMedications] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [dailyRecords, setDailyRecords] = useState([]);
  const refreshing = useRef(false);
  const queuedRefresh = useRef(false);
  const [notifications, setNotifications] = useState([]);
  const [accessibleFarms, setAccessibleFarms] = useState([]);
  const [farmSelection, setFarmSelection] = useState({ userId: null, id: '' });
  const selectedFarmId = farmSelection.userId === user?.id ? farmSelection.id : '';
  const updateSelectedFarmId = useCallback(id => setFarmSelection({ userId: user?.id || null, id }), [user?.id]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [loadedScope, setLoadedScope] = useState('');
  const [subscriptionDatabaseScope, setSubscriptionDatabaseScope] = useState('');
  const loadedScopeRef = useRef(''); loadedScopeRef.current = loadedScope;
  const refreshScope = useRef('');
  const [selection, setSelection] = useState({ key: '', id: 'all' });
  const profileFarmId = user?.farmId || user?.farm_id || '';
  const ownLoadedFarm = loadedScope.startsWith(`${user?.id}:`) ? farm?.id : '';
  const effectiveFarmId = selectedFarmId || profileFarmId || ownLoadedFarm || '';
  const scopeId = `${user?.id || ''}:${effectiveFarmId}`;
  const scopeRef = useRef(scopeId); scopeRef.current = scopeId;
  const preferenceKey = selectionKey(user?.id, effectiveFarmId);
  const isScopeMatch = Boolean(isLoggedIn && !authLoading && loadedScope && loadedScope === scopeId);
  const types = useMemo(() => isScopeMatch ? availableTypeIds(farm, flocks) : [], [isScopeMatch, farm, flocks]);
  const activeTypeId = isScopeMatch ? restoreSelection(selection.key === preferenceKey ? selection.id : readSelection(preferenceKey), types) : 'all';

  useEffect(() => {
    setSelectedPoultryType(activeTypeId);
    if (isScopeMatch && user?.id && effectiveFarmId && readSelection(preferenceKey) !== activeTypeId) {
      try { localStorage.setItem(preferenceKey, activeTypeId); } catch { /* Preferences may be disabled; in-memory selection still works. */ }
    }
  }, [activeTypeId, isScopeMatch, user?.id, effectiveFarmId, preferenceKey]);
  useEffect(() => { setSelectedFarmId(effectiveFarmId); }, [effectiveFarmId]);
  useEffect(() => () => { setSelectedFarmId(''); setSelectedPoultryType('all'); }, []);

  const selectPoultryType = useCallback(id => {
    if (authLoading || !isLoggedIn || !isScopeMatch) return;
    const valid = poultryTypeId(id);
    if (valid !== 'all' && !types.includes(valid)) return;
    setSelection(current => current.key === preferenceKey && current.id === valid ? current : { key: preferenceKey, id: valid });
  }, [authLoading, isLoggedIn, isScopeMatch, types, preferenceKey]);

  const selectFarm = id => {
    if (!accessibleFarms.some(f => f.id === id)) return;
    if (id === effectiveFarmId) return;
    setSelection({ key: '', id: 'all' });
    updateSelectedFarmId(id); setDataLoading(true); setLoadedScope('');
  };

  useEffect(() => {
    updateSelectedFarmId(profileFarmId);
    setLoadedScope(''); setAccessibleFarms([]); setDataLoading(!!isLoggedIn);
    setFarm({}); setFlocks([]); setFeeds([]); setEggs([]); setMortality([]);
    setVaccinations([]); setMedications([]); setSales([]); setExpenses([]);
    setCustomers([]); setWorkers([]); setInventory([]); setTasks([]); setDailyRecords([]);
    setWeightRecords([]); setNotifications([]); setSubscriptionDatabaseScope('');
    setSelection({ key: '', id: 'all' });
  }, [user?.id, isLoggedIn]);

  // Active Subscription & 14-Day Free Trial State
  const [subscription, setSubscription] = useState(() => subscriptionService.getSubscription());
  useEffect(() => {
    if (!user?.id || !effectiveFarmId || !isSupabaseConfigured()) return;
    let active = true, pending = false;
    const sync = async () => {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      try {
        const [messages, saved] = await Promise.all([fetchNotifications(user.id, effectiveFarmId), getFarmSubscription(effectiveFarmId)]);
        if (active) {
          setNotifications(messages);
          if (saved) { setSubscription(saved); setSubscriptionDatabaseScope(`${user.id}:${effectiveFarmId}`); }
        }
      } catch (error) { console.warn('Notification/subscription refresh failed:', error.message); }
      finally { pending = false; }
    };
    const timer = setInterval(sync, 60000);
    window.addEventListener('focus', sync);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', sync); };
  }, [user?.id, effectiveFarmId]);

  const currentPlanId = subscription?.planId || PLANS.STARTER;
  const currentPlan = subscriptionService.getPlanDetails(currentPlanId);

  const updatePlan = (planId, billingCycle = 'monthly') => subscriptionService.switchPlan(planId, billingCycle);

  const toggleAutoRenewal = async () => {
    // With Supabase, toggle auto-renewal locally for now (can be extended via Supabase function)
    const updated = { ...subscription, autoRenew: !subscription.autoRenew };
    subscriptionService.saveSubscription(updated);
    setSubscription(updated);
    return updated;
  };

  useEffect(() => {
    const changed = () => setSubscription(subscriptionService.getSubscription());
    window.addEventListener('subscription_updated', changed);
    return () => window.removeEventListener('subscription_updated', changed);
  }, [isLoggedIn, authLoading, user?.id]);

  const refreshAllData = useCallback(async () => {
    if (authLoading || !isLoggedIn || !user?.id) return;

    let farmId = effectiveFarmId;

    // Fallback: profile has no farm_id — look up farm by owner_id from Supabase
    if (!farmId && user?.id && isSupabaseConfigured()) {
      try {
        const { supabase: sb } = await import('../lib/supabaseClient.js');
        if (sb) {
          const { data: ownedFarm } = await sb.from('farms').select('id').eq('owner_id', user.id).maybeSingle();
          if (ownedFarm?.id) {
            farmId = ownedFarm.id;
            updateSelectedFarmId(ownedFarm.id);
          }
        }
      } catch (e) { console.warn('Farm owner lookup failed:', e.message); }
    }

    const identity = `${user.id}:${farmId || ''}`;

    if (!farmId) {
      // No farm found — resolve loading so the UI shows empty state instead of spinning forever
      setDataLoading(false);
      setLoadedScope(identity);
      return;
    }

    if (refreshScope.current === identity) return;
    refreshScope.current = identity;
    refreshing.current = true;

    if (loadedScopeRef.current !== identity) setDataLoading(true);
    setDataError('');

    const valid = () => {
      const [curUserId, curFarmId] = (scopeRef.current || '').split(':');
      return curUserId === user?.id && (!curFarmId || curFarmId === farmId);
    };

    try {
      // Use Supabase if configured, otherwise fall back gracefully
      if (isSupabaseConfigured()) {
        const data = await loadAllFarmData(farmId);
        if (!valid()) return;

        setFarm(data.farm || {});
        if (!data.failedFields?.includes('flocks')) setFlocks(data.flocks || []);
        if (!data.failedFields?.includes('feeds')) setFeeds(data.feeds || []);
        if (!data.failedFields?.includes('eggs')) setEggs(data.eggs || []);
        if (!data.failedFields?.includes('mortality')) setMortality(data.mortality || []);
        if (!data.failedFields?.includes('vaccinations')) setVaccinations(data.vaccinations || []);
        if (!data.failedFields?.includes('medications')) setMedications(data.medications || []);
        if (!data.failedFields?.includes('sales')) setSales(data.sales || []);
        if (!data.failedFields?.includes('expenses')) setExpenses(data.expenses || []);
        if (!data.failedFields?.includes('customers')) setCustomers(data.customers || []);
        if (!data.failedFields?.includes('dailyRecords')) setDailyRecords(data.dailyRecords || []);
        if (!data.failedFields?.includes('workers')) setWorkers(data.workers || []);
        if (!data.failedFields?.includes('inventory')) setInventory(data.inventory || []);
        if (!data.failedFields?.includes('tasks')) setTasks(data.tasks || []);
        
        // Load notifications from persistent notificationStore
        const initialNotifs = await fetchNotifications(user.id, farmId);
        if (!valid()) return;
        setNotifications(initialNotifs);

        // Run smart automated farm alerts evaluation asynchronously
        evaluateFarmSmartAlerts({
          feeds: data.feeds || [],
          mortality: data.mortality || [],
          flocks: data.flocks || [],
          subscription: data.subscription || subscriptionService.getSubscription(),
          farmId,
          userId: user.id,
        }).then((newAlerts) => {
          if (newAlerts && newAlerts.length > 0) {
            fetchNotifications(user.id, farmId).then(rows => { if (valid()) setNotifications(rows); });
          }
        }).catch(err => console.warn('Smart alert evaluation error:', err));

        // Build accessible farms list (user can only access their own farm for now)
        setAccessibleFarms([data.farm].filter(Boolean));

        // Update subscription from Supabase if available
        if (data.subscription) {
          setSubscriptionDatabaseScope(`${user.id}:${farmId}`);
          subscriptionService.saveSubscription(data.subscription);
          setSubscription(data.subscription);
        }

               setWeightRecords(
          (Array.isArray(data?.dailyRecords) ? data.dailyRecords : [])
            .filter(
              (record) =>
                record != null &&
                record.category === 'weight' &&
                record.status === 'Recorded'
            )
            .map((record) => ({
              ...(record.values ?? {}),
              id: record.id,
              flockId: record.flockId,
              date: record.date,
            }))
        );

        const key = selectionKey(user.id, farmId);

        const available = availableTypeIds(
          data?.farm ?? {},
          Array.isArray(data?.flocks) ? data.flocks : []
        );

        setSelection((current) => {
          const savedSelection =
            current?.key === key
              ? current.id
              : readSelection(key);

          const id = restoreSelection(savedSelection, available);

          return current.key === key && current.id === id ? current : { key, id };
        });

      } else {
        // Supabase not configured — no data to load
        if (!valid()) return;

        setFarm({});
        setFlocks([]);
        setFeeds([]);
        setEggs([]);
        setMortality([]);
        setVaccinations([]);
        setMedications([]);
        setSales([]);
        setExpenses([]);
        setCustomers([]);
        setDailyRecords([]);
        setWorkers([]);
        setInventory([]);
        setTasks([]);
        setNotifications([]);
        setWeightRecords([]);
      }

      if (valid()) {
        setLoadedScope(identity);
        setDataError(null);
      }

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load farm data.';

      console.error('Farm data load error:', error);

      // Always resolve loading and display errors
      // instead of leaving an infinite spinner.
      if (valid()) {
        setLoadedScope(identity);
        setDataError(message);
      }

    } finally {
      if (valid()) {
        setDataLoading(false);
      }

      if (refreshScope.current === identity) {
        refreshScope.current = '';
        refreshing.current = false;

        if (queuedRefresh.current && valid()) {
          queuedRefresh.current = false;

          queueMicrotask(() => refreshAllData());
        }
      }
    }
  }, [
    isLoggedIn,
    authLoading,
    user?.id,
    effectiveFarmId,
  ]);
  useEffect(() => {
    refreshAllData().catch(err => console.error('Farm data load error:', err));

    const handleStorageUpdate = () => {
      if (refreshing.current) { queuedRefresh.current = true; return; }
      refreshAllData().catch(err => console.error('Farm data refresh error:', err));
    };

    const handleNotificationsUpdate = (e) => {
      if (e.detail) setNotifications(e.detail);
    };

    window.addEventListener('storage-update', handleStorageUpdate);
    window.addEventListener('daily-records-updated', handleStorageUpdate);
    window.addEventListener('notifications-updated', handleNotificationsUpdate);

    // Setup Supabase Realtime for notifications
    const unsubscribeRealtime = subscribeToNotificationChanges(user?.id, () => {
      fetchNotifications(user?.id, selectedFarmId || user?.farmId).then(setNotifications);
    });

    return () => {
      window.removeEventListener('storage-update', handleStorageUpdate);
      window.removeEventListener('daily-records-updated', handleStorageUpdate);
      window.removeEventListener('notifications-updated', handleNotificationsUpdate);
      unsubscribeRealtime();
    };
  }, [refreshAllData, user?.id, selectedFarmId]);

  // Metrics
  const totalBirds = flocks.reduce((sum, f) => sum + (Number(f.currentBirds) || 0), 0);
  const totalEggsToday = eggs
    .filter(e => e.date === localDate())
    .reduce((sum, e) => sum + (Number(e.goodEggs) || 0), 0);
  const totalFeedKg = feeds.reduce((sum, f) => sum + (Number(f.quantityBags) || 0) * (Number(f.bagWeightKg) || 25), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpensesAmount;

  // Active flocks count for limit check
  const activeFlocksCount = flocks.filter(f => f.status !== 'Sold' && f.status !== 'Closed').length;

  // Plan Limit Checks
  const canAddFlock = () => {
    if (subscriptionService.isExpired(subscription)) return false;
    return activeFlocksCount < currentPlan.limits.maxFlocks;
  };
  const canAddBirds = (additionalBirds = 0) => {
    if (subscriptionService.isExpired(subscription)) return false;
    return (totalBirds + Number(additionalBirds)) <= currentPlan.limits.maxBirds;
  };
  const canAddWorker = () => {
    if (subscriptionService.isExpired(subscription)) return false;
    return workers.length < currentPlan.limits.maxUsers;
  };
  const canAddPoultryType = (additionalTypes = 1) => {
    if (subscriptionService.isExpired(subscription)) return false;
    const count = Array.isArray(farm?.poultryTypes) ? farm.poultryTypes.length : 0;
    return (count + additionalTypes) <= currentPlan.limits.maxPoultryTypes;
  };
  const canExportPdf = () => currentPlan.limits.dataExport;

  // Poultry-type scoping helpers
  const getFlockPoultryTypeId = (flock) => {
    if (!flock) return null;
    const pt = getPoultryTypeByFlockType(flock.type);
    if (pt) return pt.id;
    return 'other';
  };

  const scopedDataFor = (typeId) => {
    const typeFlocks = flocks.filter(f => getFlockPoultryTypeId(f) === typeId);
    const flockIds = new Set(typeFlocks.map(f => f.id));
    const eggsFor = eggs.filter(e => flockIds.has(e.flockId));
    const mortalityFor = mortality.filter(m => flockIds.has(m.flockId));
    const weightsFor = weightRecords.filter(w => flockIds.has(w.flockId));
    const belongs = r => r.flockId ? flockIds.has(r.flockId) : poultryTypeId(r.poultryType) === typeId;
    const salesFor = sales.filter(belongs);
    const expensesFor = expenses.filter(belongs);
    const feedsFor = feeds;
    return { flocks: typeFlocks, eggs: eggsFor, mortality: mortalityFor, weights: weightsFor, sales: salesFor, expenses: expensesFor, feeds: feedsFor, dailyRecords: dailyRecords.filter(belongs) };
  };

  const computeTypeStats = (typeId) => {
    const d = scopedDataFor(typeId);
    const totalBirds = d.flocks.reduce((sum, f) => sum + (Number(f.currentBirds) || 0), 0);
    const initialBirds = d.flocks.reduce((sum, f) => sum + (Number(f.initialBirds) || 0), 0);

    const today = localDate();
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const weekAgoStr = localDate(weekAgo);
    const monthAgoStr = localDate(monthAgo);

    const eggsToday = d.eggs.filter(e => e.date === today).reduce((sum, e) => sum + (Number(e.goodEggs) || 0), 0);
    const eggsWeek = d.eggs.filter(e => e.date >= weekAgoStr).reduce((sum, e) => sum + (Number(e.goodEggs) || 0), 0);
    const eggsMonth = d.eggs.filter(e => e.date >= monthAgoStr).reduce((sum, e) => sum + (Number(e.goodEggs) || 0), 0);
    const brokenEggs = d.eggs.reduce((sum, e) => sum + (Number(e.brokenEggs) || 0), 0);

    const mortalityCount = d.mortality.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
    const mortalityRate = initialBirds > 0 ? (mortalityCount / initialBirds) * 100 : 0;

    const revenue = d.sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const expenseTotal = d.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const feedKg = d.dailyRecords.filter(r => r.category === 'feed' && r.status === 'Recorded').reduce((n, r) => n + Number(r.values.consumedKg || 0), 0);

    const weightPoints = [...(d.weights || [])].sort((a, b) => a.date.localeCompare(b.date));
    const latestWeight = weightPoints.length > 0 ? weightPoints[weightPoints.length - 1].averageWeightKg : null;
    const firstWeight = weightPoints.length > 0 ? weightPoints[0].averageWeightKg : null;
    const weightGain = latestWeight !== null && firstWeight !== null ? latestWeight - firstWeight : null;

    const eggDays = new Map();
    d.dailyRecords.filter(r => r.category === 'eggs' && r.date === today && r.status === 'Recorded' && r.values.layingHens > 0).forEach(r => { const p = eggDays.get(r.flockId) || { hens: r.values.layingHens, eggs: 0 }; p.eggs += r.values.totalEggs; eggDays.set(r.flockId, p); });
    const hens = [...eggDays.values()].reduce((n, p) => n + p.hens, 0);
    const productionRate = hens > 0 ? [...eggDays.values()].reduce((n, p) => n + p.eggs, 0) / hens * 100 : null;

    return {
      totalBirds, initialBirds,
      activeFlocks: d.flocks.filter(f => f.status !== 'Sold' && f.status !== 'Closed').length,
      eggsToday, eggsWeek, eggsMonth, brokenEggs,
      mortalityCount, mortalityRate,
      revenue, expenses: expenseTotal, profit: revenue - expenseTotal,
      feedKg, latestWeight, weightGain, productionRate,
      avgBirdAge: d.flocks.length > 0 ? d.flocks.reduce((sum, f) => sum + (Number(f.ageWeeks) || 0), 0) / d.flocks.length : 0
    };
  };

  return (
    <FarmContext.Provider
      value={{
        accessibleFarms, selectedFarmId: effectiveFarmId, selectFarm,
        activeTypeId, selectPoultryType, availableTypeIds: types,
        dataLoading: dataLoading || !isScopeMatch, dataError, dataReady: Boolean(isScopeMatch),
        farm, flocks, feeds, eggs, mortality, vaccinations, medications,
        sales, customers, expenses, inventory, workers, tasks,
        weightRecords, dailyRecords, notifications,
        currentPlan, currentPlanId, subscription, setSubscription,
        subscriptionFromDatabase: subscriptionDatabaseScope === scopeId && isScopeMatch,
        updatePlan, toggleAutoRenewal,
        remainingTrialDays: subscriptionService.getRemainingTrialDays(subscription),
        isTrial: subscription?.status === 'trial',
        isSubscriptionExpired: subscriptionService.isExpired(subscription),
        canPerformPaidAction: () => subscriptionService.canPerformPaidAction(subscription),
        subscriptionService,
        planLimits: currentPlan.limits,
        canAddFlock, canAddBirds, canAddWorker, canAddPoultryType, canExportPdf,
        activeFlocksCount,
        getFlockPoultryTypeId, scopedDataFor, computeTypeStats,
        metrics: { totalBirds, totalEggsToday, totalFeedKg, totalRevenue, totalExpensesAmount, netProfit },
        refreshAllData,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useRawFarm = () => {
  const context = useContext(FarmContext);
  if (context === null) throw new Error('useRawFarm must be used within FarmProvider. Place FarmProvider above PoultryProvider and all farm consumers.');
  return context;
};
export const useFarm = () => {
  const raw = useRawFarm();
  const empty = { ...raw, farm: {}, flocks: [], feeds: [], eggs: [], mortality: [], vaccinations: [], medications: [], sales: [], expenses: [], weightRecords: [], dailyRecords: [] };
  const data = raw.dataReady ? scopeFarmData(raw, raw.activeTypeId) : empty;
  const totalBirds = data.flocks.reduce((n, f) => n + Number(f.currentBirds || 0), 0),
    revenue = data.sales.reduce((n, r) => n + Number(r.totalAmount || 0), 0),
    expenses = data.expenses.reduce((n, r) => n + Number(r.amount || 0), 0);
  return { ...data, metrics: { ...raw.metrics, totalBirds, totalRevenue: revenue, totalExpensesAmount: expenses, netProfit: revenue - expenses, totalEggsToday: data.eggs.filter(r => r.date === localDate()).reduce((n, r) => n + Number(r.goodEggs || 0), 0) } };
};

/**
 * Hook for poultry-type–aware components.
 */
export const usePoultryData = () => {
  const raw = useRawFarm(), scoped = useFarm();
  const selectedTypeIds = raw.dataReady ? availableTypeIds(raw.farm, raw.flocks) : [];
  const selectedTypes = selectedTypeIds.map(id => POULTRY_TYPE_MAP[id]).filter(Boolean);
  const presentTypeIds = [...new Set(raw.flocks.map(f => poultryTypeId(f.type)).filter(Boolean))];
  return { ...scoped, selectedTypeIds, selectedTypes, presentTypeIds };
};
