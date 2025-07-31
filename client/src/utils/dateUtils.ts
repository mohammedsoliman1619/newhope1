import { format, isToday, isTomorrow, isYesterday, isThisWeek, parseISO, addDays, startOfDay, endOfDay } from 'date-fns';

export const formatDate = (date: Date | string, dateFormat: string = 'MM/dd/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, dateFormat);
};

export const formatTime = (date: Date | string, timeFormat: '12h' | '24h' = '12h'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const formatString = timeFormat === '12h' ? 'h:mm a' : 'HH:mm';
  return format(dateObj, formatString);
};

export const formatDateTime = (date: Date | string, dateFormat: string = 'MM/dd/yyyy', timeFormat: '12h' | '24h' = '12h'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const timeFormatString = timeFormat === '12h' ? 'h:mm a' : 'HH:mm';
  return format(dateObj, `${dateFormat} ${timeFormatString}`);
};

export const getRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  } else if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  } else if (isYesterday(dateObj)) {
    return 'Yesterday';
  } else if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE');
  } else {
    return format(dateObj, 'MMM d');
  }
};

export const isOverdue = (dueDate: Date | string): boolean => {
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return dateObj < startOfDay(new Date());
};

export const isDueToday = (dueDate: Date | string): boolean => {
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return isToday(dateObj);
};

export const isDueTomorrow = (dueDate: Date | string): boolean => {
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return isTomorrow(dateObj);
};

export const isDueThisWeek = (dueDate: Date | string): boolean => {
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return isThisWeek(dateObj);
};

export const getUpcomingDates = (count: number = 7): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    dates.push(addDays(today, i));
  }
  
  return dates;
};

export const parseNaturalDate = (input: string): Date | null => {
  const text = input.toLowerCase().trim();
  const today = new Date();
  
  // Handle common natural language patterns
  if (text === 'today') {
    return today;
  } else if (text === 'tomorrow') {
    return addDays(today, 1);
  } else if (text === 'next week') {
    return addDays(today, 7);
  } else if (text.startsWith('in ') && text.includes('day')) {
    const days = parseInt(text.match(/\d+/)?.[0] || '0');
    return addDays(today, days);
  }
  
  // Try to parse as ISO date
  try {
    const parsed = parseISO(text);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Ignore parsing errors
  }
  
  return null;
};

export const getCurrentWeekDates = (): { start: Date; end: Date } => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const start = addDays(today, -dayOfWeek);
  const end = addDays(start, 6);
  
  return {
    start: startOfDay(start),
    end: endOfDay(end)
  };
};
