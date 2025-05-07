/**
 * Shared formatting utilities for both client and server
 */

/**
 * Format a number as GBP currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | undefined | null): string {
  // Handle potential null/undefined/NaN inputs gracefully
  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
    return "£NaN"; // Or return "£0.00" or some other indicator
  }
  return new Intl.NumberFormat("en-GB", { 
    style: "currency", 
    currency: "GBP",
  }).format(numAmount);
}

/**
 * Format a date as a string
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | unknown): string {
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString();
  }
  return new Date().toLocaleDateString();
} 