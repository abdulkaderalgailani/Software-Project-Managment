import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useDiary() {
  const { user } = useAuth();

  const fetchVisibleDiaryEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*, intern:profiles!diary_entries_intern_id_fkey(full_name, email)')
      .order('entry_date', { ascending: false });
    return { data, error };
  }, []);

  const fetchTodayDiary = useCallback(async (userId, entryDate) => {
    if (!userId || !entryDate) return { data: null, error: null };
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('intern_id', userId)
      .eq('entry_date', entryDate)
      .maybeSingle(); // There could be multiple if no unique constraint, but we want today's
    return { data, error };
  }, []);

  const upsertDiary = useCallback(async (payload) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    // Since the schema lacks a unique constraint on (intern_id, entry_date) for diary_entries,
    // we need to pass `id` in the payload if it's an update. If `id` is not present, it will insert.
    // If the schema gets updated with a unique constraint later, this still works if id is present.
    
    // We will ensure `intern_id` is correct.
    const { data, error } = await supabase
      .from('diary_entries')
      .upsert({
        intern_id: user.id,
        ...payload
      })
      .select()
      .single();

    return { data, error };
  }, [user]);

  const updateDiaryEntry = useCallback(async (entryId, payload) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('diary_entries')
      .update(payload)
      .eq('id', entryId)
      .select()
      .single();

    return { data, error };
  }, [user]);

  const deleteDiaryEntry = useCallback(async (entryId) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', entryId);

    return { error };
  }, [user]);

  return {
    fetchVisibleDiaryEntries,
    fetchTodayDiary,
    upsertDiary,
    updateDiaryEntry,
    deleteDiaryEntry,
  };
}
