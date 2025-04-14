import { stringToColor } from "./utils";
import { CATEGORY_COLORS } from "./constants";

// Define types with index signatures
type ColorMap = {
  [key: string]: string;
};

// Define a consistent color palette for charts
export const CHART_COLORS = {
  // User colors (blue/purple tones)
  users: {
    'Antonio': '#3b82f6', // Blue
    'Andres': '#8b5cf6',  // Purple
  } as ColorMap,

  // Category colors (rainbow spectrum)
  categories: {
    'Utilities': '#ef4444',     // Red
    'Groceries': '#f97316',     // Orange
    'Dining': '#eab308',        // Yellow
    'Transport': '#84cc16',     // Lime
    'Entertainment': '#06b6d4', // Cyan
    'Health': '#ec4899',        // Pink
    'Shopping': '#14b8a6',      // Teal
    'Subscriptions': '#6366f1', // Indigo
    'Gifts': '#d946ef',         // Fuchsia
    'Holidays': '#f472b6',      // Rose
  } as ColorMap,

  // Location colors (slightly darker versions of category colors)
  locations: {
    'Tower Hamlets Council Tax': '#dc2626', // Darker red
    'Ovo Energy': '#ea580c',               // Darker orange
    'Goods': '#ca8a04',                    // Darker yellow
    'Thames Water': '#65a30d',             // Darker lime
    'Hyperoptic': '#0891b2',               // Darker cyan
    'Sainsburys': '#be185d',               // Darker pink
    'Amazon': '#0f766e',                   // Darker teal
    'Netflix': '#4f46e5',                  // Darker indigo
    'Etsy': '#c026d3',                     // Darker fuchsia
    'Airbnb': '#e11d48',                   // Darker rose
  } as ColorMap
};

/**
 * Get a consistent color for a user
 * @param username The username
 * @returns A hex color code
 */
export function getUserColor(username: string): string {
  return CHART_COLORS.users[username] || stringToColor(username);
}

/**
 * Get a consistent color for a category
 * @param categoryName The category name
 * @returns A hex color code
 */
export function getCategoryColor(categoryName: string): string {
  return CHART_COLORS.categories[categoryName] ||
    // If not in our predefined map, use the category colors array in a deterministic way
    CATEGORY_COLORS[Math.abs(hashString(categoryName)) % CATEGORY_COLORS.length];
}

/**
 * Get a consistent color for a location
 * @param locationName The location name
 * @returns A hex color code
 */
export function getLocationColor(locationName: string): string {
  return CHART_COLORS.locations[locationName] ||
    // If not in our predefined map, use a darker version of the category color
    darkenColor(getCategoryColor(locationName), 0.2);
}

/**
 * Simple string hashing function to get a numeric value from a string
 * @param str The string to hash
 * @returns A numeric hash value
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Darken a hex color by a specified amount
 * @param color The hex color to darken
 * @param amount The amount to darken (0-1)
 * @returns A darkened hex color
 */
function darkenColor(color: string, amount: number): string {
  // Remove the # if it exists
  color = color.replace('#', '');

  // Parse the hex values
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);

  // Darken each component
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
