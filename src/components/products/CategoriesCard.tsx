'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { HiFolder, HiPlus, HiX } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface Category {
  id: string;
  name: string;
}

interface CategoriesCardProps {
  selectedCategories: string[];
  onChange: (categoryIds: string[]) => void;
  shopId: number;
  productId?: number;
}

export function CategoriesCard({ selectedCategories, onChange, shopId, productId }: CategoriesCardProps) {
  const { toast } = useOptimisticToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [shopId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/categories?shopId=${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם קטגוריה',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          shopId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCategory = data.category;
        
        setCategories(prev => [...prev, newCategory]);
        onChange([...selectedCategories, newCategory.id]);
        
        toast({
          title: 'הצלחה',
          description: 'הקטגוריה נוצרה בהצלחה',
        });
        
        setNewCategoryName('');
        setCreateDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast({
          title: 'שגיאה',
          description: errorData.error || 'אירעה שגיאה ביצירת הקטגוריה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה ביצירת הקטגוריה',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onChange([...selectedCategories, categoryId]);
    }
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HiFolder className="w-5 h-5" />
              <span>קטגוריות</span>
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-1"
            >
              <HiPlus className="w-4 h-4" />
              <span className="text-sm">חדש</span>
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center text-gray-500 py-4">טוען קטגוריות...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-6">
              <HiFolder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">אין קטגוריות עדיין</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2"
              >
                <HiPlus className="w-4 h-4" />
                צור קטגוריה ראשונה
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.map((category) => (
                <label
                  key={category.id}
                  htmlFor={`category-${category.id}`}
                  className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <span className="flex-1 text-sm text-gray-700">
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>יצירת קטגוריה חדשה</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">שם הקטגוריה</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="לדוגמה: בגדים, אלקטרוניקה, ספורט"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setNewCategoryName('');
                }}
                className="flex-1"
                disabled={creating}
              >
                ביטול
              </Button>
              <Button
                type="button"
                onClick={handleCreateCategory}
                className="flex-1 gap-2"
                disabled={creating || !newCategoryName.trim()}
              >
                {creating ? (
                  <>
                    <HiFolder className="w-4 h-4 animate-spin" />
                    יוצר...
                  </>
                ) : (
                  <>
                    <HiPlus className="w-4 h-4" />
                    צור קטגוריה
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
