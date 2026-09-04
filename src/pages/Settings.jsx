import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="bg-surface p-5 rounded-xl shadow-sm border border-border max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium border-b border-border pb-2 mb-4">Profile Information</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-muted w-24 inline-block">Name:</span> {profile?.full_name}</p>
            <p><span className="font-medium text-muted w-24 inline-block">Email:</span> {profile?.email}</p>
            <p><span className="font-medium text-muted w-24 inline-block">Role:</span> <span className="capitalize">{profile?.role}</span></p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium border-b border-border pb-2 mb-4">Account Actions</h3>
          <button
            onClick={handleSignOut}
            className="bg-surface text-text border border-border hover:bg-hover-bg px-4 py-2 rounded-xl font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
