import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../hooks/useReports';
import { format, parseISO, startOfWeek } from 'date-fns';
import { Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

export default function Reports() {
  const { user, profile } = useAuth();
  const { fetchVisibleReports, fetchThisWeekReport, upsertReport, updateReport, deleteReport } = useReports();

  const [entries, setEntries] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form state
  const [content, setContent] = useState('');
  const [reportId, setReportId] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this weekly report?")) {
      await deleteReport(id);
      loadData();
    }
  };

  const handleEditClick = (report) => {
    setEditingReport(report);
  };

  const isIntern = profile?.role === 'intern';
  const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'); // Monday as start

  const loadData = async () => {
    if (!user) return;
    setLoadingList(true);
    
    // Fetch all visible reports based on RLS (can_view_intern)
    const { data: listData } = await fetchVisibleReports();
    if (listData) setEntries(listData);

    if (isIntern) {
      // Pre-fill this week's report
      const { data: weekData } = await fetchThisWeekReport(user.id, thisWeekStart);
      if (weekData) {
        setContent(weekData.content || '');
        setReportId(weekData.id);
      } else {
        setContent('');
        setReportId(null);
      }
    }
    
    setLoadingList(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const handleSubmit = async (e, status = 'draft') => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const payload = {
      week_start: thisWeekStart,
      content,
      status,
      // Update submitted_at if moving to submitted status, else keep null/current
      submitted_at: status === 'submitted' ? new Date().toISOString() : null,
    };
    
    if (reportId) {
      payload.id = reportId;
    }

    const { data, error } = await upsertReport(payload);

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitSuccess(true);
      if (data?.id) setReportId(data.id);
      setTimeout(() => setSubmitSuccess(false), 3000);
      loadData(); // Refresh list to show updated entry
    }
    
    setSubmitting(false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* This Week's Report Form — shown to interns only */}
      {isIntern && (
        <div className="bg-surface p-5 rounded-xl shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text">This Week's Report</h2>
            <span className="text-sm font-medium bg-surface text-muted px-3 py-1 rounded-full">
              Week of {format(parseISO(thisWeekStart), 'MMM d, yyyy')}
            </span>
          </div>
          
          {submitError && (
            <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm mb-4">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="bg-success/10 text-success p-3 rounded-xl text-sm mb-4">
              Report saved successfully!
            </div>
          )}
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1" htmlFor="content">
                Report Content (Markdown supported)
              </label>
              <textarea
                id="content"
                rows="8"
                className="w-full px-3 py-2 border border-border rounded-xl font-mono text-sm bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="## Summary of the week&#10;&#10;..."
                required
              />
            </div>
            
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={submitting}
                className="px-6 py-2 font-medium text-text bg-surface border border-border hover:bg-hover-bg rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'submitted')}
                disabled={submitting || !content.trim()}
                className="bg-brand text-white hover:opacity-90 rounded-xl px-6 py-2 font-medium transition-colors disabled:opacity-50"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-text">
          {isIntern ? 'Past Reports' : 'Intern Weekly Reports'}
        </h3>
        
        {loadingList ? (
          <p className="text-muted">Loading reports...</p>
        ) : entries.length === 0 ? (
          <div className="bg-surface p-5 rounded-xl shadow-sm border border-border text-center text-muted">
            No weekly reports found.
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-surface p-5 rounded-xl shadow-sm border border-border flex flex-col gap-3"
              >
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div>
                    <h4 className="font-bold text-text">
                      Week of {format(parseISO(entry.week_start), 'MMMM d, yyyy')}
                    </h4>
                    {!isIntern && entry.intern && (
                      <p className="text-sm text-brand font-medium mt-0.5">
                        {entry.intern.full_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                      entry.status === 'submitted' ? 'bg-success/10 text-success' : 'bg-surface text-muted'
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-text whitespace-pre-wrap">
                  {entry.content}
                </div>
              </div>
            ))}
          </div>
        )}
      
      {editingReport && (
        <EditReportModal
          report={editingReport}
          onClose={() => setEditingReport(null)}
          onUpdated={loadData}
        />
      )}
      </div>
    </div>
  );
}


function EditReportModal({ report, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { updateReport } = useReports();

  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    if (report) {
      setContent(report.content || '');
      setStatus(report.status || 'draft');
    }
  }, [report]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: updateError } = await updateReport(report.id, {
      content,
      status,
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
    <Modal isOpen={!!report} onClose={onClose} title="Edit Weekly Report">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-text mb-1">Report Content</label>
          <textarea
            required
            rows="6"
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text mb-1">Status</label>
          <select
            className="w-full px-3 py-2 border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
          </select>
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
