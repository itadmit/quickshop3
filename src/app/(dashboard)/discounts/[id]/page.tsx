'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { HiSave, HiX, HiTag, HiTrash } from 'react-icons/hi';
import { DiscountCode, UpdateDiscountCodeRequest } from '@/types/discount';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

export default function EditDiscountPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const discountId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discount, setDiscount] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState<{
    code?: string;
    discount_type?: 'percentage' | 'fixed_amount' | 'free_shipping';
    value?: string;
    minimum_order_amount?: string;
    usage_limit?: string;
    applies_to?: 'all' | 'specific_products' | 'specific_collections';
    starts_at?: string;
    ends_at?: string;
    is_active?: boolean;
  }>({});

  useEffect(() => {
    loadDiscount();
  }, [discountId]);

  const loadDiscount = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/discounts/${discountId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'שגיאה',
            description: 'קוד הנחה לא נמצא',
            variant: 'destructive',
          });
          router.push('/discounts');
          return;
        }
        throw new Error('Failed to load discount');
      }

      const data = await response.json();
      setDiscount(data.discount);
      
      // Format dates for datetime-local input
      const startsAt = data.discount.starts_at 
        ? new Date(data.discount.starts_at).toISOString().slice(0, 16)
        : '';
      const endsAt = data.discount.ends_at
        ? new Date(data.discount.ends_at).toISOString().slice(0, 16)
        : '';

      setFormData({
        code: data.discount.code,
        discount_type: data.discount.discount_type,
        value: data.discount.value || '',
        minimum_order_amount: data.discount.minimum_order_amount || '',
        usage_limit: data.discount.usage_limit ? String(data.discount.usage_limit) : '',
        applies_to: data.discount.applies_to,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: data.discount.is_active,
      });
    } catch (error: any) {
      console.error('Error loading discount:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בטעינת קוד הנחה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.code.trim()) {
      toast({
        title: 'שגיאה',
        description: 'קוד הנחה הוא שדה חובה',
        variant: 'destructive',
      });
      return;
    }

    if (formData.discount_type !== 'free_shipping' && (!formData.value || !formData.value.trim())) {
      toast({
        title: 'שגיאה',
        description: 'ערך ההנחה הוא שדה חובה',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const payload: UpdateDiscountCodeRequest = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        value: formData.discount_type !== 'free_shipping' ? formData.value : undefined,
        minimum_order_amount: formData.minimum_order_amount || undefined,
        usage_limit: formData.usage_limit ? parseInt(String(formData.usage_limit)) : undefined,
        applies_to: formData.applies_to,
        starts_at: formData.starts_at || undefined,
        ends_at: formData.ends_at || undefined,
        is_active: formData.is_active,
      };

      const response = await fetch(`/api/discounts/${discountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה בעדכון קוד הנחה');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `קוד הנחה "${data.discount?.code || formData.code}" עודכן בהצלחה`,
      });

      router.push('/discounts');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון קוד הנחה',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את קוד ההנחה הזה?')) return;

    try {
      const response = await fetch(`/api/discounts/${discountId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete discount');
      }

      toast({
        title: 'הצלחה',
        description: 'קוד הנחה נמחק בהצלחה',
      });

      router.push('/discounts');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה במחיקת קוד הנחה',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6" dir="rtl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!discount) {
    return null;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ערוך קוד הנחה</h1>
          <p className="text-gray-500 mt-1">ערוך את פרטי קוד ההנחה</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <HiTrash className="w-4 h-4" />
            מחק
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <HiX className="w-4 h-4" />
            ביטול
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiTag className="w-5 h-5" />
            פרטי קוד הנחה
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="code">קוד הנחה *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="SUMMER2024"
                required
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">הקוד יומר לאותיות גדולות אוטומטית</p>
            </div>

            <div>
              <Label htmlFor="discount_type">סוג הנחה *</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, discount_type: value as 'percentage' | 'fixed_amount' | 'free_shipping' })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר סוג הנחה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">אחוזים (%)</SelectItem>
                  <SelectItem value="fixed_amount">סכום קבוע (₪)</SelectItem>
                  <SelectItem value="free_shipping">משלוח חינם</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.discount_type !== 'free_shipping' && (
              <div>
                <Label htmlFor="value">
                  ערך ההנחה * 
                  {formData.discount_type === 'percentage' ? ' (%)' : ' (₪)'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '50'}
                  required
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="minimum_order_amount">סכום מינימום להזמנה (₪)</Label>
              <Input
                id="minimum_order_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.minimum_order_amount}
                onChange={(e) => setFormData({ ...formData, minimum_order_amount: e.target.value })}
                placeholder="100"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="usage_limit">מגבלת שימושים</Label>
              <Input
                id="usage_limit"
                type="number"
                min="1"
                value={formData.usage_limit || ''}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value || undefined })}
                placeholder="ללא הגבלה"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                שימושים נוכחיים: {discount.usage_count} / {discount.usage_limit || '∞'}
              </p>
            </div>

            <div>
              <Label htmlFor="applies_to">חל על</Label>
              <Select
                value={formData.applies_to}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, applies_to: value as 'all' | 'specific_products' | 'specific_collections' })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המוצרים</SelectItem>
                  <SelectItem value="specific_products">מוצרים ספציפיים</SelectItem>
                  <SelectItem value="specific_collections">אוספים ספציפיים</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="starts_at">תאריך התחלה</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ends_at">תאריך סיום</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  קוד פעיל
                </Label>
              </div>
              <p className="text-sm text-gray-500 mt-1">רק קודים פעילים יכולים לשמש בהזמנות</p>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            <HiX className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <HiSave className="w-4 h-4 ml-2" />
            {saving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </div>
      </form>
    </div>
  );
}

