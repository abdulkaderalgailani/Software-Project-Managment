import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { useProgress } from '../../hooks/useProgress';
import { CheckCircle, AlertCircle, FileText, MessageSquare } from 'lucide-react';

export function InternDashboard() {
  const { user } = useAuth();
  const { fetchInternStats } = useDashboard();
  const { fetchTodayProgress } = useProgress();
  
  const [stats, setStats] = useState({ openTasks: 0, unreadMessages: 0 });
  const [todayStatus, setTodayStatus] = useState(null); // 'submitted' | 'missing' | 'loading'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      
      const statsData = await fetchInternStats(user.id);
      setStats(statsData);

      const { data: progressData } = await fetchTodayProgress(user.id);
      setTodayStatus(progressData ? progressData.status : 'missing');
      
      setLoading(false);
    }
    loadData();
  }, [user, fetchInternStats, fetchTodayProgress]);

  if (loading) return <div className="text-muted">Loading dashboard...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-text">Intern Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Status */}
        <div className="bg-surface px-5 py-4 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text">Today's Progress</h3>
              {todayStatus === 'missing' ? (
                <AlertCircle className="text-brand w-6 h-6" />
              ) : (
                <CheckCircle className="text-success w-6 h-6" />
              )}
            </div>
            <p className="text-muted mb-6">
              {todayStatus === 'missing' 
                ? "You haven't submitted your progress for today." 
                : "Your progress for today has been logged."}
            </p>
          </div>
          <Link 
            to="/progress" 
            className="text-center bg-brand text-white hover:opacity-90 rounded-xl py-2 font-medium transition-colors"
          >
            {todayStatus === 'missing' ? 'Add Progress' : 'Edit Progress'}
          </Link>
        </div>

        {/* Tasks */}
        <div className="bg-surface px-5 py-4 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-text">Open Tasks</h3>
            <FileText className="text-muted w-6 h-6" />
          </div>
          <p className="text-4xl font-bold text-text mb-4">{stats.openTasks}</p>
          <Link to="/tasks" className="text-brand hover:text-brand text-sm font-medium">
            View Tasks &rarr;
          </Link>
        </div>

        {/* Messages */}
        <div className="bg-surface px-5 py-4 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-text">Unread Messages</h3>
            <MessageSquare className="text-muted w-6 h-6" />
          </div>
          <p className="text-4xl font-bold text-text mb-4">{stats.unreadMessages}</p>
          <Link to="/messages" className="text-brand hover:text-brand text-sm font-medium">
            Go to Messages &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
