import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parse } from "date-fns";
// Import shared formatting utilities
import { formatCurrency } from "@shared/formatting";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export the shared formatCurrency function
export { formatCurrency };

// Use the shared formatDate function but maintain compatibility with existing code
export function formatDate(date: Date | string | number | undefined | null): string {
  try {
    // Handle null/undefined
    if (!date) {
      console.warn('formatDate received null/undefined date, using fallback');
      return 'Invalid date';
    }
    
    // Handle Firestore timestamp objects
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    
    // Convert string to date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Validate the date object is valid
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn('formatDate received invalid date:', date);
      return 'Invalid date';
    }
    
    // Format the valid date
    return format(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error in formatDate:', error, 'for date:', date);
    return 'Error formatting date';
  }
}

export function formatMonthYear(month: string): string {
  if (!month || typeof month !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('formatMonthYear: Invalid or empty month string', month);
    }
    return '';
  }
  try {
    // month format is YYYY-MM
    const date = parse(month + '-01', 'yyyy-MM-dd', new Date());
    if (isNaN(date.getTime())) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('formatMonthYear: Failed to parse month string', month);
      }
      return '';
    }
    return format(date, 'MMMM yyyy');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('formatMonthYear: Error formatting month', month, error);
    }
    return '';
  }
}

export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function getMonthFromDate(date: Date | string | { toDate?: () => Date } | undefined | null): string {
  if (!date) return '';
  let dateObj: Date;
  const hasToDate = (d: unknown): d is { toDate: () => Date } =>
    typeof d === 'object' && d !== null && typeof (d as { toDate?: unknown }).toDate === 'function';
  if (hasToDate(date)) {
    dateObj = date.toDate();
  } else if (typeof date === 'string' || date instanceof Date) {
    dateObj = new Date(date);
  } else {
    return '';
  }
  if (isNaN(dateObj.getTime())) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('getMonthFromDate: Invalid date value', date);
    }
    return '';
  }
  return format(dateObj, 'yyyy-MM');
}

export function getNextMonth(month: string): string {
  const date = parse(month + '-01', 'yyyy-MM-dd', new Date());
  date.setMonth(date.getMonth() + 1);
  return format(date, 'yyyy-MM');
}

export function getPreviousMonth(month: string): string {
  const date = parse(month + '-01', 'yyyy-MM-dd', new Date());
  date.setMonth(date.getMonth() - 1);
  return format(date, 'yyyy-MM');
}

export function calculatePercent(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }

  return color;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

// --- Category Color Utilities ---

// Returns Tailwind CSS classes for category TEXT color (light/dark mode aware)
export const getCategoryColorClass = (categoryName?: string): string => {
  switch (categoryName?.toLowerCase()) {
    case 'groceries':
      return 'text-green-700 dark:text-green-400';
    case 'utilities':
      return 'text-blue-700 dark:text-blue-400';
    case 'rent':
      return 'text-purple-700 dark:text-purple-400';
    case 'transport':
      return 'text-orange-700 dark:text-orange-400';
    case 'entertainment':
      return 'text-pink-700 dark:text-pink-400';
    case 'food & drink':
       return 'text-red-700 dark:text-red-400';
    // Add more categories here as needed
    default:
      return 'text-gray-600 dark:text-gray-400'; // Default/Uncategorized
  }
};

// Returns Tailwind CSS classes for category BACKGROUND color swatches (light/dark mode aware)
export const getCategoryBackgroundColorClass = (categoryName?: string): string => {
  switch (categoryName?.toLowerCase()) {
    case 'groceries':
      return 'bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-600';
    case 'utilities':
      return 'bg-blue-100 dark:bg-blue-800 border-blue-300 dark:border-blue-600';
    case 'rent':
      return 'bg-purple-100 dark:bg-purple-800 border-purple-300 dark:border-purple-600';
    case 'transport':
      return 'bg-orange-100 dark:bg-orange-800 border-orange-300 dark:border-orange-600';
    case 'entertainment':
      return 'bg-pink-100 dark:bg-pink-800 border-pink-300 dark:border-pink-600';
    case 'food & drink':
       return 'bg-red-100 dark:bg-red-800 border-red-300 dark:border-red-600';
    // Add more categories here as needed
    default:
      return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500'; // Default/Uncategorized
  }
};

/**
 * Robustly normalize any input to a Date object, or undefined if invalid.
 * Handles Date, string, Firestore Timestamp, object, undefined, null.
 */
export function normalizeToDate(input: unknown): Date | undefined {
  if (!input) return undefined;
  // Firestore Timestamp (has toDate method)
  if (typeof input === 'object' && input !== null && typeof (input as { toDate?: unknown }).toDate === 'function') {
    try {
      const d = (input as { toDate: () => Date }).toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
    } catch {
      return undefined;
    }
  }
  // Firestore Timestamp-like object with seconds
  if (typeof input === 'object' && input !== null && 'seconds' in input) {
    const seconds = (input as { seconds: number }).seconds;
    if (typeof seconds === 'number') {
      const d = new Date(seconds * 1000);
      return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
    }
  }
  // String
  if (typeof input === 'string') {
    const d = new Date(input);
    return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
  }
  // Date
  if (input instanceof Date) {
    return !isNaN(input.getTime()) ? input : undefined;
  }
  // Number (timestamp)
  if (typeof input === 'number') {
    const d = new Date(input);
    return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
  }
  return undefined;
}
