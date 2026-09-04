import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { Users, FileCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SupervisorDashboard() {
  const { user } = useAuth();
  const { fetchSupervisorStats } = useDashboard();
  
  const [data, setData] = useState({ pendingReviews: 0, interns: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      const stats = await fetchSupervisorStats(user.id);
      setData(stats);
      setLoading(false);
    }
    loadData();
  }, [user, fetchSupervisorStats]);

  if (loading) return <div className="text-muted">Loading dashboard...</div>;

  return (
    <div className="space-y-4 max-w-5xl">
      <h2 className="text-2xl font-bold text-text">Supervisor Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface px-5 py-4 rounded-2xl shadow-sm border border-border flex items-center gap-4">
          <div className="p-4 bg-brand-tint text-brand rounded-full">
            <FileCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-text">Pending Reviews</h3>
            <p className="text-3xl font-bold text-text">{data.pendingReviews}</p>
          </div>
        </div>
        
        {/* Metric: Total Interns */}
        <div className="bg-surface px-5 py-4 rounded-2xl shadow-sm border border-border flex items-center gap-4">
          <div className="p-4 bg-surface text-muted rounded-full">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-text">My Interns</h3>
            <p className="text-3xl font-bold text-text">{data.interns.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-text">Today's Submissions</h3>
        </div>
        
        {data.interns.length === 0 ? (
          <div className="px-5 py-4 text-center text-muted">No interns assigned to you.</div>
        ) : (
          <div className="divide-y divide-border">
            {data.interns.map(intern => (
              <div key={intern.id} className="px-5 py-4 flex items-center justify-between hover:bg-hover-bg transition-colors border-l-4 border-l-brand-500">
                <div>
                  <p className="font-medium text-text">{intern.full_name}</p>
                  <p className="text-sm text-muted">{intern.email}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {intern.todayProgress ? (
                    <span className="flex items-center gap-1 text-sm font-medium text-success bg-success/10 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" /> Submitted
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm font-medium text-muted bg-surface px-3 py-1 rounded-full">
                      <AlertCircle className="w-4 h-4" /> Not Yet
                    </span>
                  )}
                  {intern.todayProgress && (
                    <Link 
                      to={`/progress/${intern.todayProgress.id}`}
                      className="text-brand hover:text-brand text-sm font-medium ml-4"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
