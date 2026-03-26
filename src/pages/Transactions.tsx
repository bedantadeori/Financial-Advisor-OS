import { useState, useMemo, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useGoals } from '../hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Filter, Search, Trash2, Edit2, ArrowUpDown, ArrowUp, ArrowDown, X, MoreVertical, Calendar, Tag, Wallet as WalletIcon, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';
import { Drawer } from '../components/ui/Drawer';

function TransactionForm({ 
  id,
  onSubmit, 
  onCancel, 
  register, 
  type, 
  activeAccounts, 
  activeCategories, 
  goals, 
  isPending,
  editingTransaction,
  showButtons = true
}: any) {
  return (
    <form id={id} onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <label className="text-xs text-zinc-500">Currency</label>
        <Select {...register('currency', { required: true })}>
          <option value="INR">INR (₹)</option>
          <option value="USD">USD ($)</option>
          <option value="VND">VND (₫)</option>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-500">Amount</label>
        <Input type="number" step="0.01" {...register('amount', { required: true })} />
      </div>
      
      <div className="md:col-span-3 space-y-1">
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
            {activeAccounts.map((a: any) => (
              <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency as any)})</option>
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
              .filter((a: any) => type === 'income' ? a.type !== 'credit_card' : true)
              .map((a: any) => (
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
            {goals.map((g: any) => (
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
            {activeCategories.map((c: any) => (
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

      <div className={cn("md:col-span-4 flex justify-end gap-2 pt-4", !showButtons && "hidden md:flex")}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Transaction'}
        </Button>
      </div>
    </form>
  );
}

export default function Transactions() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      type: 'expense',
      currency: 'INR',
      amount: '',
      description: '',
      status: 'posted',
      from_account_id: '',
      to_account_id: '',
      category_id: '',
      goal_id: '',
      is_planning_income: false
    }
  });
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
        currency: data.currency || 'INR',
      };

      // Remove nested relational objects that Supabase doesn't want in an update
      delete sanitizedData.category;
      delete sanitizedData.from_account;
      delete sanitizedData.to_account;

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
      reset({
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'expense',
        currency: 'INR',
        amount: '',
        description: '',
        status: 'posted',
        from_account_id: '',
        to_account_id: '',
        category_id: '',
        goal_id: '',
        is_planning_income: false
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (t: any) => {
    setEditingTransaction(t);
    reset({
      ...t,
      transaction_date: t.transaction_date.split('T')[0],
      from_account_id: t.from_account_id || '',
      to_account_id: t.to_account_id || '',
      category_id: t.category_id || '',
      goal_id: t.goal_id || '',
      currency: t.currency || 'INR'
    });
    setIsAddOpen(true);
    setIsDetailsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction.mutateAsync(id);
      setIsDetailsOpen(false);
    }
  };

  const handleRowClick = (t: any) => {
    if (isMobile) {
      setSelectedTransaction(t);
      setIsDetailsOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ledger</h2>
          <p className="text-zinc-500 text-sm">Full transaction history</p>
        </div>
        <Button onClick={() => {
          setEditingTransaction(null);
          reset({
            transaction_date: new Date().toISOString().split('T')[0],
            type: 'expense',
            currency: 'INR',
            amount: '',
            description: '',
            status: 'posted',
            from_account_id: '',
            to_account_id: '',
            category_id: '',
            goal_id: '',
            is_planning_income: false
          });
          setIsAddOpen(true);
        }} className="w-full md:w-auto gap-2">
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </header>

      {isAddOpen && (
        <Drawer
          isOpen={isAddOpen}
          onClose={() => {
            setIsAddOpen(false);
            setEditingTransaction(null);
            reset();
          }}
          title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingTransaction(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="transaction-form" 
                className="flex-1"
                disabled={createTransaction.isPending || updateTransaction.isPending}
              >
                {(createTransaction.isPending || updateTransaction.isPending) ? 'Saving...' : 'Save Transaction'}
              </Button>
            </div>
          }
        >
          <div className="pt-4">
            <TransactionForm 
              id="transaction-form"
              onSubmit={handleSubmit(onSubmit)}
              onCancel={() => {
                setIsAddOpen(false);
                setEditingTransaction(null);
                reset();
              }}
              register={register}
              type={type}
              activeAccounts={activeAccounts}
              activeCategories={activeCategories}
              goals={goals}
              isPending={createTransaction.isPending || updateTransaction.isPending}
              editingTransaction={editingTransaction}
              showButtons={false}
            />
          </div>
        </Drawer>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder="Search description, category, account..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="secondary" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filters.type || filters.status || filters.accountId || filters.categoryId) && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-800">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500">Type</label>
                <Select 
                  value={filters.type} 
                  onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
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
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
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
                  onChange={(e) => setFilters(f => ({ ...f, accountId: e.target.value }))}
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
                  onChange={(e) => setFilters(f => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  {activeCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilters({ type: '', status: '', accountId: '', categoryId: '' })}
                  className="text-zinc-500 hover:text-zinc-100"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="p-4 font-medium cursor-pointer hover:text-zinc-100" onClick={() => handleSort('transaction_date')}>
                    <div className="flex items-center">Date <SortIcon column="transaction_date" /></div>
                  </th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium cursor-pointer hover:text-zinc-100" onClick={() => handleSort('category')}>
                    <div className="flex items-center">Category <SortIcon column="category" /></div>
                  </th>
                  <th className="p-4 font-medium cursor-pointer hover:text-zinc-100" onClick={() => handleSort('account')}>
                    <div className="flex items-center">Account <SortIcon column="account" /></div>
                  </th>
                  <th className="p-4 font-medium cursor-pointer hover:text-zinc-100 text-right" onClick={() => handleSort('amount')}>
                    <div className="flex items-center justify-end">Amount <SortIcon column="amount" /></div>
                  </th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredAndSortedTransactions.map((t: any) => (
                  <tr key={t.id} className="group hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 text-zinc-400">{formatDate(t.transaction_date)}</td>
                    <td className="p-4">
                      <div className="font-medium">{t.description}</div>
                      {t.type === 'transfer' && (
                        <div className="text-[10px] text-zinc-500 uppercase">Transfer</div>
                      )}
                    </td>
                    <td className="p-4">
                      {t.category ? (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold">
                          {t.category.name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-zinc-400">
                      {t.type === 'transfer' ? (
                        <div className="flex items-center gap-1">
                          <span>{t.from_account?.name}</span>
                          <span className="text-zinc-600">→</span>
                          <span>{t.to_account?.name}</span>
                        </div>
                      ) : (
                        t.from_account?.name || t.to_account?.name
                      )}
                    </td>
                    <td className={cn(
                      "p-4 text-right font-mono font-bold",
                      t.type === 'income' ? "text-emerald-500" : 
                      t.type === 'transfer' ? "text-blue-500" : "text-zinc-100"
                    )}>
                      {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                      {formatCurrency(t.amount, t.currency)}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold",
                        t.status === 'posted' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="w-4 h-4 text-zinc-500 hover:text-red-400" />
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

      <div className="md:hidden space-y-3">
        {filteredAndSortedTransactions.map((t: any) => (
          <Card key={t.id} onClick={() => handleRowClick(t)} className="active:scale-[0.98] transition-transform">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-zinc-100">{t.description}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{formatDate(t.transaction_date)}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-mono font-bold",
                    t.type === 'income' ? "text-emerald-500" : 
                    t.type === 'transfer' ? "text-blue-500" : "text-zinc-100"
                  )}>
                    {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                    {formatCurrency(t.amount, t.currency)}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    {t.category?.name || 'No Category'}
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] uppercase font-bold",
                    t.status === 'posted' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {t.status}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase">
                  {t.type === 'transfer' ? `${t.from_account?.name} → ${t.to_account?.name}` : (t.from_account?.name || t.to_account?.name)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Drawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Transaction Details"
      >
        {selectedTransaction && (
          <div className="p-4 space-y-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                selectedTransaction.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : 
                selectedTransaction.type === 'transfer' ? "bg-blue-500/10 text-blue-500" : "bg-zinc-500/10 text-zinc-100"
              )}>
                {selectedTransaction.type === 'income' ? <Plus className="w-6 h-6" /> : 
                 selectedTransaction.type === 'transfer' ? <ArrowUpDown className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{selectedTransaction.description}</h3>
                <p className="text-sm text-zinc-500 uppercase tracking-wider">{selectedTransaction.type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Amount</p>
                <p className={cn(
                  "text-lg font-bold",
                  selectedTransaction.type === 'income' ? "text-emerald-500" : "text-zinc-100"
                )}>
                  {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Status</p>
                <p className={cn(
                  "text-lg font-bold",
                  selectedTransaction.status === 'posted' ? "text-emerald-500" : "text-amber-500"
                )}>
                  {selectedTransaction.status}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Date</p>
                  <p className="text-sm font-medium">{formatDate(selectedTransaction.transaction_date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Tag className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Category</p>
                  <p className="text-sm font-medium">{selectedTransaction.category?.name || 'None'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <WalletIcon className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Account</p>
                  <p className="text-sm font-medium">
                    {selectedTransaction.type === 'transfer' 
                      ? `${selectedTransaction.from_account?.name} → ${selectedTransaction.to_account?.name}`
                      : (selectedTransaction.from_account?.name || selectedTransaction.to_account?.name)}
                  </p>
                </div>
              </div>

              {selectedTransaction.goal && (
                <div className="flex items-center gap-3 text-zinc-300">
                  <div className="p-2 rounded-lg bg-zinc-800">
                    <Info className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Goal</p>
                    <p className="text-sm font-medium">{selectedTransaction.goal.name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
              <Button 
                variant="secondary" 
                className="w-full gap-2"
                onClick={() => handleEdit(selectedTransaction)}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button 
                variant="secondary" 
                className="w-full gap-2 text-zinc-500 hover:text-red-400"
                onClick={() => handleDelete(selectedTransaction.id)}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
