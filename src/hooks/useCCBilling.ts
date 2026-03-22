import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCCBilling(creditCardId?: string) {
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

  return {
    bills: billsQuery.data ?? [],
    details: detailsQuery.data ?? [],
    isLoading: billsQuery.isLoading || detailsQuery.isLoading,
  };
}
