import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';

export function useReports() {
  const { user } = useAuth();

  const fetchVisibleReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*, intern:profiles!weekly_reports_intern_id_fkey(full_name, email)')
      .order('week_start', { ascending: false });
    return { data, error };
  }, []);

  const fetchThisWeekReport = useCallback(async (userId, weekStart) => {
    if (!userId || !weekStart) return { data: null, error: null };
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('intern_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();
    return { data, error };
  }, []);

  const upsertReport = useCallback(async (payload) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('weekly_reports')
      .upsert({
        intern_id: user.id,
        ...payload
      }, {
        onConflict: 'intern_id, week_start'
      })
      .select()
      .single();

    if (!error && data) {
      const action = payload.status === 'submitted' ? 'report.submitted' : 'report.draft_saved';
      await logActivity(user.id, action, 'weekly_report', data.id);
    }

    return { data, error };
  }, [user]);

  const updateReport = useCallback(async (reportId, payload) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('weekly_reports')
      .update(payload)
      .eq('id', reportId)
      .select()
      .single();

    if (!error && data) {
      await logActivity(user.id, 'report.updated', 'weekly_report', data.id);
    }

    return { data, error };
  }, [user]);

  const deleteReport = useCallback(async (reportId) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('weekly_reports')
      .delete()
      .eq('id', reportId);

    if (!error) {
      await logActivity(user.id, 'report.deleted', 'weekly_report', reportId);
    }

    return { error };
  }, [user]);

  return {
    fetchVisibleReports,
    fetchThisWeekReport,
    upsertReport,
    updateReport,
    deleteReport,
  };
}
