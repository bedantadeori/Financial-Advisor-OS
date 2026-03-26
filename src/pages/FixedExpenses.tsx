import { useState, useEffect } from 'react';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils';
import { Plus, Archive, Edit2, Info, Power, MoreVertical, Wallet, Tag, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';
import { Drawer } from '../components/ui/Drawer';

function FixedExpenseForm({ id, onSubmit, onCancel, register, editingExpense, isPending, billingType, activeAccounts, activeCategories, showButtons = true }: any) {
  return (
    <form id={id} onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            className="w-full"
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
            .filter((a: any) => a.type !== 'cash')
            .map((a: any) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-500">Category</label>
        <Select {...register('category_id')}>
          <option value="">None</option>
          {activeCategories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className={cn("md:col-span-2 flex justify-end gap-2 pt-4", !showButtons && "hidden md:flex")}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Fixed Expense'}
        </Button>
      </div>
    </form>
  );
}

export default function FixedExpenses() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const sanitizedData = {
        ...data,
        amount: parseFloat(data.amount),
        category_id: data.category_id || null,
        due_day: data.billing_type === 'bank' ? parseInt(data.due_day) : null,
      };

      if (editingExpense) {
        await updateFixedExpense.mutateAsync({
          id: editingExpense.id,
          ...sanitizedData,
        });
      } else {
        await createFixedExpense.mutateAsync({
          ...sanitizedData,
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
    reset({
      name: fe.name,
      amount: fe.amount.toString(),
      billing_type: fe.billing_type,
      due_day: fe.due_day || 1,
      account_id: fe.account_id,
      category_id: fe.category_id || ''
    });
    setIsAddOpen(true);
    setIsDetailsOpen(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await updateFixedExpense.mutateAsync({ id, is_active: !currentStatus });
  };

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this fixed expense?')) {
      await archiveFixedExpense.mutateAsync(id);
      setIsDetailsOpen(false);
    }
  };

  const handleRowClick = (fe: any) => {
    if (isMobile) {
      setSelectedExpense(fe);
      setIsDetailsOpen(true);
    }
  };

  const isPending = createFixedExpense.isPending || updateFixedExpense.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fixed Expenses</h2>
          <p className="text-zinc-500 text-sm">Recurring monthly commitments</p>
        </div>
        <Button onClick={() => {
          setEditingExpense(null);
          reset();
          setIsAddOpen(true);
        }} className="w-full md:w-auto gap-2">
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
        <Drawer 
          isOpen={isAddOpen} 
          onClose={() => {
            setIsAddOpen(false);
            setEditingExpense(null);
            reset();
          }}
          title={editingExpense ? 'Edit Fixed Expense' : 'New Fixed Expense'}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingExpense(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="fixed-expense-form" 
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? 'Saving...' : 'Save Fixed Expense'}
              </Button>
            </div>
          }
        >
          <div className="pt-4">
            <FixedExpenseForm 
              id="fixed-expense-form"
              onSubmit={handleSubmit(onSubmit)}
              onCancel={() => {
                setIsAddOpen(false);
                setEditingExpense(null);
                reset();
              }}
              register={register}
              editingExpense={editingExpense}
              isPending={isPending}
              billingType={billingType}
              activeAccounts={activeAccounts}
              activeCategories={activeCategories}
              showButtons={false}
            />
          </div>
        </Drawer>
      )}

      <Card className="hidden md:block">
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {fixedExpenses.map((fe: any) => (
          <Card 
            key={fe.id} 
            className={cn(
              "active:bg-zinc-800/50 transition-colors cursor-pointer",
              !fe.is_active && "opacity-50"
            )}
            onClick={() => handleRowClick(fe)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-zinc-100">{fe.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{fe.account?.name}</span>
                    <span className={cn(
                      "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                      fe.billing_type === 'bank' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                    )}>
                      {fe.billing_type === 'bank' ? 'Bank' : 'CC'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-zinc-100">{formatCurrency(fe.amount)}</p>
                  <p className="text-[10px] text-zinc-500 uppercase mt-1">
                    {fe.billing_type === 'bank' ? `Day ${fe.due_day}` : 'CC Billing'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-zinc-800/50">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {fe.category?.name || 'No Category'}
                </span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(fe.id, fe.is_active);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors",
                      fe.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500"
                    )}
                  >
                    <Power className="w-3 h-3" />
                    {fe.is_active ? 'Active' : 'Paused'}
                  </button>
                  <MoreVertical className="w-4 h-4 text-zinc-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Details Drawer */}
      <Drawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Fixed Expense Details"
      >
        {selectedExpense && (
          <div className="p-4 space-y-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                selectedExpense.billing_type === 'bank' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
              )}>
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{selectedExpense.name}</h3>
                <p className="text-sm text-zinc-500">Fixed Expense</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Amount</p>
                <p className="text-lg font-bold text-zinc-100">{formatCurrency(selectedExpense.amount)}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Status</p>
                <p className={cn(
                  "text-lg font-bold",
                  selectedExpense.is_active ? "text-emerald-500" : "text-zinc-500"
                )}>
                  {selectedExpense.is_active ? 'Active' : 'Paused'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Wallet className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Account</p>
                  <p className="text-sm font-medium">{selectedExpense.account?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Tag className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Category</p>
                  <p className="text-sm font-medium">{selectedExpense.category?.name || 'None'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Calendar className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Billing</p>
                  <p className="text-sm font-medium uppercase">
                    {selectedExpense.billing_type === 'bank' ? `Day ${selectedExpense.due_day}` : 'CC Billing'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
              <Button 
                variant="secondary" 
                className="w-full gap-2"
                onClick={() => handleEdit(selectedExpense)}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button 
                variant="secondary" 
                className="w-full gap-2 text-zinc-500 hover:text-red-400"
                onClick={() => handleArchive(selectedExpense.id)}
              >
                <Archive className="w-4 h-4" />
                Archive
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
