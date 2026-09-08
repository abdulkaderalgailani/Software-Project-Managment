import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';

export function useProgress() {
  const { user } = useAuth();
  
  const getTodayDateString = () => format(new Date(), 'yyyy-MM-dd');

  const fetchProgressList = useCallback(async (userId) => {
    if (!userId) return { data: null, error: null };
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('intern_id', userId)
      .order('entry_date', { ascending: false });
    return { data, error };
  }, []);

  const fetchProgressEntry = useCallback(async (id) => {
    if (!id) return { data: null, error: null };
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  }, []);

  const fetchTodayProgress = useCallback(async (userId) => {
    if (!userId) return { data: null, error: null };
    const today = getTodayDateString();
    
    // Using maybeSingle() because it might not exist yet
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('intern_id', userId)
      .eq('entry_date', today)
      .maybeSingle();
      
    return { data, error };
  }, []);

  const upsertProgress = useCallback(async (entryData) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    
    const today = getTodayDateString();
    
    const payload = {
      intern_id: user.id,
      entry_date: today,
      ...entryData,
    };

    const { data, error } = await supabase
      .from('daily_progress')
      .upsert(payload, { onConflict: 'intern_id, entry_date' })
      .select()
      .single();

    if (!error && data) {
      await logActivity(user.id, 'progress.submitted', 'daily_progress', data.id);
    }

    return { data, error };
  }, [user]);

  const updateProgress = useCallback(async (progressId, payload) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('daily_progress')
      .update(payload)
      .eq('id', progressId)
      .select()
      .single();

    if (!error && data) {
      await logActivity(user.id, 'progress.updated', 'daily_progress', data.id);
    }

    return { data, error };
  }, [user]);

  const deleteProgress = useCallback(async (progressId) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('daily_progress')
      .delete()
      .eq('id', progressId);

    if (!error) {
      await logActivity(user.id, 'progress.deleted', 'daily_progress', progressId);
    }

    return { error };
  }, [user]);

  const fetchAllVisibleProgress = useCallback(async () => {
    // No intern_id filter — RLS can_view_intern policy controls visibility.
    // Supervisors see their interns; super_supervisor/admin see everyone.
    const { data, error } = await supabase
      .from('daily_progress')
      .select('*, intern:profiles!daily_progress_intern_id_fkey(full_name, email)')
      .order('entry_date', { ascending: false });
    return { data, error };
  }, []);

  const fetchReviews = useCallback(async (progressId) => {
    if (!progressId) return { data: null, error: null };
    const { data, error } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name)')
      .eq('progress_id', progressId)
      .order('created_at', { ascending: true });
    return { data, error };
  }, []);

  const addReview = useCallback(async (progressId, comment) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          progress_id: progressId,
          reviewer_id: user.id,
          comment,
        }
      ])
      .select()
      .single();
    
    if (!error && data) {
      await logActivity(user.id, 'review.added', 'reviews', data.id);
    }

    return { data, error };
  }, [user]);

  return {
    fetchProgressList,
    fetchAllVisibleProgress,
    fetchProgressEntry,
    fetchTodayProgress,
    upsertProgress,
    updateProgress,
    deleteProgress,
    fetchReviews,
    addReview,
  };
}
