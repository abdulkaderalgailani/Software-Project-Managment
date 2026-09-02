import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';

export function useTasks() {
  const { user, profile } = useAuth();

  const fetchTasks = useCallback(async () => {
    // RLS will automatically filter to tasks assigned_to or assigned_by user
    // or all tasks if super_supervisor/admin.
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name, email), assigner:profiles!tasks_assigned_by_fkey(full_name, email)')
      .order('created_at', { ascending: false });
    
    return { data, error };
  }, []);

  const fetchAssignableInterns = useCallback(async () => {
    if (!profile) return { data: [], error: null };
    
    let query = supabase.from('profiles').select('id, full_name, email').eq('role', 'intern');
    
    if (profile.role === 'supervisor') {
      query = query.eq('supervisor_id', user.id);
    }
    // If admin/super_supervisor, they can assign to any intern
    
    const { data, error } = await query.order('full_name');
    return { data, error };
  }, [profile, user]);

  const createTask = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          ...payload,
          assigned_by: user.id,
        }
      ])
      .select()
      .single();
    
    if (!error && data) {
      await logActivity(user.id, 'task.created', 'task', data.id);
    }
    
    return { data, error };
  }, [user]);

  const updateTaskStatus = useCallback(async (taskId, status) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)
      .select()
      .single();
      
    if (!error && data) {
      await logActivity(user.id, 'task.status_changed', 'task', taskId, { new_status: status });
    }
      
    return { data, error };
  }, []);

  return {
    fetchTasks,
    fetchAssignableInterns,
    createTask,
    updateTaskStatus,
  };
}
