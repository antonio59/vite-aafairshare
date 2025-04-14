import {
  Utensils, Ticket, Gift, ShoppingCart, Heart, Umbrella, // Updated icons
  ShoppingBag, CreditCard, Bus, UtilityPole, LucideIcon // Updated icons
} from 'lucide-react';

export const USERS = [
  { id: 7, name: "Antonio" },
  { id: 8, name: "Andres" },
];

export const SPLIT_TYPES = ["50/50", "100%"] as const;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Re-add CATEGORY_COLORS
export const CATEGORY_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#8B5CF6", // purple
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#F97316", // orange
  "#84CC16", // lime
  "#06B6D4", // cyan
  "#D946EF", // fuchsia
  "#F472B6", // rose
  "#A855F7", // violet
  "#22C55E", // emerald
  "#EAB308", // yellow
  "#6B7280", // gray
  "#0EA5E9", // sky
  "#FB923C", // light orange
  "#A3E635", // light lime
];

// Define available category icon names based on user list
export const CATEGORY_ICON_NAMES = [
  'Dining', 'Entertainment', 'Gifts', 'Groceries', 'Health',
  'Holidays', 'Shopping', 'Subscriptions', 'Transport', 'Utilities',
] as const;

// Type for icon names
export type CategoryIconName = typeof CATEGORY_ICON_NAMES[number];

// Map icon names to updated Lucide components
export const CATEGORY_ICONS: Record<CategoryIconName, LucideIcon> = {
  Dining: Utensils,
  Entertainment: Ticket,
  Gifts: Gift,
  Groceries: ShoppingCart,
  Health: Heart,
  Holidays: Umbrella,
  Shopping: ShoppingBag,
  Subscriptions: CreditCard,
  Transport: Bus,
  Utilities: UtilityPole,
};
