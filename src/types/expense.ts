import { CategoryIconName } from '@/lib/constants';

export interface Location {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: CategoryIconName;
  createdAt: Date;
}

export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  locationId: string;
  splitType: '50/50' | '100%';
  date: Date;
  description?: string;
  paidByUserId: string;
  month: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ExpenseWithDetails extends Expense {
  category: Category;
  location: Location;
  paidBy: User;
}