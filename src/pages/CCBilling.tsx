import { useState } from 'react';
import { useCCBilling } from '../hooks/useCCBilling';
import { useAccounts } from '../hooks/useAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { ChevronDown, ChevronUp, CreditCard, ReceiptText } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CCBilling() {
  const { activeAccounts } = useAccounts();
  const ccAccounts = activeAccounts.filter(a => a.type === 'credit_card');
  const [selectedCC, setSelectedCC] = useState<string>(ccAccounts[0]?.id || '');
  const { bills, details } = useCCBilling(selectedCC);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);

  const toggleCycle = (statementDate: string) => {
    setExpandedCycle(expandedCycle === statementDate ? null : statementDate);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CC Billing</h2>
          <p className="text-zinc-500 text-sm">Statement history and cycle details</p>
        </div>
        <div className="w-64">
          <label className="text-xs text-zinc-500 mb-1 block uppercase font-bold">Select Card</label>
          <Select 
            value={selectedCC} 
            onChange={(e) => setSelectedCC(e.target.value)}
          >
            <option value="">All Cards</option>
            {ccAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
      </header>

      {bills.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-zinc-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No billing cycles found for this card.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bills.map((bill, index) => {
            const isExpanded = expandedCycle === bill.statement_date;
            const cycleTransactions = details.filter(d => d.statement_date === bill.statement_date);
            
            return (
              <Card key={`${bill.credit_card_id}-${bill.statement_date}`} className={cn(
                "transition-all",
                index === 0 && "border-emerald-500/30 bg-emerald-500/[0.02]"
              )}>
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleCycle(bill.statement_date!)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded bg-zinc-800",
                      index === 0 ? "text-emerald-500" : "text-zinc-400"
                    )}>
                      <ReceiptText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{bill.credit_card_name}</h4>
                        {index === 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                            Current Cycle
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">
                        Statement: {formatDate(bill.statement_date)} • Due: {formatDate(bill.due_date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 uppercase font-bold">Bill Amount</p>
                      <p className="text-lg font-mono font-bold">{formatCurrency(bill.bill_amount)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-800 p-4 bg-zinc-950/50">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-zinc-500 border-b border-zinc-800">
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Description</th>
                          <th className="pb-2 font-medium">Category</th>
                          <th className="pb-2 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {cycleTransactions.map(t => (
                          <tr key={t.transaction_id}>
                            <td className="py-2 text-zinc-400">{formatDate(t.transaction_date)}</td>
                            <td className="py-2 font-medium">{t.description}</td>
                            <td className="py-2 text-zinc-500">{t.category_name || '-'}</td>
                            <td className="py-2 text-right font-mono">{formatCurrency(t.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
