export type CurrencyCode = 'USD' | 'NGN' | 'GBP' | 'EUR';

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** Dummy exchange rate: 1 USD = rate units of this currency. */
  rate: number;
  decimals: number;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1, decimals: 2 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1550, decimals: 0 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79, decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, decimals: 2 },
};

export const CURRENCY_LIST: CurrencyInfo[] = Object.values(CURRENCIES);

