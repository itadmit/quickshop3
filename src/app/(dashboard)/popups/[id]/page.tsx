'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { HiSave, HiX, HiCollection, HiTrash } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { Popup } from '@/types/content';

export default function EditPopupPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const popupId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    content_html: '',
    trigger_type: 'time' as 'time' | 'scroll' | 'exit_intent' | 'page_load',
    trigger_value: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
  });

  useEffect(() => {
    loadPopup();
  }, [popupId]);

  const loadPopup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/popups/${popupId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'שגיאה',
            description: 'פופאפ לא נמצא',
            variant: 'destructive',
          });
          router.push('/popups');
          return;
        }
        throw new Error('Failed to load popup');
      }

      const data = await response.json();
      const popupData = data.popup;
      setPopup(popupData);
      
      // Format dates for datetime-local input
      const startsAt = popupData.starts_at 
        ? new Date(popupData.starts_at).toISOString().slice(0, 16)
        : '';
      const endsAt = popupData.ends_at
        ? new Date(popupData.ends_at).toISOString().slice(0, 16)
        : '';

      setFormData({
        name: popupData.name || '',
        title: popupData.title || '',
        content_html: popupData.content_html || '',
        trigger_type: popupData.trigger_type || 'time',
        trigger_value: popupData.trigger_value ? String(popupData.trigger_value) : '',
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: popupData.is_active !== false,
      });
    } catch (error: any) {
      console.error('Error loading popup:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בטעינת פופאפ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'שם הפופאפ הוא שדה חובה',
        variant: 'destructive',
      });
      return;
    }

    // Validate trigger_value based on trigger_type
    if (formData.trigger_type === 'time' || formData.trigger_type === 'scroll') {
      if (!formData.trigger_value || parseFloat(formData.trigger_value) <= 0) {
        toast({
          title: 'שגיאה',
          description: 'ערך הטריגר חייב להיות גדול מ-0',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setSaving(true);
      
      const payload: any = {
        name: formData.name.trim(),
        title: formData.title || null,
        content_html: formData.content_html || null,
        trigger_type: formData.trigger_type,
        trigger_value: (formData.trigger_type === 'time' || formData.trigger_type === 'scroll') && formData.trigger_value
          ? parseFloat(formData.trigger_value)
          : null,
        display_rules: null, // Can be extended later
        is_active: formData.is_active,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      };

      const response = await fetch(`/api/popups/${popupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה בעדכון פופאפ');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `פופאפ "${data.popup?.name || formData.name}" עודכן בהצלחה`,
      });

      router.push('/popups');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון פופאפ',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הפופאפ הזה?')) return;

    try {
      const response = await fetch(`/api/popups/${popupId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete popup');
      }

      toast({
        title: 'הצלחה',
        description: 'פופאפ נמחק בהצלחה',
      });

      router.push('/popups');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה במחיקת פופאפ',
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

  if (!popup) {
    return null;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ערוך פופאפ</h1>
          <p className="text-gray-500 mt-1">ערוך את פרטי הפופאפ</p>
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
            <HiCollection className="w-5 h-5" />
            פרטי הפופאפ
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">שם הפופאפ *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="פופאפ קיץ 2024"
                required
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">שם פנימי לזיהוי הפופאפ</p>
            </div>

            <div>
              <Label htmlFor="title">כותרת</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="הצטרף עכשיו!"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">כותרת שתציג בפופאפ</p>
            </div>

            <div>
              <Label htmlFor="trigger_type">סוג טריגר *</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, trigger_type: value as 'time' | 'scroll' | 'exit_intent' | 'page_load', trigger_value: '' })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר סוג טריגר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">לאחר זמן (שניות)</SelectItem>
                  <SelectItem value="scroll">לאחר גלילה (%)</SelectItem>
                  <SelectItem value="exit_intent">כוונת יציאה</SelectItem>
                  <SelectItem value="page_load">טעינת עמוד</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.trigger_type === 'time' || formData.trigger_type === 'scroll') && (
              <div>
                <Label htmlFor="trigger_value">
                  ערך טריגר * 
                  {formData.trigger_type === 'time' ? ' (שניות)' : ' (%)'}
                </Label>
                <Input
                  id="trigger_value"
                  type="number"
                  step={formData.trigger_type === 'time' ? '1' : '1'}
                  min="0.1"
                  value={formData.trigger_value}
                  onChange={(e) => setFormData({ ...formData, trigger_value: e.target.value })}
                  placeholder={formData.trigger_type === 'time' ? '5' : '50'}
                  required
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.trigger_type === 'time' 
                    ? 'מספר השניות עד להצגת הפופאפ'
                    : 'אחוז הגלילה עד להצגת הפופאפ'}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="starts_at">תאריך התחלה</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">מתי להתחיל להציג את הפופאפ</p>
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
              <p className="text-sm text-gray-500 mt-1">מתי להפסיק להציג את הפופאפ</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="content_html">תוכן HTML</Label>
              <Textarea
                id="content_html"
                value={formData.content_html}
                onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
                placeholder="<p>הכנס את תוכן הפופאפ כאן...</p>"
                rows={8}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-sm text-gray-500 mt-1">תוכן הפופאפ בפורמט HTML</p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  פופאפ פעיל
                </Label>
              </div>
              <p className="text-sm text-gray-500 mt-1">רק פופאפים פעילים יוצגו למבקרים</p>
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

