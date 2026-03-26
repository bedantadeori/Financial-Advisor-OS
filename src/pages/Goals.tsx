import { useState, useEffect } from 'react';
import { useGoals } from '../hooks/useGoals';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Edit2, Target, Calendar, Trash2, Info, MoreVertical } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';
import { Drawer } from '../components/ui/Drawer';

function GoalForm({ id, onSubmit, onCancel, register, editingGoal, isPending, showButtons = true }: any) {
  return (
    <form id={id} onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-0">
      <div className="space-y-1 min-w-0">
        <label className="text-xs text-zinc-500">Name</label>
        <Input {...register('name', { required: true })} placeholder="e.g. New Car" />
      </div>
      <div className="space-y-1 min-w-0">
        <label className="text-xs text-zinc-500">Target Amount</label>
        <Input type="number" step="0.01" {...register('target_amount', { required: true })} />
      </div>
      <div className="space-y-1 min-w-0">
        <label className="text-xs text-zinc-500">Current Amount</label>
        <Input type="number" step="0.01" {...register('current_amount')} placeholder="0.00" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-500">Deadline (Optional)</label>
        <Input 
          type="date" 
          className="w-full" 
          onClick={(e) => e.currentTarget.showPicker?.()}
          {...register('deadline')} 
        />
      </div>
      <div className={cn("md:col-span-4 flex justify-end gap-2 pt-4", !showButtons && "hidden md:flex")}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Goal'}
        </Button>
      </div>
    </form>
  );
}

export default function Goals() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { goals, createGoal, updateGoal, deleteGoal } = useGoals();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      target_amount: '',
      current_amount: '',
      deadline: ''
    }
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const onSubmit = async (data: any) => {
    try {
      if (editingGoal) {
        await updateGoal.mutateAsync({
          id: editingGoal.id,
          ...data,
          target_amount: parseFloat(data.target_amount),
          current_amount: parseFloat(data.current_amount || '0'),
        });
      } else {
        await createGoal.mutateAsync({
          ...data,
          target_amount: parseFloat(data.target_amount),
          current_amount: parseFloat(data.current_amount || '0'),
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
    reset({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline ? goal.deadline.split('T')[0] : ''
    });
    setIsAddOpen(true);
    setIsDetailsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal.mutateAsync(id);
      setIsDetailsOpen(false);
    }
  };

  const handleRowClick = (goal: any) => {
    if (isMobile) {
      setSelectedGoal(goal);
      setIsDetailsOpen(true);
    }
  };

  const isPending = createGoal.isPending || updateGoal.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Goals</h2>
          <p className="text-zinc-500 text-sm">Track your long-term savings</p>
        </div>
        <Button onClick={() => {
          setEditingGoal(null);
          reset();
          setIsAddOpen(true);
        }} className="w-full md:w-auto gap-2">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </header>

      {isAddOpen && !isMobile && (
        <Card className="border-emerald-500/50">
          <CardHeader>
            <CardTitle>{editingGoal ? 'Edit Goal' : 'New Goal'}</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalForm 
              onSubmit={handleSubmit(onSubmit)}
              onCancel={() => {
                setIsAddOpen(false);
                setEditingGoal(null);
                reset();
              }}
              register={register}
              editingGoal={editingGoal}
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
            setEditingGoal(null);
            reset();
          }}
          title={editingGoal ? 'Edit Goal' : 'New Goal'}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingGoal(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="goal-form" 
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? 'Saving...' : 'Save Goal'}
              </Button>
            </div>
          }
        >
          <div className="pt-4">
            <GoalForm 
              id="goal-form"
              onSubmit={handleSubmit(onSubmit)}
              onCancel={() => {
                setIsAddOpen(false);
                setEditingGoal(null);
                reset();
              }}
              register={register}
              editingGoal={editingGoal}
              isPending={isPending}
              showButtons={false}
            />
          </div>
        </Drawer>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = ((goal.current_amount || 0) / goal.target_amount) * 100;
          const remaining = goal.target_amount - (goal.current_amount || 0);
          
          let progressColor = "bg-red-500";
          if (progress >= 80) progressColor = "bg-emerald-500";
          else if (progress >= 50) progressColor = "bg-amber-500";

          return (
            <Card 
              key={goal.id} 
              className={cn(
                "relative overflow-hidden group cursor-pointer md:cursor-default",
                isMobile && "active:bg-zinc-800/50 transition-colors"
              )}
              onClick={() => handleRowClick(goal)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-md bg-zinc-800 text-blue-500">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {!isMobile ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(goal);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(goal.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <MoreVertical className="w-4 h-4 text-zinc-500" />
                    )}
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

      {/* Mobile Details Drawer */}
      <Drawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Goal Details"
      >
        {selectedGoal && (
          <div className="p-4 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-zinc-800 text-blue-500">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{selectedGoal.name}</h3>
                <p className="text-sm text-zinc-500">Savings Goal</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Current</p>
                <p className="text-lg font-bold text-emerald-500">{formatCurrency(selectedGoal.current_amount)}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Target</p>
                <p className="text-lg font-bold text-zinc-100">{formatCurrency(selectedGoal.target_amount)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Info className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Progress</p>
                  <p className="text-sm font-medium">
                    {Math.round(((selectedGoal.current_amount || 0) / selectedGoal.target_amount) * 100)}% Complete
                  </p>
                </div>
              </div>

              {selectedGoal.deadline && (
                <div className="flex items-center gap-3 text-zinc-300">
                  <div className="p-2 rounded-lg bg-zinc-800">
                    <Calendar className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Deadline</p>
                    <p className="text-sm font-medium">{formatDate(selectedGoal.deadline)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
              <Button 
                variant="secondary" 
                className="w-full gap-2"
                onClick={() => handleEdit(selectedGoal)}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button 
                variant="secondary" 
                className="w-full gap-2 text-red-500 hover:text-red-400"
                onClick={() => handleDelete(selectedGoal.id)}
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
