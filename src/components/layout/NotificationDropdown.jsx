import React from 'react';
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { notificationService } from '../../services/managementService';
import { useFarm } from '../../context/FarmContext';

export default function NotificationDropdown({ isOpen, onClose }) {
  const { notifications, refreshAllData } = useFarm();

  if (!isOpen) return null;

  const handleMarkAsRead = (id) => {
    notificationService.markAsRead(id);
    refreshAllData();
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    refreshAllData();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    refreshAllData();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'Critical':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'Success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-600" />
          <h4 className="font-semibold text-slate-800 text-sm">Notifications</h4>
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full">
              {notifications.filter((n) => !n.read).length} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            title="Mark all as read"
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearAll}
            title="Clear notifications"
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkAsRead(n.id)}
              className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                n.read ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/30 hover:bg-emerald-50/60'
              }`}
            >
              <div className="mt-0.5 p-1.5 bg-slate-100 rounded-lg shrink-0">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                  <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-snug">{n.message}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">No active notifications</div>
        )}
      </div>
    </div>
  );
}
