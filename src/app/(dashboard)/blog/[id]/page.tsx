'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { HiSave, HiX, HiTrash } from 'react-icons/hi';
import { BlogPost } from '@/types/content';

export default function BlogPostDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const isNew = postId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    handle: '',
    body_html: '',
    excerpt: '',
    tags: '',
    meta_title: '',
    meta_description: '',
    featured_image_url: '',
    is_published: false,
  });

  useEffect(() => {
    if (!isNew && postId) {
      loadPost();
    }
  }, [postId, isNew]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/posts/${postId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load post');
      const data = await response.json();
      const post = data.post;
      setFormData({
        title: post.title || '',
        handle: post.handle || '',
        body_html: post.body_html || '',
        excerpt: post.excerpt || '',
        tags: post.tags || '',
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        featured_image_url: post.featured_image_url || '',
        is_published: post.is_published || false,
      });
    } catch (error) {
      console.error('Error loading post:', error);
      alert('שגיאה בטעינת הפוסט');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = isNew ? '/api/blog/posts' : `/api/blog/posts/${postId}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          handle: formData.handle || null,
          body_html: formData.body_html,
          excerpt: formData.excerpt || null,
          tags: formData.tags || null,
          meta_title: formData.meta_title || null,
          meta_description: formData.meta_description || null,
          featured_image_url: formData.featured_image_url || null,
          is_published: formData.is_published,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save post');
      }

      router.push('/blog');
    } catch (error: any) {
      console.error('Error saving post:', error);
      alert(error.message || 'שגיאה בשמירת הפוסט');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הפוסט?')) return;
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete post');
      router.push('/blog');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('שגיאה במחיקת הפוסט');
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
          {isNew ? 'פוסט חדש' : 'עריכת פוסט'}
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
                placeholder="כותרת הפוסט"
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
                תקציר
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="תקציר קצר של הפוסט..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תוכן הפוסט
              </label>
              <RichTextEditor
                value={formData.body_html}
                onChange={(value) => setFormData({ ...formData, body_html: value })}
                placeholder="תוכן הפוסט..."
                className="border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תגיות (מופרדות בפסיק)
              </label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="תגית1, תגית2, תגית3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תמונה ראשית (URL)
              </label>
              <Input
                type="url"
                value={formData.featured_image_url}
                onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
                className="text-left"
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
                פוסט פורסם
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

