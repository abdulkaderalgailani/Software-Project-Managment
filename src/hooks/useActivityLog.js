import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useActivityLog() {
  const { user } = useAuth();

  const fetchLogs = useCallback(async () => {
    if (!user) return { data: null, error: null };
    
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, action, entity_type, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(50);
      
    return { data, error };
  }, [user]);

  return { fetchLogs };
}
