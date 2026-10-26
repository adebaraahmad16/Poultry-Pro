import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { getItem, setItem, KEYS } from './storageService.js';

const NOTIFS_KEY = KEYS.NOTIFICATIONS || 'poultrypro_notifications';

/**
 * Normalizes notification object structure
 */
function normalizeNotification(raw) {
  const isRead = raw.is_read !== undefined ? Boolean(raw.is_read) : Boolean(raw.read);
  return {
    id: String(raw.id),
    userId: raw.user_id || raw.recipient_user_id || '',
    farmId: raw.farm_id || null,
    title: raw.title || 'Notification',
    message: raw.message || '',
    type: (raw.type || 'info').toLowerCase(), // 'success' | 'warning' | 'error' | 'info'
    category: raw.category || 'farm', // 'farm' | 'inventory' | 'health' | 'subscription' | 'announcement'
    priority: raw.priority || 'normal', // 'low' | 'normal' | 'high' | 'urgent'
    actionUrl: raw.action_url || raw.actionUrl || '',
    isRead,
    read: isRead, // backwards compatibility
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    readAt: raw.read_at || null,
  };
}

/**
 * Fetch all notifications for the current farmer or user
 */
export async function fetchNotifications(userId, farmId) {
  let localNotifs = getItem(NOTIFS_KEY, []).map(normalizeNotification);

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userId},and(user_id.is.null,farm_id.eq.${farmId || 'none'})`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data)) {
        const remote = data.map(normalizeNotification);
        // Merge remote with local deduplicating by ID
        const mergedMap = new Map();
        remote.forEach(n => mergedMap.set(n.id, n));
        localNotifs.forEach(n => {
          if (!mergedMap.has(n.id)) mergedMap.set(n.id, n);
        });
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setItem(NOTIFS_KEY, merged);
        return merged;
      }
    } catch (err) {
      console.warn('Failed to load notifications from Supabase:', err.message);
    }
  }

  return localNotifs;
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id, userId) {
  const notifs = getItem(NOTIFS_KEY, []).map(normalizeNotification);
  const updated = notifs.map(n => n.id === id ? { ...n, isRead: true, read: true, readAt: new Date().toISOString() } : n);
  setItem(NOTIFS_KEY, updated);
  window.dispatchEvent(new CustomEvent('notifications-updated', { detail: updated }));

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase mark read error:', err.message);
    }
  }
  return updated;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId) {
  const notifs = getItem(NOTIFS_KEY, []).map(normalizeNotification);
  const now = new Date().toISOString();
  const updated = notifs.map(n => ({ ...n, isRead: true, read: true, readAt: now }));
  setItem(NOTIFS_KEY, updated);
  window.dispatchEvent(new CustomEvent('notifications-updated', { detail: updated }));

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase mark all read error:', err.message);
    }
  }
  return updated;
}

/**
 * Delete a single notification
 */
export async function deleteNotification(id, userId) {
  const notifs = getItem(NOTIFS_KEY, []).map(normalizeNotification);
  const updated = notifs.filter(n => n.id !== id);
  setItem(NOTIFS_KEY, updated);
  window.dispatchEvent(new CustomEvent('notifications-updated', { detail: updated }));

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete notification error:', err.message);
    }
  }
  return updated;
}

/**
 * Clear all read notifications
 */
export async function clearReadNotifications(userId) {
  const notifs = getItem(NOTIFS_KEY, []).map(normalizeNotification);
  const updated = notifs.filter(n => !n.isRead);
  setItem(NOTIFS_KEY, updated);
  window.dispatchEvent(new CustomEvent('notifications-updated', { detail: updated }));

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      await supabase.from('notifications').delete().eq('user_id', userId).eq('is_read', true);
    } catch (err) {
      console.warn('Supabase clear read error:', err.message);
    }
  }
  return updated;
}

/**
 * Add a notification (local + Supabase)
 */
export async function createNotification(notif, userId) {
  const normalized = normalizeNotification({
    id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    user_id: userId,
    ...notif,
  });

  const notifs = getItem(NOTIFS_KEY, []).map(normalizeNotification);
  const updated = [normalized, ...notifs];
  setItem(NOTIFS_KEY, updated);
  window.dispatchEvent(new CustomEvent('notifications-updated', { detail: updated }));

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      await supabase.from('notifications').insert({
        id: normalized.id,
        user_id: userId,
        farm_id: normalized.farmId,
        title: normalized.title,
        message: normalized.message,
        type: normalized.type,
        category: normalized.category,
        priority: normalized.priority,
        action_url: normalized.actionUrl,
        is_read: false,
      });
    } catch (err) {
      console.warn('Supabase createNotification warning:', err.message);
    }
  }
  return normalized;
}

/**
 * Evaluate Farm Data and generate intelligent smart alerts
 */
export async function evaluateFarmSmartAlerts({
  feeds = [],
  mortality = [],
  flocks = [],
  subscription = null,
  farmId = null,
  userId = null,
  preferences = {},
}) {
  if (!userId) return [];
  const existing = getItem(NOTIFS_KEY, []).map(normalizeNotification);
  const todayStr = new Date().toISOString().split('T')[0];
  const newAlerts = [];

  // 1. Feed Inventory Alerts
  if (preferences.feedInventory !== false) {
    feeds.forEach((feed) => {
      const minStock = feed.minThreshold || 10;
      const quantity = Number(feed.quantity || feed.stock || 0);
      const isLow = quantity <= minStock;
      const isOut = quantity <= 0;

      if (isLow) {
        const feedTag = `feed-alert-${feed.id || feed.name}-${todayStr}`;
        const alreadyExists = existing.some(n => n.id.includes(feedTag) || (n.category === 'inventory' && n.message.includes(feed.name) && n.createdAt.startsWith(todayStr)));

        if (!alreadyExists) {
          newAlerts.push({
            id: feedTag,
            title: isOut ? 'Feed Out of Stock!' : 'Feed Stock Running Low',
            message: isOut 
              ? `Your ${feed.name || 'poultry'} feed is completely out of stock. Immediate replenishment required.`
              : `Your ${feed.name || 'poultry'} feed stock has reached ${quantity} bags (minimum threshold: ${minStock} bags). Consider restocking soon.`,
            type: isOut ? 'error' : 'warning',
            category: 'inventory',
            priority: isOut ? 'urgent' : 'high',
            actionUrl: '/production/feed',
            farmId,
          });
        }
      }
    });
  }

  // 2. High Mortality Alerts
  if (preferences.mortalityAlerts !== false && Array.isArray(mortality) && mortality.length > 0) {
    const recentMortality = mortality.filter(m => m.date === todayStr || (new Date() - new Date(m.date) < 86400000));
    const totalDeadToday = recentMortality.reduce((acc, m) => acc + Number(m.count || m.quantity || 0), 0);

    const totalLiveBirds = flocks.reduce((acc, f) => acc + Number(f.currentBirds || f.birdCount || 0), 0);
    const mortalityRate = totalLiveBirds > 0 ? (totalDeadToday / totalLiveBirds) * 100 : 0;

    if (totalDeadToday >= 15 || mortalityRate >= 1.5) {
      const mortTag = `mortality-spike-${todayStr}`;
      const alreadyExists = existing.some(n => n.id.includes(mortTag));

      if (!alreadyExists) {
        newAlerts.push({
          id: mortTag,
          title: 'High Mortality Warning',
          message: `Recorded mortality today is ${totalDeadToday} birds (${mortalityRate.toFixed(1)}% of flock). Please inspect your housing, water lines, and ventilation immediately.`,
          type: 'error',
          category: 'health',
          priority: 'urgent',
          actionUrl: '/health/mortality',
          farmId,
        });
      }
    }
  }

  // 3. Subscription & Trial Alerts
  if (preferences.subscriptionAlerts !== false && subscription) {
    const trialEnd = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
    const renewalDate = subscription.renewalDate ? new Date(subscription.renewalDate) : null;
    const targetDate = trialEnd || renewalDate;

    if (targetDate && !isNaN(targetDate)) {
      const daysLeft = Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24));
      const isTrial = subscription.status === 'trial';

      if (daysLeft <= 3 && daysLeft >= 0) {
        const subTag = `sub-expiring-${daysLeft}d-${todayStr}`;
        const alreadyExists = existing.some(n => n.id.includes(subTag));

        if (!alreadyExists) {
          newAlerts.push({
            id: subTag,
            title: isTrial ? 'Free Trial Ending Soon!' : 'Subscription Expiring Soon!',
            message: isTrial
              ? `Your 14-day free trial will end in ${daysLeft === 0 ? 'today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''}`}. Activate your subscription to keep uninterrupted access to your records.`
              : `Your PoultryPro ${subscription.planId || 'active'} subscription will renew/expire in ${daysLeft} days. Check your billing settings to maintain service.`,
            type: 'warning',
            category: 'subscription',
            priority: 'high',
            actionUrl: '/settings/subscription',
            farmId,
          });
        }
      } else if (daysLeft < 0 && subscription.status === 'expired') {
        const expiredTag = `sub-expired-${todayStr}`;
        const alreadyExists = existing.some(n => n.id.includes(expiredTag));

        if (!alreadyExists) {
          newAlerts.push({
            id: expiredTag,
            title: 'Subscription Expired',
            message: 'Your subscription or trial has expired. You can view existing records, but flock creation is paused until renewed.',
            type: 'error',
            category: 'subscription',
            priority: 'urgent',
            actionUrl: '/settings/subscription',
            farmId,
          });
        }
      }
    }
  }

  // Save new alerts
  for (const alert of newAlerts) {
    await createNotification(alert, userId);
  }

  return newAlerts;
}

/**
 * Setup Realtime Supabase Subscription
 */
export function subscribeToNotificationChanges(userId, callback) {
  if (!isSupabaseConfigured() || !supabase || !userId) return () => {};

  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
