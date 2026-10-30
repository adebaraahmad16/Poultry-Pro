import { useAuth } from '../../context/AuthContext';
import { requireSupabaseAdmin } from '../../services/adminAccess';
import { getProfile } from '../../services/supabase/authService';
import { loadAdminConfiguration, saveAdminConfiguration, saveFarmerStatus, saveSubscriber, publishNotification, loadBroadcasts, verifyGatewayPayment } from '../services/adminPersistence';
import { SUPPORT_CONTACT } from '../../config/supportContact';
import { request, refreshCatalog } from '../../services/planCatalog';
import { isBackendConfigured } from '../../services/apiConfig';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const sharedAuth = useAuth();
  const authRef = useRef(sharedAuth); authRef.current = sharedAuth;
  const initialized = useRef(false);
  const adminRefresh = useRef(null);
  const queuedAdminRefresh = useRef(false);
  const [supabaseAdminId, setSupabaseAdminId] = useState(null);
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

  const refreshAllAdminData = useCallback(() => {
    if (isSupabaseConfigured() && authRef.current.loading) return Promise.resolve();
    const identity = authRef.current.user?.id || '';
    if (adminRefresh.current) {
      if (adminRefresh.current.identity !== identity) queuedAdminRefresh.current = true;
      return adminRefresh.current.promise;
    }
    const pending = (async () => {
    if (!initialized.current) setLoading(true);
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
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (session?.user) {
            const access = await requireSupabaseAdmin();
            if (access.userId !== session.user.id) throw new Error('The administrator session changed. Please retry.');
            // Verify admin role from profiles table
            const profile = authRef.current.user?.id === session.user.id ? authRef.current.user : await getProfile(session.user.id);

            if (['admin','super_admin','Super Admin'].includes(profile?.role)) {
              const superAdmin = initialAdminUsers[0];
              const adminObj = {
                ...superAdmin,
                id: session.user.id,
                avatar: profile.avatarDisplayUrl || profile.avatar_url || '',
                phone: profile.phone || '',
                email: profile.email || session.user.email,
                name: profile.full_name || 'Administrator',
                lastLogin: new Date().toLocaleString(),
              };
              adminService.setCurrentAdmin(adminObj);
              setCurrentAdmin(adminObj);
              setIsAdminLoggedIn(true);
              setSupabaseAdminId(access.userId);

              try {
                const configuration = await loadAdminConfiguration();
                setPlatformSettings({ ...configuration.settings, supportEscalationEmail: SUPPORT_CONTACT.email });
                setSubscriptionSettings(configuration.subscriptionSettings);
                setCmsContent({ ...configuration.cms, contact: { ...configuration.cms.contact, email: SUPPORT_CONTACT.email, phone: SUPPORT_CONTACT.phone, whatsapp: SUPPORT_CONTACT.internationalPhone } });
                setCategories(configuration.categories);
              } catch (error) { setDataError(error.message); }
              try { setNotifications(await loadBroadcasts()); }
              catch (error) { setDataError(error.message); }

              // Load farmers, farms, and subscriptions reliably without foreign key joins
              const [
                { data: farmersProfiles, error: farmersError },
                { data: allFarms },
                { data: allSubs }
              ] = await Promise.all([
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('role', 'farmer')
                  .order('created_at', { ascending: false }),
                supabase
                  .from('farms')
                  .select('*'),
                supabase
                  .from('farm_subscriptions')
                  .select('*')
              ]);

              if (allFarms) {
                const { data: flockRows, error: flockError } = await supabase.from('flocks').select('id,farm_id,type,current_birds,status');
                if (flockError) setDataError(flockError.message);
                setFarms(allFarms.map(farm => {
                  const flocks = (flockRows || []).filter(flock => flock.farm_id === farm.id);
                  const groups = new Map();
                  for (const flock of flocks) { const item = groups.get(flock.type) || { type: flock.type, totalFlocks: 0, totalBirds: 0 }; item.totalFlocks++; item.totalBirds += Number(flock.current_birds || 0); groups.set(flock.type, item); }
                  return { ...farm, farmerName: farmersProfiles?.find(f => f.id === farm.owner_id)?.full_name || '', poultryTypes: farm.poultry_types || [], totalFlocks: flocks.length, totalBirds: flocks.reduce((sum,f) => sum + Number(f.current_birds || 0), 0), breakdown: [...groups.values()] };
                }));
                const orders = await supabase.from('subscription_orders').select('*').order('created_at', { ascending: false });
                if (orders.error) setDataError(orders.error.message);
                else setPayments((orders.data || []).map(order => {
                  const farm = allFarms.find(f => f.id === order.farm_id);
                  const owner = farmersProfiles?.find(f => f.id === farm?.owner_id);
                  return { ...order, farmerId: owner?.id, farmerName: owner?.full_name || '', plan: order.plan_id, amount: Number(order.amount), billingCycle: order.billing_cycle, date: order.created_at, paymentMethod: order.payment_method, gateway: 'Paystack', status: ['success','successful','paid'].includes(order.status?.toLowerCase()) ? 'Successful' : order.status === 'pending' ? 'Pending' : order.status };
                }));
              }

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
                    status: f.account_status || 'Active',
                    dateJoined: f.created_at?.split('T')[0] || '',
                    farmId: f.farm_id || farm?.id,
                    farmName: farm?.name || 'My Farm',
                    location: farm?.location || '',
                    poultryTypes: farm?.poultry_types || [],
                    planId: planId.toLowerCase(),
                    subscription: ({ BASIC: 'Basic', PROFESSIONAL: 'Pro', ENTERPRISE: 'Enterprise' }[planId] || planId),
                    subscriptionStartDate: sub?.created_at,
                    subscriptionExpiry: sub?.renewal_date || sub?.trial_ends_at,
                    trialEndsAt: sub?.trial_ends_at,
                    convertedFromTrial: Boolean(sub?.trial_ends_at) && Number(sub?.agreed_price) > 0,
                    subscriptionStatus: ({trial:'Trial',active:'Active',expired:'Expired',cancelled:'Cancelled',past_due:'Past Due',pending:'Pending Activation'}[subStatus] || subStatus),
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
            // Cached UI identity is not a Supabase Auth session.
            adminService.clearCurrentAdmin();
            setSupabaseAdminId(null);
            setCurrentAdmin(null);
            setIsAdminLoggedIn(false);
            setFarmers([]);
          }
        } catch (supaErr) {
          setSupabaseAdminId(null);
          setIsAdminLoggedIn(false);
          setCurrentAdmin(null);
          setAuthError(supaErr.message || 'Unable to verify administrator access.');
          console.warn('Supabase admin data load error:', supaErr.message);
          setDataError(supaErr.message || 'Could not load administrator data from Supabase.');
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
      initialized.current = true;
      setLoading(false);
    }
    })().finally(() => {
      adminRefresh.current = null;
      if (queuedAdminRefresh.current) { queuedAdminRefresh.current = false; queueMicrotask(refreshAllAdminData); }
    });
    adminRefresh.current = { identity, promise: pending };
    return pending;
  }, []);

  useEffect(() => {
    if (!sharedAuth.loading) refreshAllAdminData();
    const expired = () => {
      setSupabaseAdminId(null);
      setCurrentAdmin(null);
      setIsAdminLoggedIn(false);
      setAuthError('');
      setFarmers([]);
      setLoading(false);
    };
    window.addEventListener('admin_session_expired',expired);
    return () => window.removeEventListener('admin_session_expired',expired);
  }, [refreshAllAdminData, sharedAuth.loading, sharedAuth.user?.id, sharedAuth.user?.role]);

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
      const profile = await getProfile(data.user.id);

      if (!profile || !['admin','super_admin','Super Admin'].includes(profile.role)) {
        await supabase.auth.signOut();
        throw new Error('Access denied. This account does not have admin privileges.');
      }

      const access = await requireSupabaseAdmin();
      setSupabaseAdminId(access.userId);
      const superAdmin = initialAdminUsers[0];
      const adminObj = {
        ...superAdmin,
        id: data.user.id,
        avatar: profile.avatarDisplayUrl || profile.avatar_url || '',
        phone: profile.phone || '',
        email: email || superAdmin.email,
        name: profile.full_name || 'Administrator',
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

  const updateAdminProfile = async profileData => {
    const saved = await authRef.current.updateProfile({ full_name: profileData.name, phone: profileData.phone, avatar_url: profileData.avatar });
    const updated = { ...currentAdmin, id: saved.id, name: saved.full_name, email: saved.email, phone: saved.phone, avatar: saved.avatarDisplayUrl || saved.avatar_url };
    adminService.setCurrentAdmin(updated); setCurrentAdmin(updated);
    return updated;
  };
  useEffect(() => {
    const profile = sharedAuth.user;
    if (profile && ['admin','super_admin','Super Admin'].includes(profile.role)) setCurrentAdmin(previous => previous ? { ...previous, id: profile.id, name: profile.full_name, email: profile.email, phone: profile.phone, avatar: profile.avatarDisplayUrl || profile.avatar_url } : previous);
  }, [sharedAuth.user]);

  const logoutAdmin = () => {
    setSupabaseAdminId(null);
    initialized.current = false;
    if (isSupabaseConfigured()) sharedAuth.logout().catch(error => setAuthError(error.message));
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
  const updateFarmerStatus = async (id, newStatus) => {
    await saveFarmerStatus(id, newStatus);
    setFarmers(previous => previous.map(f => f.id === id ? { ...f, status: newStatus } : f));
  };

  const toggleCategoryStatus = async id => {
    const next = categories.map(category => category.id === id ? { ...category, status: category.status === 'Active' ? 'Disabled' : 'Active' } : category);
    setCategories(await saveAdminConfiguration('categories', next));
  };

  const updateSubscriptionPlan = async (id, data) => {
    const updated = await adminService.updateSubscriptionPlan(id, data);
    setSubscriptionPlans(updated);
    setAuditLogs(adminService.getAuditLogs());
  };

  const verifyPayment = async id => {
    const payment = payments.find(row => row.id === id);
    if (!payment) throw new Error('Select a valid payment record.');
    if (payment.status === 'Successful') return payment;
    const saved = await verifyGatewayPayment(payment.reference);
    setPayments(previous => previous.map(row => row.id === id ? { ...row, status: 'Successful' } : row));
    await refreshAllAdminData();
    return saved;
  };
  const sendNotification = async values => {
    const published = await publishNotification(values, farmers);
    setNotifications(previous => [published, ...previous.filter(row => row.id !== published.id)]);
    return published;
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

  const updateSettings = async values => {
    const saved = await saveAdminConfiguration('platform', { ...values, supportEscalationEmail: SUPPORT_CONTACT.email });
    setPlatformSettings(saved); return saved;
  };
  const updateCmsContent = async values => {
    const saved = await saveAdminConfiguration('website', { ...values, contact: { ...values.contact, email: SUPPORT_CONTACT.email, phone: SUPPORT_CONTACT.phone, whatsapp: SUPPORT_CONTACT.internationalPhone } });
    setCmsContent(saved); return saved;
  };
  const updateSubscriptionSettings = async values => {
    const saved = await saveAdminConfiguration('subscriptions', values); setSubscriptionSettings(saved); return saved;
  };
  const updateFarmerSubscription = async (farmerId, action, data = {}) => {
    if (isSupabaseConfigured() && supabase) {
      const farmer = farmers.find(f => f.id === farmerId);
      if (!farmer) throw new Error('Select a valid farmer.');
      await saveSubscriber(farmer, action, data, subscriptionPlans);
      await refreshAllAdminData();
      return;
    }
    const headers = { Authorization: `Bearer ${localStorage.getItem('poultrypro_admin_token') || ''}` };
    await request(`/subscription/subscribers/${farmerId}`, { method: 'PATCH', headers, body: JSON.stringify({ action, data }) });
    setFarmers(await request('/subscription/subscribers', { headers }));
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
        isAdminLoggedIn: isSupabaseConfigured() ? isAdminLoggedIn && !sharedAuth.loading && sharedAuth.user?.id === currentAdmin?.id && supabaseAdminId === currentAdmin?.id && ['admin','super_admin','Super Admin'].includes(sharedAuth.user?.role) : isAdminLoggedIn,
        supabaseAdminReady: isAdminLoggedIn && !sharedAuth.loading && !loading && Boolean(supabaseAdminId) && sharedAuth.user?.id === supabaseAdminId && ['admin','super_admin','Super Admin'].includes(sharedAuth.user?.role),
        loading: loading || (isSupabaseConfigured() && sharedAuth.loading),
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
