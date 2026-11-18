import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';

export function useMessages() {
  const { user } = useAuth();

  // 1. Fetch 1-to-1 contacts, strictly filtering out admin for all roles
  const fetchContacts = useCallback(async () => {
    if (!user) return { data: null, error: null };
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .neq('id', user.id)
      .neq('role', 'admin')
      .order('full_name');
    
    // Explicit client-side safety filter to guarantee no admin appears
    const filtered = data ? data.filter(p => p.role !== 'admin') : null;
    return { data: filtered, error };
  }, [user]);

  // 2. Fetch conversations the current user belongs to (RLS limits to member conversations)
  const fetchConversations = useCallback(async () => {
    if (!user) return { data: null, error: null };
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: true });
    return { data, error };
  }, [user]);

  // 3. Fetch all profiles for sender name resolution in group messages
  const fetchAllProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role');
    return { data, error };
  }, []);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return { data: {}, error: null };
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('recipient_id', user.id)
      .is('read_at', null);
      
    const counts = {};
    if (data) {
      data.forEach(msg => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });
    }
    return { data: counts, error };
  }, [user]);

  const fetchMessages = useCallback(async (otherUserId) => {
    if (!user || !otherUserId) return { data: null, error: null };
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    return { data, error };
  }, [user]);

  const fetchGroupMessages = useCallback(async (conversationId) => {
    if (!user || !conversationId) return { data: null, error: null };
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    return { data, error };
  }, [user]);

  const sendMessage = useCallback(async (recipientId, content) => {
    if (!user || !recipientId) return { data: null, error: new Error('Missing user or recipient') };
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: user.id,
        recipient_id: recipientId,
        content
      }])
      .select()
      .single();
      
    if (!error && data) {
      await logActivity(user.id, 'message.sent', 'message', data.id);
    }
    
    return { data, error };
  }, [user]);

  const sendGroupMessage = useCallback(async (conversationId, content) => {
    if (!user || !conversationId) return { data: null, error: new Error('Missing user or conversation') };
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: user.id,
        conversation_id: conversationId,
        content
      }])
      .select()
      .single();
      
    if (!error && data) {
      await logActivity(user.id, 'message.sent', 'message', data.id);
    }
    
    return { data, error };
  }, [user]);

  const markAsRead = useCallback(async (otherUserId) => {
    if (!user || !otherUserId) return;
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', otherUserId)
      .eq('recipient_id', user.id)
      .is('read_at', null);
    return { error };
  }, [user]);

  const subscribeToConversation = useCallback((conversationId, callback) => {
    if (!user || !conversationId) return () => {};

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (payload.new && payload.new.conversation_id === conversationId) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const subscribeToMessages = useCallback((callback) => {
    if (!user) return () => {};

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Filter client-side: only DM messages involving the current user
          if (
            payload.new && 
            !payload.new.conversation_id &&
            (payload.new.recipient_id === user.id || payload.new.sender_id === user.id)
          ) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    fetchContacts,
    fetchConversations,
    fetchAllProfiles,
    fetchUnreadCounts,
    fetchMessages,
    fetchGroupMessages,
    sendMessage,
    sendGroupMessage,
    markAsRead,
    subscribeToConversation,
    subscribeToMessages,
  };
}
