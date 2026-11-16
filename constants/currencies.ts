export type CurrencyCode = string;

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** Exchange rate relative to USD: 1 USD = rate units of this currency. */
  rate: number;
  decimals: number;
};

export const DEFAULT_FAVORITE_CURRENCIES: CurrencyCode[] = ['USD', 'NGN', 'GBP', 'EUR'];

/** Fallback metadata & initial rates used before live Convex rates finish loading. */
export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, decimals: 2 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1550, decimals: 0 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, decimals: 2 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate: 1.38, decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.52, decimals: 2 },
  GHS: { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', rate: 15.5, decimals: 2 },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 129, decimals: 2 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 17.8, decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 153, decimals: 0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.2, decimals: 2 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 84, decimals: 2 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', rate: 0.88, decimals: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67, decimals: 2 },
};

export const CURRENCY_LIST: CurrencyInfo[] = Object.values(CURRENCIES);
