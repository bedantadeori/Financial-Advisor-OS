import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useCCBilling } from '../hooks/useCCBilling';
import { useGoals } from '../hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { formatCurrency, formatDate } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function Dashboard() {
  const { activeAccounts } = useAccounts();
  const { transactions } = useTransactions();
  const { bills } = useCCBilling();
  const { goals } = useGoals();

  // Metrics
  const bankBalance = activeAccounts
    .filter(a => a.type === 'bank')
    .reduce((sum, a) => sum + (a.balance || 0), 0);
  
  const cashBalance = activeAccounts
    .filter(a => a.type === 'cash')
    .reduce((sum, a) => sum + (a.balance || 0), 0);
  
  const ccDebt = activeAccounts
    .filter(a => a.type === 'credit_card')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const liquidNetWorth = bankBalance + cashBalance - ccDebt;

  // CC Billing Info
  const today = new Date().toISOString().split('T')[0];
  const upcomingBill = [...bills]
    .filter(b => b.due_date && b.due_date >= today)
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))[0];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Command Center</h2>
        <p className="text-zinc-500 text-sm">Real-time financial overview</p>
      </header>

      {/* Top Row - Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Liquid Net Worth" 
          value={liquidNetWorth} 
          icon={TrendingUp}
          color="text-emerald-500"
        />
        <MetricCard 
          title="Bank Balance" 
          value={bankBalance} 
          icon={Wallet}
          color="text-blue-500"
        />
        <MetricCard 
          title="Cash in Hand" 
          value={cashBalance} 
          icon={TrendingUp}
          color="text-emerald-500"
        />
        <MetricCard 
          title="Total CC Debt" 
          value={ccDebt} 
          icon={CreditCard}
          color="text-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CC Billing Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>CC Billing Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingBill ? (
              <>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-zinc-500">Upcoming Bill Due</p>
                    <p className="text-xl font-bold">{formatCurrency(upcomingBill.bill_amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Due Date</p>
                    <p className="text-sm font-medium">{formatDate(upcomingBill.due_date)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Cycle: {formatDate(upcomingBill.statement_date)}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full w-[65%]" />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-500">No active billing cycles</p>
            )}
          </CardContent>
        </Card>

        {/* Goals Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.slice(0, 4).map(goal => {
                const progress = ((goal.current_amount || 0) / goal.target_amount) * 100;
                const isUrgent = goal.deadline && 
                  new Date(goal.deadline).getTime() - new Date().getTime() < 60 * 24 * 60 * 60 * 1000 &&
                  progress < 80;

                return (
                  <div key={goal.id} className="p-3 border border-zinc-800 rounded-md bg-zinc-950/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium">{goal.name}</h4>
                      {isUrgent && <AlertCircle className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">{formatCurrency(goal.current_amount)}</span>
                      <span className="text-zinc-500">of {formatCurrency(goal.target_amount)}</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all",
                          isUrgent ? "bg-amber-500" : "bg-blue-500"
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <button className="text-xs text-emerald-500 hover:underline">View All</button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Account</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {transactions.slice(0, 10).map((t: any) => (
                  <tr key={t.id} className="group hover:bg-zinc-800/50">
                    <td className="py-2 text-zinc-400">{formatDate(t.transaction_date)}</td>
                    <td className="py-2 font-medium">{t.description}</td>
                    <td className="py-2">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] uppercase text-zinc-300">
                        {t.from_account?.name || t.to_account?.name}
                      </span>
                    </td>
                    <td className="py-2 text-zinc-400">{t.category?.name || '-'}</td>
                    <td className={cn(
                      "py-2 text-right font-mono",
                      t.type === 'income' ? 'text-emerald-500' : 
                      t.type === 'expense' ? 'text-red-500' : 'text-blue-500'
                    )}>
                      {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-2 rounded-md bg-zinc-800", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold tracking-tight">{formatCurrency(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
