import { supabase } from './supabase';

export async function logActivity(userId, action, entityType, entityId = null, metadata = {}) {
  if (!userId) return;
  
  try {
    await supabase.from('activity_logs').insert([{
      actor_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    }]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

import { Activity, CheckCircle, FileText, MessageSquare, Briefcase, FileEdit } from 'lucide-react';

export const getActionDetails = (action, entityType) => {
  switch (action) {
    case 'progress.submitted':
      return { text: 'submitted their daily progress', icon: CheckCircle, color: 'text-brand' };
    case 'task.created':
      return { text: 'assigned a new task', icon: Briefcase, color: 'text-blue-500' };
    case 'task.status_changed':
      return { text: 'updated a task status', icon: Activity, color: 'text-brand' };
    case 'review.added':
      return { text: 'added a review to a progress entry', icon: FileEdit, color: 'text-purple-500' };
    case 'report.submitted':
      return { text: 'submitted their weekly report', icon: FileText, color: 'text-brand' };
    case 'report.draft_saved':
      return { text: 'saved a weekly report draft', icon: FileText, color: 'text-muted' };
    case 'message.sent':
      return { text: 'sent a direct message', icon: MessageSquare, color: 'text-green-500' };
    default:
      return { 
        text: `performed action: ${action.replace('.', ' ')}`, 
        icon: Activity, 
        color: 'text-muted' 
      };
  }
};
