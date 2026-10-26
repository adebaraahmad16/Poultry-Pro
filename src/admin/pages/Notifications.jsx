import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  Users, 
  Radio, 
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  X
} from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import AdminDataTable from '../components/AdminDataTable';
import StatusBadge from '../components/StatusBadge';

export default function Notifications() {
  const { notifications, sendNotification, farmers } = useAdmin();
  const toast = useToast();

  const [form, setForm] = useState({
    title: '',
    category: 'System Announcements',
    priority: 'General Information', // 'General Information' | 'Important Notice' | 'Urgent Announcement'
    targetAudience: 'All Farmers',
    deliveryChannel: 'In-App & Email',
    targetFarmerId: '',
    message: ''
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const calculateRecipientCount = () => {
    if (form.targetAudience === 'Specific Farmer' && form.targetFarmerId) return 1;
    if (form.targetAudience === 'Basic Plan Users') {
      return farmers.filter((f) => f.planId === 'basic' || (!f.planId && ['Basic','Starter','Free'].includes(f.subscription))).length;
    }
    if (form.targetAudience === 'Pro Users') {
      return farmers.filter((f) => f.planId === 'professional' || (!f.planId && ['Pro','Professional'].includes(f.subscription))).length;
    }
    if (form.targetAudience === 'Enterprise Users') {
      return farmers.filter((f) => f.planId === 'enterprise' || (!f.planId && ['Enterprise'].includes(f.subscription))).length;
    }
    if (form.targetAudience === 'Broiler Farmers') {
      return farmers.filter((f) => (f.poultryTypes || []).includes('Broilers') || (f.poultryTypes || []).includes('broilers')).length;
    }
    if (form.targetAudience === 'Layer Farmers') {
      return farmers.filter((f) => (f.poultryTypes || []).includes('Layers') || (f.poultryTypes || []).includes('layers')).length;
    }
    return farmers.length;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.warning('Please enter both a headline and a message.', { title: 'Missing Fields' });
      return;
    }

    setIsSending(true);
    const recipients = calculateRecipientCount();

    try {
      await sendNotification({
        ...form,
        recipientCount: recipients,
        status: 'Delivered',
        dateSent: new Date().toLocaleDateString('en-GB')
      });

      toast.success(`Announcement published and dispatched to ${recipients} farmer(s).`, {
        title: 'Broadcast Dispatched'
      });

      setForm({
        title: '',
        category: 'System Announcements',
        priority: 'General Information',
        targetAudience: 'All Farmers',
        deliveryChannel: 'In-App & Email',
        targetFarmerId: '',
        message: ''
      });
      setIsPreviewOpen(false);
    } catch (err) {
      toast.error('Failed to dispatch notification: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const columns = [
    {
      header: 'Notification ID',
      accessor: 'id',
      render: (r) => <span className="font-mono font-bold text-xs text-slate-700">{r.id}</span>
    },
    {
      header: 'Headline & Summary',
      render: (r) => (
        <div className="max-w-md">
          <span className="font-bold text-slate-900 block text-xs truncate">{r.title}</span>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">{r.message}</span>
        </div>
      )
    },
    {
      header: 'Priority',
      render: (r) => {
        const p = r.priority || 'General Information';
        const isUrgent = p.toLowerCase().includes('urgent');
        const isImportant = p.toLowerCase().includes('important');
        return (
          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${
            isUrgent ? 'bg-rose-100 text-rose-700' : isImportant ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'
          }`}>
            {p}
          </span>
        );
      }
    },
    {
      header: 'Target Audience',
      accessor: 'targetAudience',
      render: (r) => (
        <span className="text-xs font-semibold text-emerald-800">{r.targetAudience}</span>
      )
    },
    {
      header: 'Recipients',
      render: (r) => (
        <span className="font-bold text-slate-900 text-xs">
          {(r.recipientCount || farmers.length).toLocaleString()} farmers
        </span>
      )
    },
    {
      header: 'Date Sent',
      accessor: 'dateSent',
      render: (r) => <span className="text-xs text-slate-500">{r.dateSent}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusBadge variant={r.status}>{r.status}</StatusBadge>
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Radio className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Platform Broadcast Notifications & Announcements
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Publish real-time announcements, priority advisories, and plan notifications across target farmer accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast Composer */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-extrabold text-slate-900">
              Compose Targeted Broadcast Announcement
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Target Audience: <strong className="text-emerald-700">{calculateRecipientCount()} farmer(s)</strong>
          </span>
        </div>

        <form onSubmit={handleSend} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1.5">
                Broadcast Headline / Subject
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mandatory Avian Health Protocol Update & Feed Supplementation Advisory"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">
                Announcement Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="General Information">General Information (Normal)</option>
                <option value="Important Notice">Important Notice (High)</option>
                <option value="Urgent Announcement">Urgent Announcement (Immediate Alert)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="System Announcements">System Announcements</option>
                <option value="Subscription Reminders">Subscription & Billing Updates</option>
                <option value="Health & Biosecurity Advisory">Health & Biosecurity Advisory</option>
                <option value="Platform Maintenance">Platform Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">
                Target Audience (Segment)
              </label>
              <select
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value, targetFarmerId: '' })}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="All Farmers">All Farmers (Entire Platform)</option>
                <option value="Basic Plan Users">Basic Plan Farmers Only</option>
                <option value="Pro Users">Pro Plan Subscribers Only</option>
                <option value="Enterprise Users">Enterprise Plan Subscribers Only</option>
                <option value="Broiler Farmers">Broiler Farmers</option>
                <option value="Layer Farmers">Layer Farmers</option>
                <option value="Specific Farmer">Single Selected Farmer</option>
              </select>
            </div>

            {form.targetAudience === 'Specific Farmer' ? (
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">
                  Select Farmer
                </label>
                <select
                  value={form.targetFarmerId}
                  onChange={(e) => setForm({ ...form, targetFarmerId: e.target.value })}
                  required
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">-- Choose a Farmer --</option>
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fullName || f.email} ({f.farmName || 'Farm'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">
                  Delivery Channel
                </label>
                <input
                  type="text"
                  disabled
                  value="In-App Realtime Notification"
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1.5">
              Announcement Message Body
            </label>
            <textarea
              required
              rows={4}
              placeholder="Enter full announcement details for farmers. Clear, actionable instructions recommended."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              disabled={!form.title.trim() || !form.message.trim()}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview Announcement
            </button>

            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Dispatching...' : `Publish to ${calculateRecipientCount()} Farmer(s)`}
            </button>
          </div>
        </form>
      </div>

      {/* Dispatched Broadcasts Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Dispatched Broadcast History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit log of all announcements sent from the administrative control panel.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full">
            {notifications.length} Broadcasts Logged
          </span>
        </div>

        <AdminDataTable
          columns={columns}
          data={notifications}
          searchPlaceholder="Search dispatched announcements..."
        />
      </div>

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Farmer Notification Preview
                </h3>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">
                Here is exactly how this announcement will appear in the farmer's notification center:
              </p>
              
              <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-50/30 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white text-emerald-700 shadow-xs shrink-0 mt-0.5">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {form.title || 'Announcement Headline'}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">Just now</span>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    form.priority.includes('Urgent') ? 'bg-rose-100 text-rose-700' : form.priority.includes('Important') ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {form.priority}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {form.message || 'Announcement message content...'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipients:</span>
                <span className="font-bold text-slate-800">{form.targetAudience} ({calculateRecipientCount()} farmers)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-800">{form.category}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-md"
              >
                {isSending ? 'Publishing...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
