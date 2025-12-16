'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { HiSave, HiX, HiTrash, HiSearch, HiCube } from 'react-icons/hi';
import { Page } from '@/types/content';
import { useDebounce } from '@/hooks/useDebounce';

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
    template: 'STANDARD' as 'STANDARD' | 'CHOICES_OF',
    display_type: 'GRID' as 'GRID' | 'LIST',
    selected_products: [] as number[],
    coupon_code: '',
    influencer_id: null as number | null,
    meta_title: '',
    meta_description: '',
    is_published: false,
  });

  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductsData, setSelectedProductsData] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [coupons, setCoupons] = useState<Array<{ id: number; code: string }>>([]);
  const debouncedSearchTerm = useDebounce(productSearch, 300);

  useEffect(() => {
    if (!isNew && pageId) {
      loadPage();
    }
    loadInfluencers();
    loadCoupons();
  }, [pageId, isNew]);

  useEffect(() => {
    if (formData.template === 'CHOICES_OF' && debouncedSearchTerm) {
      fetchProducts();
    } else if (formData.template === 'CHOICES_OF' && !debouncedSearchTerm) {
      setProducts([]);
    }
  }, [debouncedSearchTerm, formData.template]);

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
        template: page.template || 'STANDARD',
        display_type: page.display_type || 'GRID',
        selected_products: page.selected_products || [],
        coupon_code: page.coupon_code || '',
        influencer_id: page.influencer_id || null,
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        is_published: page.is_published || false,
      });

      // Load selected products data if CHOICES_OF
      if (page.template === 'CHOICES_OF' && page.selected_products && page.selected_products.length > 0) {
        loadSelectedProductsData(page.selected_products);
      }
    } catch (error) {
      console.error('Error loading page:', error);
      alert('שגיאה בטעינת הדף');
    } finally {
      setLoading(false);
    }
  };

  const loadInfluencers = async () => {
    try {
      const response = await fetch('/api/influencers', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setInfluencers(data.influencers || []);
      }
    } catch (error) {
      console.error('Error loading influencers:', error);
    }
  };

  const loadCoupons = async () => {
    try {
      const response = await fetch('/api/discounts', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.discounts || []);
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
    }
  };

  const fetchProducts = async () => {
    if (!debouncedSearchTerm.trim()) return;
    setLoadingProducts(true);
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(debouncedSearchTerm)}&limit=20`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadSelectedProductsData = async (productIds: number[]) => {
    try {
      const response = await fetch(`/api/products?ids=${productIds.join(',')}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedProductsData(data.products || []);
      }
    } catch (error) {
      console.error('Error loading selected products:', error);
    }
  };

  const toggleProductSelection = (productId: number) => {
    setFormData((prev) => {
      const isSelected = prev.selected_products.includes(productId);
      const newSelectedProducts = isSelected
        ? prev.selected_products.filter((id) => id !== productId)
        : [...prev.selected_products, productId];
      
      if (isSelected) {
        setSelectedProductsData((prev) => prev.filter((p) => p.id !== productId));
      } else {
        const product = products.find((p) => p.id === productId);
        if (product) {
          setSelectedProductsData((prev) => {
            if (prev.find((p) => p.id === productId)) return prev;
            return [...prev, product];
          });
        }
      }
      
      return { ...prev, selected_products: newSelectedProducts };
    });
  };

  const getSelectedProductsData = () => {
    const fromSearch = products.filter((p) => formData.selected_products.includes(p.id));
    const fromSelected = selectedProductsData.filter((p) => formData.selected_products.includes(p.id));
    const combined = [...fromSearch, ...fromSelected];
    return Array.from(new Map(combined.map(p => [p.id, p])).values());
  };

  const getProductImageUrl = (product: any): string | null => {
    if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
      return null;
    }
    const firstImage = product.images[0];
    return typeof firstImage === 'string' ? firstImage : (firstImage.src || firstImage.url || null);
  };

  const getProductName = (product: any): string => {
    return product.name || product.title || 'מוצר ללא שם';
  };

  const getProductPrice = (product: any): string => {
    if (product.price) {
      return `₪${product.price}`;
    }
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const prices = product.variants
        .map((v: any) => parseFloat(v.price || 0))
        .filter((p: number) => p > 0);
      if (prices.length > 0) {
        return `₪${Math.min(...prices)}`;
      }
    }
    return 'מחיר לא זמין';
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
          handle: formData.handle || null,
          body_html: formData.template === 'STANDARD' ? formData.body_html : null,
          template: formData.template,
          display_type: formData.template === 'CHOICES_OF' ? formData.display_type : undefined,
          selected_products: formData.template === 'CHOICES_OF' ? formData.selected_products : undefined,
          coupon_code: formData.coupon_code || null,
          influencer_id: formData.influencer_id,
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
                סוג טמפלט
              </label>
              <select
                value={formData.template}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  template: e.target.value as 'STANDARD' | 'CHOICES_OF',
                  selected_products: e.target.value === 'STANDARD' ? [] : formData.selected_products,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="STANDARD">דף רגיל</option>
                <option value="CHOICES_OF">הבחירות של...</option>
              </select>
            </div>

            {formData.template === 'CHOICES_OF' && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סוג תצוגה
                  </label>
                  <select
                    value={formData.display_type}
                    onChange={(e) => setFormData({ ...formData, display_type: e.target.value as 'GRID' | 'LIST' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="GRID">רשת (Grid)</option>
                    <option value="LIST">שורות (List)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    חיפוש ובחירת מוצרים
                  </label>
                  <div className="relative">
                    <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="חפש מוצרים..."
                      className="pr-10"
                    />
                  </div>
                </div>

                {loadingProducts && (
                  <p className="text-sm text-gray-500 text-center py-4">טוען מוצרים...</p>
                )}

                {products.length > 0 && (
                  <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                    {products.map((product) => {
                      const isSelected = formData.selected_products.includes(product.id);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProductSelection(product.id)}
                            className="rounded"
                          />
                          <div className="flex items-center gap-3 flex-1">
                            {(() => {
                              const imageUrl = getProductImageUrl(product);
                              return imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={getProductName(product)}
                                  className="w-12 h-12 rounded object-cover"
                                  onError={(e) => {
                                    // Fallback to placeholder if image fails to load
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const placeholder = target.nextElementSibling as HTMLElement;
                                    if (placeholder) {
                                      placeholder.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null;
                            })()}
                            <div className={`w-12 h-12 rounded bg-gray-100 flex items-center justify-center ${getProductImageUrl(product) ? 'hidden' : ''}`}>
                              <HiCube className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{getProductName(product)}</p>
                              <p className="text-xs text-gray-500">{getProductPrice(product)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {formData.selected_products.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      מוצרים נבחרים ({formData.selected_products.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getSelectedProductsData().map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm font-medium">{product.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleProductSelection(product.id)}
                            className="text-emerald-600 hover:text-emerald-800"
                          >
                            <HiX className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.template === 'STANDARD' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תוכן הדף
                </label>
                <RichTextEditor
                  value={formData.body_html}
                  onChange={(value) => setFormData({ ...formData, body_html: value })}
                  placeholder="תוכן הדף..."
                  className="border border-gray-300 rounded-lg"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קופון (אופציונלי)
                </label>
                <select
                  value={formData.coupon_code || ''}
                  onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value || '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">ללא קופון</option>
                  {coupons.map((coupon) => (
                    <option key={coupon.id} value={coupon.code}>
                      {coupon.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  משפיען (אופציונלי)
                </label>
                <select
                  value={formData.influencer_id || ''}
                  onChange={(e) => setFormData({ ...formData, influencer_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">ללא משפיען</option>
                  {influencers.map((influencer) => (
                    <option key={influencer.id} value={influencer.id}>
                      {influencer.name} ({influencer.email})
                    </option>
                  ))}
                </select>
              </div>
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

