import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  X,
  ExternalLink,
  Wheat,
  Activity,
  CreditCard,
  MessageSquare
} from '../common/Icons';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  clearReadNotifications 
} from '../../services/notificationStore';

export default function NotificationDropdown({ isOpen, onClose }) {
  const { notifications, user, refreshAllData } = useFarm();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  if (!isOpen) return null;

  const unreadCount = (notifications || []).filter((n) => !n.isRead && !n.read).length;
  const filteredNotifications = (notifications || []).filter((n) => {
    const isUnread = !n.isRead && !n.read;
    if (filter === 'unread') return isUnread;
    return true;
  });

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    await markNotificationAsRead(id, user?.id);
    refreshAllData();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(user?.id);
    refreshAllData();
    toast.success('All notifications marked as read', { title: 'Notifications Updated' });
  };

  const handleClearRead = async () => {
    const ok = await confirm({
      title: 'Clear Read Notifications?',
      message: 'This will remove all read alerts from your notification history.',
      confirmText: 'Clear Read',
      isDanger: false,
    });
    if (!ok) return;

    await clearReadNotifications(user?.id);
    refreshAllData();
    toast.info('Read notifications cleared.');
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id, user?.id);
    refreshAllData();
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead && !notif.read) {
      await markNotificationAsRead(notif.id, user?.id);
      refreshAllData();
    }
    onClose();

    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    } else {
      navigate('/notifications');
    }
  };

  const getNotificationIcon = (type, category) => {
    if (category === 'inventory') return <Wheat className="w-4 h-4 text-amber-600" />;
    if (category === 'health') return <Activity className="w-4 h-4 text-rose-600" />;
    if (category === 'subscription') return <CreditCard className="w-4 h-4 text-blue-600" />;
    if (category === 'announcement') return <MessageSquare className="w-4 h-4 text-emerald-600" />;

    switch ((type || '').toLowerCase()) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'error':
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;

    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      role="dialog"
      aria-label="Notification center"
      className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full mt-2 sm:w-[410px] max-h-[82dvh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
            <Bell className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-600 text-white rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount} new
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Farm alerts & updates</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4 stroke-[2]" />
            </button>
          )}
          <button
            onClick={handleClearRead}
            title="Clear read notifications"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 stroke-[2]" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({(notifications || []).length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
            filter === 'unread'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-80">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => {
            const isUnread = !n.isRead && !n.read;
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                  isUnread
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Category Icon Badge */}
                <div className="mt-0.5 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                  {getNotificationIcon(n.type, n.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>

                  {n.actionUrl && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 hover:underline">
                      View details
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Status Indicator & Action */}
                <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900" />
                  )}
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 transition-opacity"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-5 h-5 stroke-[1.8]" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-[11px] text-slate-400">
              {filter === 'unread' ? "You're all caught up with your farm alerts." : 'Important farm events, inventory, and health alerts will appear here.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
        >
          View All Notifications
          <ExternalLink className="w-3 h-3" />
        </Link>
        <span className="text-[10px] text-slate-400 font-medium">PoultryPro Smart Alerts</span>
      </div>
    </div>
  );
}
