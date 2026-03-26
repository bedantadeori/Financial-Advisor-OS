import { useState, useEffect } from 'react';
import { useCategories } from '../hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatDate } from '../lib/utils';
import { Plus, Archive, Edit2, MoreVertical, Tag, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/utils';
import { Drawer } from '../components/ui/Drawer';

function CategoryForm({ id, onSubmit, onCancel, register, editingCategory, isPending, showButtons = true }: any) {
  return (
    <form id={id} onSubmit={onSubmit} className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 space-y-1">
        <label className="text-xs text-zinc-500 md:hidden">Category Name</label>
        <Input {...register('name', { required: true })} placeholder="e.g. Groceries" />
      </div>
      <div className={cn("flex gap-2 justify-end", !showButtons && "hidden md:flex")}>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

export default function Categories() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { categories, createCategory, updateCategory, archiveCategory } = useCategories();
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    setIsDetailsOpen(false);
  };

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this category?')) {
      await archiveCategory.mutateAsync(id);
      setIsDetailsOpen(false);
    }
  };

  const handleRowClick = (c: any) => {
    if (isMobile) {
      setSelectedCategory(c);
      setIsDetailsOpen(true);
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-6 max-w-2xl">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-zinc-500 text-sm">Organize your spending</p>
        </div>
        <Button onClick={() => {
          setEditingCategory(null);
          reset();
          setIsAddOpen(true);
        }} className="w-full md:w-auto gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </header>

      {isAddOpen && (
        <Drawer 
          isOpen={isAddOpen} 
          onClose={() => {
            setIsAddOpen(false);
            setEditingCategory(null);
            reset();
          }}
          title={editingCategory ? 'Edit Category' : 'New Category'}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingCategory(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="category-form" 
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          }
        >
          <div className="pt-4">
            <CategoryForm 
              id="category-form"
              onSubmit={handleSubmit(onSubmit)}
              onCancel={() => {
                setIsAddOpen(false);
                setEditingCategory(null);
                reset();
              }}
              register={register}
              editingCategory={editingCategory}
              isPending={isPending}
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {categories.map((c) => (
          <Card 
            key={c.id} 
            className="active:bg-zinc-800/50 transition-colors cursor-pointer"
            onClick={() => handleRowClick(c)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-emerald-500">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100">{c.name}</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                      Created {formatDate(c.created_at)}
                    </p>
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-zinc-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Details Drawer */}
      <Drawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Category Details"
      >
        {selectedCategory && (
          <div className="p-4 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-zinc-800 text-emerald-500">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">{selectedCategory.name}</h3>
                <p className="text-sm text-zinc-500">Transaction Category</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Created On</p>
                  <p className="text-sm font-medium">{formatDate(selectedCategory.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
              <Button 
                variant="secondary" 
                className="w-full gap-2"
                onClick={() => handleEdit(selectedCategory)}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button 
                variant="secondary" 
                className="w-full gap-2 text-zinc-500 hover:text-red-400"
                onClick={() => handleArchive(selectedCategory.id)}
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
