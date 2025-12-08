'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { HiPlus, HiPencil, HiTrash, HiShoppingBag } from 'react-icons/hi';

interface ProductAddon {
  id: number;
  store_id: number;
  name: string;
  description: string | null;
  addon_type: string;
  is_required: boolean;
  scope: string;
  product_ids: number[];
  category_ids: number[];
  position: number;
  values: AddonValue[];
  created_at: Date;
  updated_at: Date;
}

interface AddonValue {
  id?: number;
  label: string;
  value?: string;
  price: number;
  position: number;
}

interface Category {
  id: number;
  title: string;
}

interface Product {
  id: number;
  title: string;
}

const ADDON_TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: 'בחירה אחת',
  MULTIPLE_CHOICE: 'בחירה מרובה',
  TEXT_INPUT: 'קלט טקסט',
  CHECKBOX: 'תיבת סימון',
};

export default function ProductAddonsPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ProductAddon | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    addon_type: 'SINGLE_CHOICE' as ProductAddon['addon_type'],
    is_required: false,
    scope: 'GLOBAL' as 'GLOBAL' | 'PRODUCT' | 'CATEGORY',
    product_ids: [] as number[],
    category_ids: [] as number[],
    position: 0,
    values: [] as AddonValue[],
  });

  const [newValue, setNewValue] = useState({ label: '', price: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [addonsRes, categoriesRes, productsRes] = await Promise.all([
        fetch('/api/product-addons', { credentials: 'include' }),
        fetch('/api/categories', { credentials: 'include' }),
        fetch('/api/products?limit=1000', { credentials: 'include' }),
      ]);

      if (addonsRes.ok) {
        const data = await addonsRes.json();
        setAddons(data || []);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.collections || []);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת הנתונים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingAddon(null);
    setFormData({
      name: '',
      description: '',
      addon_type: 'SINGLE_CHOICE',
      is_required: false,
      scope: 'GLOBAL',
      product_ids: [],
      category_ids: [],
      position: addons.length,
      values: [],
    });
    setNewValue({ label: '', price: '' });
    setDialogOpen(true);
  };

  const handleEdit = (addon: ProductAddon) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name,
      description: addon.description || '',
      addon_type: addon.addon_type as ProductAddon['addon_type'],
      is_required: addon.is_required,
      scope: addon.scope as 'GLOBAL' | 'PRODUCT' | 'CATEGORY',
      product_ids: addon.product_ids || [],
      category_ids: addon.category_ids || [],
      position: addon.position,
      values: addon.values.map((v) => ({
        label: v.label,
        value: v.value,
        price: v.price,
        position: v.position,
      })),
    });
    setNewValue({ label: '', price: '' });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תוספת זו?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/product-addons/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'התוספת נמחקה בהצלחה',
        });
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה במחיקת התוספת',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting addon:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת התוספת',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addValue = () => {
    if (!newValue.label.trim() || !newValue.price) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא תווית ומחיר',
        variant: 'destructive',
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      values: [
        ...prev.values,
        {
          label: newValue.label,
          price: parseFloat(newValue.price),
          position: prev.values.length,
        },
      ],
    }));
    setNewValue({ label: '', price: '' });
  };

  const removeValue = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index),
    }));
  };

  const handleTypeChange = (newType: ProductAddon['addon_type']) => {
    setFormData((prev) => {
      if (newType === 'TEXT_INPUT' || newType === 'CHECKBOX') {
        return {
          ...prev,
          addon_type: newType,
          values: [{ label: prev.name || newType, price: 0, position: 0 }],
        };
      }
      return {
        ...prev,
        addon_type: newType,
        values: [],
      };
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את שם התוספת',
        variant: 'destructive',
      });
      return;
    }

    if (
      formData.addon_type !== 'TEXT_INPUT' &&
      formData.addon_type !== 'CHECKBOX' &&
      formData.values.length === 0
    ) {
      toast({
        title: 'שגיאה',
        description: 'יש להוסיף לפחות ערך אחד',
        variant: 'destructive',
      });
      return;
    }

    if (formData.scope === 'PRODUCT' && formData.product_ids.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לפחות מוצר אחד',
        variant: 'destructive',
      });
      return;
    }

    if (formData.scope === 'CATEGORY' && formData.category_ids.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לפחות קטגוריה אחת',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        editingAddon
          ? `/api/product-addons/${editingAddon.id}`
          : '/api/product-addons',
        {
          method: editingAddon ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: editingAddon
            ? 'התוספת עודכנה בהצלחה'
            : 'התוספת נוצרה בהצלחה',
        });
        setDialogOpen(false);
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה בשמירת התוספת',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving addon:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשמירת התוספת',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumn<ProductAddon>[] = [
    {
      key: 'name',
      label: 'שם',
      render: (addon) => (
        <div className="font-medium text-gray-900">{addon.name}</div>
      ),
    },
    {
      key: 'addon_type',
      label: 'סוג',
      render: (addon) => (
        <div className="text-sm text-gray-600">
          {ADDON_TYPE_LABELS[addon.addon_type] || addon.addon_type}
        </div>
      ),
    },
    {
      key: 'scope',
      label: 'תחום',
      render: (addon) => (
        <div className="text-sm text-gray-600">
          {addon.scope === 'GLOBAL'
            ? 'גלובלי'
            : addon.scope === 'PRODUCT'
            ? `${addon.product_ids?.length || 0} מוצרים`
            : `${addon.category_ids?.length || 0} קטגוריות`}
        </div>
      ),
    },
    {
      key: 'values',
      label: 'אפשרויות',
      render: (addon) => (
        <div className="text-sm text-gray-600">
          {addon.values?.length > 0 ? `${addon.values.length} אפשרויות` : '-'}
        </div>
      ),
    },
    {
      key: 'is_required',
      label: 'חובה',
      render: (addon) => (
        <div className="text-sm">
          {addon.is_required ? (
            <span className="text-red-600 font-medium">כן</span>
          ) : (
            <span className="text-gray-400">לא</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="תוספות למוצרים"
        description="תוספות בתשלום שלקוחות יכולים להוסיף למוצרים (רקמה, אריזת מתנה, וכו')"
        primaryAction={{
          label: 'תוספת חדשה',
          onClick: handleCreateNew,
          icon: <HiPlus className="w-4 h-4" />,
        }}
        columns={columns}
        data={addons}
        keyExtractor={(addon) => addon.id}
        loading={loading}
        rowActions={(addon) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(addon);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="ערוך"
            >
              <HiPencil className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(addon.id);
              }}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="מחק"
            >
              <HiTrash className="w-5 h-5 text-red-600" />
            </button>
          </div>
        )}
        emptyState={
          <div className="text-center py-12">
            <HiShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין תוספות למוצרים</p>
            <button
              onClick={handleCreateNew}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              צור תוספת ראשונה
            </button>
          </div>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddon ? 'עריכת תוספת' : 'תוספת חדשה'}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">שם התוספת *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="לדוגמה: רקמה על הבגד"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="addon_type">סוג תוספת *</Label>
              <Select
                value={formData.addon_type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue>
                    {ADDON_TYPE_LABELS[formData.addon_type] || formData.addon_type}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_CHOICE">בחירה אחת (Radio)</SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">בחירה מרובה (Checkboxes)</SelectItem>
                  <SelectItem value="TEXT_INPUT">קלט טקסט חופשי</SelectItem>
                  <SelectItem value="CHECKBOX">תיבת סימון בודדת</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">תיאור (אופציונלי)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="תיאור קצר של התוספת"
                rows={2}
              />
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label htmlFor="scope">תחום *</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    scope: value as 'GLOBAL' | 'PRODUCT' | 'CATEGORY',
                    product_ids: [],
                    category_ids: [],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.scope === 'GLOBAL'
                      ? 'גלובלי - לכל המוצרים'
                      : formData.scope === 'PRODUCT'
                      ? 'מוצרים ספציפיים'
                      : 'קטגוריות ספציפיות'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">גלובלי - לכל המוצרים</SelectItem>
                  <SelectItem value="PRODUCT">מוצרים ספציפיים</SelectItem>
                  <SelectItem value="CATEGORY">קטגוריות ספציפיות</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Selection */}
            {formData.scope === 'PRODUCT' && (
              <div className="space-y-2">
                <Label>בחר מוצרים *</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {products.slice(0, 50).map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.product_ids.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              product_ids: [...prev.product_ids, product.id],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              product_ids: prev.product_ids.filter(
                                (id) => id !== product.id
                              ),
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{product.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Category Selection */}
            {formData.scope === 'CATEGORY' && (
              <div className="space-y-2">
                <Label>בחר קטגוריות *</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.category_ids.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              category_ids: [...prev.category_ids, category.id],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              category_ids: prev.category_ids.filter(
                                (id) => id !== category.id
                              ),
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span>{category.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Values (for SINGLE_CHOICE and MULTIPLE_CHOICE) */}
            {(formData.addon_type === 'SINGLE_CHOICE' ||
              formData.addon_type === 'MULTIPLE_CHOICE') && (
              <div className="space-y-2">
                <Label>אפשרויות *</Label>

                {/* Add Value */}
                <div className="flex gap-2">
                  <Input
                    placeholder="תווית (לדוגמה: רקמה שם)"
                    value={newValue.label}
                    onChange={(e) =>
                      setNewValue((prev) => ({ ...prev, label: e.target.value }))
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addValue();
                      }
                    }}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="מחיר"
                    value={newValue.price}
                    onChange={(e) =>
                      setNewValue((prev) => ({ ...prev, price: e.target.value }))
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addValue();
                      }
                    }}
                    className="w-32"
                  />
                  <Button onClick={addValue} size="sm">
                    <HiPlus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Values List */}
                {formData.values.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {formData.values.map((value, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span>{value.label}</span>
                          <span className="text-sm text-gray-600">
                            ₪{value.price}
                          </span>
                        </div>
                        <button
                          onClick={() => removeValue(index)}
                          className="p-1 hover:bg-red-50 rounded text-red-600"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Price for TEXT_INPUT */}
            {formData.addon_type === 'TEXT_INPUT' && (
              <div className="space-y-2">
                <Label htmlFor="textInputPrice">מחיר התוספת (אופציונלי)</Label>
                <Input
                  id="textInputPrice"
                  type="number"
                  placeholder="0.00"
                  value={formData.values[0]?.price || ''}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      values: [
                        { label: prev.name || 'קלט טקסט', price, position: 0 },
                      ],
                    }));
                  }}
                />
                <p className="text-xs text-gray-500">
                  אם המחיר 0, התוספת תהיה בחינם (למשל: הערות מיוחדות)
                </p>
              </div>
            )}

            {/* Price for CHECKBOX */}
            {formData.addon_type === 'CHECKBOX' && (
              <div className="space-y-2">
                <Label htmlFor="checkboxPrice">מחיר התוספת *</Label>
                <Input
                  id="checkboxPrice"
                  type="number"
                  placeholder="0.00"
                  value={formData.values[0]?.price || ''}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      values: [
                        { label: prev.name || 'תיבת סימון', price, position: 0 },
                      ],
                    }));
                  }}
                />
              </div>
            )}

            {/* Required */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_required">תוספת חובה</Label>
              <input
                type="checkbox"
                id="is_required"
                checked={formData.is_required}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_required: e.target.checked }))
                }
                className="rounded"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

