/**
 * Shared formatting utilities for both client and server
 */
/**
 * Format a number as GBP currency
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export declare function formatCurrency(amount: number | undefined | null): string;
/**
 * Format a date as a string
 * @param date - The date to format
 * @returns Formatted date string
 */
export declare function formatDate(date: Date | string | unknown): string;
