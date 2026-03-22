import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatDate } from '../lib/utils';
import { Plus, Archive, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';

export default function Categories() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const { categories, createCategory, updateCategory, archiveCategory } = useCategories();
  const { register, handleSubmit, reset, setValue } = useForm();

  const onSubmit = async (data: any) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          ...data,
        });
      } else {
        await createCategory.mutateAsync(data);
      }
      setIsAddOpen(false);
      setEditingCategory(null);
      reset();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (c: any) => {
    setEditingCategory(c);
    setIsAddOpen(true);
    setValue('name', c.name);
  };

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this category?')) {
      await archiveCategory.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-zinc-500 text-sm">Organize your spending</p>
        </div>
        <Button onClick={() => {
          setEditingCategory(null);
          reset();
          setIsAddOpen(true);
        }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </header>

      {isAddOpen && (
        <Card className="border-emerald-500/50">
          <CardHeader>
            <CardTitle>{editingCategory ? 'Edit Category' : 'New Category'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4">
              <div className="flex-1 space-y-1">
                <Input {...register('name', { required: true })} placeholder="e.g. Groceries" />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => {
                  setIsAddOpen(false);
                  setEditingCategory(null);
                  reset();
                }}>Cancel</Button>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {createCategory.isPending || updateCategory.isPending ? 'Saving...' : 'Save'}
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
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {categories.map((c) => (
                  <tr key={c.id} className="group hover:bg-zinc-800/50">
                    <td className="p-4 font-medium">{c.name}</td>
                    <td className="p-4 text-zinc-400">{formatDate(c.created_at)}</td>
                    <td className="p-4 text-right">
                      {!c.archived_at && (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleEdit(c)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-500 hover:text-red-400"
                            onClick={() => handleArchive(c.id)}
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
