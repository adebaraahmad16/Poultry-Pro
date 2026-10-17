import React, { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Download, Clock, Eye,
  AlertTriangle, Lock, User, DollarSign, Settings, Bell
} from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';
import AdminDataTable from '../components/AdminDataTable';
import StatusBadge from '../components/StatusBadge';

const ACTION_ICON = {
  'Farmer Suspended': { icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  'Plan Price Updated': { icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Admin Created': { icon: User, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  'Payment Verified': { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Ticket Resolved': { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Admin Login': { icon: Lock, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  'Settings Updated': { icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  'Broadcast Sent': { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
};

const getActionStyle = (action) => {
  for (const key of Object.keys(ACTION_ICON)) {
    if (action?.includes(key)) return ACTION_ICON[key];
  }
  return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
};

export default function AuditLogs() {
  const { auditLogs } = useAdmin();
  const [selectedLog, setSelectedLog] = useState(null);

  const handleExportLogs = () => {
    alert('Exporting security audit trail logs to CSV for compliance review...');
  };

  const successCount = auditLogs.filter((l) => l.status === 'Successful').length;
  const failedCount = auditLogs.filter((l) => l.status === 'Failed').length;
  const uniqueAdmins = [...new Set(auditLogs.map((l) => l.adminName))].length;
  const sensitiveCount = auditLogs.filter((l) =>
    ['Suspended', 'Price', 'Deleted', 'Password'].some((kw) => l.action?.includes(kw))
  ).length;

  const columns = [
    {
      header: 'Log ID',
      accessor: 'id',
      render: (r) => <span className="font-mono font-bold text-xs text-slate-600">{r.id}</span>
    },
    {
      header: 'Action Executed',
      accessor: 'action',
      render: (r) => {
        const style = getActionStyle(r.action);
        const Icon = style.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center shrink-0`}>
              <Icon className={`w-3.5 h-3.5 ${style.color}`} />
            </div>
            <span className="text-xs font-bold text-slate-800">{r.action}</span>
          </div>
        );
      }
    },
    {
      header: 'Administrator',
      accessor: 'adminName',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{r.adminName}</span>
          <span className="text-[11px] font-mono text-slate-400">IP: {r.ipAddress}</span>
        </div>
      )
    },
    {
      header: 'Target / Details',
      accessor: 'target',
      render: (r) => (
        <span className="text-xs text-slate-600 font-medium max-w-[200px] block truncate" title={r.target}>
          {r.target}
        </span>
      )
    },
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (r) => (
        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">{r.timestamp}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusBadge variant={r.status}>{r.status}</StatusBadge>
    },
    {
      header: 'Detail',
      render: (r) => (
        <button
          onClick={() => setSelectedLog(r)}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition"
          title="View Log Detail"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Immutable Security Journal
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Platform Security Audit Trail Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chronological, tamper-proof record of all sensitive actions performed by Super Admins, Finance Admins, and Support staff.
          </p>
        </div>
        <button
          onClick={handleExportLogs}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Audit Trail
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Log Entries</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{auditLogs.length}</p>
          <span className="text-xs text-slate-500 mt-1 block">All-time journal records</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Successful Actions</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">{successCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Completed without error</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Failed / Blocked</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{failedCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Unauthorized or errored</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Sensitive Actions</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">{sensitiveCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Suspensions, price changes</span>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-black block mb-0.5">Compliance Notice</span>
          This audit trail is an immutable, append-only security log. All administrative actions — including farmer suspensions, subscription price changes, payment verifications, and admin invitations — are permanently recorded with IP address, timestamp, and actor identity for regulatory compliance.
        </div>
      </div>

      {/* Main Audit Logs Table */}
      <AdminDataTable
        columns={columns}
        data={auditLogs}
        searchPlaceholder="Search by admin, action, target, or IP address..."
        filterKey="status"
        filterLabel="Status"
        filterOptions={['Successful', 'Failed']}
        emptyTitle="No audit logs recorded"
        emptySubtext="Admin actions will appear here as they are performed."
        pageSize={15}
      />

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-base text-slate-900">Audit Log Detail</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { label: 'Log ID', value: selectedLog.id, mono: true },
                { label: 'Action Executed', value: selectedLog.action, bold: true },
                { label: 'Administrator', value: selectedLog.adminName, bold: true },
                { label: 'Admin Role', value: selectedLog.adminRole || 'Super Admin' },
                { label: 'Target / Record', value: selectedLog.target },
                { label: 'IP Address', value: selectedLog.ipAddress, mono: true },
                { label: 'Timestamp (WAT)', value: selectedLog.timestamp, mono: true },
                { label: 'Status', value: selectedLog.status },
              ].map((row, i) => (
                <div key={i} className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0 gap-4">
                  <span className="text-slate-400 font-semibold shrink-0">{row.label}:</span>
                  {row.label === 'Status' ? (
                    <StatusBadge variant={row.value}>{row.value}</StatusBadge>
                  ) : (
                    <span className={`text-right ${row.mono ? 'font-mono text-slate-700' : ''} ${row.bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
