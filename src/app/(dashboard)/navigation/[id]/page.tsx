'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { HiPlus, HiArrowRight } from 'react-icons/hi';
import { Plus, ExternalLink } from 'lucide-react';
import { NavigationMenu, NavigationMenuItem } from '@/types/content';
import { MenuItemEditor } from '@/components/navigation/MenuItemEditor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// קומפוננטת wrapper לפריט ניתן לגרירה
function SortableMenuItem({
  item,
  onUpdate,
  onDelete,
  products,
  collections,
  pages,
}: {
  item: NavigationMenuItem;
  onUpdate: (itemId: number, updates: Partial<NavigationMenuItem>) => void;
  onDelete: (itemId: number) => void;
  products: Array<{ id: number; title: string; handle: string }>;
  collections: Array<{ id: number; title: string; handle: string }>;
  pages: Array<{ id: number; title: string; handle: string }>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <MenuItemEditor
        item={item}
        onUpdate={onUpdate}
        onDelete={onDelete}
        products={products}
        collections={collections}
        pages={pages}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export default function EditNavigationMenuPage() {
  const router = useRouter();
  const params = useParams();
  const menuId = parseInt(params?.id as string);

  const [menu, setMenu] = useState<NavigationMenu | null>(null);
  const [items, setItems] = useState<NavigationMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', url: '', linkType: 'custom' as 'custom' | 'product' | 'collection' | 'page', resourceId: null as number | null });
  const [products, setProducts] = useState<Array<{ id: number; title: string; handle: string }>>([]);
  const [collections, setCollections] = useState<Array<{ id: number; title: string; handle: string }>>([]);
  const [pages, setPages] = useState<Array<{ id: number; title: string; handle: string }>>([]);

  useEffect(() => {
    if (menuId) {
      loadMenu();
      loadResources();
    }
  }, [menuId]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/navigation/${menuId}`);
      if (!response.ok) throw new Error('Failed to load menu');
      const data = await response.json();
      setMenu(data.navigation_menu);
      setItems(data.navigation_menu.items || []);
    } catch (error) {
      console.error('Error loading menu:', error);
      alert('שגיאה בטעינת התפריט');
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const [productsRes, collectionsRes, pagesRes] = await Promise.all([
        fetch('/api/products?limit=1000'),
        fetch('/api/categories?limit=1000'),
        fetch('/api/pages?limit=1000'),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts((data.products || []).map((p: any) => ({ id: p.id, title: p.title, handle: p.handle })));
      }

      if (collectionsRes.ok) {
        const data = await collectionsRes.json();
        setCollections((data.collections || []).map((c: any) => ({ id: c.id, title: c.title || c.name, handle: c.handle })));
      }

      if (pagesRes.ok) {
        const data = await pagesRes.json();
        setPages((data.pages || []).map((p: any) => ({ id: p.id, title: p.title, handle: p.handle })));
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.label) {
      alert('נא להזין תווית');
      return;
    }

    if (!newItem.url) {
      alert('נא להזין כתובת או לבחור מהרשימה');
      return;
    }

    try {
      setAdding(true);
      const url = newItem.url;
      let type: 'link' | 'product' | 'collection' | 'page' = 'link';
      let resourceId: number | null = null;

      // זיהוי אוטומטי של סוג הקישור
      if (url.startsWith('https://') || url.startsWith('http://')) {
        // לינק חיצוני
        type = 'link';
        resourceId = null;
      } else if (url.startsWith('/products/')) {
        // מוצר
        const handle = url.replace('/products/', '');
        const product = products.find(p => p.handle === handle);
        if (product) {
          type = 'product';
          resourceId = product.id;
        }
      } else if (url.startsWith('/categories/')) {
        // קטגוריה
        const handle = url.replace('/categories/', '');
        const collection = collections.find(c => c.handle === handle);
        if (collection) {
          type = 'collection';
          resourceId = collection.id;
        }
      } else if (url.startsWith('/') && !url.startsWith('/products/') && !url.startsWith('/categories/')) {
        // עמוד
        const handle = url.replace('/', '');
        const page = pages.find(p => p.handle === handle);
        if (page) {
          type = 'page';
          resourceId = page.id;
        }
      }

      const response = await fetch(`/api/navigation/${menuId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItem.label,
          label: newItem.label,
          url,
          type,
          resource_id: resourceId,
          position: items.length,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add item');
      }

      setNewItem({ label: '', url: '', linkType: 'custom', resourceId: null });
      await loadMenu();
    } catch (error: any) {
      alert(`שגיאה בהוספת פריט: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הפריט?')) {
      return;
    }

    try {
      const response = await fetch(`/api/navigation/${menuId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete item');
      }

      await loadMenu();
    } catch (error: any) {
      alert(`שגיאה במחיקת פריט: ${error.message}`);
    }
  };

  const handleUpdateItem = async (itemId: number, updates: Partial<NavigationMenuItem>) => {
    try {
      // אם מעדכנים label, גם נעדכן את title
      const updateData = { ...updates };
      if (updates.label !== undefined && updates.title === undefined) {
        updateData.title = updates.label;
      }
      
      // עדכון מקומי מיידי (ללא רענון)
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, ...updateData } : item
        )
      );
      
      const response = await fetch(`/api/navigation/${menuId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update item');
      }

      // לא מרעננים את העמוד - השינויים כבר מוצגים מקומית
    } catch (error: any) {
      console.error('Error updating item:', error);
      // במקרה של שגיאה, נטען מחדש
      await loadMenu();
    }
  };

  // הגדרות DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      // עדכון מקומי מיידי
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      
      // עדכון בשרת - עדכון כל הפוזיציות
      try {
        await Promise.all(
          newItems.map((item, index) =>
            fetch(`/api/navigation/${menuId}/items/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ position: index }),
            })
          )
        );
      } catch (error) {
        console.error('Error updating positions:', error);
        // במקרה של שגיאה, נטען מחדש
        await loadMenu();
      }
    }
  }, [items, menuId]);

  // אפשרויות עבור Autocomplete של פריט חדש
  const newItemAutocompleteOptions = useMemo(() => {
    if (!newItem.url || newItem.url.startsWith('https://') || newItem.url.startsWith('http://')) {
      return [];
    }
    const searchTerm = newItem.url.toLowerCase();
    const allResources = [
      ...products.map(p => ({ 
        id: p.id, 
        title: p.title, 
        handle: p.handle,
        displayUrl: `/products/${p.handle}`,
        type: 'product' as const
      })),
      ...collections.map(c => ({ 
        id: c.id, 
        title: c.title, 
        handle: c.handle,
        displayUrl: `/categories/${c.handle}`,
        type: 'collection' as const
      })),
      ...pages.map(p => ({ 
        id: p.id, 
        title: p.title, 
        handle: p.handle,
        displayUrl: `/${p.handle}`,
        type: 'page' as const
      })),
    ];
    const filtered = allResources.filter(resource => 
      resource.title.toLowerCase().includes(searchTerm) ||
      resource.handle.toLowerCase().includes(searchTerm) ||
      resource.displayUrl.toLowerCase().includes(searchTerm)
    );
    return filtered.slice(0, 20).map(resource => ({
      value: resource.displayUrl,
      label: `${resource.title} (${resource.type === 'product' ? 'מוצר' : resource.type === 'collection' ? 'קטגוריה' : 'עמוד'})`
    }));
  }, [newItem.url, products, collections, pages]);

  if (loading) {
    return (
      <div className="p-6" dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="p-6" dir="rtl">
        <p className="text-red-600">תפריט לא נמצא</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">עריכת תפריט: {menu.name}</h1>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          <HiArrowRight className="w-4 h-4 ml-1" />
          חזרה
        </Button>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">הגדרות תפריט</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם התפריט
            </label>
            <Input
              value={menu.name}
              onChange={(e) => {
                const newName = e.target.value;
                setMenu(prev => prev ? { ...prev, name: newName } : null);
                fetch(`/api/navigation/${menuId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: newName }),
                });
              }}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">פריטי התפריט</h2>
          <p className="text-sm text-gray-500 mb-4">גרור את הפריטים כדי לשנות את הסדר</p>
          
          {items.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500">אין פריטים בתפריט</p>
              <p className="text-sm text-gray-400 mt-1">הוסף פריט חדש למטה</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableMenuItem
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      products={products}
                      collections={collections}
                      pages={pages}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">הוסף פריט חדש</h2>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0" style={{ width: '100px' }}>
              <input
                placeholder="תווית"
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded px-3 py-1.5 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              />
            </div>
            <span className="text-gray-300 flex-shrink-0">←</span>
            <div className="flex-1 min-w-0">
              {(newItem.url.startsWith('https://') || newItem.url.startsWith('http://')) ? (
                <input
                  placeholder="https://example.com"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  className="w-full text-sm text-gray-600 bg-white rounded px-3 py-1.5 border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  dir="ltr"
                />
              ) : (
                <Autocomplete
                  value={newItem.url}
                  onChange={(value) => setNewItem({ ...newItem, url: value })}
                  onSelect={(option) => setNewItem({ ...newItem, url: option.value })}
                  options={newItemAutocompleteOptions}
                  placeholder="הקלד קישור או חפש עמוד, קטגוריה או מוצר"
                  className="text-sm"
                />
              )}
            </div>
            <Button 
              onClick={handleAddItem} 
              disabled={adding}
              className="flex-shrink-0 min-w-[80px]"
            >
              {adding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1" />
                  מוסיף...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

