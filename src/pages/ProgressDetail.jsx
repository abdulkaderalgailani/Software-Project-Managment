import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export default function ProgressDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { fetchProgressEntry, fetchReviews, addReview } = useProgress();
  
  const [entry, setEntry] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review Form
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const canReview = profile && ['supervisor', 'super_supervisor', 'admin'].includes(profile.role);

  const loadData = async () => {
    setLoading(true);
    const { data: entryData, error: entryError } = await fetchProgressEntry(id);
    if (entryError) {
      setError(entryError.message);
    } else {
      setEntry(entryData);
      const { data: reviewsData } = await fetchReviews(id);
      if (reviewsData) setReviews(reviewsData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchProgressEntry, fetchReviews]);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmittingReview(true);
    setReviewError(null);

    const { error } = await addReview(id, newComment);
    
    if (error) {
      setReviewError(error.message);
    } else {
      setNewComment('');
      loadData(); // Refresh to show new comment
    }
    
    setSubmittingReview(false);
  };

  if (loading) {
    return <div className="text-muted">Loading entry details...</div>;
  }

  if (error || !entry) {
    return (
      <div className="bg-danger/10 text-danger p-5 rounded-xl">
        {error || 'Entry not found.'}
      </div>
    );
  }

  // Treat the presence of at least one review as the "reviewed" signal
  const isReviewed = reviews.length > 0;

  return (
    <div className="max-w-3xl space-y-4">
      <Link 
        to="/progress" 
        className="inline-flex items-center gap-2 text-brand hover:text-brand font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Progress
      </Link>
      
      {/* Entry Details */}
      <div className="bg-surface p-8 rounded-xl shadow-sm border border-border">
        <div className="border-b border-border pb-6 mb-6">
          <h2 className="text-3xl font-bold text-text">
            {format(parseISO(entry.entry_date), 'MMMM d, yyyy')}
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-sm font-medium bg-surface text-muted px-3 py-1 rounded-full">
              {entry.hours} hours logged
            </span>
            <span className={`text-sm font-medium px-3 py-1 rounded-full capitalize ${
              isReviewed ? 'bg-success/10 text-success' : 'bg-surface text-muted'
            }`}>
              {isReviewed ? 'Reviewed' : entry.status}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-bold text-text mb-2">Summary</h3>
            <p className="text-muted whitespace-pre-wrap leading-relaxed">{entry.summary}</p>
          </section>

          {entry.tasks_done && (
            <section>
              <h3 className="text-lg font-bold text-text mb-2">Tasks Done</h3>
              <p className="text-muted whitespace-pre-wrap leading-relaxed">{entry.tasks_done}</p>
            </section>
          )}

          {entry.learnings && (
            <section>
              <h3 className="text-lg font-bold text-text mb-2">Learnings</h3>
              <p className="text-muted whitespace-pre-wrap leading-relaxed">{entry.learnings}</p>
            </section>
          )}

          {entry.blockers && (
            <section>
              <h3 className="text-lg font-bold text-text mb-2">Blockers</h3>
              <p className="text-muted whitespace-pre-wrap leading-relaxed">{entry.blockers}</p>
            </section>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-surface p-8 rounded-xl shadow-sm border border-border">
        <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brand" />
          Supervisor Reviews
        </h3>
        
        {reviews.length === 0 ? (
          <p className="text-muted mb-6">No reviews yet.</p>
        ) : (
          <div className="space-y-4 mb-8">
            {reviews.map(review => (
              <div key={review.id} className="bg-surface p-4 rounded-xl border border-border">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-text">{review.reviewer?.full_name || 'Supervisor'}</span>
                  <span className="text-xs text-muted">
                    {formatDistanceToNow(parseISO(review.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-text whitespace-pre-wrap text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        )}

        {canReview && (
          <form onSubmit={handleAddReview} className="mt-6 border-t border-border pt-6">
            <label className="block text-sm font-medium text-text mb-2">Add a Review / Comment</label>
            {reviewError && (
              <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm mb-3">
                {reviewError}
              </div>
            )}
            <textarea
              rows="3"
              required
              className="w-full px-4 py-3 border border-border rounded-xl mb-3 bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
              placeholder="Great work on..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingReview}
                className="bg-brand text-white px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Posting...' : 'Post Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
