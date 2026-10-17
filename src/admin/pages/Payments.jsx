import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import AdminDataTable from '../components/AdminDataTable';
import StatusBadge from '../components/StatusBadge';

/* ─── Inline SVG Icons (No Lucide, Clean Professional SVGs) ─────────────── */
const IconReceipt = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.555.832L12 15.34l-2.445 1.492A1 1 0 018 16.832L5.555 15.34 4 16.292A1 1 0 012.445 15.46V4a2 2 0 012-2zm2 2a1 1 0 000 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h4a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const IconCheckCircle = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const IconShieldCheck = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-[#15803D]">
    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM13.707 8.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const IconDownload = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const IconPrinter = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

export default function Payments() {
  const { payments, verifyPayment } = useAdmin();
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [planFilter, setPlanFilter] = useState('ALL');

  const totalSuccessfulAmount = useMemo(
    () => payments.filter((p) => p.status === 'Successful').reduce((s, p) => s + (p.amount || 0), 0),
    [payments]
  );
  const successfulCount = useMemo(() => payments.filter((p) => p.status === 'Successful').length, [payments]);
  const pendingCount = useMemo(() => payments.filter((p) => p.status === 'Pending').length, [payments]);
  const failedCount = useMemo(() => payments.filter((p) => p.status === 'Failed').length, [payments]);
  const refundedCount = useMemo(() => payments.filter((p) => p.status === 'Refunded').length, [payments]);

  const filteredPayments = useMemo(() => {
    if (planFilter === 'ALL') return payments;
    return payments.filter((p) => {
      const planName = (p.plan || '').toLowerCase();
      if (planFilter === 'Basic') return planName.includes('basic') || planName.includes('starter');
      return planName === planFilter.toLowerCase();
    });
  }, [payments, planFilter]);

  const handleVerify = (paymentId) => {
    verifyPayment(paymentId);
  };

  const handleExportCSV = () => {
    if (!payments.length) {
      alert('No payment records available to export.');
      return;
    }
    const headers = ['Transaction ID', 'Farmer Name', 'Farmer ID', 'Plan', 'Billing Cycle', 'Amount (NGN)', 'Gateway', 'Payment Method', 'Date', 'Status', 'Reference'];
    const rows = payments.map((p) => [
      p.id,
      `"${(p.farmerName || '').replace(/"/g, '""')}"`,
      p.farmerId || '',
      p.plan || '',
      p.billingCycle || '',
      p.amount || 0,
      p.gateway || '',
      p.paymentMethod || '',
      p.date || '',
      p.status || '',
      p.reference || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `poultrypro_payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: 'Transaction ID',
      accessor: 'id',
      render: (r) => <span className="font-mono font-bold text-xs text-slate-800">{r.id}</span>
    },
    {
      header: 'Farmer Name',
      accessor: 'farmerName',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{r.farmerName}</span>
          <span className="text-[11px] font-mono text-slate-400">{r.farmerId}</span>
        </div>
      )
    },
    {
      header: 'Plan Purchased',
      accessor: 'plan',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs">{r.plan}</span>
          <span className="text-[11px] text-slate-400 block">{r.billingCycle || 'Annual'}</span>
        </div>
      )
    },
    {
      header: 'Amount Paid',
      accessor: 'amount',
      render: (r) => (
        <span className="font-extrabold text-[#15803D] text-sm">
          ₦{(r.amount || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Gateway & Method',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{r.gateway || 'Paystack'}</span>
          <span className="text-[11px] text-slate-400">{r.paymentMethod || 'Debit Card'}</span>
        </div>
      )
    },
    {
      header: 'Transaction Date',
      accessor: 'date',
      render: (r) => <span className="text-xs text-slate-600 font-medium">{r.date}</span>
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
            onClick={() => setSelectedReceipt(r)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            title="View Receipt"
            aria-label="View Receipt"
          >
            <IconReceipt />
          </button>
          {r.status === 'Pending' && (
            <button
              onClick={() => handleVerify(r.id)}
              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#15803D] rounded-lg transition"
              title="Verify Gateway Settlement"
              aria-label="Verify Gateway Settlement"
            >
              <IconCheckCircle />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Payments & Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reconcile subscription payments processed via Paystack, Flutterwave, and direct bank settlement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <IconDownload />
            Export CSV
          </button>
        </div>
      </div>

      {/* 5 Payment Summary Cards (README Section 7A) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payments Received</span>
          <p className="text-xl sm:text-2xl font-black text-[#15803D] mt-1">
            ₦{totalSuccessfulAmount.toLocaleString()}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Cleared platform revenue</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Successful Payments</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {successfulCount}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Settled transactions</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Payments</span>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
            {pendingCount}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Awaiting confirmation</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed Payments</span>
          <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
            {failedCount}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Declined cards</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Refunded Payments</span>
          <p className="text-xl sm:text-2xl font-black text-slate-700 mt-1">
            {refundedCount}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Reversed settlements</span>
        </div>
      </div>

      {/* Plan Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 shrink-0">Filter by Plan:</span>
        {['ALL', 'Basic', 'Pro', 'Enterprise'].map((p) => (
          <button
            key={p}
            onClick={() => setPlanFilter(p)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${
              planFilter === p
                ? 'bg-[#15803D] text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {p === 'ALL' ? 'All Plans' : p}
          </button>
        ))}
      </div>

      {/* Transactions Table with full status filters */}
      <AdminDataTable
        columns={columns}
        data={filteredPayments}
        searchPlaceholder="Search by transaction ID, farmer name, reference or plan..."
        filterKey="status"
        filterLabel="Status"
        filterOptions={['Successful', 'Pending', 'Failed', 'Refunded']}
        emptyTitle="No transactions found"
      />

      {/* Official Transaction Receipt Modal (README Section 7) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <IconShieldCheck />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Verified Payment Receipt</h3>
                  <span className="text-xs text-slate-400 font-mono">PoultryPro Nigeria Platform</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close receipt"
              >
                <IconClose />
              </button>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Reference:</span>
                <span className="font-mono text-slate-700">{selectedReceipt.reference || 'REF-' + selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer (Farmer):</span>
                <span className="font-bold text-slate-900">{selectedReceipt.farmerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subscription Tier:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.plan} ({selectedReceipt.billingCycle || 'Annual'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Processor:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.gateway || 'Paystack'} ({selectedReceipt.paymentMethod || 'Debit Card'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Date:</span>
                <span className="text-slate-700">{selectedReceipt.date}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase">Amount Paid:</span>
                <span className="text-xl font-black text-[#15803D]">₦{(selectedReceipt.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-slate-500">Payment Status:</span>
                <StatusBadge variant={selectedReceipt.status}>{selectedReceipt.status}</StatusBadge>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <IconPrinter />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2 bg-[#15803D] hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
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
