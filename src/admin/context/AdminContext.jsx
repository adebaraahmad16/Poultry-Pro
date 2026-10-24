import { request, refreshCatalog } from '../../services/planCatalog';
import { isBackendConfigured } from '../../services/apiConfig';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminService, initializeAdminStorage } from '../services/adminService';
import { initialAdminUsers } from '../services/adminMockData';
import { subscriptionService } from '../../services/subscriptionService';

/**
 * Normalises a farmer's subscription field to one of the three canonical plan IDs:
 * STARTER | PROFESSIONAL | ENTERPRISE
 */
const normalisePlanId = (rawPlan) => {
  if (!rawPlan) return 'BASIC';
  const u = String(rawPlan).toUpperCase();
  if (u === 'ENTERPRISE' || u === 'PRO') return 'ENTERPRISE';
  if (u === 'PROFESSIONAL') return 'PROFESSIONAL';
  if (u === 'BASIC' || u === 'STARTER' || u === 'FREE') return 'BASIC';
  return 'BASIC';
};

/**
 * Reads the subscription record for a specific farmer.
 * Uses subscriptionService.isExpired() on a synthetic record built from
 * the farmer's status and subscription fields.
 */
const getFarmerSubscriptionStatus = (farmer) => {
  try {
    if (farmer.subscriptionData && typeof farmer.subscriptionData === 'object') {
      return subscriptionService.isExpired(farmer.subscriptionData);
    }
    const planId = normalisePlanId(farmer.planId || farmer.subscription);
    const status = (() => {
      if (!farmer.subscription || farmer.subscription === 'Free' || farmer.subscription === 'Trial') return 'trial';
      if (farmer.status === 'Suspended') return 'expired';
      return 'active';
    })();
    if (farmer.subscriptionStatus) return subscriptionService.isExpired({planId,status:farmer.subscriptionStatus.toLowerCase(),renewalDate:farmer.subscriptionExpiry,trialEndsAt:farmer.trialEndsAt});
    const syntheticSub = {
      planId,
      status,
      autoRenew: status === 'active',
      renewalDate: status === 'expired'
        ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trialEndsAt: status === 'trial'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };
    return subscriptionService.isExpired(syntheticSub);
  } catch {
    return false;
  }
};

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [dataError, setDataError] = useState('');

  // Core Data Collections
  const [farmers, setFarmers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [adminStaff, setAdminStaff] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({});
  const [cmsContent, setCmsContent] = useState({});
  const [subscriptionSettings, setSubscriptionSettings] = useState({});

  const refreshAllAdminData = useCallback(async () => {
    setLoading(true);
    setAuthError('');
    setDataError('');
    const token = localStorage.getItem('poultrypro_admin_token');
    try {
      initializeAdminStorage();
      setFarms(adminService.getFarms());
      setCategories(adminService.getCategories());
      setPayments(adminService.getPayments());
      setNotifications(adminService.getNotifications());
      setTickets(adminService.getTickets());
      setAuditLogs(adminService.getAuditLogs());
      setAdminStaff(adminService.getAdminStaff());
      setPlatformSettings(adminService.getSettings());
      setCmsContent(adminService.getCmsContent());
      setSubscriptionSettings(adminService.getSubscriptionSettings());
      if (!token || !isBackendConfigured()) {
        // Public registration and pricing also consume the shared server catalog.
        refreshCatalog().then(setSubscriptionPlans).catch(console.error);
        setCurrentAdmin(null);
        setIsAdminLoggedIn(false);
        setFarmers([]);
        return;
      }
      // Cached profile data never grants access: verify the signed server session.
      const { admin } = await request('/auth/admin/session', {headers:{Authorization:`Bearer ${token}`}});
      if (localStorage.getItem('poultrypro_admin_token') !== token) return;
      const profile = {...adminService.getCurrentAdmin(), id:admin.id, email:admin.email, role:'Super Admin'};
      setCurrentAdmin(profile);
      setIsAdminLoggedIn(true);
      const results = await Promise.allSettled([
        request('/subscription/subscribers', {headers:{Authorization:`Bearer ${token}`}}),
        refreshCatalog()
      ]);
      if (localStorage.getItem('poultrypro_admin_token') !== token) return;
      if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) setFarmers(results[0].value);
      else setFarmers([]);
      if (results[1].status === 'fulfilled') setSubscriptionPlans(results[1].value);
      const failed = results.find(result => result.status === 'rejected');
      if (failed) setDataError(failed.reason.message || 'Admin data could not be loaded. Please retry.');
      else if (!Array.isArray(results[0].value)) setDataError('The backend returned an invalid farmer list. Please retry.');
    } catch (error) {
      if (localStorage.getItem('poultrypro_admin_token') !== token) return;
      setCurrentAdmin(null);
      setIsAdminLoggedIn(false);
      if ([401,403].includes(error.status)) {
        localStorage.removeItem('poultrypro_admin_token');
        adminService.clearCurrentAdmin();
      } else setAuthError(error.message || 'Unable to verify administrator access. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllAdminData();
    const expired = () => {
      setCurrentAdmin(null);
      setIsAdminLoggedIn(false);
      setAuthError('');
      setFarmers([]);
      setLoading(false);
    };
    window.addEventListener('admin_session_expired',expired);
    return () => window.removeEventListener('admin_session_expired',expired);
  }, [refreshAllAdminData]);

  useEffect(() => {
    const changed = event => setSubscriptionPlans(event.detail);
    window.addEventListener('admin_plans_updated',changed);
    return () => window.removeEventListener('admin_plans_updated',changed);
  },[]);

  // Auth Actions
  const loginAdmin = async (email, password) => {
    const result = await request('/auth/admin/login',{method:'POST',body:JSON.stringify({email,password})});
    localStorage.setItem('poultrypro_admin_token',result.token);

    const superAdmin = initialAdminUsers[0];
    const adminObj = {
      ...superAdmin,
      email: email || superAdmin.email,
      lastLogin: new Date().toLocaleString()
    };

    adminService.setCurrentAdmin(adminObj);
    setCurrentAdmin(adminObj);
    setIsAdminLoggedIn(true);
    await refreshAllAdminData();
    adminService.logAction('Super Admin Signed In', `${adminObj.name} logged into Admin Panel`);
    return true;
  };

  const updateAdminProfile = (profileData) => {
    const updated = {
      ...(currentAdmin || initialAdminUsers[0]),
      ...profileData,
      role: 'Super Admin' // Ensure always Super Admin
    };
    adminService.setCurrentAdmin(updated);
    setCurrentAdmin(updated);
    adminService.updateAdminUser(updated);
    setAdminStaff([updated]);
    adminService.logAction('Updated Admin Profile', `${updated.name} updated profile details & avatar`);
    setAuditLogs(adminService.getAuditLogs());
    return updated;
  };

  const logoutAdmin = () => {
    setAuthError('');
    setDataError('');
    localStorage.removeItem('poultrypro_admin_token');
    if (currentAdmin) {
      adminService.logAction('Admin Signed Out', `${currentAdmin.name} logged out`);
    }
    adminService.clearCurrentAdmin();
    setCurrentAdmin(null);
    setIsAdminLoggedIn(false);
  };

  // Farmer & Farm Actions
  const updateFarmerStatus = (id, newStatus) => {
    const updated = adminService.updateFarmerStatus(id, newStatus);
    setFarmers(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const toggleCategoryStatus = (id) => {
    const updated = adminService.toggleCategoryStatus(id);
    setCategories(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const updateSubscriptionPlan = async (id, data) => {
    const updated = await adminService.updateSubscriptionPlan(id, data);
    setSubscriptionPlans(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const verifyPayment = (id) => {
    const updated = adminService.verifyPayment(id);
    setPayments(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const sendNotification = (notifData) => {
    const newNotif = adminService.sendNotification(notifData);
    setNotifications(adminService.getNotifications());
    setAuditLogs(adminService.getAuditLogs());
    return newNotif;
  };

  const replyToTicket = (id, replyText) => {
    const updated = adminService.replyToTicket(
      id,
      replyText,
      currentAdmin ? `${currentAdmin.name} (${currentAdmin.role})` : 'Adebara Ahmad (Super Admin)'
    );
    setTickets(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const updateTicketStatus = (id, status) => {
    const updated = adminService.updateTicketStatus(id, status);
    setTickets(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const addAdminStaff = (userData) => {
    const newStaff = adminService.addAdminStaff(userData);
    setAdminStaff(adminService.getAdminStaff());
    setAuditLogs(adminService.getAuditLogs());
    return newStaff;
  };

  const toggleAdminStatus = (id) => {
    const updated = adminService.toggleAdminStatus(id);
    setAdminStaff(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const updateSettings = (newSettings) => {
    const updated = adminService.updateSettings(newSettings);
    setPlatformSettings(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const updateCmsContent = (newCms) => {
    const updated = adminService.updateCmsContent(newCms);
    setCmsContent(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const updateSubscriptionSettings = (newSettings) => {
    const updated = adminService.updateSubscriptionSettings(newSettings);
    setSubscriptionSettings(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const updateFarmerSubscription = async (farmerId, action, data = {}) => {
    const headers = {Authorization:`Bearer ${localStorage.getItem('poultrypro_admin_token') || ''}`};
    await request(`/subscription/subscribers/${farmerId}`,{method:'PATCH',headers,body:JSON.stringify({action,data})});
    setFarmers(await request('/subscription/subscribers',{headers}));
  };

  // ─── Real Aggregated Platform Statistics ─────────────────────────────────
  // All figures derived from actual localStorage / farmer data — no hardcoded demo numbers.
  const totalFarmers = farmers.length;
  const activeFarmers = farmers.filter((f) => f.status === 'Active').length;
  const suspendedFarmers = farmers.filter((f) => f.status === 'Suspended').length;

  const totalFarms = farms.length;
  const totalFlocks = farms.reduce((sum, f) => sum + (f.totalFlocks || 0), 0);
  const totalBirds = farms.reduce((sum, f) => sum + (f.totalBirds || 0), 0);

  // Subscription tier breakdowns
  const basicFarmers = farmers.filter((f) => normalisePlanId(f.planId || f.subscription) === 'BASIC');
  const starterFarmers = basicFarmers;
  const professionalFarmers = farmers.filter((f) => normalisePlanId(f.planId || f.subscription) === 'PROFESSIONAL');
  const enterpriseFarmers = farmers.filter((f) => normalisePlanId(f.planId || f.subscription) === 'ENTERPRISE');
  const trialFarmers = farmers.filter(
    (f) => f.subscriptionStatus === 'Trial' || !f.subscription || f.subscription === 'Free' || f.subscription === 'Trial'
  );

  // Active = paid plan AND verified as not expired via subscriptionService.isExpired()
  const activeSubscriptions = farmers.filter((f) => {
    if (normalisePlanId(f.planId || f.subscription) === 'BASIC' && (!f.subscription || f.subscription === 'Free')) return false;
    return !getFarmerSubscriptionStatus(f);
  }).length;

  // Expired = subscriptionService.isExpired() returns true for that farmer
  const expiredSubscriptions = farmers.filter((f) => getFarmerSubscriptionStatus(f)).length;

  // Revenue and payment totals from actual payment records only
  const totalRevenue = payments
    .filter((p) => p.status === 'Successful')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayments = payments.filter((p) => p.status === 'Pending').length;
  const failedPayments = payments.filter((p) => p.status === 'Failed').length;
  const cancelledSubscriptions = farmers.filter(
    (f) => f.subscriptionStatus === 'Cancelled'
  ).length;
  const pendingActivations = farmers.filter(
    (f) => f.subscriptionStatus === 'Pending Activation'
  ).length;

  // Estimated MRR from actual farmer tier counts (no hardcoded subscriber totals)
  const estimatedMRR = farmers.filter(f => f.subscriptionStatus === 'Active').reduce((total,f) => {
    const p = subscriptionPlans.find(p => p.id.toUpperCase() === normalisePlanId(f.planId || f.subscription));
    const annual = String(f.billingCycle).toLowerCase() === 'annual';
    const price = f.agreedPrice == null ? (annual ? p?.annualPrice : p?.monthlyPrice) : Number(f.agreedPrice);
    return total + (Number(price) || 0) / (annual ? 12 : 1);
  },0);
  const estimatedARR = estimatedMRR * 12;

  // Trial-to-paid conversion rate
  const convertedFromTrial = farmers.filter(
    (f) => f.convertedFromTrial === true
  ).length;
  const totalTrialEver = trialFarmers.length + convertedFromTrial;
  const trialConversionRate = totalTrialEver > 0
    ? Math.round((convertedFromTrial / totalTrialEver) * 100)
    : 0;

  const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'Pending').length;

  // Poultry distribution chart data — computed from real farm breakdown records
  const poultryDistribution = (() => {
    const typeMap = {};
    farms.forEach((farm) => {
      if (Array.isArray(farm.breakdown)) {
        farm.breakdown.forEach(({ type, totalBirds: birds }) => {
          if (!typeMap[type]) typeMap[type] = { type, farms: 0, birds: 0 };
          typeMap[type].farms += 1;
          typeMap[type].birds += birds || 0;
        });
      } else if (Array.isArray(farm.poultryTypes)) {
        farm.poultryTypes.forEach((type) => {
          if (!typeMap[type]) typeMap[type] = { type, farms: 0, birds: 0 };
          typeMap[type].farms += 1;
        });
      }
    });
    return Object.values(typeMap).sort((a, b) => b.farms - a.farms);
  })();

  // Monthly registration trend — derived from farmers' dateJoined field
  const registrationTrend = (() => {
    const monthMap = {};
    farmers.forEach((f) => {
      if (!f.dateJoined) return;
      try {
        const d = new Date(f.dateJoined);
        const key = d.toLocaleString('en-US', { month: 'short' });
        if (!monthMap[key]) monthMap[key] = { month: key, farmers: 0, revenue: 0, sortMs: d.getTime() };
        monthMap[key].farmers += 1;
        const fp = payments.filter((p) => p.farmerId === f.id && p.status === 'Successful');
        monthMap[key].revenue += fp.reduce((s, p) => s + (p.amount || 0), 0);
      } catch { /* skip */ }
    });
    return Object.values(monthMap).sort((a, b) => a.sortMs - b.sortMs);
  })();

  return (
    <AdminContext.Provider
      value={{
        currentAdmin,
        isAdminLoggedIn,
        loading,
        authError,
        dataError,
        loginAdmin,
        logoutAdmin,
        farmers,
        farms,
        categories,
        subscriptionPlans,
        payments,
        notifications,
        tickets,
        auditLogs,
        adminStaff,
        platformSettings,
        cmsContent,
        subscriptionSettings,
        refreshAllAdminData,
        updateFarmerStatus,
        toggleCategoryStatus,
        updateSubscriptionPlan,
        verifyPayment,
        sendNotification,
        replyToTicket,
        updateTicketStatus,
        addAdminStaff,
        toggleAdminStatus,
        updateAdminProfile,
        updateSettings,
        updateCmsContent,
        updateSubscriptionSettings,
        updateFarmerSubscription,
        // Subscription helpers exposed for child pages
        getFarmerSubscriptionStatus,
        normalisePlanId,
        // Tier arrays
        basicFarmers,
        starterFarmers,
        professionalFarmers,
        enterpriseFarmers,
        trialFarmers,
        // Computed chart data (no demo figures)
        poultryDistribution,
        registrationTrend,
        metrics: {
          totalFarmers,
          activeFarmers,
          suspendedFarmers,
          totalFarms,
          totalFlocks,
          totalBirds,
          activeSubscriptions,
          expiredSubscriptions,
          cancelledSubscriptions,
          pendingActivations,
          trialFarmers: trialFarmers.length,
          totalRevenue,
          pendingPayments,
          failedPayments,
          estimatedMRR,
          estimatedARR,
          trialConversionRate,
          openTickets
        }
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
