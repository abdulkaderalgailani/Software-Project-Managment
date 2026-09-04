import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../hooks/useProgress';
import { format, parseISO } from 'date-fns';
import { Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

export default function Progress() {
  const { user, profile } = useAuth();
  const { fetchProgressList, fetchAllVisibleProgress, fetchTodayProgress, upsertProgress, updateProgress, deleteProgress } = useProgress();

  const [entries, setEntries] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form state (only used by interns / anyone who wants to log their own progress)
  const [summary, setSummary] = useState('');
  const [tasksDone, setTasksDone] = useState('');
  const [learnings, setLearnings] = useState('');
  const [blockers, setBlockers] = useState('');
  const [hours, setHours] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  
  const handleDelete = async (e, id) => {
    e.preventDefault(); // Prevent link click
    if (window.confirm("Are you sure you want to delete this progress entry?")) {
      await deleteProgress(id);
      loadData();
    }
  };

  const handleEditClick = (e, entry) => {
    e.preventDefault(); // Prevent link click
    setEditingEntry(entry);
  };

  const isIntern = profile?.role === 'intern';

  const loadData = async () => {
    if (!user) return;
    setLoadingList(true);
    
    if (isIntern) {
      // Interns see only their own entries
      const { data: listData } = await fetchProgressList(user.id);
      if (listData) setEntries(listData);

      // Pre-fill today's form
      const { data: todayData } = await fetchTodayProgress(user.id);
      if (todayData) {
        setSummary(todayData.summary || '');
        setTasksDone(todayData.tasks_done || '');
        setLearnings(todayData.learnings || '');
        setBlockers(todayData.blockers || '');
        setHours(todayData.hours || '');
      } else {
        // Reset form if no entry today (fixes data bleed between accounts)
        setSummary('');
        setTasksDone('');
        setLearnings('');
        setBlockers('');
        setHours('');
      }
    } else {
      // Supervisors / super_supervisors / admins see all entries RLS allows
      const { data: listData } = await fetchAllVisibleProgress();
      if (listData) setEntries(listData);
    }
    
    setLoadingList(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const payload = {
      summary,
      tasks_done: tasksDone,
      learnings,
      blockers,
      hours: parseFloat(hours),
    };

    const { error } = await upsertProgress(payload);

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      loadData(); // Refresh list to show updated entry
    }
    
    setSubmitting(false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Today's Progress Form — shown to interns only */}
      {isIntern && (
        <div className="bg-surface p-5 rounded-xl shadow-sm border border-border">
          <h2 className="text-2xl font-bold mb-6 text-text">Today's Progress</h2>
          
          {submitError && (
            <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm mb-4">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="bg-success/10 text-success p-3 rounded-xl text-sm mb-4">
              Progress saved successfully!
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-1" htmlFor="summary">
                  Summary (What did you do overall?)
                </label>
                <textarea
                  id="summary"
                  rows="2"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-1" htmlFor="tasksDone">
                  Tasks Done
                </label>
                <textarea
                  id="tasksDone"
                  rows="2"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
                  value={tasksDone}
                  onChange={(e) => setTasksDone(e.target.value)}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-1" htmlFor="learnings">
                  Learnings (JS / React / Supabase / etc.)
                </label>
                <textarea
                  id="learnings"
                  rows="2"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
                  value={learnings}
                  onChange={(e) => setLearnings(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-1" htmlFor="blockers">
                  Pending Issues
                </label>
                <textarea
                  id="blockers"
                  rows="1"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-1" htmlFor="hours">
                  Hours
                </label>
                <input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-brand text-white hover:opacity-90 rounded-xl px-6 py-2 font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Progress'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-text">
          {isIntern ? 'Past Entries' : 'Intern Progress Entries'}
        </h3>
        
        {loadingList ? (
          <p className="text-muted">Loading entries...</p>
        ) : entries.length === 0 ? (
          <div className="bg-surface p-5 rounded-xl shadow-sm border border-border text-center text-muted">
            No progress entries found.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                to={`/progress/${entry.id}`}
                className="block bg-surface p-4 rounded-xl shadow-sm border border-border hover:bg-hover-bg transition-colors group relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-text">
                      {format(parseISO(entry.entry_date), 'MMMM d, yyyy')}
                    </h4>
                    {/* Show intern name for non-intern viewers */}
                    {!isIntern && entry.intern && (
                      <p className="text-sm text-brand font-medium mt-0.5">
                        {entry.intern.full_name}
                      </p>
                    )}
                    <p className="text-muted text-sm mt-1 line-clamp-2">
                      {entry.summary}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">

                    {user.id === entry.intern_id && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleEditClick(e, entry)} className="text-muted hover:text-brand transition-colors p-1 bg-surface rounded-full shadow-sm border border-border" title="Edit Entry">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDelete(e, entry.id)} className="text-muted hover:text-danger transition-colors p-1 bg-surface rounded-full shadow-sm border border-border" title="Delete Entry">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <span className="text-xs font-medium bg-surface text-muted px-2 py-1 rounded-full">
                      {entry.hours} hrs
                    </span>
                    {entry.status === 'reviewed' && (
                      <span className="text-xs font-medium bg-success/10 text-success px-2 py-1 rounded-full">
                        Reviewed
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      
      {editingEntry && (
        <EditProgressModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onUpdated={loadData}
        />
      )}
      </div>
    </div>
  );
}


function EditProgressModal({ entry, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { updateProgress } = useProgress();

  const [summary, setSummary] = useState('');
  const [tasksDone, setTasksDone] = useState('');
  const [learnings, setLearnings] = useState('');
  const [blockers, setBlockers] = useState('');
  const [hours, setHours] = useState('');

  useEffect(() => {
    if (entry) {
      setSummary(entry.summary || '');
      setTasksDone(entry.tasks_done || '');
      setLearnings(entry.learnings || '');
      setBlockers(entry.blockers || '');
      setHours(entry.hours || '');
    }
  }, [entry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: updateError } = await updateProgress(entry.id, {
      summary,
      tasks_done: tasksDone,
      learnings,
      blockers,
      hours: parseFloat(hours),
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
    <Modal isOpen={!!entry} onClose={onClose} title="Edit Progress Entry">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-text mb-1">Summary</label>
          <textarea
            required
            rows="2"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={summary}
            onChange={e => setSummary(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text mb-1">Tasks Done</label>
          <textarea
            rows="2"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={tasksDone}
            onChange={e => setTasksDone(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Learnings</label>
          <textarea
            rows="2"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={learnings}
            onChange={e => setLearnings(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Pending Issues</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
              value={blockers}
              onChange={e => setBlockers(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Hours</label>
            <input
              required
              type="number"
              step="0.5"
              min="0"
              className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
              value={hours}
              onChange={e => setHours(e.target.value)}
            />
          </div>
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
