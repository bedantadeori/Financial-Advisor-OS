import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCCBilling(creditCardId?: string) {
  const queryClient = useQueryClient();

  const billsQuery = useQuery({
    queryKey: ['cc_monthly_bills', creditCardId],
    queryFn: async () => {
      let query = supabase.from('cc_monthly_bills').select('*');
      if (creditCardId) query = query.eq('credit_card_id', creditCardId);
      
      const { data, error } = await query.order('statement_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const detailsQuery = useQuery({
    queryKey: ['cc_transaction_details', creditCardId],
    queryFn: async () => {
      let query = supabase.from('cc_transaction_details').select('*');
      if (creditCardId) query = query.eq('credit_card_id', creditCardId);
      
      const { data, error } = await query.order('transaction_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async ({ creditCardId, statementDate }: { creditCardId: string; statementDate: string }) => {
      const { error } = await supabase
        .from('cc_monthly_bills')
        .update({ status: 'paid' })
        .match({ credit_card_id: creditCardId, statement_date: statementDate });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cc_monthly_bills'] });
    },
  });

  return {
    bills: billsQuery.data ?? [],
    details: detailsQuery.data ?? [],
    isLoading: billsQuery.isLoading || detailsQuery.isLoading,
    markAsPaid,
  };
}
