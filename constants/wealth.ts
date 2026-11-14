import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type WealthKind = 'asset' | 'liability';

export type WealthCategory = {
  id: string;
  label: string;
  kind: WealthKind;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
  isLiquid?: boolean;
};

export const ASSET_CATEGORIES: WealthCategory[] = [
  {
    id: 'cash',
    label: 'Cash & Bank',
    kind: 'asset',
    icon: 'cash-outline',
    color: '#1b6f47',
    bg: '#e0f2e9',
    isLiquid: true,
  },
  {
    id: 'investments',
    label: 'Investments',
    kind: 'asset',
    icon: 'trending-up-outline',
    color: '#2563eb',
    bg: '#e6effe',
    isLiquid: true,
  },
  {
    id: 'crypto',
    label: 'Crypto',
    kind: 'asset',
    icon: 'logo-bitcoin',
    color: '#d97706',
    bg: '#fef3c7',
    isLiquid: true,
  },
  {
    id: 'property',
    label: 'Real Estate',
    kind: 'asset',
    icon: 'home-outline',
    color: '#7c3aed',
    bg: '#ede9fe',
  },
  {
    id: 'possessions',
    label: 'Possessions',
    kind: 'asset',
    icon: 'cube-outline',
    color: '#0891b2',
    bg: '#e0f2fe',
  },
  {
    id: 'other-asset',
    label: 'Other Assets',
    kind: 'asset',
    icon: 'sparkles-outline',
    color: '#574634',
    bg: '#f0e1cc',
  },
];

export const LIABILITY_CATEGORIES: WealthCategory[] = [
  {
    id: 'loan',
    label: 'Personal / Student Loan',
    kind: 'liability',
    icon: 'document-text-outline',
    color: '#dc2626',
    bg: '#fee2e2',
  },
  {
    id: 'credit-card',
    label: 'Credit Cards',
    kind: 'liability',
    icon: 'card-outline',
    color: '#ea580c',
    bg: '#ffedd5',
  },
  {
    id: 'mortgage',
    label: 'Mortgage',
    kind: 'liability',
    icon: 'business-outline',
    color: '#9333ea',
    bg: '#f3e8ff',
  },
  {
    id: 'debt',
    label: 'Money Owed',
    kind: 'liability',
    icon: 'people-outline',
    color: '#b91c1c',
    bg: '#fce7f3',
  },
];

export const ALL_WEALTH_CATEGORIES = [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES];

export function getWealthCategory(id: string, kind: WealthKind): WealthCategory {
  const list = kind === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
  return list.find((c) => c.id === id) ?? list[list.length - 1];
}

