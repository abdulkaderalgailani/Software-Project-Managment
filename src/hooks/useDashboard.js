import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export function useDashboard() {
  const getTodayDateString = () => format(new Date(), 'yyyy-MM-dd');

  const fetchInternStats = useCallback(async (userId) => {
    if (!userId) return { openTasks: 0, unreadMessages: 0 };
    
    // Count open tasks
    const { count: tasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .neq('status', 'done');

    // Count unread messages
    const { count: msgsCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);

    return {
      openTasks: tasksCount || 0,
      unreadMessages: msgsCount || 0,
    };
  }, []);

  const fetchSupervisorStats = useCallback(async (supervisorId) => {
    if (!supervisorId) return { pendingReviews: 0, interns: [] };
    
    const today = getTodayDateString();

    // Fetch interns under this supervisor
    const { data: internsData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('supervisor_id', supervisorId)
      .eq('role', 'intern');

    let pendingReviews = 0;
    const interns = internsData || [];

    // For each intern, fetch today's progress to check submission status
    if (interns.length > 0) {
      const internIds = interns.map(i => i.id);
      
      const { data: todayProgress } = await supabase
        .from('daily_progress')
        .select('id, intern_id, status')
        .in('intern_id', internIds)
        .eq('entry_date', today);

      const progressMap = {};
      if (todayProgress) {
        todayProgress.forEach(p => {
          progressMap[p.intern_id] = p;
        });
      }

      interns.forEach(intern => {
        intern.todayProgress = progressMap[intern.id] || null;
      });

      // Count pending reviews for these interns (all time, submitted but not reviewed)
      const { count: reviewsCount } = await supabase
        .from('daily_progress')
        .select('*', { count: 'exact', head: true })
        .in('intern_id', internIds)
        .eq('status', 'submitted');
        
      pendingReviews = reviewsCount || 0;
    }

    return { pendingReviews, interns };
  }, []);

  const fetchAdminStats = useCallback(async () => {
    const today = getTodayDateString();

    const { count: totalInterns } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'intern');

    const { count: todaySubmissions } = await supabase
      .from('daily_progress')
      .select('*', { count: 'exact', head: true })
      .eq('entry_date', today);

    const { data: recentActivity } = await supabase
      .from('activity_logs')
      .select('id, action, entity_type, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      totalInterns: totalInterns || 0,
      todaySubmissions: todaySubmissions || 0,
      recentActivity: recentActivity || [],
    };
  }, []);

  return {
    fetchInternStats,
    fetchSupervisorStats,
    fetchAdminStats,
  };
}
