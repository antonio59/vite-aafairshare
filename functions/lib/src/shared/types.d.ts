/**
 * Shared Type Definitions
 *
 * This file contains shared type definitions that are used across the application.
 * The goal is to have a single source of truth for type definitions to ensure consistency.
 */
export declare const CATEGORY_ICONS: {
    readonly SUBSCRIPTIONS: "Subscriptions";
    readonly UTILITIES: "Utilities";
    readonly GIFTS: "Gifts";
    readonly HOLIDAYS: "Holidays";
    readonly GROCERIES: "Groceries";
    readonly TRANSPORT: "Transport";
    readonly HEALTH: "Health";
    readonly ENTERTAINMENT: "Entertainment";
    readonly DINING: "Dining";
    readonly SHOPPING: "Shopping";
    readonly OTHER: "other";
};
export type CategoryIconName = 'Subscriptions' | 'Utilities' | 'Gifts' | 'Holidays' | 'Groceries' | 'Transport' | 'Health' | 'Entertainment' | 'Dining' | 'Shopping' | 'other';
export type PositiveNumber = number;
export type UUID = string;
export type ISODateString = string;
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare const isPositiveNumber: (n: number) => n is PositiveNumber;
export declare const isUUID: (s: string) => s is UUID;
export declare const isISODateString: (s: string) => s is ISODateString;
export declare function validatePositiveNumber(n: number, fieldName: string): PositiveNumber;
export declare function validateUUID(s: string, fieldName: string): UUID;
export declare function validateISODateString(s: string, fieldName: string): ISODateString;
export declare function validateExpense(expense: Omit<Expense, 'id'>): Omit<Expense, 'id'>;
export interface FirebaseAuthUser {
    uid: string;
    email: string | null;
    username: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    metadata: {
        creationTime?: string;
        lastSignInTime?: string;
    };
    providerData: Array<{
        providerId: string;
        uid: string;
        email: string | null;
        phoneNumber: string | null;
        photoURL: string | null;
    }>;
}
export interface User {
    id: UUID;
    uid: UUID;
    email: string;
    username: string;
    photoURL: string | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
    isAnonymous: boolean;
}
export interface UserDisplay {
    id: string;
    username: string;
    email: string;
    photoURL?: string;
}
export interface Location {
    id: string;
    name: string;
}
export interface Category {
    id: UUID;
    name: string;
    icon: string;
    createdAt: ISODateString | Date;
    color?: string;
}
export interface FirestoreTimestamp {
    _seconds: number;
    _nanoseconds: number;
}
export type ExpenseSplitType = "50/50" | "100%";
export interface Expense {
    id: UUID;
    amount: PositiveNumber;
    description: string;
    categoryId: UUID;
    locationId: UUID;
    paidById: UUID;
    splitBetweenIds: UUID[];
    splitType: ExpenseSplitType;
    month: string;
    date: ISODateString;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
export interface ExpenseWithDetails extends Expense {
    category: Category;
    location: Location;
    paidBy: User;
    paidByUser?: User;
}
export interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}
export declare function validateSettlement(settlement: Omit<Settlement, 'id'>): Omit<Settlement, 'id'>;
export interface Settlement {
    id: UUID;
    fromUserId: UUID;
    toUserId: UUID;
    amount: PositiveNumber;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    month: string;
    date: ISODateString;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
export interface SettlementWithUsers extends Settlement {
    fromUser: User;
    toUser: User;
}
export interface AggregatedTotal {
    amount: number;
    percentage: number;
}
export interface CategoryTotal extends AggregatedTotal {
    category: Category;
}
export interface LocationTotal extends AggregatedTotal {
    location: Location;
}
export interface MonthSummary {
    month: string;
    totalExpenses: number;
    userExpenses: Record<string, number>;
    settlementAmount: number;
    settlementDirection: {
        fromUserId: string;
        toUserId: string;
    };
    categoryTotals: CategoryTotal[];
    locationTotals: LocationTotal[];
    splitTypeTotals: Record<ExpenseSplitType, number>;
    dateDistribution: Record<string, number>;
}
export interface TrendData {
    months: string[];
    totalsByMonth: number[];
    categoriesData: Record<string, number[]>;
    locationsData: Record<string, number[]>;
}
export type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
export interface RecurringExpense extends Omit<Expense, 'date'> {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: ISODateString;
    endDate?: ISODateString;
    lastProcessedDate?: ISODateString;
}
export interface RecurringExpenseWithDetails extends RecurringExpense {
    category: Category;
    location: Location;
    paidByUser: User;
}
export declare function convertFirebaseAuthToUser(firebaseUser: FirebaseAuthUser): User;
export declare function convertToSchemaUser(user: User): User;
