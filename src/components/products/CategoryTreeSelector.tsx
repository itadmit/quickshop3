'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { HiSearch, HiChevronDown, HiChevronRight, HiFolder, HiPlus } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface Category {
  id: number;
  title: string;
  handle: string;
  parent_id?: number | null;
  children?: Category[];
}

interface CategoryTreeSelectorProps {
  selectedCategoryIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onCategoryNameChange?: (categoryId: number, categoryName: string) => void; // callback לעדכון שם הקטגוריה
  storeId?: number;
  productId?: number;
  compact?: boolean; // תצוגה קומפקטית לעריכה קבוצתית
}

export function CategoryTreeSelector({
  selectedCategoryIds,
  onSelectionChange,
  onCategoryNameChange,
  storeId,
  productId,
  compact = false,
}: CategoryTreeSelectorProps) {
  const { toast } = useOptimisticToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadCategories();
  }, [debouncedSearchTerm]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (storeId) params.append('storeId', storeId.toString());

      const response = await fetch(`/api/collections?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to load categories');
      const data = await response.json();
      setCategories(data.collections || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת הקטגוריות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // בניית עץ היררכי
  const categoryTree = useMemo(() => {
    const buildTree = (items: Category[], parentId: number | null = null): Category[] => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    };
    return buildTree(categories);
  }, [categories]);

  // פלט שטוח של כל הקטגוריות (כולל ילדים) לחיפוש
  const flattenCategories = (items: Category[]): Category[] => {
    return items.reduce<Category[]>((acc, item) => {
      acc.push(item);
      if (item.children && item.children.length > 0) {
        acc.push(...flattenCategories(item.children));
      }
      return acc;
    }, []);
  };

  const filteredCategories = useMemo(() => {
    if (!debouncedSearchTerm) return categoryTree;
    
    const allCategories = flattenCategories(categoryTree);
    const searchLower = debouncedSearchTerm.toLowerCase();
    const matching = allCategories.filter(cat => 
      cat.title.toLowerCase().includes(searchLower)
    );
    
    // אם יש חיפוש, נציג את כל הקטגוריות (כי אנחנו מחפשים בכל העץ)
    // אבל נסמן את אלה שתואמים
    return categoryTree;
  }, [categoryTree, debouncedSearchTerm]);

  const toggleCategory = (categoryId: number) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onSelectionChange(selectedCategoryIds.filter(id => id !== categoryId));
      if (onCategoryNameChange) {
        onCategoryNameChange(categoryId, '');
      }
    } else {
      const newIds = [...selectedCategoryIds, categoryId];
      onSelectionChange(newIds);
      
      // מציאת שם הקטגוריה לעדכון
      const findCategoryName = (items: Category[], id: number): string | null => {
        for (const item of items) {
          if (item.id === id) return item.title;
          if (item.children) {
            const found = findCategoryName(item.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      const categoryName = findCategoryName(categories, categoryId);
      if (onCategoryNameChange && categoryName) {
        onCategoryNameChange(categoryId, categoryName);
      }
    }
  };

  const toggleExpand = (categoryId: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
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
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCategoryName.trim(),
          parent_id: newCategoryParentId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCategory = data.collection;
        
        // הוספה לבחירה אוטומטית
        onSelectionChange([...selectedCategoryIds, newCategory.id]);
        
        // רענון רשימת הקטגוריות
        await loadCategories();
        
        toast({
          title: 'הצלחה',
          description: 'הקטגוריה נוצרה בהצלחה',
        });
        
        setNewCategoryName('');
        setNewCategoryParentId(null);
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

  const renderCategoryTree = (items: Category[], level: number = 0): JSX.Element[] => {
    return items.map(category => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedIds.has(category.id);
      const isSelected = selectedCategoryIds.includes(category.id);
      const matchesSearch = !debouncedSearchTerm || 
        category.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        flattenCategories(category.children || []).some(child => 
          child.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );

      if (debouncedSearchTerm && !matchesSearch && !hasChildren) {
        return null;
      }

      return (
        <div key={category.id}>
          <div
            className={`flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors ${
              isSelected ? 'bg-green-50' : ''
            }`}
            style={{ paddingRight: `${level * 1.5 + 0.5}rem` }}
          >
            {/* כפתור הרחבה/כיווץ */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(category.id);
                }}
                className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
              >
                {isExpanded ? (
                  <HiChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <HiChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-5" /> // רווח לאיזון
            )}

            {/* צ'קבוקס */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleCategory(category.id)}
              onClick={(e) => e.stopPropagation()}
            />

            {/* אייקון תיקייה */}
            <HiFolder className="w-4 h-4 text-gray-400 flex-shrink-0" />

            {/* שם הקטגוריה */}
            <span className="flex-1 text-sm text-gray-700">{category.title}</span>
          </div>

          {/* ילדים */}
          {hasChildren && isExpanded && (
            <div>
              {renderCategoryTree(category.children || [], level + 1)}
            </div>
          )}
        </div>
      );
    }).filter(Boolean) as JSX.Element[];
  };

  if (compact) {
    // תצוגה קומפקטית לעריכה קבוצתית
    return (
      <div className="space-y-2">
        <div className="relative">
          <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="חיפוש קטגוריות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 h-9 text-sm"
          />
        </div>

        {selectedCategoryIds.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categories
              .filter(c => selectedCategoryIds.includes(c.id))
              .map(category => (
                <span
                  key={category.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs"
                >
                  {category.title}
                </span>
              ))}
          </div>
        )}

        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
          {loading ? (
            <div className="text-center py-4 text-gray-500 text-sm">טוען קטגוריות...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">לא נמצאו קטגוריות</div>
          ) : (
            <div className="space-y-0.5">
              {renderCategoryTree(filteredCategories)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // תצוגה מלאה
  return (
    <>
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <HiFolder className="w-4 h-4" />
              <span>קטגוריות</span>
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-1 h-8"
            >
              <HiPlus className="w-3 h-3" />
              <span className="text-xs">חדש</span>
            </Button>
          </div>

          <div className="relative mb-3">
            <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="חיפוש קטגוריות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 h-9 text-sm"
            />
          </div>

          {selectedCategoryIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {categories
                .filter(c => selectedCategoryIds.includes(c.id))
                .map(category => (
                  <span
                    key={category.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                  >
                    {category.title}
                  </span>
                ))}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-gray-500 text-sm">טוען קטגוריות...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-6">
                <HiFolder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3 text-sm">אין קטגוריות עדיין</p>
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
              <div className="space-y-0.5">
                {renderCategoryTree(filteredCategories)}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>יצירת קטגוריה חדשה</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 px-6">
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

            <div className="space-y-2">
              <Label htmlFor="category-parent">קטגוריה אב (אופציונלי)</Label>
              <select
                id="category-parent"
                value={newCategoryParentId || ''}
                onChange={(e) => setNewCategoryParentId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full h-9 border border-gray-200 rounded-md bg-white px-3 py-2 text-sm"
              >
                <option value="">ללא קטגוריה אב</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
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
                  setNewCategoryParentId(null);
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

