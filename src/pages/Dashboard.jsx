import React from 'react';
import { useAuth } from '../context/AuthContext';
import { InternDashboard } from '../features/dashboard/InternDashboard';
import { SupervisorDashboard } from '../features/dashboard/SupervisorDashboard';
import { AdminDashboard } from '../features/dashboard/AdminDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  if (!profile) {
    return <div className="text-muted">Loading profile...</div>;
  }

  // Render the appropriate dashboard based on user role
  switch (profile.role) {
    case 'intern':
      return <InternDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'super_supervisor':
    case 'admin':
      return <AdminDashboard />;
    default:
      return <div className="text-danger">Unknown role: {profile.role}</div>;
  }
}
