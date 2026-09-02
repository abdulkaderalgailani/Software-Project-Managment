import React, { useState, useEffect } from 'react';
import { useActivityLog } from '../hooks/useActivityLog';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';
import { getActionDetails } from '../lib/activityLogger';

export default function Logs() {
  const { fetchLogs } = useActivityLog();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const { data } = await fetchLogs();
      if (data) {
        setLogs(data);
      }
      setLoading(false);
    }
    loadLogs();
  }, [fetchLogs]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-8 h-8 text-brand-500" />
        <h2 className="text-2xl font-bold text-ink">Activity Log</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 text-muted">Loading activity logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-muted text-center">No recent activity found.</div>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log) => {
              const details = getActionDetails(log.action, log.entity_type);
              const Icon = details.icon;
              
              return (
                <li key={log.id} className="p-6 flex gap-4 hover:bg-surface transition-colors">
                  <div className={`mt-1 bg-surface p-2 rounded-full ${details.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-ink text-sm">
                      <span className="font-bold text-ink">{log.profiles?.full_name || 'Someone'}</span>
                      {' '}
                      {details.text}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}
                      {' • '}
                      {format(parseISO(log.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
