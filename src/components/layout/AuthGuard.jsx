import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function AuthGuard() {
  const { session, loading } = useAuth();

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

  // Render children (outlet) if authenticated
  return <Outlet />;
}
