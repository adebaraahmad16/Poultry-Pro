import useSaveAction from '../../hooks/useSaveAction';
import AdminDialog from '../components/AdminDialog';
import React, { useState } from 'react';
import { Headphones, Send, CheckCircle2, AlertCircle, Clock, MessageSquare, User } from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';
import AdminDataTable from '../components/AdminDataTable';
import StatusBadge from '../components/StatusBadge';

export default function Support() {
  const { tickets, replyToTicket, updateTicketStatus } = useAdmin();
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  const totalTickets = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const pendingCount = tickets.filter((t) => t.status === 'Pending').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;
  const highPriorityCount = tickets.filter((t) => t.priority === 'High').length;

  const [handleSendReply, handleSendReplySaving] = useSaveAction(async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    await replyToTicket(activeTicket.id, replyText);
    setReplyText('');

    // Update active view
    const updated = {
      ...activeTicket,
      status: 'Pending',
      messages: [
        ...activeTicket.messages,
        {
          sender: 'Super Admin',
          role: 'Support Admin',
          timestamp: 'Just now',
          text: replyText
        }
      ]
    };
    setActiveTicket(updated);
  });

  const [handleStatusChange, handleStatusChangeSaving] = useSaveAction(async (newStatus) => {
    if (!activeTicket) return;
    await updateTicketStatus(activeTicket.id, newStatus);
    setActiveTicket({ ...activeTicket, status: newStatus });
  });

  const columns = [
    {
      header: 'Ticket ID',
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
      header: 'Subject & Inquiry',
      render: (r) => (
        <div className="max-w-xs">
          <span className="font-bold text-slate-900 block text-xs truncate">{r.subject}</span>
          <span className="text-[11px] text-slate-500 block truncate">{r.category}</span>
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (r) => <StatusBadge variant={r.priority}>{r.priority}</StatusBadge>
    },
    {
      header: 'Assigned To',
      accessor: 'assignedTo',
      render: (r) => <span className="text-xs font-semibold text-slate-700">{r.assignedTo || 'Unassigned'}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusBadge variant={r.status}>{r.status}</StatusBadge>
    },
    {
      header: 'Actions',
      render: (r) => (
        <button
          onClick={() => setActiveTicket(r)}
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition flex items-center gap-1"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Respond
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Farmer Support Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Resolve farmer inquiries, assist with Paystack subscription verification, and clarify egg/flock metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
            {highPriorityCount} Urgent Tickets
          </span>
        </div>
      </div>

      {/* KPI Cards (README Section 11A) */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tickets</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalTickets}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Open / Unanswered</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{openCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Farmer Reply</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Resolved Inquiries</span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{resolvedCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">High Priority</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{highPriorityCount}</p>
        </div>
      </div>

      {/* Tickets Table */}
      <AdminDataTable
        columns={columns}
        data={tickets}
        searchPlaceholder="Search tickets by subject, farmer, ID or priority..."
        filterKey="status"
        filterLabel="Status"
        filterOptions={['Open', 'Pending', 'Resolved']}
        emptyTitle="No support tickets found"
      />

      {/* Ticket Conversation Thread Modal (README Section 11C & 11D) */}
      {activeTicket && (
        <AdminDialog onClose={()=>setActiveTicket(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">{activeTicket.id}</span>
                  <StatusBadge variant={activeTicket.priority}>{activeTicket.priority} Priority</StatusBadge>
                  <StatusBadge variant={activeTicket.status}>{activeTicket.status}</StatusBadge>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {activeTicket.subject}
                </h3>
                <span className="text-xs text-slate-500 block">
                  Farmer: <strong className="text-slate-800">{activeTicket.farmerName}</strong> ({activeTicket.farmerId})
                </span>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Conversation Messages Thread */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-[#F8FAF9]">
              {(activeTicket.messages || []).map((msg, idx) => {
                const isAdmin = msg.role === 'Support Admin';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-semibold text-slate-400">
                      <span>{msg.sender}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAdmin
                          ? 'bg-[#15803D] text-white rounded-br-xs shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer & Actions */}
            <div className="p-5 border-t border-slate-200 bg-white space-y-3">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type official reply to farmer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
                <button disabled={handleSendReplySaving}
                  type="submit"
                  className="px-5 py-3 bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >{handleSendReplySaving ? 'Saving...' : <>
                  <Send className="w-4 h-4" />
                  Reply
                </>}</button>
              </form>

              <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Change Status:</span>
                  <button disabled={handleStatusChangeSaving}
                    type="button"
                    onClick={() => handleStatusChange('Resolved')}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100 transition"
                  >{handleStatusChangeSaving ? 'Saving...' : <>
                    Mark as Resolved
                  </>}</button>
                  <button disabled={handleStatusChangeSaving}
                    type="button"
                    onClick={() => handleStatusChange('Open')}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition"
                  >{handleStatusChangeSaving ? 'Saving...' : <>
                    Reopen Ticket
                  </>}</button>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}
