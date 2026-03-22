import { useState } from 'react';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils';
import { Plus, Archive, Edit2, Info, Power } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';

export default function FixedExpenses() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const { fixedExpenses, createFixedExpense, updateFixedExpense, archiveFixedExpense } = useFixedExpenses();
  const { activeAccounts } = useAccounts();
  const { activeCategories } = useCategories();
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      name: '',
      amount: '',
      billing_type: 'bank' as 'bank' | 'cc',
      due_day: 1,
      account_id: '',
      category_id: ''
    }
  });

  const billingType = watch('billing_type');

  const onSubmit = async (data: any) => {
    try {
      if (editingExpense) {
        await updateFixedExpense.mutateAsync({
          id: editingExpense.id,
          ...data,
          amount: parseFloat(data.amount),
          due_day: data.billing_type === 'bank' ? parseInt(data.due_day) : null,
        });
      } else {
        await createFixedExpense.mutateAsync({
          ...data,
          amount: parseFloat(data.amount),
          due_day: data.billing_type === 'bank' ? parseInt(data.due_day) : null,
          is_active: true,
        });
      }
      setIsAddOpen(false);
      setEditingExpense(null);
      reset();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (fe: any) => {
    setEditingExpense(fe);
    setIsAddOpen(true);
    setValue('name', fe.name);
    setValue('amount', fe.amount.toString());
    setValue('billing_type', fe.billing_type);
    setValue('due_day', fe.due_day || 1);
    setValue('account_id', fe.account_id);
    setValue('category_id', fe.category_id || '');
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await updateFixedExpense.mutateAsync({ id, is_active: !currentStatus });
  };

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this fixed expense?')) {
      await archiveFixedExpense.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fixed Expenses</h2>
          <p className="text-zinc-500 text-sm">Recurring monthly commitments</p>
        </div>
        <Button onClick={() => {
          setEditingExpense(null);
          reset();
          setIsAddOpen(true);
        }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Fixed Expense
        </Button>
      </header>

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 text-sm text-blue-400">
        <Info className="w-5 h-5 shrink-0" />
        <p>
          Fixed expenses are auto-injected as pending transactions on the 15th of each month. 
          CC expenses are dated to the 1st of the following month. 
          Bank expenses are dated to their exact deduction day.
        </p>
      </div>

      {isAddOpen && (
        <Card className="border-emerald-500/50">
          <CardHeader>
            <CardTitle>{editingExpense ? 'Edit Fixed Expense' : 'New Fixed Expense'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Name</label>
                <Input {...register('name', { required: true })} placeholder="e.g. Rent" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Amount</label>
                <Input type="number" step="0.01" {...register('amount', { required: true })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Billing Type</label>
                <Select {...register('billing_type', { required: true })}>
                  <option value="bank">Bank</option>
                  <option value="cc">CC</option>
                </Select>
              </div>
              {billingType === 'bank' && (
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Deduction day (1-28)</label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="28" 
                    {...register('due_day', { 
                      required: billingType === 'bank',
                      min: 1,
                      max: 28
                    })} 
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Charge to Account</label>
                <Select {...register('account_id', { required: true })}>
                  <option value="">Select Account</option>
                  {activeAccounts
                    .filter(a => a.type !== 'cash')
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Category</label>
                <Select {...register('category_id')}>
                  <option value="">None</option>
                  {activeCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={() => {
                  setIsAddOpen(false);
                  setEditingExpense(null);
                  reset();
                }}>Cancel</Button>
                <Button type="submit" disabled={createFixedExpense.isPending || updateFixedExpense.isPending}>
                  {createFixedExpense.isPending || updateFixedExpense.isPending ? 'Saving...' : 'Save Fixed Expense'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium hidden sm:table-cell">Account</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Category</th>
                  <th className="p-4 font-medium hidden md:table-cell">Type</th>
                  <th className="p-4 font-medium hidden md:table-cell">Due day</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium">Active</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {fixedExpenses.map((fe: any) => (
                  <tr key={fe.id} className={cn(
                    "group hover:bg-zinc-800/50",
                    !fe.is_active && "opacity-50"
                  )}>
                    <td className="p-4 font-medium">
                      <div className="flex flex-col">
                        <span>{fe.name}</span>
                        <div className="flex items-center gap-2 sm:hidden">
                          <span className="text-[8px] text-zinc-500 uppercase">{fe.account?.name}</span>
                          <span className={cn(
                            "text-[8px] uppercase font-bold",
                            fe.billing_type === 'bank' ? "text-blue-400" : "text-purple-400"
                          )}>
                            {fe.billing_type === 'bank' ? 'Bank' : 'CC'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-400 hidden sm:table-cell">{fe.account?.name}</td>
                    <td className="p-4 text-zinc-400 hidden lg:table-cell">{fe.category?.name || '-'}</td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold",
                        fe.billing_type === 'bank' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                      )}>
                        {fe.billing_type === 'bank' ? 'Bank' : 'CC'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 hidden md:table-cell">
                      {fe.billing_type === 'bank' ? fe.due_day : '-'}
                    </td>
                    <td className="p-4 text-right font-mono font-bold">
                      {formatCurrency(fe.amount)}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleToggle(fe.id, fe.is_active)}
                        className={cn(
                          "p-1 rounded transition-colors",
                          fe.is_active ? "text-emerald-500 hover:bg-emerald-500/10" : "text-zinc-500 hover:bg-zinc-500/10"
                        )}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleEdit(fe)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-zinc-500 hover:text-red-400"
                          onClick={() => handleArchive(fe.id)}
                        >
                          <Archive className="w-3 h-3" />
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
