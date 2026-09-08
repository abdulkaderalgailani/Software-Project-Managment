import React, { useEffect, useState } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { Users, FileText, Activity } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { getActionDetails } from '../../lib/activityLogger';

export function AdminDashboard() {
  const { fetchAdminStats } = useDashboard();
  
  const [data, setData] = useState({ totalInterns: 0, todaySubmissions: 0, recentActivity: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const stats = await fetchAdminStats();
      setData(stats);
      setLoading(false);
    }
    loadData();
  }, [fetchAdminStats]);

  if (loading) return <div className="text-muted">Loading dashboard...</div>;

  return (
    <div className="space-y-4 max-w-5xl">
      <h2 className="text-2xl font-bold text-text">Org Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Metric: Total Interns */}
        <div className="bg-surface px-5 py-4 rounded-2xl shadow-sm border border-border flex items-center gap-4">
          <div className="p-4 bg-brand-tint text-brand rounded-full">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-text">Total Interns</h3>
            <p className="text-3xl font-bold text-text">{data.totalInterns}</p>
          </div>
        </div>
        
        {/* Metric: Today's Submissions */}
        <div className="bg-surface px-5 py-4 rounded-2xl shadow-sm border border-border flex items-center gap-4">
          <div className="p-4 bg-surface text-muted rounded-full">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-text">Today's Submissions</h3>
            <p className="text-3xl font-bold text-text">{data.todaySubmissions}</p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand" />
          <h3 className="text-lg font-bold text-text">Recent Activity</h3>
        </div>
        
        {data.recentActivity.length === 0 ? (
          <div className="px-5 py-4 text-center text-muted">No recent activity found.</div>
        ) : (
          <div className="divide-y divide-border">
            {data.recentActivity.map(log => {
              const details = getActionDetails(log.action, log.entity_type);
              const Icon = details.icon;
              return (
                <div key={log.id} className="px-5 py-4 flex items-center justify-between hover:bg-hover-bg transition-colors border-l-4 border-l-brand-500">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full bg-surface ${details.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-text text-sm">
                        <span className="font-bold text-text">{log.profiles?.full_name || 'System'}</span>
                        {' '}
                        {details.text}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted">
                    {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
