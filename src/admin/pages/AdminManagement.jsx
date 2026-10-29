import ResponsiveRecords from '../components/ResponsiveRecords';
import AdminDialog from '../components/AdminDialog';
import React, { useState } from 'react';
import { Plus, Phone } from '../../components/common/Icons';
import { useAdmin } from '../context/AdminContext';
import StatusBadge from '../components/StatusBadge';

export default function AdminManagement() {
  const { adminStaff, addAdminStaff, toggleAdminStatus, currentAdmin } = useAdmin();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Support Admin'
  });

  const handleCreate = (e) => {
    e.preventDefault();
    addAdminStaff({
      ...form,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    });
    alert(`Administrator account created for ${form.name} (${form.role}).`);
    setIsAddOpen(false);
    setForm({ name: '', email: '', phone: '', role: 'Support Admin' });
  };

  const handleToggle = (staff) => {
    if (staff.id === currentAdmin?.id) {
      alert('You cannot suspend your own active administrator account.');
      return;
    }
    toggleAdminStatus(staff.id);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Administrative Team & Role RBAC
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Super Admin control center to invite platform administrators and restrict permissions by role.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-[#15803D] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Administrator
        </button>
      </div>

      {/* Role Descriptions Grid (README Section 13A) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[
          { role: 'Super Admin', desc: 'Full unrestricted platform access, pricing, and admin invitations.' },
          { role: 'Platform Admin', desc: 'Farmers, farms directory, and poultry category management.' },
          { role: 'Finance Admin', desc: 'Subscription plans, Paystack reconciliation, and receipts.' },
          { role: 'Support Admin', desc: 'Customer support tickets, responses, and farmer notifications.' },
          { role: 'Content Admin', desc: 'Public landing page content management.' }
        ].map((r, i) => (
          <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-black text-slate-900 block mb-1">{r.role}</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Admin Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-extrabold text-slate-900">
            Platform Administrators ({adminStaff.length})
          </h2>
          <span className="text-xs font-semibold text-slate-400">Encrypted Role Verification</span>
        </div>

        <div className="overflow-x-auto">
          <ResponsiveRecords><table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Administrator</th>
                <th className="px-6 py-3.5">Administrative Role</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">Last Login</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {adminStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {staff.avatar ? (
                        <img
                          src={staff.avatar}
                          alt={staff.name}
                          className="w-9 h-9 rounded-xl object-cover shrink-0 border border-emerald-600/30"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {staff.name[0]}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{staff.name}</span>
                        <span className="text-[11px] text-slate-400">{staff.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="text-slate-800 font-medium block">{staff.phone}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {staff.lastLogin}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge variant={staff.status}>{staff.status}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggle(staff)}
                      disabled={staff.id === currentAdmin?.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed ${
                        staff.status === 'Active'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {staff.status === 'Active' ? 'Suspend Access' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></ResponsiveRecords>
        </div>
      </div>

      {/* Invite Admin Modal (README Section 13B) */}
      {isAddOpen && (
        <AdminDialog onClose={()=>setIsAddOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-3">
              <h3 className="text-lg font-extrabold text-slate-900">Invite Platform Administrator</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Segun Ogundimu"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="segun@poultrypro.ng"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+234 803 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Administrative Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <option value="Platform Admin">Platform Admin (Farmers & Farms)</option>
                  <option value="Finance Admin">Finance Admin (Subscriptions & Payments)</option>
                  <option value="Support Admin">Support Admin (Tickets & Assistance)</option>
                  <option value="Content Admin">Content Admin (Website CMS)</option>
                  <option value="Super Admin">Super Admin (Full Platform Master)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#15803D] hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Confirm & Create Admin
                </button>
              </div>
            </form>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}
