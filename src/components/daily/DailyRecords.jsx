import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  NotebookPen, Egg, Wheat, AlertTriangle, Syringe, Pill,
  Receipt, DollarSign, Activity, Filter, Eye, ArrowUpRight,
  Calendar, Layers, Building2, CheckCircle2, Clock
} from '../common/Icons';
import { useFarm, usePoultryData } from '../../context/FarmContext';
import { usePoultry } from '../../context/PoultryContext';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../common/DataTable';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export default function DailyRecords({ compact = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    farm,
    flocks,
    feeds,
    eggs,
    mortality,
    vaccinations,
    medications,
    expenses,
    sales,
    dailyRecords,
    accessibleFarms,
    selectedFarmId,
    selectFarm
  } = useFarm();

  const { selectedTypes } = usePoultryData();
  const { activeTypeId, selectPoultryType } = usePoultry();

  // Filters State
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [poultryTypeFilter, setPoultryTypeFilter] = useState(activeTypeId || 'all');
  const [flockFilter, setFlockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Details Modal State
  const [selectedActivity, setSelectedActivity] = useState(null);

  const farms = accessibleFarms || [farm].filter(Boolean);

  // Helper date strings
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // 1. Build Unified Chronological Activity History from actual records
  const allActivities = useMemo(() => {
    const list = [];
    const farmName = farm?.name || 'My Farm';

    // Helper to find flock name & poultry type
    const getFlockInfo = (fId) => {
      const fl = flocks.find(f => f.id === fId);
      return {
        flockName: fl ? fl.name : 'Farm-wide',
        poultryType: fl?.type || 'All Poultry'
      };
    };

    // A. Egg Production records
    (eggs || []).forEach(e => {
      const { flockName, poultryType } = getFlockInfo(e.flockId);
      const total = Number(e.totalCollected) || Number(e.goodEggs) || 0;
      const good = Number(e.goodEggs) || total;
      const cracked = Number(e.crackedEggs) || 0;
      const damaged = Number(e.damagedEggs) || 0;
      list.push({
        id: `egg-${e.id}`,
        rawId: e.id,
        date: e.date || todayStr,
        activityType: 'Egg Production',
        category: 'eggs',
        farmName,
        farmId: e.farmId || farm?.id,
        flockId: e.flockId,
        flockName,
        poultryType: e.poultryType || poultryType,
        summary: `${total.toLocaleString()} eggs collected (${good} good, ${cracked} cracked, ${damaged} damaged)`,
        recordedBy: e.recordedBy || user?.name || user?.email || 'Farmer',
        status: 'Recorded',
        dashboardPath: '/production/eggs',
        dashboardName: 'Egg Production',
        originalRecord: e
      });
    });

    // B. Feeding records (from dailyRecords where category === 'feed')
    (dailyRecords || [])
      .filter(r => r.category === 'feed')
      .forEach(f => {
        const { flockName, poultryType } = getFlockInfo(f.flockId);
        const qty = f.values?.quantity || f.quantity || 0;
        const feedType = f.values?.feedType || f.feedType || 'Layer Mash';
        list.push({
          id: `feed-${f.id}`,
          rawId: f.id,
          date: f.date || todayStr,
          activityType: 'Feeding',
          category: 'feed',
          farmName,
          farmId: f.farmId || farm?.id,
          flockId: f.flockId,
          flockName,
          poultryType: f.poultryType || poultryType,
          summary: `${Number(qty).toLocaleString()} kg of ${feedType} consumed`,
          recordedBy: f.farmerId || user?.name || user?.email || 'Farmer',
          status: f.status || 'Recorded',
          dashboardPath: '/production/feed',
          dashboardName: 'Feed Management',
          originalRecord: f
        });
      });

    // C. Mortality records
    (mortality || []).forEach(m => {
      const { flockName, poultryType } = getFlockInfo(m.flockId);
      const dead = Number(m.birdsDead) || Number(m.count) || 0;
      const cause = m.cause || m.suspectedCause || 'Unspecified';
      list.push({
        id: `mortality-${m.id}`,
        rawId: m.id,
        date: m.date || todayStr,
        activityType: 'Mortality',
        category: 'mortality',
        farmName,
        farmId: m.farmId || farm?.id,
        flockId: m.flockId,
        flockName,
        poultryType: m.poultryType || poultryType,
        summary: `${dead} bird${dead === 1 ? '' : 's'} lost (Cause: ${cause})`,
        recordedBy: m.recordedBy || user?.name || user?.email || 'Farmer',
        status: 'Recorded',
        dashboardPath: '/health/mortality',
        dashboardName: 'Mortality Tracking',
        originalRecord: m
      });
    });

    // D. Vaccination records
    (vaccinations || []).forEach(v => {
      const { flockName, poultryType } = getFlockInfo(v.flockId);
      const count = Number(v.birdsVaccinated) || 0;
      const vaccine = v.vaccine || v.name || 'Vaccine';
      list.push({
        id: `vac-${v.id}`,
        rawId: v.id,
        date: v.scheduledDate || v.date || todayStr,
        activityType: 'Vaccination',
        category: 'vaccination',
        farmName,
        farmId: v.farmId || farm?.id,
        flockId: v.flockId,
        flockName,
        poultryType,
        summary: `${vaccine} administered to ${count.toLocaleString()} birds (${v.method || 'Drinking Water'})`,
        recordedBy: v.administeredBy || user?.name || user?.email || 'Farmer',
        status: v.status || 'Completed',
        dashboardPath: '/health/vaccinations',
        dashboardName: 'Vaccinations',
        originalRecord: v
      });
    });

    // E. Medication records
    (medications || []).forEach(med => {
      const { flockName, poultryType } = getFlockInfo(med.flockId);
      list.push({
        id: `med-${med.id}`,
        rawId: med.id,
        date: med.startDate || med.date || todayStr,
        activityType: 'Medication',
        category: 'medication',
        farmName,
        farmId: med.farmId || farm?.id,
        flockId: med.flockId,
        flockName,
        poultryType,
        summary: `${med.medicationName || med.name} (${med.dosage || 'Standard'} dose, ${med.durationDays || med.duration || 3} days)`,
        recordedBy: med.administeredBy || user?.name || user?.email || 'Farmer',
        status: med.status || 'Completed',
        dashboardPath: '/health/medication',
        dashboardName: 'Medications',
        originalRecord: med
      });
    });

    // F. Expenses records
    (expenses || []).forEach(exp => {
      const { flockName, poultryType } = getFlockInfo(exp.flockId);
      list.push({
        id: `exp-${exp.id}`,
        rawId: exp.id,
        date: exp.date || todayStr,
        activityType: 'Expense',
        category: 'expenses',
        farmName,
        farmId: exp.farmId || farm?.id,
        flockId: exp.flockId,
        flockName: exp.flockId ? flockName : 'General Farm',
        poultryType: exp.flockId ? poultryType : 'Farm-wide',
        summary: `₦${(Number(exp.amount) || 0).toLocaleString()} — ${exp.description || exp.category}`,
        recordedBy: user?.name || user?.email || 'Farmer',
        status: 'Paid',
        dashboardPath: '/business/expenses',
        dashboardName: 'Expenses',
        originalRecord: exp
      });
    });

    // G. Sales records
    (sales || []).forEach(s => {
      const { flockName, poultryType } = getFlockInfo(s.flockId);
      const qty = s.quantity || 0;
      const prod = s.product || s.productType || 'Product';
      const cust = s.customerName || s.customer || 'Direct Customer';
      list.push({
        id: `sale-${s.id}`,
        rawId: s.id,
        date: s.date || todayStr,
        activityType: 'Sale',
        category: 'sales',
        farmName,
        farmId: s.farmId || farm?.id,
        flockId: s.flockId,
        flockName: s.flockId ? flockName : 'General Farm',
        poultryType: s.flockId ? poultryType : 'Farm-wide',
        summary: `₦${(Number(s.totalAmount) || 0).toLocaleString()} — ${qty} ${prod} to ${cust}`,
        recordedBy: user?.name || user?.email || 'Farmer',
        status: s.paymentStatus || 'Paid',
        dashboardPath: '/business/sales',
        dashboardName: 'Sales & Revenue',
        originalRecord: s
      });
    });

    // Sort descending by date
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }, [farm, flocks, eggs, dailyRecords, mortality, vaccinations, medications, expenses, sales, user]);

  // 2. Filtered Activities
  const filteredActivities = useMemo(() => {
    return allActivities.filter(act => {
      // Category filter
      if (categoryFilter !== 'all' && act.category !== categoryFilter) return false;

      // Flock filter
      if (flockFilter !== 'all' && act.flockId !== flockFilter) return false;

      // Poultry Type filter
      if (poultryTypeFilter !== 'all') {
        const matchesType = act.poultryType.toLowerCase().includes(poultryTypeFilter.toLowerCase());
        if (!matchesType && act.poultryType !== 'Farm-wide' && act.poultryType !== 'All Poultry') {
          return false;
        }
      }

      // Date Preset Filter
      if (datePreset === 'today') {
        if (act.date !== todayStr) return false;
      } else if (datePreset === 'yesterday') {
        if (act.date !== yesterdayStr) return false;
      } else if (datePreset === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        if (new Date(act.date) < weekAgo) return false;
      } else if (datePreset === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 86400000);
        if (new Date(act.date) < monthAgo) return false;
      } else if (datePreset === 'custom') {
        if (customFrom && act.date < customFrom) return false;
        if (customTo && act.date > customTo) return false;
      }

      return true;
    });
  }, [allActivities, categoryFilter, flockFilter, poultryTypeFilter, datePreset, customFrom, customTo, todayStr, yesterdayStr]);

  // 3. Compute 8 Mandatory Overview Cards from actual Supabase records
  const totalFeedKg = useMemo(() => {
    return (dailyRecords || [])
      .filter(r => r.category === 'feed')
      .reduce((sum, r) => sum + (Number(r.values?.quantity || r.quantity || 0)), 0);
  }, [dailyRecords]);

  const totalEggsCollected = useMemo(() => {
    return (eggs || []).reduce((sum, e) => sum + (Number(e.totalCollected) || Number(e.goodEggs) || 0), 0);
  }, [eggs]);

  const totalMortality = useMemo(() => {
    return (mortality || []).reduce((sum, m) => sum + (Number(m.birdsDead) || Number(m.count) || 0), 0);
  }, [mortality]);

  const totalVaccinations = useMemo(() => {
    return (vaccinations || []).length;
  }, [vaccinations]);

  const totalMedications = useMemo(() => {
    return (medications || []).length;
  }, [medications]);

  const totalExpensesAmount = useMemo(() => {
    return (expenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  const totalSalesAmount = useMemo(() => {
    return (sales || []).reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }, [sales]);

  const totalRecordedActivities = allActivities.length;

  // Table columns definition
  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (r) => <span className="font-semibold text-slate-800 whitespace-nowrap">{r.date}</span>
    },
    {
      header: 'Activity Type',
      render: (r) => {
        let variant = 'slate';
        if (r.category === 'eggs') variant = 'amber';
        else if (r.category === 'feed') variant = 'blue';
        else if (r.category === 'mortality') variant = 'rose';
        else if (r.category === 'vaccination') variant = 'purple';
        else if (r.category === 'medication') variant = 'cyan';
        else if (r.category === 'sales') variant = 'green';
        else if (r.category === 'expenses') variant = 'slate';
        return <Badge variant={variant}>{r.activityType}</Badge>;
      }
    },
    {
      header: 'Farm / Flock',
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">{r.flockName}</span>
          <span className="text-[10px] text-slate-400">{r.farmName}</span>
        </div>
      )
    },
    {
      header: 'Poultry Type',
      render: (r) => <span className="text-xs font-medium text-slate-600">{r.poultryType}</span>
    },
    {
      header: 'Record Summary',
      render: (r) => (
        <span className="font-medium text-slate-800 text-xs sm:text-sm line-clamp-2">
          {r.summary}
        </span>
      )
    },
    {
      header: 'Status',
      render: (r) => {
        const isCompleted = r.status === 'Completed' || r.status === 'Recorded' || r.status === 'Paid';
        return (
          <Badge variant={isCompleted ? 'green' : 'amber'}>
            {r.status}
          </Badge>
        );
      }
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={() => setSelectedActivity(r)}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            Details
          </button>
          <Link
            to={r.dashboardPath}
            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
            title={`Open in ${r.dashboardName}`}
          >
            Dashboard
            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <NotebookPen className="w-6 h-6 text-emerald-600" />
              Daily Farm Records — Centralized Monitoring
            </h1>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-full">
              Read-Only Overview
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Centralized monitoring hub showing all recorded farm activities across production, feeding, health, expenses, and sales.
          </p>
        </div>

        {/* Informational Guidance */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Each dashboard manages its own records directly</span>
        </div>
      </div>

      {/* 8 Mandatory Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Total Feed Consumed */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Feed Consumed</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Wheat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{totalFeedKg.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kg</span></p>
            <Link to="/production/feed" className="text-2xs font-semibold text-teal-700 hover:underline flex items-center gap-0.5 mt-1.5">
              Feed Dashboard <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 2. Total Eggs Collected */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Eggs Collected</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Egg className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{totalEggsCollected.toLocaleString()} <span className="text-sm font-semibold text-slate-500">eggs</span></p>
            <Link to="/production/eggs" className="text-2xs font-semibold text-emerald-700 hover:underline flex items-center gap-0.5 mt-1.5">
              Egg Production <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 3. Total Mortality */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Mortality</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-rose-600">{totalMortality.toLocaleString()} <span className="text-sm font-semibold text-slate-500">birds</span></p>
            <Link to="/health/mortality" className="text-2xs font-semibold text-rose-700 hover:underline flex items-center gap-0.5 mt-1.5">
              Mortality Dashboard <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 4. Total Vaccinations */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Vaccinations</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Syringe className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{totalVaccinations} <span className="text-sm font-semibold text-slate-500">events</span></p>
            <Link to="/health/vaccinations" className="text-2xs font-semibold text-purple-700 hover:underline flex items-center gap-0.5 mt-1.5">
              Vaccination Records <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 5. Total Medication Activities */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Medication Activities</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{totalMedications} <span className="text-sm font-semibold text-slate-500">treatments</span></p>
            <Link to="/health/medication" className="text-2xs font-semibold text-amber-700 hover:underline flex items-center gap-0.5 mt-1.5">
              Medication Dashboard <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 6. Total Expenses */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Expenses</span>
            <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">₦{totalExpensesAmount.toLocaleString()}</p>
            <Link to="/business/expenses" className="text-2xs font-semibold text-slate-700 hover:underline flex items-center gap-0.5 mt-1.5">
              Expenses Dashboard <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 7. Total Sales */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sales</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-emerald-700">₦{totalSalesAmount.toLocaleString()}</p>
            <Link to="/business/sales" className="text-2xs font-semibold text-emerald-700 hover:underline flex items-center gap-0.5 mt-1.5">
              Sales Dashboard <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 8. Total Recorded Activities */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recorded Activities</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-blue-700">{totalRecordedActivities.toLocaleString()}</p>
            <span className="text-2xs font-medium text-slate-400 block mt-1.5">Across all farm tables</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Unified Monitoring Filters:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Farm selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Farm</label>
            <select
              value={selectedFarmId || farm?.id || ''}
              onChange={(e) => selectFarm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Poultry Type selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Poultry Type</label>
            <select
              value={poultryTypeFilter}
              onChange={(e) => setPoultryTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Poultry Types</option>
              {selectedTypes.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Flock selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Flock</label>
            <select
              value={flockFilter}
              onChange={(e) => setFlockFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Flocks & Farm-wide</option>
              {flocks.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
              ))}
            </select>
          </div>

          {/* Activity Category selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Activity Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Farm Activities</option>
              <option value="eggs">Egg Production</option>
              <option value="feed">Feeding</option>
              <option value="mortality">Mortality</option>
              <option value="vaccination">Vaccinations</option>
              <option value="medication">Medication</option>
              <option value="expenses">Expenses</option>
              <option value="sales">Sales & Revenue</option>
            </select>
          </div>

          {/* Date Presets selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Period</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">From:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">To:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            {(customFrom || customTo) && (
              <button
                onClick={() => { setCustomFrom(''); setCustomTo(''); }}
                className="text-xs text-rose-600 font-semibold hover:underline"
              >
                Clear Range
              </button>
            )}
          </div>
        )}
      </div>

      {/* Unified Activity History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Unified Farm Activity History</h2>
            <p className="text-xs text-slate-500">
              Aggregated chronological log of all farm activities ({filteredActivities.length} total records shown)
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredActivities}
          searchPlaceholder="Search unified activities by flock, poultry type, summary..."
          emptyTitle="No farm activities recorded"
        />
      </div>

      {/* View Details Read-Only Modal */}
      {selectedActivity && (
        <Modal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title={`Activity Details: ${selectedActivity.activityType}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-extrabold text-slate-900 text-sm">{selectedActivity.summary}</p>
              <p className="text-slate-500">Date: <span className="font-semibold text-slate-700">{selectedActivity.date}</span></p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white border border-slate-100 rounded-lg">
                <dt className="text-slate-400 font-semibold uppercase text-[10px]">Farm</dt>
                <dd className="font-bold text-slate-800 mt-0.5">{selectedActivity.farmName}</dd>
              </div>
              <div className="p-2.5 bg-white border border-slate-100 rounded-lg">
                <dt className="text-slate-400 font-semibold uppercase text-[10px]">Flock</dt>
                <dd className="font-bold text-slate-800 mt-0.5">{selectedActivity.flockName}</dd>
              </div>
              <div className="p-2.5 bg-white border border-slate-100 rounded-lg">
                <dt className="text-slate-400 font-semibold uppercase text-[10px]">Poultry Type</dt>
                <dd className="font-bold text-slate-800 mt-0.5">{selectedActivity.poultryType}</dd>
              </div>
              <div className="p-2.5 bg-white border border-slate-100 rounded-lg">
                <dt className="text-slate-400 font-semibold uppercase text-[10px]">Status</dt>
                <dd className="font-bold text-emerald-700 mt-0.5">{selectedActivity.status}</dd>
              </div>
            </dl>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-xs">
              <p className="font-bold mb-0.5">ℹ️ Centralized Monitoring Mode</p>
              <p className="text-blue-800 leading-relaxed">
                Daily Records is strictly a monitoring page. To edit, update, or remove this record, open the original{' '}
                <strong>{selectedActivity.dashboardName}</strong> dashboard.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const path = selectedActivity.dashboardPath;
                  setSelectedActivity(null);
                  navigate(path);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                Go to {selectedActivity.dashboardName}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
