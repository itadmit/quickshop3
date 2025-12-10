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
import { HiSave, HiX, HiCollection } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

export default function NewPopupPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      
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

      const response = await fetch('/api/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה ביצירת פופאפ');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `פופאפ "${data.popup?.name || formData.name}" נוצר בהצלחה`,
      });

      router.push('/popups');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת פופאפ',
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
          <h1 className="text-2xl font-bold text-gray-900">פופאפ חדש</h1>
          <p className="text-gray-500 mt-1">צור פופאפ חדש</p>
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
            {loading ? 'שומר...' : 'שמור פופאפ'}
          </Button>
        </div>
      </form>
    </div>
  );
}

