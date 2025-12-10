'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { HiSave, HiX, HiGift, HiTrash } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface GiftCard {
  id: number;
  code: string;
  initial_value: string;
  current_value: string;
  currency: string;
  expires_at: Date | null;
  customer_id: number | null;
  order_id: number | null;
  note: string | null;
  is_active: boolean;
}

export default function EditGiftCardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const giftCardId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
  const [formData, setFormData] = useState({
    expires_at: '',
    note: '',
    is_active: true,
  });

  useEffect(() => {
    loadGiftCard();
  }, [giftCardId]);

  const loadGiftCard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gift-cards/${giftCardId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'שגיאה',
            description: 'כרטיס מתנה לא נמצא',
            variant: 'destructive',
          });
          router.push('/gift-cards');
          return;
        }
        throw new Error('Failed to load gift card');
      }

      const data = await response.json();
      const card = data.gift_card;
      setGiftCard(card);
      
      // Format date for input
      const expiresAt = card.expires_at 
        ? new Date(card.expires_at).toISOString().split('T')[0]
        : '';

      setFormData({
        expires_at: expiresAt,
        note: card.note || '',
        is_active: card.is_active !== false,
      });
    } catch (error: any) {
      console.error('Error loading gift card:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בטעינת כרטיס מתנה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      
      const payload: any = {
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        note: formData.note || null,
        is_active: formData.is_active,
      };

      const response = await fetch(`/api/gift-cards/${giftCardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה בעדכון כרטיס מתנה');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `כרטיס מתנה "${data.gift_card?.code || giftCard?.code}" עודכן בהצלחה`,
      });

      router.push('/gift-cards');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון כרטיס מתנה',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כרטיס המתנה הזה?')) return;

    try {
      const response = await fetch(`/api/gift-cards/${giftCardId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete gift card');
      }

      toast({
        title: 'הצלחה',
        description: 'כרטיס מתנה נמחק בהצלחה',
      });

      router.push('/gift-cards');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה במחיקת כרטיס מתנה',
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

  if (!giftCard) {
    return null;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ערוך כרטיס מתנה</h1>
          <p className="text-gray-500 mt-1">ערוך את פרטי כרטיס המתנה</p>
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
            <HiGift className="w-5 h-5" />
            פרטי כרטיס המתנה
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>קוד כרטיס המתנה</Label>
              <Input
                value={giftCard.code}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">קוד כרטיס המתנה לא ניתן לשינוי</p>
            </div>

            <div>
              <Label>ערך ראשוני</Label>
              <Input
                value={`${giftCard.currency === 'ILS' ? '₪' : giftCard.currency === 'USD' ? '$' : '€'} ${parseFloat(giftCard.initial_value).toLocaleString('he-IL')}`}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">ערך ראשוני לא ניתן לשינוי</p>
            </div>

            <div>
              <Label>ערך נוכחי</Label>
              <Input
                value={`${giftCard.currency === 'ILS' ? '₪' : giftCard.currency === 'USD' ? '$' : '€'} ${parseFloat(giftCard.current_value).toLocaleString('he-IL')}`}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">ערך נוכחי מתעדכן אוטומטית</p>
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

