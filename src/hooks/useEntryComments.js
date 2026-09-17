import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useEntryComments() {
  const { user } = useAuth();

  const fetchComments = useCallback(async (entryType, entryId) => {
    if (!entryId || !entryType) return { data: null, error: null };
    const { data, error } = await supabase
      .from('entry_comments')
      .select('*, author:profiles!entry_comments_author_id_fkey(full_name)')
      .eq('entry_type', entryType)
      .eq('entry_id', entryId)
      .order('created_at', { ascending: true });
    return { data, error };
  }, []);

  const addComment = useCallback(async (payload) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('entry_comments')
      .insert({
        ...payload,
        author_id: user.id
      })
      .select()
      .single();

    return { data, error };
  }, [user]);

  return {
    fetchComments,
    addComment,
  };
}
