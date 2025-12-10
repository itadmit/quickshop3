'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { HiSave, HiX, HiGift } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

export default function NewGiftCardPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    initial_value: '',
    currency: 'ILS',
    expires_at: '',
    customer_id: '',
    order_id: '',
    note: '',
    is_active: true,
  });

  // Generate random code if empty
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.code.trim()) {
      toast({
        title: 'שגיאה',
        description: 'קוד כרטיס המתנה הוא שדה חובה',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.initial_value || parseFloat(formData.initial_value) <= 0) {
      toast({
        title: 'שגיאה',
        description: 'ערך ראשוני חייב להיות גדול מ-0',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload: any = {
        code: formData.code.toUpperCase().trim(),
        initial_value: parseFloat(formData.initial_value),
        currency: formData.currency,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        order_id: formData.order_id ? parseInt(formData.order_id) : null,
        note: formData.note || null,
      };

      const response = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה ביצירת כרטיס מתנה');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `כרטיס מתנה "${data.gift_card?.code || formData.code}" נוצר בהצלחה`,
      });

      router.push('/gift-cards');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת כרטיס מתנה',
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
          <h1 className="text-2xl font-bold text-gray-900">כרטיס מתנה חדש</h1>
          <p className="text-gray-500 mt-1">צור כרטיס מתנה חדש</p>
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
            <HiGift className="w-5 h-5" />
            פרטי כרטיס המתנה
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="code">קוד כרטיס המתנה *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="GIFT12345678"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateCode}
                  className="whitespace-nowrap"
                >
                  צור קוד
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">הקוד יומר לאותיות גדולות אוטומטית</p>
            </div>

            <div>
              <Label htmlFor="initial_value">ערך ראשוני (₪) *</Label>
              <Input
                id="initial_value"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.initial_value}
                onChange={(e) => setFormData({ ...formData, initial_value: e.target.value })}
                placeholder="100"
                required
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">הסכום הראשוני של כרטיס המתנה</p>
            </div>

            <div>
              <Label htmlFor="currency">מטבע</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר מטבע" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ILS">₪ שקל (ILS)</SelectItem>
                  <SelectItem value="USD">$ דולר (USD)</SelectItem>
                  <SelectItem value="EUR">€ אירו (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expires_at">תאריך תפוגה</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">השאר ריק ללא הגבלת זמן</p>
            </div>

            <div>
              <Label htmlFor="customer_id">ID לקוח</Label>
              <Input
                id="customer_id"
                type="number"
                min="1"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                placeholder="אופציונלי"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">קשור כרטיס מתנה ללקוח ספציפי</p>
            </div>

            <div>
              <Label htmlFor="order_id">ID הזמנה</Label>
              <Input
                id="order_id"
                type="number"
                min="1"
                value={formData.order_id}
                onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                placeholder="אופציונלי"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">קשור כרטיס מתנה להזמנה ספציפית</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="note">הערה</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="הערות נוספות על כרטיס המתנה..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  כרטיס פעיל
                </Label>
              </div>
              <p className="text-sm text-gray-500 mt-1">רק כרטיסים פעילים יכולים לשמש בהזמנות</p>
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
            {loading ? 'שומר...' : 'שמור כרטיס מתנה'}
          </Button>
        </div>
      </form>
    </div>
  );
}

