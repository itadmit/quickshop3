'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { HiSave, HiX, HiFolder } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

export default function NewCollectionPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    handle: '',
    description: '',
    image_url: '',
    published_scope: 'web',
    sort_order: 'manual',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.title.trim()) {
      toast({
        title: 'שגיאה',
        description: 'שם האוסף הוא שדה חובה',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        title: formData.title.trim(),
        handle: formData.handle?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        image_url: formData.image_url?.trim() || undefined,
        published_scope: formData.published_scope || 'web',
        sort_order: formData.sort_order || 'manual',
      };

      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה ביצירת אוסף');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `אוסף "${data.collection?.title || formData.title}" נוצר בהצלחה`,
      });

      router.push(`/collections/${data.collection?.id}`);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת אוסף',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate handle from title
  const handleTitleChange = (value: string) => {
    setFormData({ ...formData, title: value });
    if (!formData.handle) {
      const generatedHandle = value
        .toLowerCase()
        .trim()
        .replace(/[\u0590-\u05FF]/g, '') // Remove Hebrew characters
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      setFormData(prev => ({ ...prev, handle: generatedHandle }));
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">אוסף חדש</h1>
          <p className="text-gray-500 mt-1">צור אוסף מוצרים חדש</p>
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
            <HiFolder className="w-5 h-5" />
            פרטי אוסף
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">שם האוסף *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="אוסף קיץ 2024"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="handle">Handle (כתובת URL)</Label>
              <Input
                id="handle"
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                placeholder="summer-2024"
                className="mt-1 font-mono"
              />
              <p className="text-sm text-gray-500 mt-1">נוצר אוטומטית מהשם אם לא מוגדר</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">תיאור</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תיאור האוסף..."
                rows={4}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <Label htmlFor="image_url">כתובת תמונה</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="published_scope">היקף פרסום</Label>
              <Select
                value={formData.published_scope}
                onValueChange={(value) => setFormData({ ...formData, published_scope: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">אתר</SelectItem>
                  <SelectItem value="global">גלובלי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort_order">סדר מיון</Label>
              <Select
                value={formData.sort_order}
                onValueChange={(value) => setFormData({ ...formData, sort_order: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">ידני</SelectItem>
                  <SelectItem value="best-selling">הנמכרים ביותר</SelectItem>
                  <SelectItem value="title-ascending">שם (א-ת)</SelectItem>
                  <SelectItem value="title-descending">שם (ת-א)</SelectItem>
                  <SelectItem value="price-ascending">מחיר (נמוך לגבוה)</SelectItem>
                  <SelectItem value="price-descending">מחיר (גבוה לנמוך)</SelectItem>
                  <SelectItem value="created-ascending">תאריך יצירה (ישן לחדש)</SelectItem>
                  <SelectItem value="created-descending">תאריך יצירה (חדש לישן)</SelectItem>
                </SelectContent>
              </Select>
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
            {loading ? 'יוצר...' : 'צור אוסף'}
          </Button>
        </div>
      </form>
    </div>
  );
}

