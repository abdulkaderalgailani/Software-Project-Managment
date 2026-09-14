import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../hooks/useTeam';
import { Users, Mail, User, Shield, ShieldAlert, Calendar } from 'lucide-react';
import { InternProgress } from '../components/ui/InternProgress';
import { Modal } from '../components/ui/Modal';

export default function Team() {
  const { profile } = useAuth();
  const { fetchTeam, fetchPendingUsers, approveUser, setInternshipDates, assignSupervisor } = useTeam();
  
  const [team, setTeam] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'approvals'
  const [editingDatesUser, setEditingDatesUser] = useState(null);
  const [assigningSupervisorUser, setAssigningSupervisorUser] = useState(null);

  const isAdmin = profile?.role === 'admin';
  const canSetDates = ['admin', 'super_supervisor', 'supervisor'].includes(profile?.role);
  
  const supervisorsList = team.filter(u => ['supervisor', 'super_supervisor'].includes(u.role));

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

  const getSupervisorName = (supervisorId) => {
    if (!supervisorId) return 'Unassigned';
    const sup = team.find(u => u.id === supervisorId);
    return sup ? sup.full_name : 'Unassigned';
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
                <div key={user.id} className="bg-surface p-5 rounded-xl shadow-sm border border-border flex flex-col gap-3 overflow-hidden">
                  <div className="min-w-0">
                    <h3 className="font-bold text-text text-lg truncate" title={user.full_name}>{user.full_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted mt-1 min-w-0">
                      <Mail className="w-4 h-4 flex-shrink-0" /> 
                      <span className="truncate" title={user.email}>{user.email}</span>
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
                className="bg-surface p-5 rounded-xl shadow-sm border border-border flex flex-col gap-3 hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text text-lg truncate" title={member.full_name}>{member.full_name}</h3>
                  </div>
                  {['admin', 'super_supervisor'].includes(profile.role) && (
                    <div className="flex-shrink-0 ml-2">
                      {renderRoleBadge(member.role)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted min-w-0">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href={`mailto:${member.email}`} className="truncate hover:text-brand transition-colors" title={member.email}>
                    {member.email}
                  </a>
                </div>

                {member.role === 'intern' && (
                  <div className="mt-auto pt-3 border-t border-border">
                    {isAdmin && (
                      <div className="mb-3 text-sm flex items-center justify-between">
                        <span className="text-muted">Supervisor:</span>
                        <span className="font-medium text-text truncate ml-2" title={getSupervisorName(member.supervisor_id)}>
                          {getSupervisorName(member.supervisor_id)}
                        </span>
                      </div>
                    )}
                    <InternProgress 
                      startDate={member.internship_start_date} 
                      endDate={member.internship_end_date} 
                      compact 
                    />
                    {canSetDates && (
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingDatesUser(member)}
                          className="flex-1 text-xs font-bold text-text bg-surface-nested border border-border hover:bg-hover-bg py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Calendar className="w-3 h-3" /> Edit Dates
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setAssigningSupervisorUser(member)}
                            className="flex-1 text-xs font-bold text-text bg-surface-nested border border-border hover:bg-hover-bg py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <User className="w-3 h-3" /> Assign Sup.
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {editingDatesUser && (
        <EditDatesModal 
          user={editingDatesUser} 
          onClose={() => setEditingDatesUser(null)} 
          setInternshipDates={setInternshipDates}
          onSuccess={() => {
            setEditingDatesUser(null);
            loadData();
          }}
        />
      )}

      {assigningSupervisorUser && (
        <AssignSupervisorModal
          user={assigningSupervisorUser}
          supervisors={supervisorsList}
          actorId={profile.id}
          onClose={() => setAssigningSupervisorUser(null)}
          assignSupervisor={assignSupervisor}
          onSuccess={() => {
            setAssigningSupervisorUser(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function AssignSupervisorModal({ user, supervisors, actorId, onClose, onSuccess, assignSupervisor }) {
  const [supervisorId, setSupervisorId] = useState(user.supervisor_id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const targetSupervisor = supervisorId || null;
    const { error: assignError } = await assignSupervisor(user.id, targetSupervisor, actorId);
    
    setLoading(false);
    if (assignError) {
      setError(assignError.message);
    } else {
      onSuccess();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Assign Supervisor: ${user.full_name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-text mb-1">Select Supervisor</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={supervisorId}
            onChange={(e) => setSupervisorId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {supervisors.map(sup => (
              <option key={sup.id} value={sup.id}>
                {sup.full_name} ({sup.role === 'super_supervisor' ? 'Super Sup.' : 'Supervisor'})
              </option>
            ))}
          </select>
        </div>
        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-text bg-surface border border-border hover:bg-hover-bg rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-medium text-white bg-brand hover:opacity-90 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditDatesModal({ user, onClose, onSuccess, setInternshipDates }) {
  const [startDate, setStartDate] = useState(user.internship_start_date || '');
  const [endDate, setEndDate] = useState(user.internship_end_date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: rpcError } = await setInternshipDates(user.id, startDate || null, endDate || null);
    
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
    } else {
      onSuccess();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit Dates: ${user.full_name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">End Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-text bg-surface border border-border hover:bg-hover-bg rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-medium text-white bg-brand hover:opacity-90 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Dates'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
