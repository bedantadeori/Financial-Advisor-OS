import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useGoals } from '../hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Filter, Search, Trash2, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';

export default function Transactions() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const { transactions, createTransaction, updateTransaction, deleteTransaction, isLoading } = useTransactions();
  const { activeAccounts } = useAccounts();
  const { activeCategories } = useCategories();
  const { goals } = useGoals();

  const { register, handleSubmit, watch, reset, setValue } = useForm();
  const type = watch('type', 'expense');

  const onSubmit = async (data: any) => {
    try {
      if (editingTransaction) {
        await updateTransaction.mutateAsync({
          id: editingTransaction.id,
          ...data,
          amount: parseFloat(data.amount),
          is_planning_income: data.is_planning_income || false,
        });
      } else {
        await createTransaction.mutateAsync({
          ...data,
          amount: parseFloat(data.amount),
          is_planning_income: data.is_planning_income || false,
        });
      }
      setIsAddOpen(false);
      setEditingTransaction(null);
      reset();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (t: any) => {
    setEditingTransaction(t);
    setIsAddOpen(true);
    // Populate form
    Object.keys(t).forEach(key => {
      if (key === 'transaction_date') {
        setValue(key, t[key].split('T')[0]);
      } else {
        setValue(key, t[key]);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ledger</h2>
          <p className="text-zinc-500 text-sm">Full transaction history</p>
        </div>
        <Button onClick={() => {
          setEditingTransaction(null);
          reset();
          setIsAddOpen(true);
        }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </header>

      {isAddOpen && (
        <Card className="border-emerald-500/50">
          <CardHeader>
            <CardTitle>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Date</label>
                <Input type="date" {...register('transaction_date', { required: true })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Type</label>
                <Select {...register('type', { required: true })}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Amount</label>
                <Input type="number" step="0.01" {...register('amount', { required: true })} />
              </div>
              
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-zinc-500">Description</label>
                <Input {...register('description', { required: true })} />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Status</label>
                <Select {...register('status')}>
                  <option value="posted">Posted</option>
                  <option value="pending">Pending</option>
                </Select>
              </div>

              {(type === 'expense' || type === 'transfer') && (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">From Account</label>
                  <Select {...register('from_account_id', { required: true })}>
                    <option value="">Select Account</option>
                    {activeAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                    ))}
                  </Select>
                </div>
              )}

              {(type === 'income' || type === 'transfer') && (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">To Account</label>
                  <Select {...register('to_account_id', { required: true })}>
                    <option value="">Select Account</option>
                    {activeAccounts
                      .filter(a => type === 'income' ? a.type !== 'credit_card' : true)
                      .map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                  </Select>
                </div>
              )}

              {type === 'transfer' && (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Link to Goal (Optional)</label>
                  <Select {...register('goal_id')}>
                    <option value="">None</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </Select>
                </div>
              )}

              {type !== 'transfer' && (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Category</label>
                  <Select {...register('category_id')}>
                    <option value="">None</option>
                    {activeCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
              )}

              {type === 'income' && (
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" {...register('is_planning_income')} id="planning" />
                  <label htmlFor="planning" className="text-xs text-zinc-400">Planning Income</label>
                </div>
              )}

              <div className="md:col-span-3 flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={() => {
                  setIsAddOpen(false);
                  setEditingTransaction(null);
                  reset();
                }}>Cancel</Button>
                <Button type="submit" disabled={createTransaction.isPending || updateTransaction.isPending}>
                  {createTransaction.isPending || updateTransaction.isPending ? 'Saving...' : 'Save Transaction'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input placeholder="Search transactions..." className="pl-9" />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium hidden md:table-cell">Type</th>
                  <th className="pb-2 font-medium hidden lg:table-cell">Account</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Category</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {transactions.map((t: any) => (
                  <tr key={t.id} className="group hover:bg-zinc-800/50">
                    <td className="py-2 text-zinc-400 whitespace-nowrap">{formatDate(t.transaction_date)}</td>
                    <td className="py-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate max-w-[120px] sm:max-w-none">{t.description}</span>
                        <div className="flex items-center gap-2 md:hidden">
                          <span className={cn(
                            "text-[8px] uppercase font-bold",
                            t.type === 'income' ? 'text-emerald-500' :
                            t.type === 'expense' ? 'text-red-500' :
                            'text-blue-500'
                          )}>
                            {t.type}
                          </span>
                          {t.status === 'pending' && (
                            <span className="text-[8px] text-amber-500 uppercase font-bold">Pending</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 hidden md:table-cell">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] uppercase font-bold",
                        t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' :
                        t.type === 'expense' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      )}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2 hidden lg:table-cell">
                      <div className="flex flex-col text-xs text-zinc-400">
                        {t.from_account?.name && <span>From: {t.from_account.name}</span>}
                        {t.to_account?.name && <span>To: {t.to_account.name}</span>}
                      </div>
                    </td>
                    <td className="py-2 text-zinc-400 hidden sm:table-cell">{t.category?.name || '-'}</td>
                    <td className={cn(
                      "py-2 text-right font-mono font-bold",
                      t.type === 'income' ? 'text-emerald-500' : 
                      t.type === 'expense' ? 'text-red-500' : 'text-blue-500'
                    )}>
                      {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleEdit(t)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-red-500 hover:text-red-400"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
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
