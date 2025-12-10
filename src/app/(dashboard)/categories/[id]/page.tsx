'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { HiSave, HiX, HiTrash, HiPlus, HiSearch, HiFilter } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { CategoryTreeSelector } from '@/components/products/CategoryTreeSelector';

interface CollectionRule {
  field: 'title' | 'price' | 'tag' | 'vendor' | 'type';
  condition: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with';
  value: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  status: string;
  availability: string;
  sku: string | null;
}

interface CollectionProduct {
  id: string;
  position: number;
  product: Product;
}

export default function CategoryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const categoryId = params.id as string;
  const isNew = categoryId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: number; title: string }>>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    description: '',
    imageUrl: '',
    type: 'MANUAL' as 'MANUAL' | 'AUTOMATIC',
    parent_id: null as number | null,
    is_published: true,
  });

  // מוצרים (רק במצב ידני)
  const [selectedProducts, setSelectedProducts] = useState<CollectionProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // תנאים אוטומטיים
  const [rules, setRules] = useState<CollectionRule[]>([
    { field: 'title', condition: 'contains', value: '' }
  ]);
  const [matchType, setMatchType] = useState<'all' | 'any'>('all');

  useEffect(() => {
    if (!isNew && categoryId) {
      loadCategory();
    }
    loadCategories();
  }, [categoryId, isNew]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/collections?limit=1000', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.collections || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/collections/${categoryId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load category');
      const data = await response.json();
      const category = data.collection;
      
      setFormData({
        name: category.title || '',
        handle: category.handle || '',
        description: category.description || '',
        imageUrl: category.image_url || '',
        type: category.type || 'MANUAL',
        parent_id: category.parent_id || null,
        is_published: category.is_published !== undefined ? category.is_published : true,
      });

      if (category.products) {
        setSelectedProducts(category.products.map((p: any, index: number) => {
          // מיפוי נכון של תמונות
          let images: string[] = [];
          if (Array.isArray(p.images) && p.images.length > 0) {
            images = p.images.map((img: any) => {
              // תמונות יכולות להיות string או object
              if (typeof img === 'string') return img;
              return img.url || img.image_url || img.src || img;
            }).filter(Boolean);
          }
          
          // מיפוי נכון של מחיר - יכול להיות number או string
          let price = 0;
          if (p.price !== undefined && p.price !== null) {
            price = typeof p.price === 'string' ? parseFloat(p.price) || 0 : p.price;
          } else if (p.variants?.[0]?.price) {
            price = typeof p.variants[0].price === 'string' ? parseFloat(p.variants[0].price) || 0 : p.variants[0].price;
          }
          
          // מיפוי נכון של compare_at_price
          let comparePrice: number | null = null;
          if (p.compare_at_price !== undefined && p.compare_at_price !== null) {
            comparePrice = typeof p.compare_at_price === 'string' ? parseFloat(p.compare_at_price) || null : p.compare_at_price;
          } else if (p.variants?.[0]?.compare_at_price) {
            comparePrice = typeof p.variants[0].compare_at_price === 'string' ? parseFloat(p.variants[0].compare_at_price) || null : p.variants[0].compare_at_price;
          }
          
          return {
            id: `temp-${p.id || index}`,
            position: p.position !== undefined ? p.position : index,
            product: {
              id: p.id?.toString() || '',
              name: p.title || p.name || 'ללא שם',
              slug: p.handle || '',
              price: price,
              comparePrice: comparePrice,
              images: images,
              status: p.status || '',
              availability: '',
              sku: p.sku || p.variants?.[0]?.sku || null,
            },
          };
        }));
      }

      if (category.rules) {
        const rulesData = typeof category.rules === 'string' ? JSON.parse(category.rules) : category.rules;
        if (rulesData.conditions) {
          setRules(rulesData.conditions);
        }
        if (rulesData.matchType) {
          setMatchType(rulesData.matchType);
        }
      }
    } catch (error) {
      console.error('Error loading category:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת הקטגוריה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(query)}&status=active&limit=20`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        const products = data.products || [];
        // מיפוי נכון של המוצרים עם כל הפרטים
        const mappedProducts: Product[] = products.map((p: any) => ({
          id: p.id?.toString() || '',
          name: p.title || p.name || 'ללא שם',
          slug: p.handle || '',
          price: p.variants?.[0]?.price || p.price || 0,
          comparePrice: p.variants?.[0]?.compare_at_price || p.compare_at_price || null,
          images: p.images?.map((img: any) => img.url || img.image_url) || [],
          status: p.status || '',
          availability: '',
          sku: p.variants?.[0]?.sku || p.sku || null,
        }));
        const filteredProducts = mappedProducts.filter(
          (p: Product) => !selectedProducts.some(sp => sp.product.id === p.id)
        );
        setSearchResults(filteredProducts);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addProduct = (product: Product) => {
    setSelectedProducts(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        position: prev.length,
        product
      }
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.product.id !== productId));
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedProducts.length - 1)
    ) {
      return;
    }

    const newProducts = [...selectedProducts];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
    
    newProducts.forEach((p, i) => {
      p.position = i;
    });
    
    setSelectedProducts(newProducts);
  };

  const addRule = () => {
    setRules(prev => [
      ...prev,
      { field: 'title', condition: 'contains', value: '' }
    ]);
  };

  const removeRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<CollectionRule>) => {
    setRules(prev => prev.map((rule, i) => 
      i === index ? { ...rule, ...updates } : rule
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = isNew ? '/api/collections' : `/api/collections/${categoryId}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const payload: any = {
        title: formData.name,
        handle: formData.handle || null,
        description: formData.description || null,
        image_url: formData.imageUrl || null,
        type: formData.type,
        parent_id: formData.parent_id,
        is_published: formData.is_published,
      };

      // הוספת rules אם זה אוטומטי
      if (formData.type === 'AUTOMATIC') {
        payload.rules = {
          conditions: rules.filter(r => r.value.trim()),
          matchType
        };
      }

      // הוספת productIds אם זה ידני
      if (formData.type === 'MANUAL') {
        payload.productIds = selectedProducts.map(p => p.product.id);
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save category');
      }

      toast({
        title: 'הצלחה',
        description: 'הקטגוריה נשמרה בהצלחה',
      });

      router.push('/categories');
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשמירת הקטגוריה',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקטגוריה?')) return;
    
    try {
      const response = await fetch(`/api/collections/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete category');
      
      toast({
        title: 'הצלחה',
        description: 'הקטגוריה נמחקה בהצלחה',
      });
      
      router.push('/categories');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה במחיקת הקטגוריה',
        variant: 'destructive',
      });
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
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {isNew ? 'קטגוריה חדשה' : 'עריכת קטגוריה'}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {isNew ? 'צרו קטגוריה חדשה לארגון המוצרים' : 'ערכו את פרטי הקטגוריה'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4">
          {!isNew && (
            <Button variant="destructive" onClick={handleDelete}>
              <HiTrash className="w-4 h-4 ml-2" />
              מחק
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/categories')}
            className="px-4 py-2 text-sm border-gray-300"
          >
            ביטול
          </Button>
          <Button
            type="submit"
            form="category-form"
            variant="default"
            disabled={saving}
            className="px-4 py-2 text-sm"
          >
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </div>

      <form id="category-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* מידע בסיסי */}
            <Card>
              <div className="p-6 space-y-6">
                <div>
                  <Label htmlFor="name">שם הקטגוריה *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="לדוגמה: חולצות"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="handle">סלאג (URL)</Label>
                  <Input
                    id="handle"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    placeholder="ייווצר אוטומטית אם לא מוגדר"
                    dir="ltr"
                    className="text-left mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Handle ייווצר אוטומטית משם הקטגוריה אם לא מוגדר
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">תיאור</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="תיאור הקטגוריה..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl">תמונת קטגוריה (URL)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    dir="ltr"
                    className="text-left mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="parent">קטגוריה אב (אופציונלי)</Label>
                  <select
                    id="parent"
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full h-9 border border-gray-200 rounded-md bg-white px-3 py-2 text-sm mt-2"
                  >
                    <option value="">ללא קטגוריה אב</option>
                    {categories
                      .filter(cat => !isNew || cat.id.toString() !== categoryId)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.title}</option>
                      ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* סוג קטגוריה */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <HiFilter className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">סוג קטגוריה</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">איך מוצרים מתווספים לקטגוריה?</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, type: value as 'MANUAL' | 'AUTOMATIC' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סוג קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">ידני - בחר מוצרים בעצמך</SelectItem>
                      <SelectItem value="AUTOMATIC">אוטומטי - לפי תנאים</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'AUTOMATIC' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label>תנאי בחירת מוצרים</Label>
                      <Select value={matchType} onValueChange={(v) => setMatchType(v as 'all' | 'any')}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל התנאים (AND)</SelectItem>
                          <SelectItem value="any">אחד מהתנאים (OR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      {rules.map((rule, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <Select
                            value={rule.field}
                            onValueChange={(v: any) => updateRule(index, { field: v })}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="title">כותרת מוצר</SelectItem>
                              <SelectItem value="price">מחיר</SelectItem>
                              <SelectItem value="tag">תג</SelectItem>
                              <SelectItem value="vendor">ספק</SelectItem>
                              <SelectItem value="type">סוג</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={rule.condition}
                            onValueChange={(v: any) => updateRule(index, { condition: v })}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">שווה ל</SelectItem>
                              <SelectItem value="not_equals">לא שווה ל</SelectItem>
                              <SelectItem value="contains">מכיל</SelectItem>
                              <SelectItem value="not_contains">לא מכיל</SelectItem>
                              <SelectItem value="greater_than">גדול מ</SelectItem>
                              <SelectItem value="less_than">קטן מ</SelectItem>
                              <SelectItem value="starts_with">מתחיל ב</SelectItem>
                              <SelectItem value="ends_with">מסתיים ב</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            value={rule.value}
                            onChange={(e) => updateRule(index, { value: e.target.value })}
                            placeholder="ערך..."
                            className="flex-1"
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRule(index)}
                            disabled={rules.length === 1}
                          >
                            <HiX className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addRule}
                      className="w-full"
                    >
                      <HiPlus className="w-4 h-4 ml-2" />
                      הוסף תנאי
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* מוצרים - רק במצב ידני */}
            {formData.type === 'MANUAL' && (
              <Card>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      מוצרים ({selectedProducts.length})
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSearch(!showSearch)}
                    >
                      <HiPlus className="w-4 h-4 ml-2" />
                      הוסף מוצרים
                    </Button>
                  </div>

                  {/* חיפוש מוצרים */}
                  {showSearch && (
                    <div className="space-y-3 pb-4 border-b">
                      <div className="relative">
                        <HiSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="חפש מוצרים לפי שם או מקט..."
                          className="pr-10"
                        />
                      </div>

                      {searching && (
                        <p className="text-sm text-gray-500">מחפש...</p>
                      )}

                      {searchResults.length > 0 && (
                        <div className="max-h-[300px] overflow-y-auto space-y-2 border-t pt-3 mt-3">
                          {searchResults.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 cursor-pointer transition-colors"
                              onClick={() => addProduct(product)}
                            >
                              {product.images?.[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                                  <HiSearch className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{product.name || 'ללא שם'}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {product.price && typeof product.price === 'number' ? `₪${product.price.toFixed(2)}` : '₪0.00'}
                                  {product.sku && ` • מקט: ${product.sku}`}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <HiPlus className="w-5 h-5 text-green-600" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchQuery && !searching && searchResults.length === 0 && (
                        <p className="text-sm text-gray-500">לא נמצאו מוצרים</p>
                      )}
                    </div>
                  )}

                  {/* רשימת מוצרים נבחרים */}
                  {selectedProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>לא נבחרו מוצרים</p>
                      <p className="text-sm mt-1">לחץ על "הוסף מוצרים" כדי להתחיל</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedProducts.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveProduct(index, 'up')}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveProduct(index, 'down')}
                              disabled={index === selectedProducts.length - 1}
                            >
                              ↓
                            </Button>
                          </div>
                          {(() => {
                            const firstImage = item.product.images?.[0];
                            const imageUrl = typeof firstImage === 'string' 
                              ? firstImage 
                              : firstImage?.src || firstImage?.url || firstImage?.image_url;
                            
                            return imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.product.name || 'מוצר'}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <HiSearch className="w-8 h-8 text-gray-400" />
                              </div>
                            );
                          })()}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{item.product.name || 'ללא שם'}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.product.price && typeof item.product.price === 'number' ? `₪${item.product.price.toFixed(2)}` : '₪0.00'}
                              {item.product.sku && ` • מקט: ${item.product.sku}`}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(item.product.id)}
                          >
                            <HiX className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_published" className="cursor-pointer">
                    פרסם קטגוריה
                  </Label>
                </div>
              </div>
            </Card>
          </div>
        </div>

      </form>
    </div>
  );
}
