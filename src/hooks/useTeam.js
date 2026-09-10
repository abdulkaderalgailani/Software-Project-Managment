import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTeam() {
  const fetchTeam = useCallback(async (profile) => {
    if (!profile) return { data: null, error: new Error("Profile not loaded") };

    try {
      if (['admin', 'super_supervisor'].includes(profile.role)) {
        // Fetch all profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, internship_start_date, internship_end_date')
          .order('role', { ascending: true })
          .order('full_name', { ascending: true });
        
        return { data, error };
      } 
      
      if (profile.role === 'supervisor') {
        // Fetch their own interns
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, internship_start_date, internship_end_date')
          .eq('supervisor_id', profile.id)
          .order('full_name', { ascending: true });
          
        return { data, error };
      }
      
      if (profile.role === 'intern') {
        // Interns don't supervise anyone, but we can fetch their supervisor's info if they have one
        if (!profile.supervisor_id) {
          return { data: [], error: null }; // No team, no supervisor
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, internship_start_date, internship_end_date')
          .eq('id', profile.supervisor_id)
          .single();
          
        // We wrap the single supervisor in an array so the UI can expect a standard format if needed,
        // or the UI can handle the intern case specifically.
        return { data: data ? [data] : [], error };
      }

      return { data: [], error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, []);

  const fetchPendingUsers = useCallback(async (profile) => {
    if (!profile || profile.role !== 'admin') return { data: null, error: new Error("Unauthorized") };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }, []);

  const approveUser = useCallback(async (userId, role, supervisorId = null) => {
    try {
      const payload = { status: 'active', role };
      if (supervisorId) payload.supervisor_id = supervisorId;

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);
      
      return { error };
    } catch (err) {
      return { error: err };
    }
  }, []);

  const setInternshipDates = useCallback(async (targetInternId, startDate, endDate) => {
    try {
      const { error } = await supabase.rpc('set_internship_dates', {
        target_intern: targetInternId,
        start_date: startDate,
        end_date: endDate
      });
      return { error };
    } catch (err) {
      return { error: err };
    }
  }, []);

  return { fetchTeam, fetchPendingUsers, approveUser, setInternshipDates };
}
