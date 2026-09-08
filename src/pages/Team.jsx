import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../hooks/useTeam';
import { Users, Mail, User, Shield, ShieldAlert } from 'lucide-react';

export default function Team() {
  const { profile } = useAuth();
  const { fetchTeam, fetchPendingUsers, approveUser } = useTeam();
  
  const [team, setTeam] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'approvals'

  const isAdmin = profile?.role === 'admin';

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    
    const { data: teamData, error: fetchError } = await fetchTeam(profile);
    
    if (fetchError) {
      setError(fetchError.message);
    } else if (teamData) {
      setTeam(teamData);
    }

    if (isAdmin) {
      const { data: pendingData } = await fetchPendingUsers(profile);
      if (pendingData) setPendingUsers(pendingData);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleApprove = async (userId, role) => {
    if (window.confirm(`Approve user as ${role}?`)) {
      setLoading(true);
      const { error } = await approveUser(userId, role);
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        loadData();
      }
    }
  };

  // Helper to render role badge
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="flex items-center gap-1 text-xs font-bold bg-danger/10 text-danger px-2 py-1 rounded-full uppercase tracking-wider">
            <ShieldAlert className="w-3 h-3" /> Admin
          </span>
        );
      case 'super_supervisor':
        return (
          <span className="flex items-center gap-1 text-xs font-bold bg-purple-500/10 text-purple-600 px-2 py-1 rounded-full uppercase tracking-wider">
            <Shield className="w-3 h-3" /> Super Sup.
          </span>
        );
      case 'supervisor':
        return (
          <span className="flex items-center gap-1 text-xs font-bold bg-brand-tint text-brand px-2 py-1 rounded-full uppercase tracking-wider">
            <User className="w-3 h-3" /> Supervisor
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold bg-surface text-muted px-2 py-1 rounded-full uppercase tracking-wider border border-border">
            Intern
          </span>
        );
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-5xl space-y-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-brand" />
          <h2 className="text-2xl font-bold text-text">
            {['admin', 'super_supervisor'].includes(profile.role) ? 'Organization Directory' : 'My Team'}
          </h2>
        </div>
        
        {isAdmin && (
          <div className="flex bg-surface-nested p-1 rounded-xl border border-border shadow-sm">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'directory' 
                  ? 'bg-surface text-text shadow-sm' 
                  : 'text-muted hover:text-text'
              }`}
            >
              Directory
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'approvals' 
                  ? 'bg-brand text-white shadow-sm' 
                  : 'text-muted hover:text-text'
              }`}
            >
              Pending Approvals
              {pendingUsers.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'approvals' ? 'bg-white/20' : 'bg-brand text-white'
                }`}>
                  {pendingUsers.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-danger/10 text-danger p-4 rounded-xl text-sm font-medium">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="bg-surface p-5 rounded-xl shadow-sm border border-border text-muted">
          Loading data...
        </div>
      ) : profile.role === 'intern' ? (
        <div className="bg-surface p-8 rounded-xl shadow-sm border border-border text-center">
          <div className="mx-auto bg-surface w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-xl font-bold text-text mb-2">You don't have a team view</h3>
          <p className="text-muted max-w-md mx-auto">
            Interns do not supervise other team members. 
            {team.length > 0 && team[0] && (
              <span className="block mt-4 text-text font-medium">
                Your assigned supervisor is: <span className="text-brand">{team[0].full_name}</span>
              </span>
            )}
          </p>
        </div>
      ) : activeTab === 'approvals' && isAdmin ? (
        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="bg-surface p-8 rounded-xl shadow-sm border border-border text-center text-muted">
              No pending approvals.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingUsers.map(user => (
                <div key={user.id} className="bg-surface p-5 rounded-xl shadow-sm border border-border flex flex-col gap-3">
                  <div>
                    <h3 className="font-bold text-text text-lg">{user.full_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted mt-1">
                      <Mail className="w-4 h-4" /> {user.email}
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-3 border-t border-border flex gap-2">
                    <button 
                      onClick={() => handleApprove(user.id, 'intern')}
                      className="flex-1 bg-surface-nested hover:bg-hover-bg text-text text-sm font-bold py-2 rounded-lg border border-border transition-colors"
                    >
                      Approve Intern
                    </button>
                    <button 
                      onClick={() => handleApprove(user.id, 'supervisor')}
                      className="flex-1 bg-brand text-white text-sm font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Approve Sup.
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.length === 0 ? (
            <div className="col-span-full bg-surface p-8 rounded-xl shadow-sm border border-border text-center text-muted">
              No team members found.
            </div>
          ) : (
            team.map((member) => (
              <div 
                key={member.id} 
                className="bg-surface p-5 rounded-xl shadow-sm border border-border flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-text text-lg line-clamp-1">{member.full_name}</h3>
                  </div>
                  {['admin', 'super_supervisor'].includes(profile.role) && (
                    <div className="flex-shrink-0 ml-2">
                      {renderRoleBadge(member.role)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted mt-auto">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href={`mailto:${member.email}`} className="truncate hover:text-brand transition-colors">
                    {member.email}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
