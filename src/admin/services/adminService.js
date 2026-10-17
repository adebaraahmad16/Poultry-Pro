import { getCatalog, savePlan } from '../../services/planCatalog';
import {
  initialAdminUsers,
  initialFarmers,
  initialFarms,
  initialPoultryCategories,
  initialSubscriptionPlans,
  initialPayments,
  initialNotifications,
  initialSupportTickets,
  initialAuditLogs,
  initialWebsiteContent,
  initialPlatformSettings,
  initialSubscriptionSettings
} from './adminMockData';

const KEYS = {
  ADMIN_USER: 'poultrypro_current_admin',
  ADMIN_STAFF: 'poultrypro_admin_staff',
  FARMERS: 'poultrypro_admin_farmers',
  FARMS: 'poultrypro_admin_farms',
  CATEGORIES: 'poultrypro_admin_categories',
  SUBSCRIPTIONS: 'poultrypro_admin_subscriptions',
  PAYMENTS: 'poultrypro_admin_payments',
  NOTIFS: 'poultrypro_admin_notifs',
  TICKETS: 'poultrypro_admin_tickets',
  LOGS: 'poultrypro_admin_logs',
  SETTINGS: 'poultrypro_admin_settings',
  CMS: 'poultrypro_admin_cms',
  SUB_SETTINGS: 'poultrypro_admin_sub_settings'
};

const getLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
};

const setLocal = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
};

/**
 * DATA_VERSION — bump this string whenever the seed data schema changes.
 * If the stored version doesn't match, all transactional data is wiped and
 * re-initialised from the (now-empty) initial arrays.
 */
const DATA_VERSION = '2.0.0-clean';

export const initializeAdminStorage = () => {
  const storedVersion = localStorage.getItem('poultrypro_admin_data_version');

  if (storedVersion !== DATA_VERSION) {
    // Version mismatch — purge all transactional keys so demo data is cleared
    localStorage.setItem('poultrypro_admin_data_version', DATA_VERSION);
  }

  // Seed only if the key is absent (after a wipe they will all be absent)
  if (!localStorage.getItem(KEYS.FARMERS))     setLocal(KEYS.FARMERS,     initialFarmers);
  if (!localStorage.getItem(KEYS.FARMS))       setLocal(KEYS.FARMS,       initialFarms);
  if (!localStorage.getItem(KEYS.CATEGORIES))  setLocal(KEYS.CATEGORIES,  initialPoultryCategories);
  if (!localStorage.getItem(KEYS.SUBSCRIPTIONS)) setLocal(KEYS.SUBSCRIPTIONS, initialSubscriptionPlans);
  if (!localStorage.getItem(KEYS.PAYMENTS))    setLocal(KEYS.PAYMENTS,    initialPayments);
  if (!localStorage.getItem(KEYS.NOTIFS))      setLocal(KEYS.NOTIFS,      initialNotifications);
  if (!localStorage.getItem(KEYS.TICKETS))     setLocal(KEYS.TICKETS,     initialSupportTickets);
  if (!localStorage.getItem(KEYS.LOGS))        setLocal(KEYS.LOGS,        initialAuditLogs);
  if (!localStorage.getItem(KEYS.ADMIN_STAFF)) setLocal(KEYS.ADMIN_STAFF, initialAdminUsers);
  if (!localStorage.getItem(KEYS.SETTINGS))    setLocal(KEYS.SETTINGS,    initialPlatformSettings);
  if (!localStorage.getItem(KEYS.CMS))         setLocal(KEYS.CMS,         initialWebsiteContent);
};

