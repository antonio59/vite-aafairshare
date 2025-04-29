import { format } from 'date-fns';

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

export function getMonthFromDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM');
}

export function formatMonthYear(monthStr: string): string {
  if (!monthStr || typeof monthStr !== 'string' || !/^\d{4}-\d{2}$/.test(monthStr)) {
    return '';
  }
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  if (isNaN(date.getTime())) return '';
  return format(date, 'MMMM yyyy');
}

export function getPreviousMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  date.setMonth(date.getMonth() - 1);
  return format(date, 'yyyy-MM');
} 