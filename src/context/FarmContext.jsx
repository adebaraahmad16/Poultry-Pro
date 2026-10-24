import { useAuth } from './AuthContext';
import { usePlanCatalog } from '../components/subscriptions/usePlanCatalog';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { inventoryService } from '../services/businessService';
import { taskService, notificationService } from '../services/managementService';
import { PLANS } from '../constants/plans';
import { POULTRY_TYPE_MAP, getPoultryTypeByFlockType } from '../constants/poultryTypes';
import { subscriptionService } from '../services/subscriptionService';
import { localDate } from '../../shared/dailyRecords';
import { availableTypeIds, poultryTypeId, scopeFarmData, selectionKey, restoreSelection } from '../../shared/poultryScope';
import { setSelectedFarmId, setSelectedPoultryType } from '../services/farmScope';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';
import { loadAllFarmData } from '../services/supabase/farmDataService.js';

const FarmContext = createContext();

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
  const [notifications, setNotifications] = useState([]);
  const [accessibleFarms, setAccessibleFarms] = useState([]);
  const [selectedFarmId, updateSelectedFarmId] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [loadedScope, setLoadedScope] = useState('');
  const loadedScopeRef = useRef(''); loadedScopeRef.current = loadedScope;
  const refreshScope = useRef('');
  const [selection, setSelection] = useState({ key: '', id: 'all' });
  const scopeId = `${user?.id || ''}:${selectedFarmId || user?.farmId || ''}`;
  const scopeRef = useRef(scopeId); scopeRef.current = scopeId;
  const types = availableTypeIds(farm, flocks);
  const preferenceKey = selectionKey(user?.id, selectedFarmId || user?.farmId);
  const activeTypeId = loadedScope === scopeId ? restoreSelection(selection.key === preferenceKey ? selection.id : localStorage.getItem(preferenceKey), types) : 'all';
  setSelectedPoultryType(activeTypeId);

  const selectPoultryType = id => {
    const valid = poultryTypeId(id);
    if (valid !== 'all' && !types.includes(valid)) return;
    setSelection({ key: preferenceKey, id: valid }); localStorage.setItem(preferenceKey, valid);
  };

  const selectFarm = id => {
    if (!accessibleFarms.some(f => f.id === id)) return;
    const nextKey = selectionKey(user.id, id);
    setSelection({ key: nextKey, id: activeTypeId });
    setSelectedFarmId(id); updateSelectedFarmId(id); setDataLoading(true); setLoadedScope('');
  };

  useEffect(() => {
    setSelectedFarmId(user?.farmId || ''); updateSelectedFarmId(user?.farmId || '');
    setLoadedScope(''); setAccessibleFarms([]); setDataLoading(!!isLoggedIn);
    return () => setSelectedFarmId('');
  }, [user?.id, isLoggedIn]);

  // Active Subscription & 14-Day Free Trial State
  const [subscription, setSubscription] = useState(() => subscriptionService.getSubscription());

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
    if (authLoading || !isLoggedIn) return;

    const farmId = selectedFarmId || user?.farmId;
    if (!farmId) {
      setDataLoading(false);
      return;
    }

    const identity = `${user.id}:${farmId}`;
    if (refreshScope.current === identity) return;
    refreshScope.current = identity;
    refreshing.current = true;

    if (loadedScopeRef.current !== identity) setDataLoading(true);
    setDataError('');

    const valid = () => scopeRef.current === identity;

    try {
      // Use Supabase if configured, otherwise fall back gracefully
      if (isSupabaseConfigured()) {
        const data = await loadAllFarmData(farmId);
        if (!valid()) return;

        setFarm(data.farm || {});
        setFlocks(data.flocks || []);
        setFeeds(data.feeds || []);
        setEggs(data.eggs || []);
        setMortality(data.mortality || []);
        setVaccinations(data.vaccinations || []);
        setMedications(data.medications || []);
        setSales(data.sales || []);
        setExpenses(data.expenses || []);
        setCustomers(data.customers || []);
        setDailyRecords(data.dailyRecords || []);
        setWorkers(data.workers || []);
        setInventory(inventoryService.getInventory());
        setTasks(taskService.getTasks());
        setNotifications(notificationService.getNotifications());

        // Build accessible farms list (user can only access their own farm for now)
        setAccessibleFarms([data.farm].filter(Boolean));

        // Update subscription from Supabase if available
        if (data.subscription) {
          subscriptionService.saveSubscription(data.subscription);
          setSubscription(data.subscription);
        }

        setWeightRecords((data.dailyRecords || [])
          .filter(r => r.category === 'weight' && r.status === 'Recorded')
          .map(r => ({ ...r.values, id: r.id, flockId: r.flockId, date: r.date }))
        );
      } else {
        // Supabase not configured — no data to load
        if (!valid()) return;
        setFarm({});
        setFlocks([]); setFeeds([]); setEggs([]); setMortality([]);
        setVaccinations([]); setMedications([]); setSales([]); setExpenses([]);
        setCustomers([]); setDailyRecords([]); setWorkers([]);
        setInventory([]); setTasks([]); setNotifications([]);
      }

      const key = selectionKey(user.id, farmId);
      const available = availableTypeIds(farm, flocks);
      setSelection(current => {
        const id = restoreSelection(current.key === key ? current.id : localStorage.getItem(key), available);
        localStorage.setItem(key, id); return { key, id };
      });

      if (valid()) setLoadedScope(identity);
    } catch (error) {
      if (valid()) { setLoadedScope(''); setDataError(error.message || 'Failed to load farm data.'); }
    } finally {
      if (valid()) setDataLoading(false);
      if (refreshScope.current === identity) { refreshScope.current = ''; refreshing.current = false; }
    }
  }, [isLoggedIn, authLoading, user?.id, selectedFarmId]);

  useEffect(() => {
    refreshAllData().catch(err => console.error('Farm data load error:', err));

    const handleStorageUpdate = () => {
      if (refreshing.current) return;
      refreshAllData().catch(err => console.error('Farm data refresh error:', err));
    };

    window.addEventListener('storage-update', handleStorageUpdate);
    window.addEventListener('daily-records-updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage-update', handleStorageUpdate);
      window.removeEventListener('daily-records-updated', handleStorageUpdate);
    };
  }, [refreshAllData]);

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
        accessibleFarms, selectedFarmId: selectedFarmId || user?.farmId, selectFarm,
        activeTypeId, selectPoultryType, availableTypeIds: types,
        dataLoading: dataLoading || loadedScope !== scopeId, dataError, dataReady: loadedScope === scopeId,
        farm, flocks, feeds, eggs, mortality, vaccinations, medications,
        sales, customers, expenses, inventory, workers, tasks,
        weightRecords, dailyRecords, notifications,
        currentPlan, currentPlanId, subscription, setSubscription,
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

export const useRawFarm = () => useContext(FarmContext);
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
