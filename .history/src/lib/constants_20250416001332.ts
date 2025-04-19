import {
  Utensils, ShoppingBag, Bus, Heart, Theater,
  Lightbulb, LucideIcon, CreditCard,
  Gift, Plane, ShoppingCart
} from 'lucide-react';
import type { CategoryIconName } from '@shared/types';

export type { CategoryIconName };

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

// Category colors using the shared CategoryIconName type
export const CATEGORY_COLORS: Record<CategoryIconName, string> = {
  Subscriptions: 'bg-orange-100 text-orange-800',
  Utilities: 'bg-indigo-100 text-indigo-800',
  Gifts: 'bg-pink-100 text-pink-800',
  Holidays: 'bg-blue-100 text-blue-800',
  Groceries: 'bg-green-100 text-green-800',
  Transport: 'bg-yellow-100 text-yellow-800',
  Health: 'bg-red-100 text-red-800',
  Entertainment: 'bg-purple-100 text-purple-800',
  Dining: 'bg-amber-100 text-amber-800',
  Shopping: 'bg-teal-100 text-teal-800',
  other: 'bg-gray-100 text-gray-800',
};

// Map icons using the shared CategoryIconName type
export const CATEGORY_ICONS: Record<CategoryIconName, LucideIcon> = {
  Subscriptions: CreditCard,
  Utilities: Lightbulb,
  Gifts: Gift,
  Holidays: Plane,
  Groceries: ShoppingCart,
  Transport: Bus,
  Health: Heart,
  Entertainment: Theater,
  Dining: Utensils,
  Shopping: ShoppingBag,
  other: ShoppingCart,
};

// Emoji mappings using the shared CategoryIconName type
export const CATEGORY_ICONS_EMOJI: Record<CategoryIconName, string> = {
  Subscriptions: '💳',
  Utilities: '💡',
  Gifts: '🎁',
  Holidays: '✈️',
  Groceries: '🛒',
  Transport: '🚗',
  Health: '🏥',
  Entertainment: '🎭',
  Dining: '🍽️',
  Shopping: '🛍️',
  other: '❓',
};
