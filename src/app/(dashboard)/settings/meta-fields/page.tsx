'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { HiPlus, HiPencil, HiTrash, HiAdjustments } from 'react-icons/hi';

interface MetaFieldDefinition {
  id: number;
  store_id: number;
  namespace: string;
  key: string;
  label: string;
  description: string | null;
  value_type: string;
  required: boolean;
  validations: any;
  scope: string;
  category_ids: number[];
  show_in_storefront: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
}

interface Category {
  id: number;
  title: string;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  string: 'טקסט',
  integer: 'מספר שלם',
  json: 'JSON',
  date: 'תאריך',
  color: 'צבע',
  checkbox: 'תיבת סימון',
  number: 'מספר עשרוני',
  url: 'קישור',
  file: 'קובץ',
};

export default function MetaFieldsPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [definitions, setDefinitions] = useState<MetaFieldDefinition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<MetaFieldDefinition | null>(null);
  
  const [formData, setFormData] = useState({
    namespace: 'custom',
    key: '',
    label: '',
    description: '',
    value_type: 'string',
    required: false,
    scope: 'GLOBAL' as 'GLOBAL' | 'CATEGORY',
    category_ids: [] as number[],
    show_in_storefront: false,
    position: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [fieldsRes, categoriesRes] = await Promise.all([
        fetch('/api/meta-field-definitions', { credentials: 'include' }),
        fetch('/api/categories', { credentials: 'include' }),
      ]);
      
      if (fieldsRes.ok) {
        const data = await fieldsRes.json();
        setDefinitions(data || []);
      }
      
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.collections || []);
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
    setEditingDefinition(null);
    setFormData({
      namespace: 'custom',
      key: '',
      label: '',
      description: '',
      value_type: 'string',
      required: false,
      scope: 'GLOBAL',
      category_ids: [],
      show_in_storefront: false,
      position: definitions.length,
    });
    setDialogOpen(true);
  };

  const handleEdit = (definition: MetaFieldDefinition) => {
    setEditingDefinition(definition);
    setFormData({
      namespace: definition.namespace,
      key: definition.key,
      label: definition.label,
      description: definition.description || '',
      value_type: definition.value_type,
      required: definition.required,
      scope: definition.scope as 'GLOBAL' | 'CATEGORY',
      category_ids: definition.category_ids || [],
      show_in_storefront: definition.show_in_storefront,
      position: definition.position,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק שדה זה? כל הערכים במוצרים ימחקו גם כן.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/meta-field-definitions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'השדה נמחק בהצלחה',
        });
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה במחיקת השדה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת השדה',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.label.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את שם השדה',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.key.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את מזהה השדה',
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
        editingDefinition
          ? `/api/meta-field-definitions/${editingDefinition.id}`
          : '/api/meta-field-definitions',
        {
          method: editingDefinition ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: editingDefinition
            ? 'השדה עודכן בהצלחה'
            : 'השדה נוצר בהצלחה',
        });
        setDialogOpen(false);
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה בשמירת השדה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשמירת השדה',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumn<MetaFieldDefinition>[] = [
    {
      key: 'label',
      label: 'שם השדה',
      render: (def) => (
        <div className="font-medium text-gray-900">{def.label}</div>
      ),
    },
    {
      key: 'namespace',
      label: 'Namespace / Key',
      render: (def) => (
        <div className="text-sm text-gray-500 font-mono">
          {def.namespace}.{def.key}
        </div>
      ),
    },
    {
      key: 'value_type',
      label: 'סוג',
      render: (def) => (
        <div className="text-sm text-gray-600">
          {FIELD_TYPE_LABELS[def.value_type] || def.value_type}
        </div>
      ),
    },
    {
      key: 'scope',
      label: 'תחום',
      render: (def) => (
        <div className="text-sm text-gray-600">
          {def.scope === 'GLOBAL' ? 'גלובלי' : `${def.category_ids?.length || 0} קטגוריות`}
        </div>
      ),
    },
    {
      key: 'required',
      label: 'חובה',
      render: (def) => (
        <div className="text-sm">
          {def.required ? (
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
        title="שדות מטא (Meta Fields)"
        description="הוסף שדות נוספים למוצרים שלך. השדות יופיעו בעמוד יצירה/עריכת מוצר"
        primaryAction={{
          label: 'שדה חדש',
          onClick: handleCreateNew,
          icon: <HiPlus className="w-4 h-4" />,
        }}
        columns={columns}
        data={definitions}
        keyExtractor={(def) => def.id}
        loading={loading}
        rowActions={(def) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(def);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="ערוך"
            >
              <HiPencil className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(def.id);
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
            <HiAdjustments className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין שדות מטא</p>
            <button
              onClick={handleCreateNew}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              צור שדה מטא ראשון
            </button>
          </div>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDefinition ? 'עריכת שדה' : 'שדה חדש'}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label">שם השדה *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder="לדוגמה: מרכיבים"
              />
            </div>

            {/* Key */}
            <div className="space-y-2">
              <Label htmlFor="key">מזהה ייחודי *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                  }))
                }
                placeholder="לדוגמה: ingredients"
                disabled={!!editingDefinition}
              />
              <p className="text-xs text-gray-500">
                רק אותיות אנגליות קטנות, מספרים וקו תחתון. לא ניתן לשנות לאחר היצירה.
              </p>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">סוג שדה *</Label>
              <Select
                value={formData.value_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, value_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {FIELD_TYPE_LABELS[formData.value_type] || formData.value_type}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">הסבר (אופציונלי)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="הסבר קצר על מה השדה הזה"
                rows={2}
              />
            </div>

            {/* Namespace */}
            <div className="space-y-2">
              <Label htmlFor="namespace">Namespace</Label>
              <Input
                id="namespace"
                value={formData.namespace}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    namespace: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                  }))
                }
                placeholder="custom"
                disabled={!!editingDefinition}
              />
              <p className="text-xs text-gray-500">
                מאפשר ארגון של שדות לקבוצות (לדוגמה: custom, product, shipping)
              </p>
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label htmlFor="scope">תחום *</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, scope: value as 'GLOBAL' | 'CATEGORY', category_ids: [] }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.scope === 'GLOBAL' ? 'גלובלי - לכל המוצרים' : 'קטגוריה - למוצרים בקטגוריות ספציפיות'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">גלובלי - לכל המוצרים</SelectItem>
                  <SelectItem value="CATEGORY">קטגוריה - למוצרים בקטגוריות ספציפיות</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            {/* Required */}
            <div className="flex items-center justify-between">
              <Label htmlFor="required">שדה חובה</Label>
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, required: e.target.checked }))
                }
                className="rounded"
              />
            </div>

            {/* Show in Storefront */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show_in_storefront">הצג בחנות</Label>
              <input
                type="checkbox"
                id="show_in_storefront"
                checked={formData.show_in_storefront}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, show_in_storefront: e.target.checked }))
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

