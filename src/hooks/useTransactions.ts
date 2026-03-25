import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { getExchangeRates, convertToINR, convertFromINR } from '../lib/currency';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type NewTransaction = Database['public']['Tables']['transactions']['Insert'];

export function useTransactions(filters?: any) {
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name),
          from_account:accounts!transactions_from_account_id_fkey(name, currency, balance, balance_in_inr),
          to_account:accounts!transactions_to_account_id_fkey(name, currency, balance, balance_in_inr)
        `)
        .order('transaction_date', { ascending: false })
        .limit(500);

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.accountId) {
        query = query.or(`from_account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: Omit<NewTransaction, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const rates = await getExchangeRates();
      const currency = (transaction.currency as any) || 'INR';
      const exchangeRate = rates[currency] || 1;
      const amountInINR = await convertToINR(transaction.amount, currency);

      const { data, error } = await supabase
        .from('transactions')
        .insert([{ 
          ...transaction, 
          user_id: user.id,
          amount_in_inr: amountInINR,
          exchange_rate: exchangeRate,
          currency: currency
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { data: oldTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      const rates = await getExchangeRates();
      const currency = (updates.currency as any) || oldTransaction?.currency || 'INR';
      const amount = updates.amount ?? oldTransaction?.amount ?? 0;
      const amountInINR = await convertToINR(amount, currency);
      const exchangeRate = rates[currency] || 1;

      const { data, error } = await supabase
        .from('transactions')
        .update({
          ...updates,
          amount_in_inr: amountInINR,
          exchange_rate: exchangeRate,
          currency: currency
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
