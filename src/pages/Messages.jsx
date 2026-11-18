import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Send, User, Users, MessageSquare } from 'lucide-react';

export default function Messages() {
  const { user, profile } = useAuth();
  const isGuest = profile?.role === 'guest';
  const { 
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
    subscribeToMessages 
  } = useMessages();

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Initial Load: Conversations, Contacts, Profiles & Unread Counts
  useEffect(() => {
    async function init() {
      setLoading(true);
      const [
        { data: contactsData }, 
        { data: countsData },
        { data: convsData },
        { data: profilesData }
      ] = await Promise.all([
        fetchContacts(),
        fetchUnreadCounts(),
        fetchConversations(),
        fetchAllProfiles()
      ]);

      if (contactsData) setContacts(contactsData);
      if (countsData) setUnreadCounts(countsData);
      if (convsData) setConversations(convsData);

      const map = {};
      if (profilesData) {
        profilesData.forEach(p => {
          map[p.id] = p;
        });
      }
      if (user && profile) {
        map[user.id] = profile;
      }
      setProfilesMap(map);

      setLoading(false);
    }
    init();
  }, [fetchContacts, fetchUnreadCounts, fetchConversations, fetchAllProfiles, user, profile]);

  // 2. Load Messages when Active Chat changes
  useEffect(() => {
    async function loadThread() {
      if (!activeChat) {
        setMessages([]);
        return;
      }

      if (activeChat.isGroup) {
        const { data } = await fetchGroupMessages(activeChat.id);
        if (data) setMessages(data);
      } else {
        const { data } = await fetchMessages(activeChat.id);
        if (data) setMessages(data);

        // Mark as read if there were unread messages from them
        if (unreadCounts[activeChat.id] > 0) {
          await markAsRead(activeChat.id);
          setUnreadCounts(prev => ({ ...prev, [activeChat.id]: 0 }));
        }
      }
      scrollToBottom();
    }
    loadThread();
  }, [activeChat, fetchGroupMessages, fetchMessages, markAsRead]); // intentional omission of unreadCounts to avoid loop

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Setup Realtime Subscription for Active Chat (with cleanup on switch / unmount)
  useEffect(() => {
    if (!activeChat) return;

    let unsubscribe;

    if (activeChat.isGroup) {
      unsubscribe = subscribeToConversation(activeChat.id, (newMsg) => {
        // If sender profile not yet cached, dynamically fetch it
        if (newMsg.sender_id && !profilesMap[newMsg.sender_id]) {
          supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', newMsg.sender_id)
            .single()
            .then(({ data }) => {
              if (data) {
                setProfilesMap(prev => ({ ...prev, [data.id]: data }));
              }
            });
        }

        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });
    } else {
      unsubscribe = subscribeToMessages((newMsg) => {
        if (
          !newMsg.conversation_id &&
          (newMsg.sender_id === activeChat.id || newMsg.recipient_id === activeChat.id)
        ) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (newMsg.recipient_id === user?.id) {
            markAsRead(activeChat.id);
          }
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeChat, user?.id, subscribeToConversation, subscribeToMessages, markAsRead, profilesMap]);

  // 4. Global DM unread listener (updates badges when DM arrives while in other chats)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`dm-unread-global:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const msg = payload.new;
          if (msg && !msg.conversation_id && msg.recipient_id === user.id) {
            // If sender is not the currently active 1-to-1 chat, increment unread count
            if (!activeChat || activeChat.isGroup || activeChat.id !== msg.sender_id) {
              setUnreadCounts(prev => ({
                ...prev,
                [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !activeChat) return;

    setSending(true);
    let res;
    if (activeChat.isGroup) {
      res = await sendGroupMessage(activeChat.id, content);
    } else {
      res = await sendMessage(activeChat.id, content);
    }

    if (!res.error) {
      setNewMessage('');
      if (res.data) {
        setMessages(prev => {
          if (prev.some(m => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
      }
    }
    setSending(false);
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border flex h-[calc(100vh-4rem)] overflow-hidden">
      
      {/* Left sidebar: Groups and Contacts List */}
      <div className="w-1/3 border-r border-border flex flex-col bg-surface">
        <div className="p-4 border-b border-border bg-surface">
          <h2 className="text-xl font-bold text-text">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-muted text-sm">Loading chats...</div>
          ) : (
            <div className="divide-y divide-border">
              {/* Group Conversations (rendered ABOVE 1-to-1 contacts) */}
              {conversations.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider bg-surface-nested/40">
                    Groups
                  </div>
                  {conversations.map(conv => {
                    const isActive = activeChat?.isGroup && activeChat?.id === conv.id;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setActiveChat({ id: conv.id, name: conv.name || 'Team', isGroup: true })}
                        className={`w-full text-left p-4 flex items-center justify-between transition-colors ${
                          isActive ? 'bg-brand-tint' : 'hover:bg-hover-bg'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-2 rounded-full flex-shrink-0 ${isActive ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-semibold truncate ${isActive ? 'text-brand' : 'text-text'}`}>
                              {conv.name || 'Team'}
                            </p>
                            <p className={`text-xs truncate ${isActive ? 'text-brand/80' : 'text-muted'}`}>
                              Group Chat
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Direct Messages (1-to-1 Contacts without Admin) */}
              <div>
                {conversations.length > 0 && (
                  <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider bg-surface-nested/40">
                    Direct Messages
                  </div>
                )}
                {contacts.length === 0 ? (
                  <div className="p-4 text-muted text-sm">No contacts found.</div>
                ) : (
                  contacts.map(contact => {
                    const unread = unreadCounts[contact.id] || 0;
                    const isActive = !activeChat?.isGroup && activeChat?.id === contact.id;
                    return (
                      <button
                        key={contact.id}
                        onClick={() => setActiveChat({ 
                          id: contact.id, 
                          full_name: contact.full_name, 
                          role: contact.role, 
                          email: contact.email, 
                          isGroup: false 
                        })}
                        className={`w-full text-left p-4 flex items-center justify-between transition-colors ${
                          isActive ? 'bg-brand-tint' : 'hover:bg-hover-bg'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`p-2 rounded-full flex-shrink-0 ${isActive ? 'bg-brand text-white' : 'bg-border text-muted'}`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium truncate ${isActive ? 'text-brand' : 'text-text'}`}>
                              {contact.full_name}
                            </p>
                            <p className={`text-xs capitalize truncate ${isActive ? 'text-brand/80' : 'text-muted'}`}>
                              {contact.role}
                            </p>
                          </div>
                        </div>
                        {unread > 0 && (
                          <span className="bg-brand text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Active Thread */}
      <div className="flex-1 flex flex-col bg-surface">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className={`p-2 rounded-full flex-shrink-0 ${activeChat.isGroup ? 'bg-brand/10 text-brand' : 'bg-border text-muted'}`}>
                {activeChat.isGroup ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-text">
                  {activeChat.isGroup ? activeChat.name : activeChat.full_name}
                </h3>
                <span className="text-xs bg-surface text-muted px-2 py-0.5 rounded-full capitalize border border-border">
                  {activeChat.isGroup ? 'Group' : activeChat.role}
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted text-sm">
                  {activeChat.isGroup ? 'No messages in Team chat yet. Say hello!' : 'No messages yet. Say hello!'}
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === user?.id;
                  const sender = profilesMap[msg.sender_id];
                  const senderName = isMine 
                    ? (profile?.full_name ? `${profile.full_name} (You)` : 'You')
                    : (sender?.full_name || 'Team Member');

                  let timeFormatted = '';
                  try {
                    if (msg.created_at) {
                      timeFormatted = format(parseISO(msg.created_at), 'h:mm a');
                    }
                  } catch {
                    timeFormatted = '';
                  }

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {activeChat.isGroup && (
                        <span className={`text-xs font-semibold mb-1 px-1 ${isMine ? 'text-brand' : 'text-muted'}`}>
                          {senderName}
                        </span>
                      )}
                      <div 
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isMine 
                            ? 'bg-brand-tint border border-[rgba(248,72,26,0.4)] text-brand rounded-br-sm' 
                            : 'bg-surface border border-border text-text rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      </div>
                      {timeFormatted && (
                        <span className="text-[10px] text-muted mt-1 px-1">
                          {timeFormatted}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {!isGuest ? (
              <form onSubmit={handleSend} className="p-4 border-t border-border bg-surface flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-border rounded-full bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
                  placeholder={activeChat.isGroup ? `Message #${activeChat.name}...` : "Type a message..."}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-2 bg-brand text-white rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
                </button>
              </form>
            ) : (
              <div className="p-4 border-t border-border bg-surface text-center text-muted text-sm">
                Messaging is disabled in demo mode.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted">
            <MessageSquare className="w-12 h-12 mb-4 text-border" />
            <p>Select a group or contact to start messaging</p>
          </div>
        )}
      </div>

    </div>
  );
}
