import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { formatCurrencyWithSymbol, type Currency } from './currency';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency: Currency = 'INR', showINR: boolean = false, inrAmount?: number) {
  if (amount === null || amount === undefined) return formatCurrencyWithSymbol(0, currency);
  
  const formatted = formatCurrencyWithSymbol(amount, currency);
  
  if (showINR && currency !== 'INR' && inrAmount !== undefined) {
    return `${formatted} (${formatCurrencyWithSymbol(inrAmount, 'INR')})`;
  }
  
  return formatted;
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '-';
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
