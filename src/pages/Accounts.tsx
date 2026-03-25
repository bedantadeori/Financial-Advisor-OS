import { useState, useEffect } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Archive, Edit2, Wallet, CreditCard, Banknote, Info, Calendar, MoreVertical } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';
import { Drawer } from '../components/ui/Drawer';

function AccountForm({ onSubmit, onCancel, register, editingAccount, isPending }: any) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="space-y-1">
        <label className="text-xs text-zinc-500">Name</label>
        <Input {...register('name', { required: true })} placeholder="e.g. HDFC Bank" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-500">Type</label>
        <Select {...register('type', { required: true })}>
          <option value="bank">Bank</option>
          <option value="credit_card">Credit Card</option>
          <option value="cash">Cash</option>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-500">Currency</label>
        <Select {...register('currency', { required: true })}>
          <option value="INR">INR (₹)</option>
          <option value="USD">USD ($)</option>
          <option value="VND">VND (₫)</option>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-500">{editingAccount ? 'Balance' : 'Initial Balance'}</label>
        <Input type="number" step="0.01" {...register('balance')} placeholder="0.00" />
      </div>
      <div className="md:col-span-4 flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Account'}
        </Button>
      </div>
    </form>
  );
}

export default function Accounts() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { accounts, createAccount, updateAccount, archiveAccount, isLoading } = useAccounts();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      type: 'bank',
      currency: 'INR',
      balance: ''
    }
  });

  const onSubmit = async (data: any) => {
    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          ...data,
          balance: parseFloat(data.balance || '0'),
          currency: data.currency,
        });
      } else {
        await createAccount.mutateAsync({
          ...data,
          balance: parseFloat(data.balance || '0'),
          currency: data.currency,
        });
      }
      setIsAddOpen(false);
      setEditingAccount(null);
      reset({
        name: '',
        type: 'bank',
        currency: 'INR',
        balance: ''
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (a: any) => {
    setEditingAccount(a);
    reset({
      name: a.name,
      type: a.type,
      balance: a.balance,
      currency: a.currency || 'INR'
    });
    setIsAddOpen(true);
    setIsDetailsOpen(false);
  };

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this account? It will be hidden from dropdowns.')) {
      await archiveAccount.mutateAsync(id);
      setIsDetailsOpen(false);
    }
  };

  const handleRowClick = (a: any) => {
    if (isMobile) {
      setSelectedAccount(a);
      setIsDetailsOpen(true);
    }
  };

  const isPending = createAccount.isPending || updateAccount.isPending;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
          <p className="text-zinc-500 text-sm">Manage your bank accounts, cards, and cash</p>
        </div>
        <Button onClick={() => {
          setEditingAccount(null);
          reset();
          setIsAddOpen(true);
        }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </header>

      {isAddOpen && !isMobile && (
        <Card className="border-emerald-500/50">
          <CardHeader>
            <CardTitle>{editingAccount ? 'Edit Account' : 'New Account'}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountForm 
              onSubmit={handleSubmit(onSubmit)}
              onCancel={() => {
                setIsAddOpen(false);
                setEditingAccount(null);
                reset();
              }}
              register={register}
              editingAccount={editingAccount}
              isPending={isPending}
            />
          </CardContent>
        </Card>
      )}

      {isAddOpen && isMobile && (
        <Drawer 
          isOpen={isAddOpen} 
          onClose={() => {
            setIsAddOpen(false);
            setEditingAccount(null);
            reset();
          }}
          title={editingAccount ? 'Edit Account' : 'New Account'}
        >
          <div className="pt-4">
            <AccountForm 
              onSubmit={handleSubmit(onSubmit)}
              onCancel={() => {
                setIsAddOpen(false);
                setEditingAccount(null);
                reset();
              }}
              register={register}
              editingAccount={editingAccount}
              isPending={isPending}
            />
          </div>
        </Drawer>
      )}

      <Drawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Account Details"
      >
        {selectedAccount && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Balance</p>
                <p className="text-3xl font-black font-mono text-emerald-500">
                  {formatCurrency(selectedAccount.balance, selectedAccount.currency, true, selectedAccount.balance_in_inr)}
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-zinc-800 text-[10px] uppercase font-black tracking-tighter text-zinc-300">
                {selectedAccount.type}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-4 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Account Name</p>
                  <p className="text-zinc-100 font-medium">{selectedAccount.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
                <div className="p-2 bg-zinc-800 rounded-lg">
                  <Info className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Status</p>
                  <p className={cn(
                    "font-medium",
                    selectedAccount.archived_at ? "text-zinc-500" : "text-emerald-500"
                  )}>
                    {selectedAccount.archived_at ? "Archived" : "Active"}
                  </p>
                </div>
              </div>
            </div>

            {!selectedAccount.archived_at && (
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 border-zinc-800 h-12 rounded-xl"
                  onClick={() => handleEdit(selectedAccount)}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full gap-2 border-zinc-800 text-zinc-500 hover:text-red-400 h-12 rounded-xl"
                  onClick={() => handleArchive(selectedAccount.id)}
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium hidden sm:table-cell">Type</th>
                  <th className="p-4 font-medium text-right">Balance</th>
                  <th className="p-4 font-medium hidden md:table-cell">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {accounts.map((a) => (
                  <tr key={a.id} className="group hover:bg-zinc-800/50">
                    <td className="p-4 font-medium">
                      <div className="flex flex-col">
                        <span>{a.name}</span>
                        <span className="text-[8px] uppercase text-zinc-500 sm:hidden font-bold">{a.type}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] uppercase text-zinc-300 font-bold">
                        {a.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold">
                      {formatCurrency(a.balance, a.currency, true, a.balance_in_inr)}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {a.archived_at ? (
                        <span className="text-xs text-zinc-500">Archived</span>
                      ) : (
                        <span className="text-xs text-emerald-500">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!a.archived_at && (
                        <div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleEdit(a)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-500 hover:text-red-400"
                            onClick={() => handleArchive(a.id)}
                          >
                            <Archive className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-zinc-800">
              {accounts.map((a) => (
                <div 
                  key={a.id} 
                  onClick={() => handleRowClick(a)}
                  className="p-4 active:bg-zinc-800 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-500">
                      {a.type === 'credit_card' ? <CreditCard className="w-5 h-5" /> : 
                       a.type === 'cash' ? <Banknote className="w-5 h-5" /> : 
                       <Wallet className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-100">{a.name}</p>
                      <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">{a.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black font-mono text-emerald-500">
                      {formatCurrency(a.balance, a.currency, true, a.balance_in_inr)}
                    </p>
                    {a.archived_at && (
                      <span className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Archived</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
