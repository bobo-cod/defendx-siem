
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function formatDate(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) ? format(parsedDate, 'MMM dd, yyyy HH:mm:ss') : 'Invalid date';
}

export function formatRelativeTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate)
    ? formatDistanceToNow(parsedDate, { addSuffix: true })
    : 'Unknown';
}

export function formatShortDate(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) ? format(parsedDate, 'MMM dd, HH:mm') : 'Invalid';
}

export function formatTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) ? format(parsedDate, 'HH:mm:ss') : 'Invalid';
}

