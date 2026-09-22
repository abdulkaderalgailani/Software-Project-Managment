import React from 'react';
import { format, parseISO, differenceInCalendarDays, isBefore, isAfter } from 'date-fns';
import { Calendar } from 'lucide-react';
import { getUrgencyColorClass } from '../../lib/dateUtils';

export function InternProgress({ startDate, endDate, compact = false }) {
  if (!startDate || !endDate) {
    return (
      <div className={`flex items-center gap-2 text-muted ${compact ? 'text-xs' : 'text-sm'}`}>
        <Calendar className={compact ? "w-3 h-3" : "w-4 h-4"} />
        <span>Dates Not Set</span>
      </div>
    );
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const today = new Date();

  // Calculations
  const totalDays = Math.max(1, differenceInCalendarDays(end, start));
  const daysPassed = Math.max(0, differenceInCalendarDays(today, start));
  
  let percentage = (daysPassed / totalDays) * 100;
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;

  const daysRemaining = Math.max(0, differenceInCalendarDays(end, today));

  let statusText = `${daysRemaining} days remaining`;
  if (isBefore(today, start)) {
    statusText = `Starts in ${differenceInCalendarDays(start, today)} days`;
  } else if (isAfter(today, end)) {
    statusText = "Completed";
  }

  const dateFmt = compact ? 'MMM d' : 'MMM d, yyyy';
  const isCompleted = isAfter(today, end);
  const endColorClass = getUrgencyColorClass(endDate, isCompleted);
  const isUrgent = endColorClass !== 'text-muted';

  return (
    <div className={`flex flex-col gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className="flex justify-between items-center text-muted">
        <div className={`flex items-center gap-2 ${isUrgent ? endColorClass : ''}`}>
          <Calendar className={compact ? "w-3 h-3" : `w-4 h-4 ${!isUrgent ? 'text-brand' : ''}`} />
          <span className={`font-medium ${!isUrgent ? 'text-text' : ''}`}>
            {format(start, dateFmt)} &rarr; {format(end, dateFmt)}
          </span>
        </div>
        {!compact && <span className="font-medium">{statusText}</span>}
      </div>

      <div className="relative w-full h-2 bg-border rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${percentage === 100 ? 'bg-success' : 'bg-brand'} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {compact && (
        <div className="text-right text-[10px] font-medium text-muted mt-0.5">
          {statusText}
        </div>
      )}
    </div>
  );
}
