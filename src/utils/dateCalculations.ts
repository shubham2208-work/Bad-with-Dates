import { OccasionEvent } from '../types/occasion';

export interface NextOccurrenceInfo {
  nextDate: Date;
  daysRemaining: number;
  isToday: boolean;
  isTomorrow: boolean;
  isPastThisYear: boolean;
  yearsCount?: number;
  milestoneLabel?: string;
  formattedDate: string;
}

export function getNextOccurrence(event: OccasionEvent, referenceDate: Date = new Date()): NextOccurrenceInfo {
  const parts = event.date.split('-');
  const eventYear = parseInt(parts[0], 10);
  const eventMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const eventDay = parseInt(parts[2], 10);

  const refYear = referenceDate.getFullYear();
  const todayAtMidnight = new Date(refYear, referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0, 0);

  let targetDate = new Date(refYear, eventMonth, eventDay, 0, 0, 0, 0);

  if (event.repeatYearly) {
    if (targetDate.getTime() < todayAtMidnight.getTime()) {
      targetDate = new Date(refYear + 1, eventMonth, eventDay, 0, 0, 0, 0);
    }
  }

  const diffTime = targetDate.getTime() - todayAtMidnight.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const isToday = daysRemaining === 0;
  const isTomorrow = daysRemaining === 1;
  const isPastThisYear = daysRemaining < 0;

  // Milestone calculation
  let yearsCount: number | undefined;
  let milestoneLabel: string | undefined;

  const originYear = event.startYear || (eventYear < refYear ? eventYear : undefined);
  if (originYear) {
    const diffYears = targetDate.getFullYear() - originYear;
    if (diffYears > 0) {
      yearsCount = diffYears;
      if (event.occasionType === 'birthday') {
        milestoneLabel = `Turning ${diffYears}`;
      } else if (event.occasionType === 'anniversary' || event.occasionType === 'wedding') {
        milestoneLabel = `${diffYears}${getOrdinalSuffix(diffYears)} Anniversary`;
      } else if (event.occasionType === 'promotion') {
        milestoneLabel = `${diffYears} ${diffYears === 1 ? 'Year' : 'Years'} Milestone`;
      } else {
        milestoneLabel = `${diffYears}${getOrdinalSuffix(diffYears)} Year`;
      }
    }
  }

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', weekday: 'short' };
  const formattedDate = targetDate.toLocaleDateString('en-US', options);

  return {
    nextDate: targetDate,
    daysRemaining,
    isToday,
    isTomorrow,
    isPastThisYear,
    yearsCount,
    milestoneLabel,
    formattedDate,
  };
}

export function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function formatRelativeDays(days: number): string {
  if (days === 0) return 'Today! 🎉';
  if (days === 1) return 'Tomorrow';
  if (days === 2) return 'In 2 days';
  if (days < 7) return `In ${days} days`;
  if (days < 14) return 'Next week';
  if (days < 30) return `In ${Math.round(days / 7)} weeks`;
  return `In ${days} days`;
}

