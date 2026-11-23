import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type TransactionType = 'expense' | 'income';
type IconName = ComponentProps<typeof Ionicons>['name'];

export type Category = {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  type: TransactionType;
};

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'groceries', label: 'Groceries', icon: 'basket-outline', color: '#f59e0b', type: 'expense' },
  { id: 'food', label: 'Food', icon: 'restaurant-outline', color: '#14b8a6', type: 'expense' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', color: '#ec4899', type: 'expense' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline', color: '#a855f7', type: 'expense' },
  { id: 'health', label: 'Health', icon: 'pulse-outline', color: '#22c55e', type: 'expense' },
  { id: 'sport', label: 'Sport', icon: 'barbell-outline', color: '#3b82f6', type: 'expense' },
  { id: 'transport', label: 'Transportation', icon: 'car-outline', color: '#60a5fa', type: 'expense' },
  { id: 'housing', label: 'Housing', icon: 'home-outline', color: '#f97316', type: 'expense' },
  { id: 'education', label: 'Education', icon: 'school-outline', color: '#8b5cf6', type: 'expense' },
  { id: 'travel', label: 'Travel', icon: 'airplane-outline', color: '#0ea5e9', type: 'expense' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'repeat-outline', color: '#94a3b8', type: 'expense' },
  { id: 'other-expense', label: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#a5a79b', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', label: 'Salary', icon: 'cash-outline', color: '#22c55e', type: 'income' },
  { id: 'freelance', label: 'Freelance', icon: 'laptop-outline', color: '#3b82f6', type: 'income' },
  { id: 'business', label: 'Business', icon: 'briefcase-outline', color: '#f59e0b', type: 'income' },
  { id: 'investments', label: 'Investments', icon: 'trending-up-outline', color: '#a855f7', type: 'income' },
  { id: 'gift', label: 'Gift', icon: 'gift-outline', color: '#ec4899', type: 'income' },
  { id: 'refund', label: 'Refund', icon: 'return-down-back-outline', color: '#0ea5e9', type: 'income' },
  { id: 'other-income', label: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#a5a79b', type: 'income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const categoriesFor = (type: TransactionType) =>
  type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

export const getCategory = (id: string) =>
  ALL_CATEGORIES.find((c) => c.id === id) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

