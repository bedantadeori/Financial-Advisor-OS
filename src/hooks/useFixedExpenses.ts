import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type FixedExpense = Database['public']['Tables']['fixed_expenses']['Row'];
type NewFixedExpense = Database['public']['Tables']['fixed_expenses']['Insert'];

export function useFixedExpenses() {
  const queryClient = useQueryClient();

  const fixedExpensesQuery = useQuery({
    queryKey: ['fixed_expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .select(`
          *,
          account:accounts(name),
          category:categories(name)
        `)
        .is('archived_at', null)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createFixedExpense = useMutation({
    mutationFn: async (expense: Omit<NewFixedExpense, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('fixed_expenses')
        .insert([{ ...expense, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
    },
  });

  const updateFixedExpense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FixedExpense> & { id: string }) => {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
    },
  });

  const archiveFixedExpense = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed_expenses'] });
    },
  });

  return {
    fixedExpenses: fixedExpensesQuery.data ?? [],
    isLoading: fixedExpensesQuery.isLoading,
    createFixedExpense,
    updateFixedExpense,
    archiveFixedExpense,
  };
}
