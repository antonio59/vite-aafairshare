// Note: Removed Drizzle ORM and Zod definitions. These are plain TypeScript types for Firestore.

// Re-export formatting utilities
export * from './formatting';

// User type (Reflecting Firebase Auth and Firestore user profile)
export type User = {
  id: string; // Firestore document ID
  username: string;
  email: string | null;
  photoURL?: string; // Add optional photoURL
  createdAt?: Date;
};

// Category type
export type Category = {
  id: string; // Firestore document ID
  name: string;
  icon?: string; // Keep optional icon field
  // color: string; // Color removed - handled by frontend CSS/Tailwind
  // originalId?: number | null; // Removed originalId
};

// Location type
export type Location = {
  id: string; // Firestore document ID
  name: string;
  color?: string; // Add optional color field
  // originalId?: number | null; // Removed originalId
};

// Expense type (Reflecting Firestore document structure)
export type Expense = {
  id: string; // Firestore document ID
  description?: string; // Optional description
  amount: number; // Store as number in Firestore
  date: Date; // Store as Firestore Timestamp, convert to Date in client
  paidByUserId: string; // Firebase Auth UID of payer
  splitType: string; // e.g., "50/50", "exact", "percentage"
  categoryId: string; // Firestore document ID of category
  locationId: string; // Firestore document ID of location
  month: string; // YYYY-MM format
  recurringExpenseId?: string; // Reference to recurring expense if this was generated from one
  // originalId?: number | null; // Removed originalId
  // Add fields for specific split details if needed, e.g., shares for exact splits
};

// Extended Expense type with related data (populated client-side or via Cloud Functions)
export type ExpenseWithDetails = Expense & {
  category?: Category; // Optional category details
  location?: Location; // Optional location details
  paidByUser?: User; // Optional user details
};

// Settlement type
export type Settlement = {
  id: string; // Firestore document ID
  amount: number;
  date: Date; // Store as Firestore Timestamp, convert to Date in client
  month: string; // Format: YYYY-MM
  fromUserId: string; // Firebase Auth UID
  toUserId: string; // Firebase Auth UID
  notes?: string;
  // originalId?: number | null; // Removed originalId
};

// Extended Settlement type with related data
export type SettlementWithUsers = Settlement & {
  fromUser: User; // Use the updated User type
  toUser: User; // Use the updated User type
};

// Type for individual category/location totals within the summary
export type AggregatedTotal = {
  amount: number;
  percentage: number;
};

export type CategoryTotal = AggregatedTotal & {
  category: Category;
};

export type LocationTotal = AggregatedTotal & {
  location: Location;
};

// Updated Month Summary type to match Analytics.tsx calculation
export type MonthSummary = {
  month: string; // YYYY-MM
  totalExpenses: number;
  userExpenses: Record<string, number>; // { userId: amountPaid }
  settlementAmount: number;
  settlementDirection: { fromUserId: string; toUserId: string };
  categoryTotals: CategoryTotal[];
  locationTotals: LocationTotal[];
  splitTypeTotals: Record<string, number>; // { splitType: totalAmount }
  dateDistribution: Record<string, number>; // Placeholder for now { date: count/amount }
};

// Type for trend analysis data (Keep as is for now)
export type TrendData = {
  months: string[];
  totalsByMonth: number[];
  categoriesData: Record<string, number[]>; // Key is category ID (string) or name
  locationsData: Record<string, number[]>; // Key is location ID (string) or name
};

// Recurring expense frequency
export type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

// Recurring expense type
export type RecurringExpense = {
  id: string;
  title: string;
  amount: number;
  description?: string;
  categoryId: string;
  locationId: string;
  paidByUserId: string;
  splitType: string; // Same as Expense splitType
  frequency: RecurringFrequency;
  startDate: Date; // Store as Firestore Timestamp
  endDate?: Date; // Optional end date
  lastGeneratedDate?: Date; // Track the last date an expense was generated
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

// Recurring expense with related data
export type RecurringExpenseWithDetails = RecurringExpense & {
  category?: Category;
  location?: Location;
  paidByUser?: User;
}; 