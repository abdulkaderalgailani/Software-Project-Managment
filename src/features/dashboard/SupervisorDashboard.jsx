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
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-2xl font-bold text-ink">Supervisor Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metric: Pending Reviews */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border flex items-center gap-4">
          <div className="p-4 bg-brand-50 text-brand-500 rounded-full">
            <FileCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-ink">Pending Reviews</h3>
            <p className="text-3xl font-bold text-ink">{data.pendingReviews}</p>
          </div>
        </div>
        
        {/* Metric: Total Interns */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border flex items-center gap-4">
          <div className="p-4 bg-surface text-muted rounded-full">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-ink">My Interns</h3>
            <p className="text-3xl font-bold text-ink">{data.interns.length}</p>
          </div>
        </div>
      </div>

      {/* Interns List */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-ink">Today's Submissions</h3>
        </div>
        
        {data.interns.length === 0 ? (
          <div className="p-6 text-center text-muted">No interns assigned to you.</div>
        ) : (
          <div className="divide-y divide-border">
            {data.interns.map(intern => (
              <div key={intern.id} className="p-4 flex items-center justify-between hover:bg-surface transition-colors">
                <div>
                  <p className="font-medium text-ink">{intern.full_name}</p>
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
                      className="text-brand-600 hover:text-brand-700 text-sm font-medium ml-4"
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
