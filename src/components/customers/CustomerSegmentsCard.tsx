'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { HiUsers, HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface SegmentCriteria {
  min_orders?: number;
  max_orders?: number;
  min_total_spent?: number;
  max_total_spent?: number;
  tags?: string[];
  state?: string;
  accepts_marketing?: boolean;
}

interface Segment {
  id: number;
  name: string;
  description: string | null;
  criteria: SegmentCriteria;
  customer_count: number;
  is_active: boolean;
}

interface CustomerSegmentsCardProps {
  customerId?: number;
  onSegmentSelect?: (segmentId: number) => void;
}

export function CustomerSegmentsCard({ customerId, onSegmentSelect }: CustomerSegmentsCardProps) {
  const { toast } = useOptimisticToast();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: {
      min_orders: undefined as number | undefined,
      max_orders: undefined as number | undefined,
      min_total_spent: undefined as number | undefined,
      max_total_spent: undefined as number | undefined,
      tags: [] as string[],
      state: undefined as string | undefined,
      accepts_marketing: undefined as boolean | undefined,
    },
    is_active: true,
  });

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers/segments?active_only=false');
      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments || []);
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם סגמנט',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/customers/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'הסגמנט נוצר בהצלחה',
        });
        setCreateDialogOpen(false);
        resetForm();
        await fetchSegments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create segment');
      }
    } catch (error: any) {
      console.error('Error creating segment:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת הסגמנט',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (segment: Segment) => {
    setSelectedSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
      criteria: {
        min_orders: segment.criteria.min_orders,
        max_orders: segment.criteria.max_orders,
        min_total_spent: segment.criteria.min_total_spent,
        max_total_spent: segment.criteria.max_total_spent,
        tags: segment.criteria.tags || [],
        state: segment.criteria.state,
        accepts_marketing: segment.criteria.accepts_marketing,
      },
      is_active: segment.is_active,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSegment || !formData.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם סגמנט',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/customers/segments/${selectedSegment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'הסגמנט עודכן בהצלחה',
        });
        setEditDialogOpen(false);
        setSelectedSegment(null);
        resetForm();
        await fetchSegments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update segment');
      }
    } catch (error: any) {
      console.error('Error updating segment:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון הסגמנט',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (segmentId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הסגמנט הזה?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/customers/segments/${segmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'הסגמנט נמחק בהצלחה',
        });
        await fetchSegments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete segment');
      }
    } catch (error: any) {
      console.error('Error deleting segment:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה במחיקת הסגמנט',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      criteria: {
        min_orders: undefined,
        max_orders: undefined,
        min_total_spent: undefined,
        max_total_spent: undefined,
        tags: [],
        state: '',
        accepts_marketing: undefined,
      },
      is_active: true,
    });
  };

  const formatCriteria = (criteria: Segment['criteria']) => {
    const parts: string[] = [];
    if (criteria.min_orders !== undefined) parts.push(`מינימום ${criteria.min_orders} הזמנות`);
    if (criteria.max_orders !== undefined) parts.push(`מקסימום ${criteria.max_orders} הזמנות`);
    if (criteria.min_total_spent !== undefined) parts.push(`מינימום ₪${criteria.min_total_spent} הוצאות`);
    if (criteria.max_total_spent !== undefined) parts.push(`מקסימום ₪${criteria.max_total_spent} הוצאות`);
    if (criteria.tags && criteria.tags.length > 0) parts.push(`תגיות: ${criteria.tags.join(', ')}`);
    if (criteria.state) parts.push(`סטטוס: ${criteria.state === 'enabled' ? 'פעיל' : criteria.state === 'disabled' ? 'מושבת' : criteria.state}`);
    if (criteria.accepts_marketing !== undefined) parts.push(`משווק: ${criteria.accepts_marketing ? 'כן' : 'לא'}`);
    return parts.length > 0 ? parts.join(' • ') : 'ללא קריטריונים';
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HiUsers className="w-5 h-5" />
              <span>סגמנטים</span>
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
              className="gap-1"
            >
              <HiPlus className="w-4 h-4" />
              <span className="text-sm">חדש</span>
            </Button>
          </div>

          {loading && segments.length === 0 ? (
            <div className="text-center text-gray-500 py-4">טוען סגמנטים...</div>
          ) : segments.length === 0 ? (
            <div className="text-center py-6">
              <HiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">אין סגמנטים עדיין</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  resetForm();
                  setCreateDialogOpen(true);
                }}
                className="gap-2"
              >
                <HiPlus className="w-4 h-4" />
                צור סגמנט ראשון
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-emerald-200 hover:bg-emerald-50/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                        {!segment.is_active && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">לא פעיל</span>
                        )}
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">
                          {segment.customer_count} לקוחות
                        </span>
                      </div>
                      {segment.description && (
                        <p className="text-sm text-gray-600 mb-2">{segment.description}</p>
                      )}
                      <p className="text-xs text-gray-500">{formatCriteria(segment.criteria)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(segment)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="ערוך"
                      >
                        <HiPencil className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(segment.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="מחק"
                      >
                        <HiTrash className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>יצירת סגמנט חדש</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name">שם הסגמנט *</Label>
              <Input
                id="segment-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="לדוגמה: לקוחות VIP, לקוחות חדשים"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment-description">תיאור</Label>
              <Input
                id="segment-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור קצר של הסגמנט"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-orders">מינימום הזמנות</Label>
                <Input
                  id="min-orders"
                  type="number"
                  value={formData.criteria.min_orders || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    criteria: { ...prev.criteria, min_orders: e.target.value ? parseInt(e.target.value) : undefined }
                  }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-orders">מקסימום הזמנות</Label>
                <Input
                  id="max-orders"
                  type="number"
                  value={formData.criteria.max_orders || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    criteria: { ...prev.criteria, max_orders: e.target.value ? parseInt(e.target.value) : undefined }
                  }))}
                  placeholder="∞"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-total-spent">מינימום הוצאות (₪)</Label>
                <Input
                  id="min-total-spent"
                  type="number"
                  value={formData.criteria.min_total_spent || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    criteria: { ...prev.criteria, min_total_spent: e.target.value ? parseFloat(e.target.value) : undefined }
                  }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-total-spent">מקסימום הוצאות (₪)</Label>
                <Input
                  id="max-total-spent"
                  type="number"
                  value={formData.criteria.max_total_spent || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    criteria: { ...prev.criteria, max_total_spent: e.target.value ? parseFloat(e.target.value) : undefined }
                  }))}
                  placeholder="∞"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment-state">סטטוס</Label>
              <select
                id="segment-state"
                value={formData.criteria.state || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  criteria: { ...prev.criteria, state: e.target.value ? e.target.value : undefined }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">כל הסטטוסים</option>
                <option value="enabled">פעיל</option>
                <option value="disabled">מושבת</option>
                <option value="invited">הוזמן</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accepts-marketing">משווק</Label>
              <select
                id="accepts-marketing"
                value={formData.criteria.accepts_marketing === undefined ? '' : formData.criteria.accepts_marketing ? 'true' : 'false'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  criteria: {
                    ...prev.criteria,
                    accepts_marketing: e.target.value === '' ? undefined : e.target.value === 'true'
                  }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">כל הלקוחות</option>
                <option value="true">משווקים</option>
                <option value="false">לא משווקים</option>
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
                  resetForm();
                }}
                className="flex-1"
                disabled={loading}
              >
                ביטול
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                className="flex-1 gap-2"
                disabled={loading || !formData.name.trim()}
              >
                {loading ? 'יוצר...' : 'צור סגמנט'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>עריכת סגמנט</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-segment-name">שם הסגמנט *</Label>
              <Input
                id="edit-segment-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="לדוגמה: לקוחות VIP, לקוחות חדשים"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-segment-description">תיאור</Label>
              <Input
                id="edit-segment-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור קצר של הסגמנט"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-min-orders">מינימום הזמנות</Label>
                <Input
                  id="edit-min-orders"
                  type="number"
                  value={formData.criteria.min_orders || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    criteria: { ...prev.criteria, min_orders: e.target.value ? parseInt(e.target.value) : undefined }
                  }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max-orders">מקסימום הזמנות</Label>
                <Input
                  id="edit-max-orders"
                  type="number"
                  value={formData.criteria.max_orders || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    criteria: { ...prev.criteria, max_orders: e.target.value ? parseInt(e.target.value) : undefined }
                  }))}
                  placeholder="∞"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-min-total-spent">מינימום הוצאות (₪)</Label>
                <Input
                  id="edit-min-total-spent"
                  type="number"
                  value={formData.criteria.min_total_spent || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    criteria: { ...prev.criteria, min_total_spent: e.target.value ? parseFloat(e.target.value) : undefined }
                  }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max-total-spent">מקסימום הוצאות (₪)</Label>
                <Input
                  id="edit-max-total-spent"
                  type="number"
                  value={formData.criteria.max_total_spent || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    criteria: { ...prev.criteria, max_total_spent: e.target.value ? parseFloat(e.target.value) : undefined }
                  }))}
                  placeholder="∞"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-segment-state">סטטוס</Label>
              <select
                id="edit-segment-state"
                value={formData.criteria.state || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  criteria: { ...prev.criteria, state: e.target.value ? e.target.value : undefined }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">כל הסטטוסים</option>
                <option value="enabled">פעיל</option>
                <option value="disabled">מושבת</option>
                <option value="invited">הוזמן</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-accepts-marketing">משווק</Label>
              <select
                id="edit-accepts-marketing"
                value={formData.criteria.accepts_marketing === undefined ? '' : formData.criteria.accepts_marketing ? 'true' : 'false'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  criteria: {
                    ...prev.criteria,
                    accepts_marketing: e.target.value === '' ? undefined : e.target.value === 'true'
                  }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">כל הלקוחות</option>
                <option value="true">משווקים</option>
                <option value="false">לא משווקים</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedSegment(null);
                  resetForm();
                }}
                className="flex-1"
                disabled={loading}
              >
                ביטול
              </Button>
              <Button
                type="button"
                onClick={handleUpdate}
                className="flex-1 gap-2"
                disabled={loading || !formData.name.trim()}
              >
                {loading ? 'מעדכן...' : 'עדכן סגמנט'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