export function generateWhatsAppUrl(phone?: string, message?: string): string {
  if (!phone) {
    return `https://wa.me/?text=${encodeURIComponent(message || '')}`;
  }
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message || '')}`;
}

export function generateSmsUrl(phone?: string, message?: string): string {
  if (!phone) return `sms:?body=${encodeURIComponent(message || '')}`;
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return `sms:${cleanPhone}?body=${encodeURIComponent(message || '')}`;
}

export function generateGoogleCalendarUrl(event: OccasionEvent): string {
  const occurrence = getNextOccurrence(event);
  const target = occurrence.nextDate;
  
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');

  const dateString = `${y}${m}${d}`;
  const title = encodeURIComponent(`${event.name}'s ${getOccasionLabel(event)} - Bad with Dates`);
  const details = encodeURIComponent(
    `Celebration reminder for ${event.name} (${event.relationship}).\nNotes: ${event.notes || 'None'}\nCreated via Bad with Dates app.`
  );
  
  let recurParam = '';
  if (event.repeatYearly) {
    recurParam = '&recur=RRULE:FREQ=YEARLY';
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateString}/${dateString}&details=${details}${recurParam}`;
}

export function generateIcsFile(events: OccasionEvent[]): string {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bad with Dates//Celebration Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((event) => {
    const occ = getNextOccurrence(event);
    const target = occ.nextDate;
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const dtstart = `${y}${m}${d}`;

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:bad-with-dates-${event.id}@app`);
    icsContent.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    icsContent.push(`DTSTART;VALUE=DATE:${dtstart}`);
    icsContent.push(`SUMMARY:${event.name}'s ${getOccasionLabel(event)}`);
    icsContent.push(`DESCRIPTION:${event.relationship} - ${event.notes || 'Remember to send wishes!'}`);
    if (event.repeatYearly) {
      icsContent.push('RRULE:FREQ=YEARLY');
    }
    // 7 days before alarm
    icsContent.push('BEGIN:VALARM');
    icsContent.push('ACTION:DISPLAY');
    icsContent.push(`DESCRIPTION:Upcoming: ${event.name}'s ${getOccasionLabel(event)} in 7 days!`);
    icsContent.push('TRIGGER:-P7D');
    icsContent.push('END:VALARM');
    // 1 day before alarm
    icsContent.push('BEGIN:VALARM');
    icsContent.push('ACTION:DISPLAY');
    icsContent.push(`DESCRIPTION:Tomorrow is ${event.name}'s ${getOccasionLabel(event)}!`);
    icsContent.push('TRIGGER:-P1D');
    icsContent.push('END:VALARM');

    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
}

export function getOccasionLabel(event: OccasionEvent): string {
  if (event.customOccasionTitle) return event.customOccasionTitle;
  switch (event.occasionType) {
    case 'birthday':
      return 'Birthday';
    case 'anniversary':
      return 'Anniversary';
    case 'relationship':
      return 'Relationship Anniversary';
    case 'promotion':
      return 'Promotion / Work Milestone';
    case 'graduation':
      return 'Graduation';
    case 'wedding':
      return 'Wedding Day';
    case 'valentine':
      return "Valentine's Day";
    case 'friendship':
      return 'Friendship Day';
    case 'pet':
      return 'Pet Birthday / Gotcha Day';
    default:
      return 'Special Day';
  }
}

export function getOccasionIcon(type: OccasionEvent['occasionType']): string {
  switch (type) {
    case 'birthday':
      return '🎂';
    case 'anniversary':
      return '💍';
    case 'relationship':
      return '❤️';
    case 'promotion':
      return '💼';
    case 'graduation':
      return '🎓';
    case 'wedding':
      return '💒';
    case 'valentine':
      return '💘';
    case 'friendship':
      return '🌟';
    case 'pet':
      return '🐾';
    default:
      return '🎉';
  }
}

export function getOccasionGradient(type: OccasionEvent['occasionType']): string {
  switch (type) {
    case 'birthday':
      return 'from-amber-500 via-rose-500 to-pink-500';
    case 'anniversary':
      return 'from-rose-500 via-red-500 to-amber-600';
    case 'relationship':
      return 'from-pink-500 via-rose-600 to-purple-600';
    case 'promotion':
      return 'from-blue-600 via-indigo-600 to-teal-500';
    case 'graduation':
      return 'from-emerald-500 via-teal-600 to-cyan-600';
    case 'wedding':
      return 'from-amber-400 via-rose-400 to-pink-500';
    case 'valentine':
      return 'from-rose-600 via-pink-600 to-red-500';
    case 'friendship':
      return 'from-purple-500 via-indigo-500 to-sky-500';
    case 'pet':
      return 'from-orange-400 via-amber-500 to-yellow-500';
    default:
      return 'from-violet-500 via-purple-500 to-pink-500';
  }
}
