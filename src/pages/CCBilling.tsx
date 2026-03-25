import { useState, useEffect } from 'react';
import { useCCBilling } from '../hooks/useCCBilling';
import { useAccounts } from '../hooks/useAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { ChevronDown, ChevronUp, CreditCard, ReceiptText, Calendar, Tag, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CCBilling() {
  const { activeAccounts } = useAccounts();
  const ccAccounts = activeAccounts.filter(a => a.type === 'credit_card');
  const [selectedCC, setSelectedCC] = useState<string>(ccAccounts[0]?.id || '');
  const { bills, details } = useCCBilling(selectedCC);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  
  const closestFutureBill = [...bills]
    .filter(b => b.statement_date && b.statement_date >= today)
    .sort((a, b) => (a.statement_date || '').localeCompare(b.statement_date || ''))[0];

  const currentCycleIndex = bills.findIndex(b => b === closestFutureBill);
  const finalCurrentCycleIndex = currentCycleIndex === -1 ? 0 : currentCycleIndex;

  const toggleCycle = (statementDate: string) => {
    setExpandedCycle(expandedCycle === statementDate ? null : statementDate);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CC Billing</h2>
          <p className="text-zinc-500 text-sm">Statement history and cycle details</p>
        </div>
        <div className="w-full md:w-64">
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
                index === finalCurrentCycleIndex && "border-emerald-500/30 bg-emerald-500/[0.02]"
              )}>
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleCycle(bill.statement_date!)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded bg-zinc-800",
                      index === finalCurrentCycleIndex ? "text-emerald-500" : "text-zinc-400"
                    )}>
                      <ReceiptText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{bill.credit_card_name}</h4>
                        {index === finalCurrentCycleIndex && (
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
                  
                  <div className="flex items-center gap-4 md:gap-8">
                    <div className="text-right">
                      <p className="text-[10px] md:text-xs text-zinc-500 uppercase font-bold">Bill Amount</p>
                      <p className="text-sm md:text-lg font-mono font-bold">{formatCurrency(bill.bill_amount)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-800 p-4 bg-zinc-950/50">
                    {!isMobile ? (
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
                    ) : (
                      <div className="space-y-3">
                        {cycleTransactions.map(t => (
                          <div key={t.transaction_id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-zinc-200">{t.description}</h5>
                              <span className="font-mono font-bold text-zinc-100">{formatCurrency(t.amount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                {formatDate(t.transaction_date)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Tag className="w-3 h-3" />
                                {t.category_name || 'No Category'}
                              </div>
                            </div>
                          </div>
                        ))}
                        {cycleTransactions.length === 0 && (
                          <div className="text-center py-4 text-zinc-500 text-xs">
                            No transactions in this cycle.
                          </div>
                        )}
                      </div>
                    )}
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
