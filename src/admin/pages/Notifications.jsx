import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, Users, Radio, MessageSquare } from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';
import AdminDataTable from '../components/AdminDataTable';
import StatusBadge from '../components/StatusBadge';

export default function Notifications() {
  const { notifications, sendNotification, farmers } = useAdmin();
  const [form, setForm] = useState({
    title: '',
    category: 'System',
    targetAudience: 'All Farmers',
    deliveryChannel: 'In-App & Email',
    message: ''
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return;

    let recipients = farmers.length;
    if (form.targetAudience === 'Basic Plan Users') recipients = farmers.filter((f) => f.planId === 'basic' || (!f.planId && ['Basic','Starter','Free'].includes(f.subscription))).length;
    if (form.targetAudience === 'Pro & Enterprise') recipients = farmers.filter((f) => ['professional','enterprise'].includes(f.planId) || (!f.planId && ['Professional','Enterprise'].includes(f.subscription))).length;
    if (form.targetAudience === 'Broiler Farmers') recipients = farmers.filter((f) => f.poultryTypes.includes('Broilers')).length;
    if (form.targetAudience === 'Layer Farmers') recipients = farmers.filter((f) => f.poultryTypes.includes('Layers')).length;

    sendNotification({
      ...form,
      recipientCount: recipients
    });

    alert(`Notification broadcast dispatched to ${recipients} target farmers.`);
    setForm({
      title: '',
      category: 'System',
      targetAudience: 'All Farmers',
      deliveryChannel: 'In-App & Email',
      message: ''
    });
  };

  const columns = [
    {
      header: 'Notification ID',
      accessor: 'id',
      render: (r) => <span className="font-mono font-bold text-xs text-slate-700">{r.id}</span>
    },
    {
      header: 'Title & Summary',
      render: (r) => (
        <div className="max-w-md">
          <span className="font-bold text-slate-900 block text-xs truncate">{r.title}</span>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">{r.message}</span>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (r) => (
        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-bold">
          {r.category}
        </span>
      )
    },
    {
      header: 'Target Audience',
      accessor: 'targetAudience',
      render: (r) => (
        <span className="text-xs font-semibold text-emerald-800">{r.targetAudience}</span>
      )
    },
    {
      header: 'Delivered To',
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
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Platform Broadcast Notifications
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Deliver targeted system announcements, disease outbreak advisories, and subscription reminders to poultry farmers.
        </p>
      </div>

      {/* Broadcast Composer (README Section 10A & 10B) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
          <Radio className="w-5 h-5 text-emerald-700" />
          <h2 className="text-base font-extrabold text-slate-900">
            Compose Targeted Broadcast Announcement
          </h2>
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
                placeholder="e.g. Newcastle Disease Vaccination Advisory for Kwara & Oyo Farms"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
              >
                <option value="System">System Notifications</option>
                <option value="Subscription">Subscription Notifications</option>
                <option value="Agricultural Advisory">Agricultural & Health Advisory</option>
                <option value="Promotional">Promotional & Discounts</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">
                Target Audience (Segment)
              </label>
              <select
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
              >
                <option value="All Farmers">All Farmers (Entire Platform)</option>
                <option value="Basic Plan Users">Basic Plan Farmers Only</option>
                <option value="Pro & Enterprise">Pro & Enterprise Subscribers</option>
                <option value="Broiler Farmers">Broiler Farmers Only</option>
                <option value="Layer Farmers">Layer Farmers Only</option>
                <option value="Turkey Farmers">Turkey Farmers Only</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1.5">
                Delivery Channel
              </label>
              <select
                value={form.deliveryChannel}
                onChange={(e) => setForm({ ...form, deliveryChannel: e.target.value })}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
              >
                <option value="In-App & Email">In-App Notification Feed & Email</option>
                <option value="In-App Only">In-App Notification Feed Only</option>
                <option value="Urgent Dashboard Banner">Urgent Red Dashboard Top Banner</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1.5">
              Notification Body Content
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write clear, actionable instructions for farmers..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Dispatch Platform Broadcast
            </button>
          </div>
        </form>
      </div>

      {/* Historical Broadcasts Table (README Section 10C) */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900 mb-4">
          Broadcast Delivery History
        </h2>
        <AdminDataTable
          columns={columns}
          data={notifications}
          searchPlaceholder="Search previously sent announcements..."
          filterKey="category"
          filterLabel="Category"
          filterOptions={['System', 'Agricultural Advisory', 'Promotional', 'Subscription']}
          emptyTitle="No notification history found"
        />
      </div>
    </div>
  );
}
