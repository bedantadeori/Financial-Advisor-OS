import { useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Edit2, Target, Calendar, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';

export default function Goals() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const { goals, createGoal, updateGoal, deleteGoal } = useGoals();
  const { register, handleSubmit, reset, setValue } = useForm();

  const onSubmit = async (data: any) => {
    try {
      if (editingGoal) {
        await updateGoal.mutateAsync({
          id: editingGoal.id,
          ...data,
          target_amount: parseFloat(data.target_amount),
        });
      } else {
        await createGoal.mutateAsync({
          ...data,
          target_amount: parseFloat(data.target_amount),
          current_amount: 0,
        });
      }
      setIsAddOpen(false);
      setEditingGoal(null);
      reset();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setIsAddOpen(true);
    setValue('name', goal.name);
    setValue('target_amount', goal.target_amount);
    setValue('deadline', goal.deadline ? goal.deadline.split('T')[0] : '');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Goals</h2>
          <p className="text-zinc-500 text-sm">Track your long-term savings</p>
        </div>
        <Button onClick={() => {
          setEditingGoal(null);
          reset();
          setIsAddOpen(true);
        }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </header>

      {isAddOpen && (
        <Card className="border-emerald-500/50">
          <CardHeader>
            <CardTitle>{editingGoal ? 'Edit Goal' : 'New Goal'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
              <div className="space-y-1 min-w-0">
                <label className="text-xs text-zinc-500">Name</label>
                <Input {...register('name', { required: true })} placeholder="e.g. New Car" />
              </div>
              <div className="space-y-1 min-w-0">
                <label className="text-xs text-zinc-500">Target Amount</label>
                <Input type="number" step="0.01" {...register('target_amount', { required: true })} />
              </div>
              <div className="space-y-1 min-w-0">
                <label className="text-xs text-zinc-500">Deadline (Optional)</label>
                <Input type="date" className="w-full" {...register('deadline')} />
              </div>
              <div className="md:col-span-3 flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={() => {
                  setIsAddOpen(false);
                  setEditingGoal(null);
                  reset();
                }}>Cancel</Button>
                <Button type="submit" disabled={createGoal.isPending || updateGoal.isPending}>
                  {createGoal.isPending || updateGoal.isPending ? 'Saving...' : 'Save Goal'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = ((goal.current_amount || 0) / goal.target_amount) * 100;
          const remaining = goal.target_amount - (goal.current_amount || 0);
          
          let progressColor = "bg-red-500";
          if (progress >= 80) progressColor = "bg-emerald-500";
          else if (progress >= 50) progressColor = "bg-amber-500";

          return (
            <Card key={goal.id} className="relative overflow-hidden group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-md bg-zinc-800 text-blue-500">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(goal)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-400"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-4 text-zinc-100 normal-case text-lg">{goal.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-zinc-500">Current</p>
                    <p className="text-xl font-bold">{formatCurrency(goal.current_amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Target</p>
                    <p className="text-sm font-medium text-zinc-300">{formatCurrency(goal.target_amount)}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">{Math.round(progress)}% Complete</span>
                    <span className="text-zinc-500">{formatCurrency(remaining)} left</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500", progressColor)}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {goal.deadline && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                    <Calendar className="w-3 h-3" />
                    Target Date: {formatDate(goal.deadline)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
