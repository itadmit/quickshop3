'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { HiSave, HiX, HiTag } from 'react-icons/hi';
import { CreateDiscountCodeRequest } from '@/types/discount';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

export default function NewDiscountPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    code: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
    value: string;
    minimum_order_amount: string;
    usage_limit?: string;
    applies_to: 'all' | 'specific_products' | 'specific_collections';
    starts_at: string;
    ends_at: string;
    is_active: boolean;
  }>({
    code: '',
    discount_type: 'percentage',
    value: '',
    minimum_order_amount: '',
    usage_limit: undefined,
    applies_to: 'all',
    starts_at: '',
    ends_at: '',
    is_active: true,
  });

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
      setLoading(true);
      
      const payload: CreateDiscountCodeRequest = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type!,
        value: formData.discount_type !== 'free_shipping' ? formData.value : undefined,
        minimum_order_amount: formData.minimum_order_amount || undefined,
        usage_limit: formData.usage_limit ? parseInt(String(formData.usage_limit)) : undefined,
        applies_to: formData.applies_to || 'all',
        starts_at: formData.starts_at || undefined,
        ends_at: formData.ends_at || undefined,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
      };

      const response = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה ביצירת קוד הנחה');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `קוד הנחה "${data.discount?.code || formData.code}" נוצר בהצלחה`,
      });

      router.push('/discounts');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת קוד הנחה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">קוד הנחה חדש</h1>
          <p className="text-gray-500 mt-1">צור קוד הנחה חדש</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <HiX className="w-4 h-4" />
          ביטול
        </Button>
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
              <p className="text-sm text-gray-500 mt-1">השאר ריק למגבלה ללא הגבלה</p>
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
            disabled={loading}
          >
            <HiX className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <HiSave className="w-4 h-4 ml-2" />
            {loading ? 'שומר...' : 'שמור קוד הנחה'}
          </Button>
        </div>
      </form>
    </div>
  );
}

