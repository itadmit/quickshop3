'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { HiSave, HiX, HiTrash, HiFolder } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface Collection {
  id: number;
  title: string;
  handle: string;
  description: string | null;
  image_url: string | null;
  published_at: Date | null;
  published_scope: string;
  sort_order: string;
  created_at: Date;
  updated_at: Date;
  products?: Array<{ id: number; title: string; handle: string; status: string }>;
  products_count?: number;
}

export default function EditCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const collectionId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    handle: '',
    description: '',
    image_url: '',
    published_at: '',
    published_scope: 'web',
    sort_order: 'manual',
  });

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/collections/${collectionId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'שגיאה',
            description: 'אוסף לא נמצא',
            variant: 'destructive',
          });
          router.push('/collections');
          return;
        }
        throw new Error('Failed to load collection');
      }

      const data = await response.json();
      setCollection(data.collection);
      
      // Format published_at for datetime-local input
      const publishedAt = data.collection.published_at
        ? new Date(data.collection.published_at).toISOString().slice(0, 16)
        : '';

      setFormData({
        title: data.collection.title || '',
        handle: data.collection.handle || '',
        description: data.collection.description || '',
        image_url: data.collection.image_url || '',
        published_at: publishedAt,
        published_scope: data.collection.published_scope || 'web',
        sort_order: data.collection.sort_order || 'manual',
      });
    } catch (error: any) {
      console.error('Error loading collection:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בטעינת אוסף',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
      setSaving(true);
      
      // Use null instead of undefined to allow clearing values
      const payload = {
        title: formData.title.trim(),
        handle: formData.handle?.trim() || null,
        description: formData.description?.trim() || null,
        image_url: formData.image_url?.trim() || null,
        published_at: formData.published_at || null,
        published_scope: formData.published_scope || 'web',
        sort_order: formData.sort_order || 'manual',
      };

      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה בעדכון אוסף');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `אוסף "${data.collection?.title || formData.title}" עודכן בהצלחה`,
      });

      router.push('/collections');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון אוסף',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את האוסף הזה?')) return;

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete collection');
      }

      toast({
        title: 'הצלחה',
        description: 'אוסף נמחק בהצלחה',
      });

      router.push('/collections');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה במחיקת אוסף',
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

  if (!collection) {
    return null;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ערוך אוסף</h1>
          <p className="text-gray-500 mt-1">ערוך את פרטי האוסף</p>
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
            <HiFolder className="w-5 h-5" />
            פרטי אוסף
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">שם האוסף *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              <Label htmlFor="published_at">תאריך פרסום</Label>
              <Input
                id="published_at"
                type="datetime-local"
                value={formData.published_at}
                onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">השאר ריק לטיוטה</p>
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

        {collection.products && collection.products.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              מוצרים באוסף ({collection.products_count || collection.products.length})
            </h2>
            <div className="space-y-2">
              {collection.products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/products/edit/${product.id}`)}
                >
                  <div>
                    <div className="font-medium text-gray-900">{product.title}</div>
                    <div className="text-sm text-gray-500">{product.handle}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    product.status === 'active' ? 'bg-green-100 text-green-800' :
                    product.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.status === 'active' ? 'פעיל' :
                     product.status === 'draft' ? 'טיוטה' :
                     'ארכיון'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

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

