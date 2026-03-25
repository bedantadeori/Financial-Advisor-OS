import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { convertToINR } from '../lib/currency';

type Account = Database['public']['Tables']['accounts']['Row'];
type NewAccount = Database['public']['Tables']['accounts']['Insert'];

export function useAccounts() {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .is('archived_at', null)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const activeAccountsQuery = useQuery({
    queryKey: ['accounts', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .is('archived_at', null)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createAccount = useMutation({
    mutationFn: async (account: Omit<NewAccount, 'user_id'>) => {
      console.log('Creating account:', account);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const balanceInINR = await convertToINR(account.balance || 0, (account.currency as any) || 'INR');
      console.log('Calculated balance_in_inr:', balanceInINR);
      
      const { data, error } = await supabase
        .from('accounts')
        .insert([{ 
          ...account, 
          user_id: user.id,
          balance_in_inr: balanceInINR
        }])
        .select()
        .single();
      if (error) {
        console.error('Supabase error creating account:', error);
        throw error;
      }
      console.log('Account created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      console.log('Updating account:', id, updates);
      
      // Fetch latest account data to ensure accurate balance_in_inr calculation
      const { data: currentAccount, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching current account for update:', fetchError);
        throw fetchError;
      }

      let balanceInINR = updates.balance_in_inr;
      
      if (updates.balance !== undefined || updates.currency !== undefined) {
        const balance = updates.balance ?? currentAccount.balance ?? 0;
        const currency = updates.currency ?? currentAccount.currency ?? 'INR';
        balanceInINR = await convertToINR(balance, currency as any);
        console.log('Recalculated balance_in_inr:', balanceInINR);
      }

      const { data, error } = await supabase
        .from('accounts')
        .update({
          ...updates,
          balance_in_inr: balanceInINR
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error updating account:', error);
        throw error;
      }
      console.log('Account updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const archiveAccount = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('accounts')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  return {
    accounts: accountsQuery.data ?? [],
    activeAccounts: activeAccountsQuery.data ?? [],
    isLoading: accountsQuery.isLoading,
    createAccount,
    updateAccount,
    archiveAccount,
  };
}
