import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { format, parseISO } from 'date-fns';
import { Send, User, MessageSquare } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const { 
    fetchContacts, 
    fetchUnreadCounts, 
    fetchMessages, 
    sendMessage, 
    markAsRead, 
    subscribeToMessages 
  } = useMessages();

  const [contacts, setContacts] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Initial Load: Contacts & Unread Counts
  useEffect(() => {
    async function init() {
      setLoading(true);
      const [{ data: contactsData }, { data: countsData }] = await Promise.all([
        fetchContacts(),
        fetchUnreadCounts()
      ]);
      if (contactsData) setContacts(contactsData);
      if (countsData) setUnreadCounts(countsData);
      setLoading(false);
    }
    init();
  }, [fetchContacts, fetchUnreadCounts]);

  // 2. Load Messages when Active Contact changes
  useEffect(() => {
    async function loadThread() {
      if (!activeContact) return;
      const { data } = await fetchMessages(activeContact.id);
      if (data) setMessages(data);
      scrollToBottom();
      
      // Mark as read if there were unread messages from them
      if (unreadCounts[activeContact.id] > 0) {
        await markAsRead(activeContact.id);
        setUnreadCounts(prev => ({ ...prev, [activeContact.id]: 0 }));
      }
    }
    loadThread();
  }, [activeContact, fetchMessages, markAsRead]); // intentional omission of unreadCounts to avoid loop

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Setup Realtime Subscription
  useEffect(() => {
    const unsubscribe = subscribeToMessages((newMsg) => {
      // If we are currently talking to the sender/recipient of this new message
      if (
        activeContact && 
        (newMsg.sender_id === activeContact.id || newMsg.recipient_id === activeContact.id)
      ) {
        setMessages(prev => [...prev, newMsg]);
        
        // If we received it, mark it as read immediately since the thread is open
        if (newMsg.recipient_id === user.id) {
          markAsRead(activeContact.id);
        }
      } else if (newMsg.recipient_id === user.id) {
        // Otherwise, it's from someone else. Increment their unread count.
        setUnreadCounts(prev => ({
          ...prev,
          [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1
        }));
      }
    });

    return () => unsubscribe();
  }, [activeContact, user.id, subscribeToMessages, markAsRead]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    setSending(true);
    const { error } = await sendMessage(activeContact.id, newMessage);
    if (!error) {
      setNewMessage('');
    }
    setSending(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border flex h-[calc(100vh-8rem)] overflow-hidden">
      
      {/* Left sidebar: Contacts List */}
      <div className="w-1/3 border-r border-border flex flex-col bg-surface">
        <div className="p-4 border-b border-border bg-white">
          <h2 className="text-xl font-bold text-ink">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-muted text-sm">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="p-4 text-muted text-sm">No contacts found.</div>
          ) : (
            <div className="divide-y divide-border">
              {contacts.map(contact => {
                const unread = unreadCounts[contact.id] || 0;
                const isActive = activeContact?.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setActiveContact(contact)}
                    className={`w-full text-left p-4 flex items-center justify-between transition-colors ${
                      isActive ? 'bg-brand-50' : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-full flex-shrink-0 ${isActive ? 'bg-brand-500 text-white' : 'bg-border text-muted'}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${isActive ? 'text-brand-700' : 'text-ink'}`}>
                          {contact.full_name}
                        </p>
                        <p className={`text-xs capitalize truncate ${isActive ? 'text-brand-600/80' : 'text-muted'}`}>
                          {contact.role}
                        </p>
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Active Thread */}
      <div className="flex-1 flex flex-col bg-white">
        {activeContact ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              <h3 className="text-lg font-bold text-ink">{activeContact.full_name}</h3>
              <span className="text-xs bg-surface text-muted px-2 py-1 rounded-full capitalize">
                {activeContact.role}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted text-sm">
                  No messages yet. Say hello!
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isMine 
                            ? 'bg-brand-500 text-white rounded-br-sm' 
                            : 'bg-surface border border-border text-ink rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-muted mt-1 px-1">
                        {format(parseISO(msg.created_at), 'h:mm a')}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-border bg-surface flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 bg-white border border-border rounded-full focus:outline-none focus-visible:ring-2 ring-brand-500"
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted">
            <MessageSquare className="w-12 h-12 mb-4 text-border" />
            <p>Select a contact to start messaging</p>
          </div>
        )}
      </div>

    </div>
  );
}
