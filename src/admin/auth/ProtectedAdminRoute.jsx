import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

export default function ProtectedAdminRoute({ children }) {
  const { isAdminLoggedIn, loading, authError, refreshAllAdminData, logoutAdmin } = useAdmin();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return <main className="min-h-dvh bg-[#F8FAF9] p-6 flex items-center justify-center">
      <div role="alert" className="w-full max-w-lg rounded-2xl border bg-white p-6 space-y-4">
        <h1 className="text-xl font-bold text-[#1F2937]">Unable to verify admin access</h1>
        <p className="text-sm text-slate-600 break-words">{authError}</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={refreshAllAdminData} className="rounded-lg bg-[#15803D] px-4 py-3 text-white">Retry</button>
          <button onClick={logoutAdmin} className="rounded-lg border px-4 py-3">Return to sign in</button>
        </div>
      </div>
    </main>;
  }

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
