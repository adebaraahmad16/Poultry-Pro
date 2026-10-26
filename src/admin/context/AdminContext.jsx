import { request, refreshCatalog } from '../../services/planCatalog';
import { isBackendConfigured } from '../../services/apiConfig';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminService, initializeAdminStorage } from '../services/adminService';
import { initialAdminUsers } from '../services/adminMockData';
import { subscriptionService } from '../../services/subscriptionService';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient.js';

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

      // Always refresh the plan catalog (uses defaults when Supabase unconfigured)
      refreshCatalog().then(setSubscriptionPlans).catch(console.error);

      // Load farmers from Supabase if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          // Check if the current user is an admin via Supabase auth
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Verify admin role from profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, full_name, email')
              .eq('id', session.user.id)
              .single();

            if (profile?.role === 'admin' || profile?.role === 'super_admin') {
              const superAdmin = initialAdminUsers[0];
              const adminObj = {
                ...superAdmin,
                email: profile.email || superAdmin.email,
                name: profile.full_name || superAdmin.name,
                lastLogin: new Date().toLocaleString(),
              };
              adminService.setCurrentAdmin(adminObj);
              setCurrentAdmin(adminObj);
              setIsAdminLoggedIn(true);

              // Load farmers, farms, and subscriptions reliably without foreign key joins
              const [
                { data: farmersProfiles, error: farmersError },
                { data: allFarms },
                { data: allSubs }
              ] = await Promise.all([
                supabase
                  .from('profiles')
                  .select('id, full_name, email, phone, role, created_at, farm_id')
                  .eq('role', 'farmer')
                  .order('created_at', { ascending: false }),
                supabase
                  .from('farms')
                  .select('id, owner_id, name, location, poultry_types'),
                supabase
                  .from('farm_subscriptions')
                  .select('*')
              ]);

              if (!farmersError && Array.isArray(farmersProfiles)) {
                const mapped = farmersProfiles.map(f => {
                  const farm = (allFarms || []).find(farmItem => farmItem.id === f.farm_id || farmItem.owner_id === f.id);
                  const sub = (allSubs || []).find(subItem => subItem.user_id === f.id || (farm && subItem.farm_id === farm.id));
                  const planId = (sub?.plan_id || 'basic').toUpperCase();
                  const subStatus = sub?.status || 'trial';
                  return {
                    id: f.id,
                    fullName: f.full_name,
                    email: f.email,
                    phone: f.phone,
                    status: 'Active',
                    dateJoined: f.created_at?.split('T')[0] || '',
                    farmId: f.farm_id || farm?.id,
                    farmName: farm?.name || 'My Farm',
                    location: farm?.location || '',
                    poultryTypes: farm?.poultry_types || [],
                    planId,
                    subscription: planId,
                    subscriptionStatus: subStatus === 'trial' ? 'Trial' : subStatus === 'active' ? 'Active' : subStatus === 'expired' ? 'Expired' : 'Trial',
                    billingCycle: sub?.billing_cycle || 'monthly',
                    subscriptionData: sub ? {
                      planId,
                      status: subStatus,
                      trialEndsAt: sub.trial_ends_at,
                      renewalDate: sub.renewal_date || sub.current_period_end || sub.trial_ends_at,
                      autoRenew: sub.auto_renew,
                    } : null,
                  };
                });
                setFarmers(mapped);
              }
            } else {
              // Not an admin — clear admin state
              setCurrentAdmin(null);
              setIsAdminLoggedIn(false);
              setFarmers([]);
            }
          } else {
            // No session
            const cachedAdmin = adminService.getCurrentAdmin();
            if (cachedAdmin) {
              setCurrentAdmin(cachedAdmin);
              setIsAdminLoggedIn(true);
            } else {
              setCurrentAdmin(null);
              setIsAdminLoggedIn(false);
            }
            setFarmers([]);
          }
        } catch (supaErr) {
          console.warn('Supabase admin data load error:', supaErr.message);
          setDataError('Could not load farmer data from Supabase.');
          setFarmers([]);
        }
      } else if (!isBackendConfigured()) {
        // Neither Supabase nor backend configured — no farmer data
        const cachedAdmin = adminService.getCurrentAdmin();
        if (cachedAdmin) {
          setCurrentAdmin(cachedAdmin);
          setIsAdminLoggedIn(true);
        }
        setFarmers([]);
      } else {
        // Legacy: Express backend fallback
        const token = localStorage.getItem('poultrypro_admin_token');
        if (!token) {
          setCurrentAdmin(null);
          setIsAdminLoggedIn(false);
          setFarmers([]);
        } else {
          try {
            const { admin } = await request('/auth/admin/session', { headers: { Authorization: `Bearer ${token}` } });
            if (localStorage.getItem('poultrypro_admin_token') !== token) return;
            const profile = { ...adminService.getCurrentAdmin(), id: admin.id, email: admin.email, role: 'Super Admin' };
            setCurrentAdmin(profile);
            setIsAdminLoggedIn(true);
            const results = await Promise.allSettled([
              request('/subscription/subscribers', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) setFarmers(results[0].value);
            else setFarmers([]);
          } catch (error) {
            if ([401, 403].includes(error.status)) {
              localStorage.removeItem('poultrypro_admin_token');
              adminService.clearCurrentAdmin();
            }
            setCurrentAdmin(null);
            setIsAdminLoggedIn(false);
            setFarmers([]);
          }
        }
      }
    } catch (error) {
      setCurrentAdmin(null);
      setIsAdminLoggedIn(false);
      setAuthError(error.message || 'Unable to verify administrator access. Please retry.');
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
    if (isSupabaseConfigured() && supabase) {
      // Use Supabase for admin login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);

      // Verify this user has admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, email')
        .eq('id', data.user.id)
        .single();

      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        await supabase.auth.signOut();
        throw new Error('Access denied. This account does not have admin privileges.');
      }

      const superAdmin = initialAdminUsers[0];
      const adminObj = {
        ...superAdmin,
        email: email || superAdmin.email,
        name: profile.full_name || superAdmin.name,
        lastLogin: new Date().toLocaleString(),
      };
      adminService.setCurrentAdmin(adminObj);
      setCurrentAdmin(adminObj);
      setIsAdminLoggedIn(true);
      await refreshAllAdminData();
      adminService.logAction('Super Admin Signed In', `${adminObj.name} logged into Admin Panel`);
      return true;
    }

    // Legacy Express backend fallback
    const result = await request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('poultrypro_admin_token', result.token);

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

  const sendNotification = async (notifData) => {
    const newNotif = adminService.sendNotification(notifData);
    setNotifications(adminService.getNotifications());
    setAuditLogs(adminService.getAuditLogs());

    // Also persist broadcast announcement into Supabase notifications for target farmers
    if (isSupabaseConfigured() && supabase) {
      try {
        let targets = farmers || [];
        if (notifData.targetAudience === 'Basic Plan Users') {
          targets = targets.filter(f => f.planId === 'basic' || (!f.planId && ['Basic','Starter','Free'].includes(f.subscription)));
        } else if (notifData.targetAudience === 'Pro Users') {
          targets = targets.filter(f => f.planId === 'professional' || (!f.planId && ['Pro','Professional'].includes(f.subscription)));
        } else if (notifData.targetAudience === 'Enterprise Users') {
          targets = targets.filter(f => f.planId === 'enterprise' || (!f.planId && ['Enterprise'].includes(f.subscription)));
        } else if (notifData.targetFarmerId) {
          targets = targets.filter(f => f.id === notifData.targetFarmerId);
        }

        const priorityType = notifData.priority === 'Urgent Announcement' || notifData.priority === 'urgent'
          ? 'error'
          : notifData.priority === 'Important Notice' || notifData.priority === 'high'
          ? 'warning'
          : 'info';

        const priorityLevel = notifData.priority === 'Urgent Announcement' || notifData.priority === 'urgent'
          ? 'urgent'
          : notifData.priority === 'Important Notice' || notifData.priority === 'high'
          ? 'high'
          : 'normal';

        const rows = targets.map(f => ({
          user_id: f.id,
          farm_id: f.farmId || null,
          title: notifData.title,
          message: notifData.message,
          type: priorityType,
          category: 'announcement',
          priority: priorityLevel,
          action_url: '/notifications',
          is_read: false
        }));

        if (rows.length > 0) {
          await supabase.from('notifications').insert(rows);
        }
      } catch (err) {
        console.warn('Supabase admin dispatch broadcast warning:', err.message);
      }
    }

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
    if (isSupabaseConfigured() && supabase) {
      try {
        if (action === 'extendTrial') {
          const days = data.days || 14;
          const newTrialEnd = new Date(Date.now() + days * 86400000).toISOString();
          await supabase
            .from('farm_subscriptions')
            .update({ trial_ends_at: newTrialEnd, status: 'trial' })
            .eq('user_id', farmerId);
        } else if (action === 'changePlan') {
          await supabase
            .from('farm_subscriptions')
            .update({ plan_id: (data.planId || 'BASIC').toLowerCase(), status: 'active' })
            .eq('user_id', farmerId);
        } else if (action === 'cancel') {
          await supabase
            .from('farm_subscriptions')
            .update({ status: 'cancelled' })
            .eq('user_id', farmerId);
        }
        await refreshAllAdminData();
        return;
      } catch (err) {
        console.warn('Supabase updateFarmerSubscription error:', err);
      }
    }

    const headers = { Authorization: `Bearer ${localStorage.getItem('poultrypro_admin_token') || ''}` };
    try {
      await request(`/subscription/subscribers/${farmerId}`, { method: 'PATCH', headers, body: JSON.stringify({ action, data }) });
      setFarmers(await request('/subscription/subscribers', { headers }));
    } catch (err) {
      console.warn('Backend updateFarmerSubscription error:', err);
    }
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
