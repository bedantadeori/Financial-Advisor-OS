import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Archive, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';

export default function Accounts() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const { accounts, createAccount, updateAccount, archiveAccount, isLoading } = useAccounts();
  const { register, handleSubmit, reset, setValue } = useForm();

  const onSubmit = async (data: any) => {
    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          ...data,
          balance: parseFloat(data.balance || '0'),
        });
      } else {
        await createAccount.mutateAsync({
          ...data,
          balance: parseFloat(data.balance || '0'),
        });
      }
      setIsAddOpen(false);
      setEditingAccount(null);
      reset();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (a: any) => {
    setEditingAccount(a);
    setIsAddOpen(true);
    setValue('name', a.name);
    setValue('type', a.type);
    setValue('balance', a.balance);
  };

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this account? It will be hidden from dropdowns.')) {
      await archiveAccount.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
          <p className="text-zinc-500 text-sm">Manage your financial entities</p>
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

      {isAddOpen && (
        <Card className="border-emerald-500/50">
          <CardHeader>
            <CardTitle>{editingAccount ? 'Edit Account' : 'New Account'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className="text-xs text-zinc-500">{editingAccount ? 'Balance' : 'Initial Balance'}</label>
                <Input type="number" step="0.01" {...register('balance')} placeholder="0.00" />
              </div>
              <div className="md:col-span-3 flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={() => {
                  setIsAddOpen(false);
                  setEditingAccount(null);
                  reset();
                }}>Cancel</Button>
                <Button type="submit" disabled={createAccount.isPending || updateAccount.isPending}>
                  {createAccount.isPending || updateAccount.isPending ? 'Saving...' : 'Save Account'}
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
                      {formatCurrency(a.balance)}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
