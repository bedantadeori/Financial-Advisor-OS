import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { convertCurrency } from '../lib/currency';

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
          from_account:accounts!transactions_from_account_id_fkey(name, currency, balance),
          to_account:accounts!transactions_to_account_id_fkey(name, currency, balance)
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
      
      const transactionCurrency = (transaction.currency as any) || 'INR';
      
      let fromAccountAmount = transaction.amount;
      let toAccountAmount = transaction.amount;

      // 1. Single-hop conversion for From Account
      if (transaction.from_account_id) {
        const { data: fromAcc } = await supabase.from('accounts').select('currency').eq('id', transaction.from_account_id).single();
        if (fromAcc && fromAcc.currency !== transactionCurrency) {
          fromAccountAmount = await convertCurrency(transaction.amount, transactionCurrency, fromAcc.currency);
        }
      }

      // 2. Single-hop conversion for To Account
      if (transaction.to_account_id) {
        const { data: toAcc } = await supabase.from('accounts').select('currency').eq('id', transaction.to_account_id).single();
        if (toAcc && toAcc.currency !== transactionCurrency) {
          toAccountAmount = await convertCurrency(transaction.amount, transactionCurrency, toAcc.currency);
        }
      }

      // Calculate base INR for historical reporting if not already INR
      const amountInINR = transactionCurrency === 'INR' 
        ? transaction.amount 
        : await convertCurrency(transaction.amount, transactionCurrency, 'INR');

      const { data, error } = await supabase
        .from('transactions')
        .insert([{ 
          ...transaction, 
          user_id: user.id,
          amount_in_inr: amountInINR, 
          from_account_amount: fromAccountAmount,
          to_account_amount: toAccountAmount      
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

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { data: oldTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      const transactionCurrency = (updates.currency as any) || oldTransaction?.currency || 'INR';
      const amount = updates.amount ?? oldTransaction?.amount ?? 0;

      let fromAccountAmount = amount;
      let toAccountAmount = amount;

      const fromAccountId = updates.from_account_id !== undefined ? updates.from_account_id : oldTransaction?.from_account_id;
      const toAccountId = updates.to_account_id !== undefined ? updates.to_account_id : oldTransaction?.to_account_id;

      if (fromAccountId) {
        const { data: fromAcc } = await supabase.from('accounts').select('currency').eq('id', fromAccountId).single();
        if (fromAcc && fromAcc.currency !== transactionCurrency) {
          fromAccountAmount = await convertCurrency(amount, transactionCurrency, fromAcc.currency);
        }
      }

      if (toAccountId) {
        const { data: toAcc } = await supabase.from('accounts').select('currency').eq('id', toAccountId).single();
        if (toAcc && toAcc.currency !== transactionCurrency) {
          toAccountAmount = await convertCurrency(amount, transactionCurrency, toAcc.currency);
        }
      }

      const amountInINR = transactionCurrency === 'INR' 
        ? amount 
        : await convertCurrency(amount, transactionCurrency, 'INR');

      const { data, error } = await supabase
        .from('transactions')
        .update({
          ...updates,
          amount_in_inr: amountInINR,
          from_account_amount: fromAccountAmount,
          to_account_amount: toAccountAmount
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

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
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
