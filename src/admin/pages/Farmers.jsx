import useSaveAction from '../../hooks/useSaveAction';
import AdminDialog from '../components/AdminDialog';
import React, { useState } from 'react';
import { Eye, ShieldAlert, CheckCircle2, Send, Phone, Mail, MapPin } from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import AdminDataTable from '../components/AdminDataTable';
import StatusBadge from '../components/StatusBadge';

export default function Farmers() {
  const { farmers, updateFarmerStatus, sendNotification } = useAdmin();
  const toast = useToast();
  const confirm = useConfirm();
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [notifyFarmer, setNotifyFarmer] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState('');

  const [handleToggleStatus, handleToggleStatusSaving] = useSaveAction(async (farmer) => {
    const nextStatus = farmer.status === 'Active' ? 'Suspended' : 'Active';
    const ok = await confirm({
      title: `${nextStatus === 'Suspended' ? 'Suspend' : 'Activate'} Farmer Account?`,
      message: `Are you sure you want to change ${farmer.fullName}'s account status to ${nextStatus}?`,
      confirmText: nextStatus === 'Suspended' ? 'Suspend Farmer' : 'Activate Farmer',
      isDanger: nextStatus === 'Suspended',
    });
    if (!ok) return;

    await updateFarmerStatus(farmer.id, nextStatus);
    if (selectedFarmer && selectedFarmer.id === farmer.id) {
      setSelectedFarmer({ ...selectedFarmer, status: nextStatus });
    }
    toast.success(`Farmer account status updated to ${nextStatus}.`, { title: 'Status Updated' });
  });

  const [handleSendDirectNotification, handleSendDirectNotificationSaving] = useSaveAction(async (e) => {
    e.preventDefault();
    if (!notificationMsg.trim() || !notifyFarmer) return;

    try {
      await sendNotification({
        title: `Direct Administrator Notice`,
        message: notificationMsg,
        category: 'System Announcements',
        priority: 'Important Notice',
        targetAudience: `Farmer: ${notifyFarmer.fullName} (${notifyFarmer.email})`,
        targetFarmerId: notifyFarmer.id,
        deliveryChannel: 'In-App & Email'
      });

      toast.success(`Notification dispatched directly to ${notifyFarmer.fullName}.`, { title: 'Notice Sent' });
      setNotificationMsg('');
      setNotifyFarmer(null);
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch notification.');
    }
  });

  const columns = [
    {
      header: 'Farmer ID',
      accessor: 'id',
      render: (r) => <span className="font-mono font-bold text-xs text-slate-700">{r.id}</span>
    },
    {
      header: 'Full Name',
      accessor: 'fullName',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
            {r.fullName?.[0] || '?'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">{r.fullName}</span>
            <span className="text-[11px] text-slate-400">{r.email}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Phone & Location',
      render: (r) => (
        <div>
          <span className="font-medium text-slate-800 block text-xs">{r.phone}</span>
          <span className="text-[11px] text-slate-400">{r.location}</span>
        </div>
      )
    },
    {
      header: 'Poultry Types',
      render: (r) => (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {(Array.isArray(r.poultryTypes) ? r.poultryTypes : []).map((pt) => (
            <span
              key={pt}
              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold"
            >
              {pt}
            </span>
          ))}
          {(!Array.isArray(r.poultryTypes) || r.poultryTypes.length === 0) && (
            <span className="text-xs text-slate-400">Not recorded</span>
          )}
        </div>
      )
    },
    {
      header: 'Subscription',
      accessor: 'subscription',
      render: (r) => <StatusBadge variant={r.subscription}>{r.subscription} Plan</StatusBadge>
    },
    {
      header: 'Farms',
      render: (r) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold">
          {r.farmsCount || 1} {r.farmsCount === 1 ? 'farm' : 'farms'}
        </span>
      )
    },
    {
      header: 'Birds Population',
      render: (r) => (
        <span className="font-bold text-slate-900">
          {(r.totalBirds || 0).toLocaleString()} <span className="text-slate-400 font-normal text-xs">birds</span>
        </span>
      )
    },
    {
      header: 'Date Joined',
      accessor: 'dateJoined',
      render: (r) => <span className="text-xs text-slate-600 font-medium whitespace-nowrap">{r.dateJoined || '2026-06-15'}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusBadge variant={r.status}>{r.status}</StatusBadge>
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedFarmer(r)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            title="View Full Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setNotifyFarmer(r)}
            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
            title="Send Direct Notification"
          >
            <Send className="w-4 h-4" />
          </button>
          <button disabled={handleToggleStatusSaving}
            onClick={() => handleToggleStatus(r)}
            className={`p-1.5 rounded-lg transition ${
              r.status === 'Active'
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
            }`}
            title={r.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
          >{handleToggleStatusSaving ? 'Saving...' : <>
            {r.status === 'Active' ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </>}</button>
        </div>
      )
    }
  ];

  const activeCount = farmers.filter((f) => f.status === 'Active').length;
  const suspendedCount = farmers.filter((f) => f.status === 'Suspended').length;
  const starterCount = farmers.filter((f) => f.planId === 'basic' || (!f.planId && ['Basic','Starter','Free'].includes(f.subscription))).length;
  const professionalCount = farmers.filter((f) => f.planId === 'professional' || (!f.planId && f.subscription === 'Professional')).length;
  const enterpriseCount = farmers.filter((f) => f.planId === 'enterprise' || (!f.planId && ['Enterprise','PRO'].includes(f.subscription))).length;
  const totalBirds = farmers.reduce((s, f) => s + (f.totalBirds || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Registered Farmers Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Oversee registered poultry farm owners, review subscription plans, and manage account statuses.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <span>Total Farmers: {farmers.length}</span>
          <span>•</span>
          <span className="text-emerald-700">Active: {activeCount}</span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Farmers</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{farmers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Active</span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Suspended</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{suspendedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Basic Plan</span>
          <p className="text-2xl font-black text-slate-600 mt-1">{starterCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Pro</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{professionalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Enterprise</span>
          <p className="text-2xl font-black text-purple-700 mt-1">{enterpriseCount}</p>
        </div>
      </div>

      {/* Main Table */}
      <AdminDataTable
        columns={columns}
        data={farmers}
        searchPlaceholder="Search by name, email, phone, location or poultry type..."
        filterKey="subscription"
        filterLabel="Plan"
        filterOptions={['Basic', 'Pro', 'Enterprise']}
        emptyTitle="No farmers found"
        emptySubtext="Try clearing filters or search query."
      />

      {/* Farmer Profile Modal (README Section 4B) */}
      {selectedFarmer && (
        <AdminDialog onClose={()=>setSelectedFarmer(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-lg">
                  {selectedFarmer.fullName?.[0] || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{selectedFarmer.fullName}</h3>
                  <span className="text-xs font-mono text-slate-400">{selectedFarmer.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFarmer(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                &times;
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Personal Info</span>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{selectedFarmer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{selectedFarmer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{selectedFarmer.location}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Platform Status</span>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-slate-500">Plan Tier:</span>
                  <StatusBadge variant={selectedFarmer.subscription}>{selectedFarmer.subscription} Plan</StatusBadge>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-slate-500">Account Status:</span>
                  <StatusBadge variant={selectedFarmer.status}>{selectedFarmer.status}</StatusBadge>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-slate-500">Joined Date:</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.dateJoined}</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-slate-500">Last Activity:</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.lastLogin}</span>
                </div>
              </div>
            </div>

            {/* Farm & Birds Summary */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-around text-center">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Registered Farms</span>
                <p className="text-xl font-extrabold text-emerald-950 mt-0.5">{selectedFarmer.farmsCount}</p>
              </div>
              <div className="w-px h-8 bg-emerald-200" />
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Flocks</span>
                <p className="text-xl font-extrabold text-emerald-950 mt-0.5">{selectedFarmer.totalFlocks}</p>
              </div>
              <div className="w-px h-8 bg-emerald-200" />
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Recorded Birds</span>
                <p className="text-xl font-extrabold text-emerald-950 mt-0.5">{(selectedFarmer.totalBirds || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button disabled={handleToggleStatusSaving}
                type="button"
                onClick={() => handleToggleStatus(selectedFarmer)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  selectedFarmer.status === 'Active'
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >{handleToggleStatusSaving ? 'Saving...' : <>
                {selectedFarmer.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
              </>}</button>
              <button
                type="button"
                onClick={() => setSelectedFarmer(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </AdminDialog>
      )}

      {/* Direct Notification Modal */}
      {notifyFarmer && (
        <AdminDialog onClose={()=>setNotifyFarmer(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-5">
            <h3 className="text-lg font-extrabold text-slate-900">
              Send Direct Notification to {notifyFarmer.fullName}
            </h3>
            <p className="text-xs text-slate-500">
              This message will be delivered into the farmer's notification feed and account email ({notifyFarmer.email}).
            </p>

            <form onSubmit={handleSendDirectNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Message Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={notificationMsg}
                  onChange={(e) => setNotificationMsg(e.target.value)}
                  placeholder="e.g. Please verify your farm bio-security registration or update your annual Pro payment details..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNotifyFarmer(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button disabled={handleSendDirectNotificationSaving}
                  type="submit"
                  className="px-5 py-2 bg-[#15803D] hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >{handleSendDirectNotificationSaving ? 'Saving...' : <>
                  Send Message
                </>}</button>
              </div>
            </form>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}
