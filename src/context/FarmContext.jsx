import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeStorage, getItem, setItem } from '../services/storageService';
import { flockService } from '../services/flockService';
import { eggService, feedService } from '../services/productionService';
import { healthService } from '../services/healthService';
import { salesService, customerService, expenseService, inventoryService } from '../services/businessService';
import { workerService, taskService, notificationService, farmProfileService } from '../services/managementService';
import { weightService } from '../services/weightService';
import { PLANS, PLAN_DETAILS } from '../constants/plans';
import { POULTRY_TYPE_MAP, getPoultryTypeByFlockType } from '../constants/poultryTypes';

const FarmContext = createContext();

export const FarmProvider = ({ children }) => {
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
  const [notifications, setNotifications] = useState([]);

  // Active Subscription Plan State (saved in localStorage)
  const [currentPlanId, setCurrentPlanId] = useState(() => {
    return getItem('poultrypro_current_plan') || PLANS.FREE;
  });

  const currentPlan = PLAN_DETAILS[currentPlanId] || PLAN_DETAILS[PLANS.FREE];

  const updatePlan = (planId) => {
    if (PLAN_DETAILS[planId]) {
      setCurrentPlanId(planId);
      setItem('poultrypro_current_plan', planId);
    }
  };

  const refreshAllData = useCallback(async () => {
    initializeStorage();
    setFarm(farmProfileService.getFarm());

    // Fetch asynchronously from Express API + MySQL, with local storage fallback
    const loadedFlocks = await flockService.getAll();
    setFlocks(loadedFlocks || []);

    const loadedFeeds = await feedService.getInventory();
    setFeeds(loadedFeeds || []);

    const loadedEggs = await eggService.getAll();
    setEggs(loadedEggs || []);

    const loadedMortality = await healthService.getMortalityRecords();
    setMortality(loadedMortality || []);

    setVaccinations(healthService.getVaccinations());
    setMedications(healthService.getMedications());

    const loadedSales = await salesService.getSales();
    setSales(loadedSales || []);

    setCustomers(customerService.getCustomers());

    const loadedExpenses = await expenseService.getExpenses();
    setExpenses(loadedExpenses || []);

    setInventory(inventoryService.getInventory());
    setWorkers(workerService.getWorkers());
    setTasks(taskService.getTasks());
    setWeightRecords(weightService.getWeightRecords());
    setNotifications(notificationService.getNotifications());
  }, []);

  useEffect(() => {
    refreshAllData();

    const handleStorageUpdate = () => {
      refreshAllData();
    };

    window.addEventListener('storage-update', handleStorageUpdate);
    return () => window.removeEventListener('storage-update', handleStorageUpdate);
  }, [refreshAllData]);

  // Metrics
  const totalBirds = flocks.reduce((sum, f) => sum + (Number(f.currentBirds) || 0), 0);
  const totalEggsToday = eggs
    .filter((e) => e.date === new Date().toISOString().split('T')[0])
    .reduce((sum, e) => sum + (Number(e.goodEggs) || 0), 0);
  const totalFeedKg = feeds.reduce((sum, f) => sum + (Number(f.quantityBags) || 0) * (Number(f.bagWeightKg) || 25), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpensesAmount;

  // Plan Limit Checks
  const canAddFlock = () => flocks.length < currentPlan.limits.maxFlocks;
  const canAddBirds = (additionalBirds = 0) => (totalBirds + Number(additionalBirds)) <= currentPlan.limits.maxBirds;
  const canAddWorker = () => workers.length < currentPlan.limits.maxUsers;
  const canExportPdf = () => currentPlan.limits.pdfExport;

  // POULTRY-TYPE SCOPING HELPERS
  // Each poultry type owns its flocks; records are attributed to a poultry type
  // via the flock the record belongs to, so layer egg records never leak into
  // broiler dashboards.
  const getFlockPoultryTypeId = (flock) => {
    if (!flock) return null;
    const pt = getPoultryTypeByFlockType(flock.type);
    if (pt) return pt.id;
    // Unregistered flock types (e.g. legacy "Cockerel") roll up under Other Poultry
    return 'other';
  };

  const scopedDataFor = (typeId) => {
    const typeFlocks = flocks.filter((f) => getFlockPoultryTypeId(f) === typeId);
    const flockIds = new Set(typeFlocks.map((f) => f.id));
    const eggsFor = eggs.filter((e) => flockIds.has(e.flockId));
    const mortalityFor = mortality.filter((m) => flockIds.has(m.flockId));
    const weightsFor = weightRecords.filter((w) => flockIds.has(w.flockId));
    const salesFor = sales.filter((s) => s.flockId && flockIds.has(s.flockId));
    const expensesFor = expenses.filter((e) => e.flockId && flockIds.has(e.flockId));
    const feedsFor = feeds; // feed inventory is farm-wide
    return { flocks: typeFlocks, eggs: eggsFor, mortality: mortalityFor, weights: weightsFor, sales: salesFor, expenses: expensesFor, feeds: feedsFor };
  };

  /** Aggregate KPIs for one poultry type from its scoped records. */
  const computeTypeStats = (typeId) => {
    const d = scopedDataFor(typeId);
    const totalBirds = d.flocks.reduce((sum, f) => sum + (Number(f.currentBirds) || 0), 0);
    const initialBirds = d.flocks.reduce((sum, f) => sum + (Number(f.initialBirds) || 0), 0);

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    const eggsToday = d.eggs.filter((e) => e.date === today).reduce((sum, e) => sum + (Number(e.goodEggs) || 0), 0);
    const eggsWeek = d.eggs.filter((e) => e.date >= weekAgoStr).reduce((sum, e) => sum + (Number(e.goodEggs) || 0), 0);
    const eggsMonth = d.eggs.filter((e) => e.date >= monthAgoStr).reduce((sum, e) => sum + (Number(e.goodEggs) || 0), 0);
    const brokenEggs = d.eggs.reduce((sum, e) => sum + (Number(e.brokenEggs) || 0), 0);

    const mortalityCount = d.mortality.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
    const mortalityRate = initialBirds > 0 ? (mortalityCount / initialBirds) * 100 : 0;

    const revenue = d.sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const expenseTotal = d.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const feedKg = d.feeds.reduce((sum, f) => sum + (Number(f.quantityBags) || 0) * (Number(f.bagWeightKg) || 25), 0);

    const weightPoints = [...d.weights].sort((a, b) => a.date.localeCompare(b.date));
    const latestWeight = weightPoints.length > 0 ? weightPoints[weightPoints.length - 1].averageWeightKg : null;
    const firstWeight = weightPoints.length > 0 ? weightPoints[0].averageWeightKg : null;
    const weightGain = latestWeight !== null && firstWeight !== null ? latestWeight - firstWeight : null;

    // Production rate: eggs today vs laying-age females (approximated by total birds)
    const productionRate = totalBirds > 0 && eggsToday > 0 ? (eggsToday / totalBirds) * 100 : 0;

    return {
      totalBirds,
      initialBirds,
      activeFlocks: d.flocks.filter((f) => f.status !== 'Sold' && f.status !== 'Closed').length,
      eggsToday,
      eggsWeek,
      eggsMonth,
      brokenEggs,
      mortalityCount,
      mortalityRate,
      revenue,
      expenses: expenseTotal,
      profit: revenue - expenseTotal,
      feedKg,
      latestWeight,
      weightGain,
      productionRate,
      avgBirdAge: d.flocks.length > 0 ? d.flocks.reduce((sum, f) => sum + (Number(f.ageWeeks) || 0), 0) / d.flocks.length : 0
    };
  };

  return (
    <FarmContext.Provider
      value={{
        farm,
        flocks,
        feeds,
        eggs,
        mortality,
        vaccinations,
        medications,
        sales,
        customers,
        expenses,
        inventory,
        workers,
        tasks,
        weightRecords,
        notifications,
        currentPlan,
        currentPlanId,
        updatePlan,
        planLimits: currentPlan.limits,
        canAddFlock,
        canAddBirds,
        canAddWorker,
        canExportPdf,
        getFlockPoultryTypeId,
        scopedDataFor,
        computeTypeStats,
        metrics: {
          totalBirds,
          totalEggsToday,
          totalFeedKg,
          totalRevenue,
          totalExpensesAmount,
          netProfit
        },
        refreshAllData
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => useContext(FarmContext);

/**
 * Hook for poultry-type–aware components.
 *
 * Resolves the farmer's selected poultry types (farm profile first, with
 * automatic migration from existing flocks so older accounts just work),
 * exposes the currently active type, and provides scoped data + stats for it.
 */
export const usePoultryData = () => {
  const farm = useFarm();
  const { farm: profile, flocks } = farm;

  // Determine which poultry types this farmer manages
  let selectedTypeIds = Array.isArray(profile?.poultryTypes) ? profile.poultryTypes : [];

  // Migration: derive from existing flocks if the profile has none saved yet
  if (selectedTypeIds.length === 0 && flocks.length > 0) {
    const derived = new Set();
    flocks.forEach((f) => {
      const typeId = farm.getFlockPoultryTypeId(f);
      if (typeId) derived.add(typeId);
    });
    selectedTypeIds = Array.from(derived);
  }

  const selectedTypes = selectedTypeIds.map((id) => POULTRY_TYPE_MAP[id]).filter(Boolean);

  // IDs of poultry types that actually have flocks recorded (for "All Poultry" breakdown)
  const presentTypeIds = Array.from(
    new Set(flocks.map((f) => farm.getFlockPoultryTypeId(f)).filter(Boolean))
  );

  return { ...farm, selectedTypeIds, selectedTypes, presentTypeIds };
};
