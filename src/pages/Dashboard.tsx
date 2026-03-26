import { useState, useEffect, useMemo } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useCCBilling } from '../hooks/useCCBilling';
import { useGoals } from '../hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { formatCurrency, formatDate } from '../lib/utils';
import { Drawer } from '../components/ui/Drawer';
import { Button } from '../components/ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard,
  AlertCircle,
  Calendar,
  Tag,
  Settings,
  Check,
  Plus,
  Target
} from 'lucide-react';
import { cn } from '../lib/utils';

const DEFAULT_WIDGETS = ['net-worth', 'bank-balance', 'cash-balance', 'cc-debt'];

export default function Dashboard() {
  const { activeAccounts } = useAccounts();
  const { transactions } = useTransactions();
  const { bills } = useCCBilling();
  const { goals } = useGoals();
  const [isMobile, setIsMobile] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  });

  useEffect(() => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(visibleWidgets));
  }, [visibleWidgets]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Metrics (Always in INR)
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
  
  const ccAccounts = activeAccounts.filter(a => a.type === 'credit_card');
  
  const ccBillingData = useMemo(() => {
    return ccAccounts.map(account => {
      const cardBills = bills.filter(b => b.credit_card_id === account.id);
      
      const current = [...cardBills]
        .filter(b => b.statement_date && b.statement_date >= today)
        .sort((a, b) => (a.statement_date || '').localeCompare(b.statement_date || ''))[0];
      
      const upcoming = [...cardBills]
        .filter(b => b.due_date && b.due_date >= today && b.statement_date && b.statement_date < today)
        .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))[0];

      return { account, current, upcoming };
    }).filter(d => d.current || d.upcoming);
  }, [ccAccounts, bills, today]);

  const toggleWidget = (id: string) => {
    setVisibleWidgets(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const widgetOptions = [
    { id: 'net-worth', label: 'Liquid Net Worth', group: 'Core Metrics' },
    { id: 'bank-balance', label: 'Total Bank Balance', group: 'Core Metrics' },
    { id: 'cash-balance', label: 'Total Cash in Hand', group: 'Core Metrics' },
    { id: 'cc-debt', label: 'Total CC Debt', group: 'Core Metrics' },
    ...activeAccounts.map(a => ({ id: `account-${a.id}`, label: `${a.name} Balance`, group: 'Accounts' })),
    ...goals.map(g => ({ id: `goal-${g.id}`, label: `${g.name} Progress`, group: 'Goals' })),
  ];

  const groupedOptions = useMemo(() => {
    const groups: Record<string, typeof widgetOptions> = {};
    widgetOptions.forEach(opt => {
      if (!groups[opt.group]) groups[opt.group] = [];
      groups[opt.group].push(opt);
    });
    return groups;
  }, [widgetOptions]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Command Center</h2>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <p className="text-zinc-500 text-sm">Real-time financial overview (INR)</p>
        </div>
      </header>

      <Drawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Customize Dashboard"
      >
        <div className="space-y-6 pt-4 pb-20">
          {Object.entries(groupedOptions).map(([group, options]) => (
            <div key={group} className="space-y-2">
              <h3 className="text-[10px] uppercase font-black text-zinc-500 tracking-widest px-1">{group}</h3>
              <div className="grid grid-cols-1 gap-1">
                {(options as any[]).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => toggleWidget(opt.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                      visibleWidgets.includes(opt.id) 
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    {visibleWidgets.includes(opt.id) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4 opacity-30" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Top Row - Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleWidgets.includes('net-worth') && (
          <MetricCard 
            title="Liquid Net Worth" 
            value={liquidNetWorth} 
            icon={TrendingUp}
            color="text-emerald-500"
          />
        )}
        {visibleWidgets.includes('bank-balance') && (
          <MetricCard 
            title="Bank Balance" 
            value={bankBalance} 
            icon={Wallet}
            color="text-blue-500"
          />
        )}
        {visibleWidgets.includes('cash-balance') && (
          <MetricCard 
            title="Cash in Hand" 
            value={cashBalance} 
            icon={TrendingUp}
            color="text-emerald-500"
          />
        )}
        {visibleWidgets.includes('cc-debt') && (
          <MetricCard 
            title="Total CC Debt" 
            value={ccDebt} 
            icon={CreditCard}
            color="text-red-500"
          />
        )}
        {activeAccounts.map(a => visibleWidgets.includes(`account-${a.id}`) && (
          <MetricCard 
            key={a.id}
            title={a.name} 
            value={a.balance} 
            currency={a.currency}
            icon={a.type === 'credit_card' ? CreditCard : Wallet}
            color={a.type === 'credit_card' ? 'text-red-500' : 'text-emerald-500'}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CC Billing Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>CC Billing Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ccBillingData.length > 0 ? (
              <div className="space-y-8">
                {ccBillingData.map(({ account, current, upcoming }) => (
                  <div key={account.id} className="space-y-4 pb-4 border-b border-zinc-800 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-3 h-3 text-zinc-500" />
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{account.name}</span>
                    </div>
                    {current && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Current Cycle</p>
                            <p className="text-2xl font-black font-mono text-emerald-500">
                              {formatCurrency(current.bill_amount)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Statement</p>
                            <p className="text-xs font-bold">{formatDate(current.statement_date)}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">
                            <span>Progress to Statement</span>
                            <span>Due {formatDate(current.due_date)}</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[45%]" />
                          </div>
                        </div>
                      </div>
                    )}

                    {upcoming && (
                      <div className={cn(
                        "p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/30",
                        !current && "border-red-500/30 bg-red-500/[0.02]"
                      )}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-zinc-800 text-red-500">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Upcoming Bill</p>
                              <p className="text-xs font-bold">{formatCurrency(upcoming.bill_amount)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Due In</p>
                            <p className="text-[10px] font-bold text-red-400">{formatDate(upcoming.due_date)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
              {goals.filter(g => visibleWidgets.includes(`goal-${g.id}`) || visibleWidgets.length === 0).slice(0, 4).map(goal => {
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
              {goals.length === 0 && <p className="text-sm text-zinc-500">No active goals</p>}
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
          {!isMobile ? (
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
                        {formatCurrency(t.amount, t.currency, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((t: any) => (
                <div key={t.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-zinc-200">{t.description}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[8px] uppercase text-zinc-400 font-bold">
                          {t.from_account?.name || t.to_account?.name}
                        </span>
                      </div>
                    </div>
                    <span className={cn(
                      "font-mono font-bold",
                      t.type === 'income' ? 'text-emerald-500' : 
                      t.type === 'expense' ? 'text-red-500' : 'text-blue-500'
                    )}>
                      {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                      {formatCurrency(t.amount, t.currency, false)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-wider pt-2 border-t border-zinc-800/30">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(t.transaction_date)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      {t.category?.name || 'No Category'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, currency = 'INR' }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-2 rounded-md bg-zinc-800", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate">{title}</p>
          <div className="flex flex-col">
            <p className="text-xl font-black tracking-tight font-mono">
              {formatCurrency(value, currency, false)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
