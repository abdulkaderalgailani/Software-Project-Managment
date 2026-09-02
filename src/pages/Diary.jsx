import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { format, parseISO } from 'date-fns';

export default function Diary() {
  const { user, profile } = useAuth();
  const { fetchVisibleDiaryEntries, fetchTodayDiary, upsertDiary } = useDiary();

  const [entries, setEntries] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form state
  const [content, setContent] = useState('');
  const [entryId, setEntryId] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isIntern = profile?.role === 'intern';
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-ink">Today's Diary</h2>
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
              <label className="block text-sm font-medium text-ink mb-1" htmlFor="content">
                Dear Diary... (What's on your mind?)
              </label>
              <textarea
                id="content"
                rows="6"
                className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus-visible:ring-2 ring-brand-500 ring-offset-2"
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
                className="bg-brand-500 text-white hover:bg-brand-600 rounded-xl px-6 py-2 font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Diary'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-ink">
          {isIntern ? 'Past Entries' : 'Intern Diary Entries'}
        </h3>
        
        {loadingList ? (
          <p className="text-muted">Loading entries...</p>
        ) : entries.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border text-center text-muted">
            No diary entries found.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-border flex flex-col gap-3"
              >
                <div className="flex justify-between items-start border-b border-border pb-3 mb-2">
                  <div>
                    <h4 className="font-bold text-ink">
                      {format(parseISO(entry.entry_date), 'MMMM d, yyyy')}
                    </h4>
                    {!isIntern && entry.intern && (
                      <p className="text-sm text-brand-600 font-medium mt-0.5">
                        {entry.intern.full_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-ink whitespace-pre-wrap">
                  {entry.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
