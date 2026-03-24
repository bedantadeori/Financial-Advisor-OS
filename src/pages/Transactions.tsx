import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useGoals } from '../hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Filter, Search, Trash2, Edit2, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';

export default function Transactions() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'transaction_date',
    direction: 'desc'
  });
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    accountId: '',
    categoryId: ''
  });

  const { transactions, createTransaction, updateTransaction, deleteTransaction, isLoading } = useTransactions();
  const { activeAccounts } = useAccounts();
  const { activeCategories } = useCategories();
  const { goals } = useGoals();

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Global Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.description?.toLowerCase().includes(lowerSearch) ||
        t.category?.name?.toLowerCase().includes(lowerSearch) ||
        t.from_account?.name?.toLowerCase().includes(lowerSearch) ||
        t.to_account?.name?.toLowerCase().includes(lowerSearch) ||
        t.amount?.toString().includes(lowerSearch) ||
        t.type?.toLowerCase().includes(lowerSearch) ||
        t.status?.toLowerCase().includes(lowerSearch)
      );
    }

    // Column Filters
    if (filters.type) result = result.filter(t => t.type === filters.type);
    if (filters.status) result = result.filter(t => t.status === filters.status);
    if (filters.accountId) {
      result = result.filter(t => t.from_account_id === filters.accountId || t.to_account_id === filters.accountId);
    }
    if (filters.categoryId) result = result.filter(t => t.category_id === filters.categoryId);

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'category':
            aValue = a.category?.name || '';
            bValue = b.category?.name || '';
            break;
          case 'account':
            aValue = (a.from_account?.name || '') + (a.to_account?.name || '');
            bValue = (b.from_account?.name || '') + (b.to_account?.name || '');
            break;
          case 'amount':
            aValue = a.amount;
            bValue = b.amount;
            break;
          case 'transaction_date':
            aValue = new Date(a.transaction_date).getTime();
            bValue = new Date(b.transaction_date).getTime();
            break;
          default:
            aValue = a[sortConfig.key] || '';
            bValue = b[sortConfig.key] || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [transactions, searchTerm, filters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-3 h-3 ml-1 text-emerald-500" /> : 
      <ArrowDown className="w-3 h-3 ml-1 text-emerald-500" />;
  };

  const { register, handleSubmit, watch, reset, setValue } = useForm();
  const type = watch('type', 'expense');

  const onSubmit = async (data: any) => {
    try {
      const sanitizedData = {
        ...data,
        amount: parseFloat(data.amount),
        from_account_id: data.from_account_id || null,
        to_account_id: data.to_account_id || null,
        category_id: data.category_id || null,
        goal_id: data.goal_id || null,
        is_planning_income: data.is_planning_income || false,
      };

      // Ensure correct fields are null based on type
      if (data.type === 'income') {
        sanitizedData.from_account_id = null;
      } else if (data.type === 'expense') {
        sanitizedData.to_account_id = null;
      } else if (data.type === 'transfer') {
        sanitizedData.category_id = null;
      }

      if (editingTransaction) {
        await updateTransaction.mutateAsync({
          id: editingTransaction.id,
          ...sanitizedData,
        });
      } else {
        await createTransaction.mutateAsync(sanitizedData);
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
                <Input 
                  type="date" 
                  className="w-full" 
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  {...register('transaction_date', { required: true })} 
                />
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
        <CardHeader className="flex flex-col space-y-4 pb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              size="sm" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filters.type || filters.status || filters.accountId || filters.categoryId) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Type</label>
                <Select 
                  value={filters.type} 
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">All Types</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Status</label>
                <Select 
                  value={filters.status} 
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="posted">Posted</option>
                  <option value="pending">Pending</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Account</label>
                <Select 
                  value={filters.accountId} 
                  onChange={(e) => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
                >
                  <option value="">All Accounts</option>
                  {activeAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Category</label>
                <Select 
                  value={filters.categoryId} 
                  onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  {activeCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilters({ type: '', status: '', accountId: '', categoryId: '' })}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-zinc-500 animate-pulse">
                <Search className="w-8 h-8 mx-auto mb-4 opacity-20" />
                <p>Loading transactions...</p>
              </div>
            ) : filteredAndSortedTransactions.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <Filter className="w-8 h-8 mx-auto mb-4 opacity-20" />
                <p>No transactions found matching your criteria.</p>
                {(searchTerm || filters.type || filters.status || filters.accountId || filters.categoryId) && (
                  <Button 
                    variant="link" 
                    className="mt-2 text-emerald-500"
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({ type: '', status: '', accountId: '', categoryId: '' });
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-800">
                    <th 
                      className="pb-2 font-medium cursor-pointer hover:text-zinc-300 transition-colors"
                      onClick={() => handleSort('transaction_date')}
                    >
                      <div className="flex items-center">
                        Date <SortIcon column="transaction_date" />
                      </div>
                    </th>
                    <th 
                      className="pb-2 font-medium cursor-pointer hover:text-zinc-300 transition-colors"
                      onClick={() => handleSort('description')}
                    >
                      <div className="flex items-center">
                        Description <SortIcon column="description" />
                      </div>
                    </th>
                    <th 
                      className="pb-2 font-medium hidden md:table-cell cursor-pointer hover:text-zinc-300 transition-colors"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center">
                        Type <SortIcon column="type" />
                      </div>
                    </th>
                    <th 
                      className="pb-2 font-medium hidden lg:table-cell cursor-pointer hover:text-zinc-300 transition-colors"
                      onClick={() => handleSort('account')}
                    >
                      <div className="flex items-center">
                        Account <SortIcon column="account" />
                      </div>
                    </th>
                    <th 
                      className="pb-2 font-medium hidden sm:table-cell cursor-pointer hover:text-zinc-300 transition-colors"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center">
                        Category <SortIcon column="category" />
                      </div>
                    </th>
                    <th 
                      className="pb-2 font-medium text-right cursor-pointer hover:text-zinc-300 transition-colors"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center justify-end">
                        Amount <SortIcon column="amount" />
                      </div>
                    </th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredAndSortedTransactions.map((t: any) => (
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
