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
import { HiPlus, HiPencil, HiTrash, HiTable } from 'react-icons/hi';

interface SizeChart {
  id: number;
  store_id: number;
  name: string;
  chart_type: string;
  chart_data: any;
  image_url: string | null;
  description: string | null;
  scope: string;
  category_ids: number[];
  position: number;
  created_at: Date;
  updated_at: Date;
}

interface Category {
  id: number;
  title: string;
}

const CHART_TYPE_LABELS: Record<string, string> = {
  clothing: 'ביגוד',
  shoes: 'נעליים',
  accessories: 'אביזרים',
  other: 'אחר',
};

export default function SizeChartsPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<SizeChart | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    chart_type: 'clothing',
    chart_data: {},
    image_url: '',
    description: '',
    scope: 'GLOBAL' as 'GLOBAL' | 'CATEGORY',
    category_ids: [] as number[],
    position: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [chartsRes, categoriesRes] = await Promise.all([
        fetch('/api/size-charts', { credentials: 'include' }),
        fetch('/api/categories', { credentials: 'include' }),
      ]);

      if (chartsRes.ok) {
        const data = await chartsRes.json();
        setSizeCharts(data || []);
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
    setEditingChart(null);
    setFormData({
      name: '',
      chart_type: 'clothing',
      chart_data: {},
      image_url: '',
      description: '',
      scope: 'GLOBAL',
      category_ids: [],
      position: sizeCharts.length,
    });
    setDialogOpen(true);
  };

  const handleEdit = (chart: SizeChart) => {
    setEditingChart(chart);
    setFormData({
      name: chart.name,
      chart_type: chart.chart_type,
      chart_data: chart.chart_data || {},
      image_url: chart.image_url || '',
      description: chart.description || '',
      scope: chart.scope as 'GLOBAL' | 'CATEGORY',
      category_ids: chart.category_ids || [],
      position: chart.position,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק טבלת מידות זו?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/size-charts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'טבלת המידות נמחקה בהצלחה',
        });
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה במחיקת טבלת המידות',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting size chart:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת טבלת המידות',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את שם טבלת המידות',
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
        editingChart
          ? `/api/size-charts/${editingChart.id}`
          : '/api/size-charts',
        {
          method: editingChart ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: editingChart
            ? 'טבלת המידות עודכנה בהצלחה'
            : 'טבלת המידות נוצרה בהצלחה',
        });
        setDialogOpen(false);
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה בשמירת טבלת המידות',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving size chart:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשמירת טבלת המידות',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumn<SizeChart>[] = [
    {
      key: 'name',
      label: 'שם',
      render: (chart) => (
        <div className="font-medium text-gray-900">{chart.name}</div>
      ),
    },
    {
      key: 'chart_type',
      label: 'סוג',
      render: (chart) => (
        <div className="text-sm text-gray-600">
          {CHART_TYPE_LABELS[chart.chart_type] || chart.chart_type}
        </div>
      ),
    },
    {
      key: 'scope',
      label: 'תחום',
      render: (chart) => (
        <div className="text-sm text-gray-600">
          {chart.scope === 'GLOBAL' ? 'גלובלי' : `${chart.category_ids?.length || 0} קטגוריות`}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'תיאור',
      render: (chart) => (
        <div className="text-sm text-gray-500 line-clamp-2">
          {chart.description || '-'}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="טבלאות מידות"
        description="נהל טבלאות מידות למוצרים. הטבלאות יופיעו בעמוד יצירה/עריכת מוצר"
        primaryAction={{
          label: 'טבלת מידות חדשה',
          onClick: handleCreateNew,
          icon: <HiPlus className="w-4 h-4" />,
        }}
        columns={columns}
        data={sizeCharts}
        keyExtractor={(chart) => chart.id}
        loading={loading}
        rowActions={(chart) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(chart);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="ערוך"
            >
              <HiPencil className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(chart.id);
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
            <HiTable className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין טבלאות מידות</p>
            <button
              onClick={handleCreateNew}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              צור טבלת מידות ראשונה
            </button>
          </div>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChart ? 'עריכת טבלת מידות' : 'טבלת מידות חדשה'}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">שם טבלת המידות *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="לדוגמה: מידות חולצות"
              />
            </div>

            {/* Chart Type */}
            <div className="space-y-2">
              <Label htmlFor="chart_type">סוג טבלת מידות *</Label>
              <Select
                value={formData.chart_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, chart_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {CHART_TYPE_LABELS[formData.chart_type] || formData.chart_type}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHART_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
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
                placeholder="תיאור קצר של טבלת המידות"
                rows={2}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image_url">קישור לתמונה (אופציונלי)</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, image_url: e.target.value }))
                }
                placeholder="https://example.com/image.jpg"
              />
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

            {/* Chart Data Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>הערה:</strong> נתוני הטבלה (chart_data) יוגדרו בעת עריכת המוצר.
                כאן תוכל להגדיר את ההגדרות הכלליות של טבלת המידות.
              </p>
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

