import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  CheckCheck, 
  Trash2, 
  Filter, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Wheat, 
  Activity, 
  CreditCard, 
  MessageSquare,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  X
} from '../../components/common/Icons';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  clearReadNotifications 
} from '../../services/notificationStore';

const CATEGORIES = [
  { id: 'all', label: 'All Notifications', icon: Bell },
  { id: 'farm', label: 'Farm Activities', icon: ShieldCheck },
  { id: 'inventory', label: 'Inventory Alerts', icon: Wheat },
  { id: 'health', label: 'Poultry Health & Mortality', icon: Activity },
  { id: 'subscription', label: 'Subscription & Payments', icon: CreditCard },
  { id: 'free_trial', label: 'Free Trial', icon: Calendar },
  { id: 'announcement', label: 'System Announcements', icon: MessageSquare },
];

export default function NotificationsPage() {
  const { notifications, user, refreshAllData } = useFarm();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [selectedDetail, setSelectedDetail] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  // Metrics summary
  const allNotifs = notifications || [];
  const totalCount = allNotifs.length;
  const unreadCount = allNotifs.filter((n) => !n.isRead && !n.read).length;
  const importantCount = allNotifs.filter((n) => n.priority === 'urgent' || n.priority === 'high' || n.type === 'error').length;
  
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentCount = allNotifs.filter((n) => {
    const t = new Date(n.createdAt).getTime();
    return !isNaN(t) && t > oneDayAgo;
  }).length;

  // Filtered list
  const filteredList = useMemo(() => {
    return allNotifs.filter((n) => {
      // Category filter
      if (selectedCategory !== 'all' && n.category !== selectedCategory) {
        return false;
      }
      // Unread tab
      if (activeTab === 'unread' && (n.isRead || n.read)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(q);
        const matchesMsg = n.message?.toLowerCase().includes(q);
        const matchesCat = n.category?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesCat) return false;
      }
      return true;
    });
  }, [allNotifs, selectedCategory, activeTab, searchQuery]);

  const handleMarkAsRead = async (id) => {
    await markNotificationAsRead(id, user?.id);
    refreshAllData();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(user?.id);
    refreshAllData();
    toast.success('All notifications marked as read', { title: 'Updated' });
  };

  const handleDelete = async (id, title) => {
    const ok = await confirm({
      title: 'Delete Notification?',
      message: `Are you sure you want to delete "${title || 'this alert'}"?`,
      confirmText: 'Delete',
      isDanger: true,
    });
    if (!ok) return;

    await deleteNotification(id, user?.id);
    if (selectedDetail?.id === id) setSelectedDetail(null);
    refreshAllData();
    toast.info('Notification deleted.');
  };

  const handleClearRead = async () => {
    const ok = await confirm({
      title: 'Clear Read Notifications?',
      message: 'This will permanently remove all notifications you have already read.',
      confirmText: 'Clear Read',
      isDanger: false,
    });
    if (!ok) return;

    await clearReadNotifications(user?.id);
    refreshAllData();
    toast.info('Cleared read notifications.');
  };

  const getCategoryIcon = (category, type) => {
    if (category === 'inventory') return <Wheat className="w-5 h-5 text-amber-600" />;
    if (category === 'health') return <Activity className="w-5 h-5 text-rose-600" />;
    if (category === 'subscription') return <CreditCard className="w-5 h-5 text-blue-600" />;
    if (category === 'announcement') return <MessageSquare className="w-5 h-5 text-emerald-600" />;

    switch ((type || '').toLowerCase()) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'error':
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 rounded-md">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 rounded-md">High</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Bell className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                Notification Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time farm alerts, inventory thresholds, health records, and system announcements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}

          <button
            onClick={handleClearRead}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Read
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Notifications
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">All recorded</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Unread Notifications
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {unreadCount}
            </span>
            <span className="text-xs font-bold text-emerald-700">Action needed</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
            Important Alerts
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {importantCount}
            </span>
            <span className="text-xs font-semibold text-rose-600">Urgent & High</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
            Recent (24h)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {recentCount}
            </span>
            <span className="text-xs font-semibold text-blue-500">Last 24 hours</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: Sidebar Categories + Notification List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Navigation */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              Categories
            </span>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count = cat.id === 'all' 
                ? allNotifs.length 
                : allNotifs.filter(n => n.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0 stroke-[2]" />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notification List Workspace */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Tabs */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search alerts, warnings, titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* All vs Unread Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-stretch sm:self-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({filteredList.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'unread'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* List Items */}
          <div className="space-y-2.5">
            {filteredList.length > 0 ? (
              filteredList.map((n) => {
                const isUnread = !n.isRead && !n.read;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (isUnread) handleMarkAsRead(n.id);
                      setSelectedDetail(n);
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                      isUnread
                        ? 'bg-white dark:bg-slate-900 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Icon */}
                      <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                        {getCategoryIcon(n.category, n.type)}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-sm ${isUnread ? 'font-extrabold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                            {n.title}
                          </h3>
                          {getPriorityBadge(n.priority)}
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md capitalize">
                            {n.category}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>

                        <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(n.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {n.actionUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(n.actionUrl);
                              }}
                              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              {n.category === 'free_trial' ? 'Upgrade Now' : 'Open Section'} &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {isUnread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(n.id);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl hover:bg-emerald-100 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(n.id, n.title);
                        }}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.9]" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors hidden sm:block" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Bell className="w-7 h-7 stroke-[1.8]" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  No notifications match your filters
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery ? `No results found for "${searchQuery}". Try a different keyword.` : 'You have no notifications in this category.'}
                </p>
                {(searchQuery || selectedCategory !== 'all' || activeTab !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setActiveTab('all');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  {getCategoryIcon(selectedDetail.category, selectedDetail.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {selectedDetail.title}
                    </h3>
                    {getPriorityBadge(selectedDetail.priority)}
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {new Date(selectedDetail.createdAt).toLocaleString('en-GB')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedDetail.message}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleDelete(selectedDetail.id, selectedDetail.title)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete Notification
              </button>

              <div className="flex items-center gap-2">
                {selectedDetail.actionUrl && (
                  <button
                    onClick={() => {
                      const url = selectedDetail.actionUrl;
                      setSelectedDetail(null);
                      navigate(url);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    {selectedDetail.category === 'free_trial' ? 'Upgrade Now' : 'Open Action Link'}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
