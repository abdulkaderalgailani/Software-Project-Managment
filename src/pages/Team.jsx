import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../hooks/useTeam';
import { Users, Mail, User, Shield, ShieldAlert } from 'lucide-react';

export default function Team() {
  const { profile } = useAuth();
  const { fetchTeam } = useTeam();
  
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTeam() {
      if (!profile) return;
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await fetchTeam(profile);
      
      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setTeam(data);
      }
      setLoading(false);
    }
    
    loadTeam();
  }, [profile, fetchTeam]);

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
          <span className="flex items-center gap-1 text-xs font-bold bg-brand-50 text-brand-600 px-2 py-1 rounded-full uppercase tracking-wider">
            <User className="w-3 h-3" /> Supervisor
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold bg-surface text-muted px-2 py-1 rounded-full uppercase tracking-wider">
            Intern
          </span>
        );
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-brand-500" />
        <h2 className="text-2xl font-bold text-ink">
          {['admin', 'super_supervisor'].includes(profile.role) ? 'Organization Directory' : 'My Team'}
        </h2>
      </div>

      {error && (
        <div className="bg-danger/10 text-danger p-4 rounded-xl text-sm font-medium">
          Error loading team: {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border text-muted">
          Loading team data...
        </div>
      ) : profile.role === 'intern' ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-border text-center">
          <div className="mx-auto bg-surface w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">You don't have a team view</h3>
          <p className="text-muted max-w-md mx-auto">
            Interns do not supervise other team members. 
            {team.length > 0 && team[0] && (
              <span className="block mt-4 text-ink font-medium">
                Your assigned supervisor is: <span className="text-brand-600">{team[0].full_name}</span>
              </span>
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl shadow-sm border border-border text-center text-muted">
              No team members found.
            </div>
          ) : (
            team.map((member) => (
              <div 
                key={member.id} 
                className="bg-white p-5 rounded-xl shadow-sm border border-border flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-ink text-lg line-clamp-1">{member.full_name}</h3>
                  </div>
                  {/* For admin/super, we show roles. For supervisor, they only see interns anyway, but we can still show the badge. */}
                  {['admin', 'super_supervisor'].includes(profile.role) && (
                    <div className="flex-shrink-0 ml-2">
                      {renderRoleBadge(member.role)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted mt-auto">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href={`mailto:${member.email}`} className="truncate hover:text-brand-600 transition-colors">
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
