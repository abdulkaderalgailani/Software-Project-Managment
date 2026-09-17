import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { format, parseISO } from 'date-fns';
import { Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { EntryComments } from '../components/ui/EntryComments';

export default function Diary() {
  const { user, profile } = useAuth();
  const { fetchVisibleDiaryEntries, fetchTodayDiary, upsertDiary, updateDiaryEntry, deleteDiaryEntry } = useDiary();

  const [entries, setEntries] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form state
  const [content, setContent] = useState('');
  const [entryId, setEntryId] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [supervisorEditingEntry, setSupervisorEditingEntry] = useState(null);

  
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this diary entry?")) {
      await deleteDiaryEntry(id);
      loadData();
    }
  };

  const handleEditClick = (entry) => {
    setEditingEntry(entry);
  };

  const handleSupervisorEditClick = (entry) => {
    setSupervisorEditingEntry(entry);
  };

  const isIntern = profile?.role === 'intern';
  const isGuest = profile?.role === 'guest';
  // Use today's date in YYYY-MM-DD
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  const loadData = async () => {
    if (!user) return;
    setLoadingList(true);
    
    // Fetch all visible diary entries based on RLS (can_view_intern)
    const { data: listData } = await fetchVisibleDiaryEntries();
    if (listData) setEntries(listData);

    if (isIntern) {
      // Pre-fill today's diary
      const { data: todayData } = await fetchTodayDiary(user.id, todayDate);
      if (todayData) {
        setContent(todayData.content || '');
        setEntryId(todayData.id);
      } else {
        setContent('');
        setEntryId(null);
      }
    }
    
    setLoadingList(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const payload = {
      entry_date: todayDate,
      content,
    };
    
    if (entryId) {
      payload.id = entryId;
    }

    const { data, error } = await upsertDiary(payload);

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitSuccess(true);
      if (data?.id) setEntryId(data.id);
      setTimeout(() => setSubmitSuccess(false), 3000);
      loadData(); // Refresh list to show updated entry
    }
    
    setSubmitting(false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Today's Diary Form — shown to interns only */}
      {isIntern && (
        <div className="bg-surface p-5 rounded-xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text">Today's Diary</h2>
            <span className="text-sm font-medium bg-surface text-muted px-3 py-1 rounded-full">
              {format(parseISO(todayDate), 'MMM d, yyyy')}
            </span>
          </div>
          
          {submitError && (
            <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm mb-4">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="bg-success/10 text-success p-3 rounded-xl text-sm mb-4">
              Diary entry saved successfully!
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1" htmlFor="content">
                Dear Diary... (What's on your mind?)
              </label>
              <textarea
                id="content"
                rows="6"
                className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Today was interesting because..."
                required
              />
            </div>
            
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-brand text-white hover:opacity-90 rounded-xl px-6 py-2 font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Diary'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-text">
          {isIntern ? 'Past Entries' : 'Intern Diary Entries'}
        </h3>
        
        {loadingList ? (
          <p className="text-muted">Loading entries...</p>
        ) : entries.length === 0 ? (
          <div className="bg-surface p-5 rounded-xl shadow-sm border border-border text-center text-muted">
            No diary entries found.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-surface p-5 rounded-xl shadow-sm border border-border flex flex-col gap-3 group relative"
              >
                <div className="flex justify-between items-start border-b border-border pb-3 mb-2">
                  <div>
                    <h4 className="font-bold text-text">
                      {format(parseISO(entry.entry_date), 'MMMM d, yyyy')}
                    </h4>
                    {!isIntern && entry.intern && (
                      <p className="text-sm text-brand font-medium mt-0.5">
                        {entry.intern.full_name}
                      </p>
                    )}
                  </div>
                  {!isGuest && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user.id === entry.intern_id ? (
                        <>
                          <button onClick={() => handleEditClick(entry)} className="text-muted hover:text-brand transition-colors p-1 bg-surface rounded-full shadow-sm border border-border" title="Edit Entry">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(entry.id)} className="text-muted hover:text-danger transition-colors p-1 bg-surface rounded-full shadow-sm border border-border" title="Delete Entry">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : !isIntern ? (
                        <button onClick={() => handleSupervisorEditClick(entry)} className="text-muted hover:text-brand transition-colors p-1 bg-surface rounded-full shadow-sm border border-border" title="Supervisor Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="text-text whitespace-pre-wrap">
                  {entry.content}
                </div>
                <EntryComments entryType="diary" entryId={entry.id} internId={entry.intern_id} />
              </div>
            ))}
          </div>
        )}
      
      {editingEntry && (
        <EditDiaryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onUpdated={loadData}
        />
      )}
      {supervisorEditingEntry && (
        <SupervisorEditDiaryModal
          entry={supervisorEditingEntry}
          onClose={() => setSupervisorEditingEntry(null)}
          onUpdated={loadData}
        />
      )}
      </div>
    </div>
  );
}


function EditDiaryModal({ entry, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { updateDiaryEntry } = useDiary();

  const [content, setContent] = useState('');

  useEffect(() => {
    if (entry) {
      setContent(entry.content || '');
    }
  }, [entry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: updateError } = await updateDiaryEntry(entry.id, {
      content,
    });
    
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onUpdated();
    onClose();
  };

  return (
    <Modal isOpen={!!entry} onClose={onClose} title="Edit Diary Entry">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-text mb-1">Diary Content</label>
          <textarea
            required
            rows="6"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-text bg-surface border border-border hover:bg-hover-bg rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-medium text-white bg-brand hover:opacity-90 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SupervisorEditDiaryModal({ entry, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { editDiaryRpc } = useDiary();

  const [content, setContent] = useState('');

  useEffect(() => {
    if (entry) {
      setContent(entry.content || '');
    }
  }, [entry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: updateError } = await editDiaryRpc(entry.id, content);
    
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onUpdated();
    onClose();
  };

  return (
    <Modal isOpen={!!entry} onClose={onClose} title="Supervisor Edit: Diary Entry">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-text mb-1">Diary Content</label>
          <textarea
            required
            rows="8"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-medium text-text bg-surface border border-border hover:bg-hover-bg rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-medium text-white bg-brand hover:opacity-90 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
