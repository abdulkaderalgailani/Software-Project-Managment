import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEntryComments } from '../../hooks/useEntryComments';
import { format, parseISO } from 'date-fns';

export function EntryComments({ entryType, entryId, internId }) {
  const { profile } = useAuth();
  const { fetchComments, addComment } = useEntryComments();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isIntern = profile?.role === 'intern';

  const loadComments = async () => {
    setLoading(true);
    const { data } = await fetchComments(entryType, entryId);
    if (data) setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [entryType, entryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await addComment({
      entry_type: entryType,
      entry_id: entryId,
      intern_id: internId,
      comment: newComment
    });

    if (!error) {
      setNewComment('');
      loadComments();
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h5 className="font-bold text-text mb-3">Comments</h5>
      
      {loading ? (
        <p className="text-sm text-muted">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted mb-4">No comments yet.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white dark:bg-[#111C40] p-3 rounded-lg border border-border">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-text">
                  {comment.author?.full_name || 'Unknown User'}
                </span>
                <span className="text-xs text-muted">
                  {format(parseISO(comment.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
              <div className="text-sm text-text whitespace-pre-wrap">
                {comment.comment}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isIntern && (
        <form onSubmit={handleSubmit} className="mt-2">
          <textarea
            className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-white dark:bg-[#111C40] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus-visible:ring-2 ring-brand ring-offset-2 focus:outline-none"
            rows="2"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-1.5 text-sm font-medium text-white bg-brand hover:opacity-90 rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
