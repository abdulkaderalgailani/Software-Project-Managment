import { differenceInCalendarDays, parseISO } from 'date-fns';

const URGENCY_THRESHOLD_DAYS = 3;

/**
 * Returns a Tailwind text color class based on how soon a date is.
 * 
 * @param {string | Date} dateString - The due date or end date
 * @param {boolean} isCompleted - If true, always returns neutral color
 * @returns {string} Tailwind class name
 */
export function getUrgencyColorClass(dateString, isCompleted = false) {
  if (!dateString) return 'text-muted';
  if (isCompleted) return 'text-muted';

  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  const today = new Date();
  
  const diff = differenceInCalendarDays(date, today);

  if (diff < 0) {
    return 'text-danger font-medium'; // Overdue (red)
  }
  
  if (diff <= URGENCY_THRESHOLD_DAYS) {
    return 'text-brand font-medium'; // Due soon (orange)
  }

  return 'text-muted'; // Normal/Otherwise (gray)
}
