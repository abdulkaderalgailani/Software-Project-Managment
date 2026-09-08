import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export function AuthGuard() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login if there is no session
    return <Navigate to="/login" replace />;
  }

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-page-bg">
        <div className="bg-surface p-8 rounded-xl shadow-md border border-border w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-text">Account Pending</h2>
          <p className="text-muted mb-6">
            Your account is currently awaiting approval from an administrator. 
            Please check back later or contact support.
          </p>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="text-brand hover:opacity-90 font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Render children (outlet) if authenticated
  return <Outlet />;
}
