'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HiSave, HiX, HiTrash } from 'react-icons/hi';
import { Page } from '@/types/content';

export default function PageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;
  const isNew = pageId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    handle: '',
    body_html: '',
    meta_title: '',
    meta_description: '',
    is_published: false,
  });

  useEffect(() => {
    if (!isNew && pageId) {
      loadPage();
    }
  }, [pageId, isNew]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pages/${pageId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load page');
      const data = await response.json();
      const page = data.page;
      setFormData({
        title: page.title || '',
        handle: page.handle || '',
        body_html: page.body_html || '',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        is_published: page.is_published || false,
      });
    } catch (error) {
      console.error('Error loading page:', error);
      alert('שגיאה בטעינת הדף');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = isNew ? '/api/pages' : `/api/pages/${pageId}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          handle: formData.handle || undefined,
          body_html: formData.body_html,
          meta_title: formData.meta_title || null,
          meta_description: formData.meta_description || null,
          is_published: formData.is_published,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save page');
      }

      router.push('/pages');
    } catch (error: any) {
      console.error('Error saving page:', error);
      alert(error.message || 'שגיאה בשמירת הדף');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הדף?')) return;
    
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete page');
      router.push('/pages');
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('שגיאה במחיקת הדף');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'דף חדש' : 'עריכת דף'}
        </h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="ghost" onClick={handleDelete} className="text-red-600">
              <HiTrash className="w-5 h-5 ml-2" />
              מחק
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.back()}>
            <HiX className="w-5 h-5 ml-2" />
            ביטול
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כותרת *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="לדוגמה: תנאי שימוש"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סלאג (URL)
              </label>
              <Input
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                placeholder="ייווצר אוטומטית אם לא מוגדר"
                dir="ltr"
                className="text-left"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תוכן הדף (HTML)
              </label>
              <textarea
                value={formData.body_html}
                onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                placeholder="תוכן הדף..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-4">הגדרות SEO</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Title (SEO)
                          <span className="text-xs text-gray-500 mr-2">
                            ({formData.meta_title.length}/60 תווים)
                          </span>
                        </label>
                        <Input
                          value={formData.meta_title}
                          onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                          placeholder="כותרת SEO"
                          maxLength={60}
                          className={formData.meta_title.length > 60 ? 'border-red-300' : ''}
                        />
                        {formData.meta_title && (
                          <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-sm">
                            <div className="text-xs text-gray-500 mb-1">תצוגה מקדימה:</div>
                            <div className="font-semibold text-blue-600">{formData.meta_title}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formData.meta_description || 'תיאור SEO...'}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meta Description (SEO)
                          <span className="text-xs text-gray-500 mr-2">
                            ({formData.meta_description.length}/160 תווים)
                          </span>
                        </label>
                        <textarea
                          value={formData.meta_description}
                          onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                          placeholder="תיאור SEO"
                          maxLength={160}
                          rows={3}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            formData.meta_description.length > 160 ? 'border-red-300' : ''
                          }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          תיאור קצר שיופיע בתוצאות החיפוש
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                דף פורסם
              </label>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </form>
    </div>
  );
}

