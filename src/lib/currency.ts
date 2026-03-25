
export type Currency = 'INR' | 'USD' | 'VND';

export const CURRENCIES: Currency[] = ['INR', 'USD', 'VND'];

export interface ExchangeRates {
  [key: string]: number;
}

let cachedRates: ExchangeRates | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  if (cachedRates && (now - lastFetchTime < CACHE_DURATION)) {
    console.log('Using cached exchange rates');
    return cachedRates;
  }

  console.log('Fetching fresh exchange rates...');
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/INR');
    const data = await response.json();
    if (data && data.rates) {
      console.log('Successfully fetched exchange rates');
      cachedRates = data.rates;
      lastFetchTime = now;
      return cachedRates!;
    }
    throw new Error('Invalid exchange rate data');
  } catch (error) {
    console.error('Failed to fetch exchange rates, using fallbacks:', error);
    // Fallback rates if fetch fails
    return {
      INR: 1,
      USD: 0.012,
      VND: 300,
    };
  }
}

export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  const rates = await getExchangeRates();
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  // Single-hop calculation using the live rate ratio
  const convertedAmount = (amount / fromRate) * toRate;
  
  return Number(convertedAmount.toFixed(2));
}

export function formatCurrencyWithSymbol(amount: number | null | undefined, currency: Currency = 'INR') {
  if (amount === null || amount === undefined) amount = 0;
  
  const locales: Record<Currency, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    VND: 'vi-VN'
  };

  return new Intl.NumberFormat(locales[currency] || 'en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(amount);
}