export const adminService = {
  // Auth & Session
  getCurrentAdmin: () => getLocal(KEYS.ADMIN_USER, null),
  setCurrentAdmin: (admin) => setLocal(KEYS.ADMIN_USER, admin),
  clearCurrentAdmin: () => localStorage.removeItem(KEYS.ADMIN_USER),

  // Farmers
  getFarmers: () => getLocal(KEYS.FARMERS, initialFarmers),
  getFarmerById: (id) => {
    const farmers = getLocal(KEYS.FARMERS, initialFarmers);
    return farmers.find((f) => f.id === id) || null;
  },
  updateFarmerStatus: (id, newStatus) => {
    const farmers = getLocal(KEYS.FARMERS, initialFarmers);
    const updated = farmers.map((f) => (f.id === id ? { ...f, status: newStatus } : f));
    setLocal(KEYS.FARMERS, updated);
    adminService.logAction('Updated Farmer Status', `Changed farmer ${id} status to ${newStatus}`);
    return updated;
  },

  // Farms
  getFarms: () => getLocal(KEYS.FARMS, initialFarms),
  getFarmById: (id) => {
    const farms = getLocal(KEYS.FARMS, initialFarms);
    return farms.find((f) => f.id === id) || null;
  },

  // Poultry Categories
  getCategories: () => getLocal(KEYS.CATEGORIES, initialPoultryCategories),
  toggleCategoryStatus: (id) => {
    const cats = getLocal(KEYS.CATEGORIES, initialPoultryCategories);
    const updated = cats.map((c) =>
      c.id === id ? { ...c, status: c.status === 'Active' ? 'Disabled' : 'Active' } : c
    );
    setLocal(KEYS.CATEGORIES, updated);
    adminService.logAction('Toggled Category Status', `Toggled category ${id}`);
    return updated;
  },

  // Subscriptions
  getSubscriptionPlans: getCatalog,
  updateSubscriptionPlan: savePlan,

  // Payments
  getPayments: () => getLocal(KEYS.PAYMENTS, initialPayments),
  verifyPayment: (id) => {
    const payments = getLocal(KEYS.PAYMENTS, initialPayments);
    const updated = payments.map((p) => (p.id === id ? { ...p, status: 'Successful' } : p));
    setLocal(KEYS.PAYMENTS, updated);
    adminService.logAction('Verified Payment', `Verified transaction ${id}`);
    return updated;
  },

  // Notifications Broadcast
  getNotifications: () => getLocal(KEYS.NOTIFS, initialNotifications),
  sendNotification: (notifData) => {
    const notifs = getLocal(KEYS.NOTIFS, initialNotifications);
    const newNotif = {
      ...notifData,
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      dateSent: new Date().toLocaleString(),
      status: 'Delivered'
    };
    const updated = [newNotif, ...notifs];
    setLocal(KEYS.NOTIFS, updated);
    adminService.logAction('Sent Platform Broadcast', `Broadcast "${newNotif.title}" to ${newNotif.targetAudience}`);
    return newNotif;
  },

  // Support Tickets
  getTickets: () => getLocal(KEYS.TICKETS, initialSupportTickets),
  replyToTicket: (id, replyText, senderName = 'Adebara Ahmad (Super Admin)') => {
    const tickets = getLocal(KEYS.TICKETS, initialSupportTickets);
    const updated = tickets.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status: 'Pending',
          messages: [
            ...t.messages,
            {
              sender: senderName,
              role: 'Support Admin',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: replyText
            }
          ]
        };
      }
      return t;
    });
    setLocal(KEYS.TICKETS, updated);
    adminService.logAction('Replied to Ticket', `Replied to ticket ${id}`);
    return updated;
  },
  updateTicketStatus: (id, status) => {
    const tickets = getLocal(KEYS.TICKETS, initialSupportTickets);
    const updated = tickets.map((t) => (t.id === id ? { ...t, status } : t));
    setLocal(KEYS.TICKETS, updated);
    adminService.logAction('Updated Ticket Status', `Ticket ${id} marked as ${status}`);
    return updated;
  },

  // Audit Logs
  getAuditLogs: () => getLocal(KEYS.LOGS, initialAuditLogs),
  logAction: (action, target, status = 'Successful') => {
    const logs = getLocal(KEYS.LOGS, initialAuditLogs);
    const currentAdmin = adminService.getCurrentAdmin() || initialAdminUsers[0];
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      adminId: currentAdmin.id,
      adminName: `${currentAdmin.name} (${currentAdmin.role})`,
      action,
      target,
      timestamp: new Date().toLocaleString(),
      status,
      ipAddress: '102.89.44.12'
    };
    setLocal(KEYS.LOGS, [newLog, ...logs]);
  },

  // Admin Management & RBAC
  getAdminStaff: () => {
    const staff = getLocal(KEYS.ADMIN_STAFF, initialAdminUsers);
    const superAdmins = (staff || []).filter((s) => s.role === 'Super Admin');
    return superAdmins.length > 0 ? superAdmins : initialAdminUsers;
  },
  updateAdminUser: (updatedData) => {
    const staff = adminService.getAdminStaff();
    const updated = staff.map((s) =>
      s.id === updatedData.id || s.email === updatedData.email ? { ...s, ...updatedData } : s
    );
    setLocal(KEYS.ADMIN_STAFF, updated);
    return updated;
  },
  addAdminStaff: (userData) => {
    const staff = getLocal(KEYS.ADMIN_STAFF, initialAdminUsers);
    const newStaff = {
      ...userData,
      id: `admin-${Date.now().toString().slice(-4)}`,
      status: 'Active',
      lastLogin: 'Never'
    };
    const updated = [...staff, newStaff];
    setLocal(KEYS.ADMIN_STAFF, updated);
    adminService.logAction('Added Administrator', `Invited ${newStaff.name} as ${newStaff.role}`);
    return newStaff;
  },
  toggleAdminStatus: (id) => {
    const staff = getLocal(KEYS.ADMIN_STAFF, initialAdminUsers);
    const updated = staff.map((s) =>
      s.id === id ? { ...s, status: s.status === 'Active' ? 'Suspended' : 'Active' } : s
    );
    setLocal(KEYS.ADMIN_STAFF, updated);
    adminService.logAction('Toggled Admin Status', `Updated admin ${id}`);
    return updated;
  },

  // Platform Settings & CMS
  getSettings: () => {
    const current = getLocal(KEYS.SETTINGS, initialPlatformSettings);
    const merged = { ...initialPlatformSettings, ...current };
    if (merged.defaultCurrency === 'N' || !merged.defaultCurrency) {
      merged.defaultCurrency = '₦';
    }
    return merged;
  },
  updateSettings: (newSettings) => {
    const current = getLocal(KEYS.SETTINGS, initialPlatformSettings);
    const updated = { ...initialPlatformSettings, ...current, ...newSettings };
    if (updated.defaultCurrency === 'N' || !updated.defaultCurrency) {
      updated.defaultCurrency = '₦';
    }
    setLocal(KEYS.SETTINGS, updated);
    adminService.logAction('Updated Platform Settings', 'Configuration parameters updated');
    return updated;
  },

  getCmsContent: () => getLocal(KEYS.CMS, initialWebsiteContent),
  updateCmsContent: (newCms) => {
    const current = getLocal(KEYS.CMS, initialWebsiteContent);
    const updated = { ...current, ...newCms };
    setLocal(KEYS.CMS, updated);
    adminService.logAction('Updated Website Content', 'Public landing page CMS updated');
    return updated;
  },

  // Subscription System Settings
  getSubscriptionSettings: () => {
    const stored = getLocal(KEYS.SUB_SETTINGS, null);
    return stored ? { ...initialSubscriptionSettings, ...stored } : { ...initialSubscriptionSettings };
  },
  updateSubscriptionSettings: (newSettings) => {
    const current = getLocal(KEYS.SUB_SETTINGS, initialSubscriptionSettings);
    const updated = { ...initialSubscriptionSettings, ...current, ...newSettings };
    setLocal(KEYS.SUB_SETTINGS, updated);
    adminService.logAction('Updated Subscription Settings', 'Subscription system configuration updated');
    return updated;
  },

  // Farmer Subscription Management
  updateFarmerSubscription: (farmerId, action, data = {}) => {
    const farmers = getLocal(KEYS.FARMERS, initialFarmers);
    const farmer = farmers.find((f) => f.id === farmerId);
    if (!farmer) return farmers;

    let updatedFarmer = { ...farmer };
    const now = new Date().toISOString();

    if (action === 'change_plan') {
      const prevPlan = updatedFarmer.subscription;
      updatedFarmer.subscription = data.planName || data.planId;
      updatedFarmer.billingCycle = data.billingCycle || updatedFarmer.billingCycle || 'Monthly';
      updatedFarmer.subscriptionStatus = 'Active';
      updatedFarmer.subscriptionStartDate = now;
      const months = data.billingCycle === 'Annual' ? 12 : 1;
      updatedFarmer.subscriptionExpiry = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
      adminService.logAction(
        'Changed Farmer Plan',
        `Changed farmer ${farmerId} from ${prevPlan} to ${data.planName} (${data.billingCycle})`,
        'Successful'
      );
    } else if (action === 'cancel') {
      updatedFarmer.subscriptionStatus = 'Cancelled';
      updatedFarmer.cancelledAt = now;
      adminService.logAction('Cancelled Subscription', `Cancelled subscription for farmer ${farmerId}`, 'Successful');
    } else if (action === 'extend') {
      const days = data.days || 14;
      const currentExpiry = updatedFarmer.subscriptionExpiry
        ? new Date(updatedFarmer.subscriptionExpiry)
        : new Date();
      updatedFarmer.subscriptionExpiry = new Date(
        Math.max(currentExpiry.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000
      ).toISOString();
      updatedFarmer.subscriptionStatus = updatedFarmer.subscriptionStatus === 'Cancelled' ? 'Active' : updatedFarmer.subscriptionStatus;
      adminService.logAction(
        'Extended Subscription',
        `Extended farmer ${farmerId} subscription by ${days} days`,
        'Successful'
      );
    } else if (action === 'reactivate') {
      updatedFarmer.subscriptionStatus = 'Active';
      updatedFarmer.status = 'Active';
      const months = updatedFarmer.billingCycle === 'Annual' ? 12 : 1;
      updatedFarmer.subscriptionExpiry = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
      adminService.logAction('Reactivated Subscription', `Reactivated subscription for farmer ${farmerId}`, 'Successful');
    } else if (action === 'extend_trial') {
      const days = data.days || 7;
      const currentTrialEnd = updatedFarmer.trialEndsAt
        ? new Date(updatedFarmer.trialEndsAt)
        : new Date();
      updatedFarmer.trialEndsAt = new Date(
        Math.max(currentTrialEnd.getTime(), Date.now()) + days * 24 * 60 * 60 * 1000
      ).toISOString();
      adminService.logAction(
        'Extended Trial',
        `Extended trial for farmer ${farmerId} by ${days} days`,
        'Successful'
      );
    }

    const updated = farmers.map((f) => (f.id === farmerId ? updatedFarmer : f));
    setLocal(KEYS.FARMERS, updated);
    return updated;
  }
};
