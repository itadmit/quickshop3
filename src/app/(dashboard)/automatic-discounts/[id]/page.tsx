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
import { HiSave, HiX, HiSparkles, HiTrash } from 'react-icons/hi';
import { AutomaticDiscount, UpdateAutomaticDiscountRequest } from '@/types/discount';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { ProductSelector } from '@/components/discounts/ProductSelector';
import { CollectionSelector } from '@/components/discounts/CollectionSelector';
import { TagSelector } from '@/components/discounts/TagSelector';

export default function EditAutomaticDiscountPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const discountId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discount, setDiscount] = useState<AutomaticDiscount | null>(null);
  const [formData, setFormData] = useState<{
    name?: string;
    description?: string;
    discount_type?: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume';
    value?: string;
    minimum_order_amount?: string;
    maximum_order_amount?: string;
    minimum_quantity?: string;
    maximum_quantity?: string;
    applies_to?: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
    priority?: string;
    can_combine_with_codes?: boolean;
    can_combine_with_other_automatic?: boolean;
    max_combined_discounts?: string;
    customer_segment?: 'all' | 'vip' | 'new_customer' | 'returning_customer' | null;
    minimum_orders_count?: string;
    minimum_lifetime_value?: string;
    starts_at?: string;
    ends_at?: string;
    day_of_week?: number[] | null;
    hour_start?: string;
    hour_end?: string;
    is_active?: boolean;
    product_ids?: number[];
    collection_ids?: number[];
    tag_names?: string[];
    // BOGO fields
    buy_quantity?: string;
    get_quantity?: string;
    get_discount_type?: 'free' | 'percentage' | 'fixed_amount';
    get_discount_value?: string;
    applies_to_same_product?: boolean;
    // Bundle fields
    bundle_min_products?: string;
    bundle_discount_type?: 'percentage' | 'fixed_amount';
    bundle_discount_value?: string;
    // Volume fields
    volume_tiers?: Array<{
      quantity: number;
      discount_type: 'percentage' | 'fixed_amount';
      value: number;
    }>;
  }>({});

  useEffect(() => {
    if (discountId) {
      loadDiscount();
    }
  }, [discountId]);

  const loadDiscount = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/automatic-discounts/${discountId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'שגיאה',
            description: 'הנחה אוטומטית לא נמצאה',
            variant: 'destructive',
          });
          router.push('/automatic-discounts');
          return;
        }
        throw new Error('Failed to load automatic discount');
      }

      const data = await response.json();
      setDiscount(data.discount);
      
      // Format dates for datetime-local input
      const startsAt = data.discount.starts_at 
        ? new Date(data.discount.starts_at).toISOString().slice(0, 16)
        : '';
      const endsAt = data.discount.ends_at
        ? new Date(data.discount.ends_at).toISOString().slice(0, 16)
        : '';

      setFormData({
        name: data.discount.name,
        description: data.discount.description || '',
        discount_type: data.discount.discount_type,
        value: data.discount.value || '',
        minimum_order_amount: data.discount.minimum_order_amount || '',
        maximum_order_amount: data.discount.maximum_order_amount || '',
        minimum_quantity: data.discount.minimum_quantity !== null && data.discount.minimum_quantity !== undefined ? String(data.discount.minimum_quantity) : undefined,
        maximum_quantity: data.discount.maximum_quantity !== null && data.discount.maximum_quantity !== undefined ? String(data.discount.maximum_quantity) : undefined,
        applies_to: data.discount.applies_to,
        priority: String(data.discount.priority || 0),
        can_combine_with_codes: data.discount.can_combine_with_codes,
        can_combine_with_other_automatic: data.discount.can_combine_with_other_automatic,
        max_combined_discounts: String(data.discount.max_combined_discounts || 1),
        customer_segment: data.discount.customer_segment || 'all',
        minimum_orders_count: data.discount.minimum_orders_count !== null && data.discount.minimum_orders_count !== undefined ? String(data.discount.minimum_orders_count) : undefined,
        minimum_lifetime_value: data.discount.minimum_lifetime_value || undefined,
        starts_at: startsAt || undefined,
        ends_at: endsAt || undefined,
        day_of_week: data.discount.day_of_week || undefined,
        hour_start: data.discount.hour_start !== null && data.discount.hour_start !== undefined ? String(data.discount.hour_start) : undefined,
        hour_end: data.discount.hour_end !== null && data.discount.hour_end !== undefined ? String(data.discount.hour_end) : undefined,
        is_active: data.discount.is_active,
        product_ids: data.discount.product_ids || [],
        collection_ids: data.discount.collection_ids || [],
        tag_names: data.discount.tag_names || [],
        // BOGO fields
        buy_quantity: data.discount.buy_quantity ? String(data.discount.buy_quantity) : undefined,
        get_quantity: data.discount.get_quantity ? String(data.discount.get_quantity) : undefined,
        get_discount_type: data.discount.get_discount_type || undefined,
        get_discount_value: data.discount.get_discount_value || undefined,
        applies_to_same_product: data.discount.applies_to_same_product !== null ? data.discount.applies_to_same_product : true,
        // Bundle fields
        bundle_min_products: data.discount.bundle_min_products ? String(data.discount.bundle_min_products) : undefined,
        bundle_discount_type: data.discount.bundle_discount_type || undefined,
        bundle_discount_value: data.discount.bundle_discount_value || undefined,
        // Volume fields
        volume_tiers: data.discount.volume_tiers || undefined,
      });
    } catch (error: any) {
      console.error('Error loading automatic discount:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בטעינת הנחה אוטומטית',
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
        description: 'שם ההנחה הוא שדה חובה',
        variant: 'destructive',
      });
      return;
    }

    // Validation based on discount type
    if (formData.discount_type === 'bogo') {
      if (!formData.buy_quantity || !formData.get_quantity) {
        toast({
          title: 'שגיאה',
          description: 'כמות לקנייה וכמות לקבלה הן שדות חובה עבור BOGO',
          variant: 'destructive',
        });
        return;
      }
      if (formData.get_discount_type !== 'free' && !formData.get_discount_value) {
        toast({
          title: 'שגיאה',
          description: 'ערך ההנחה על מה שמקבלים הוא שדה חובה',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.discount_type === 'bundle') {
      if (!formData.bundle_min_products || !formData.bundle_discount_value) {
        toast({
          title: 'שגיאה',
          description: 'מינימום מוצרים וערך ההנחה הם שדות חובה עבור הנחת חבילה',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.discount_type === 'volume') {
      if (!formData.volume_tiers || formData.volume_tiers.length === 0) {
        toast({
          title: 'שגיאה',
          description: 'יש להוסיף לפחות tier אחד עבור הנחה לפי כמות',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.discount_type !== 'free_shipping' && (!formData.value || !formData.value.trim())) {
      toast({
        title: 'שגיאה',
        description: 'ערך ההנחה הוא שדה חובה',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      // Use null instead of undefined to allow clearing values
      // JSON.stringify ignores undefined but includes null
      const payload: UpdateAutomaticDiscountRequest = {
        name: formData.name!.trim(),
        description: formData.description?.trim() || null,
        discount_type: formData.discount_type,
        value: (formData.discount_type !== 'free_shipping' && formData.discount_type !== 'bogo' && formData.discount_type !== 'bundle' && formData.discount_type !== 'volume') ? (formData.value || null) : null,
        // BOGO fields
        buy_quantity: formData.discount_type === 'bogo' && formData.buy_quantity ? parseInt(formData.buy_quantity) : null,
        get_quantity: formData.discount_type === 'bogo' && formData.get_quantity ? parseInt(formData.get_quantity) : null,
        get_discount_type: formData.discount_type === 'bogo' ? (formData.get_discount_type || null) : null,
        get_discount_value: formData.discount_type === 'bogo' && formData.get_discount_value ? formData.get_discount_value : null,
        applies_to_same_product: formData.discount_type === 'bogo' ? formData.applies_to_same_product : null,
        // Bundle fields
        bundle_min_products: formData.discount_type === 'bundle' && formData.bundle_min_products ? parseInt(formData.bundle_min_products) : null,
        bundle_discount_type: formData.discount_type === 'bundle' ? (formData.bundle_discount_type || null) : null,
        bundle_discount_value: formData.discount_type === 'bundle' && formData.bundle_discount_value ? formData.bundle_discount_value : null,
        // Volume fields
        volume_tiers: formData.discount_type === 'volume' && formData.volume_tiers && formData.volume_tiers.length > 0 ? formData.volume_tiers : null,
        minimum_order_amount: formData.minimum_order_amount || null,
        maximum_order_amount: formData.maximum_order_amount || null,
        minimum_quantity: formData.minimum_quantity ? parseInt(formData.minimum_quantity) : null,
        maximum_quantity: formData.maximum_quantity ? parseInt(formData.maximum_quantity) : null,
        applies_to: formData.applies_to,
        priority: formData.priority ? parseInt(formData.priority) : 0,
        can_combine_with_codes: formData.can_combine_with_codes,
        can_combine_with_other_automatic: formData.can_combine_with_other_automatic,
        max_combined_discounts: formData.max_combined_discounts ? parseInt(formData.max_combined_discounts) : 1,
        customer_segment: formData.customer_segment || null,
        minimum_orders_count: formData.minimum_orders_count ? parseInt(formData.minimum_orders_count) : null,
        minimum_lifetime_value: formData.minimum_lifetime_value || null,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        day_of_week: formData.day_of_week && formData.day_of_week.length > 0 ? formData.day_of_week : null,
        hour_start: formData.hour_start ? parseInt(formData.hour_start) : null,
        hour_end: formData.hour_end ? parseInt(formData.hour_end) : null,
        is_active: formData.is_active,
        product_ids: formData.product_ids && formData.product_ids.length > 0 ? formData.product_ids : [],
        collection_ids: formData.collection_ids && formData.collection_ids.length > 0 ? formData.collection_ids : [],
        tag_names: formData.tag_names && formData.tag_names.length > 0 ? formData.tag_names : [],
      };

      const response = await fetch(`/api/automatic-discounts/${discountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה בעדכון הנחה אוטומטית');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `הנחה אוטומטית "${data.discount?.name || formData.name}" עודכנה בהצלחה`,
      });

      router.push('/automatic-discounts');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון הנחה אוטומטית',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ההנחה האוטומטית הזו?')) return;

    try {
      const response = await fetch(`/api/automatic-discounts/${discountId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete automatic discount');
      }

      toast({
        title: 'הצלחה',
        description: 'הנחה אוטומטית נמחקה בהצלחה',
      });

      router.push('/automatic-discounts');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה במחיקת הנחה אוטומטית',
        variant: 'destructive',
      });
    }
  };

  const daysOfWeek = [
    { value: 0, label: 'ראשון' },
    { value: 1, label: 'שני' },
    { value: 2, label: 'שלישי' },
    { value: 3, label: 'רביעי' },
    { value: 4, label: 'חמישי' },
    { value: 5, label: 'שישי' },
    { value: 6, label: 'שבת' },
  ];

  const toggleDayOfWeek = (day: number) => {
    const currentDays = formData.day_of_week || [];
    if (currentDays.includes(day)) {
      setFormData({ ...formData, day_of_week: currentDays.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, day_of_week: [...currentDays, day] });
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

  if (!discount) {
    return null;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ערוך הנחה אוטומטית</h1>
          <p className="text-gray-500 mt-1">ערוך את פרטי ההנחה האוטומטית</p>
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
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiSparkles className="w-5 h-5" />
            פרטי הנחה אוטומטית
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="name">שם ההנחה *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="10% הנחה על כל המוצרים"
                required
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">תיאור</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תיאור ההנחה..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="discount_type">סוג הנחה *</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, discount_type: value as 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר סוג הנחה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">אחוזים (%)</SelectItem>
                  <SelectItem value="fixed_amount">סכום קבוע (₪)</SelectItem>
                  <SelectItem value="free_shipping">משלוח חינם</SelectItem>
                  <SelectItem value="bogo">קנה X קבל Y (BOGO)</SelectItem>
                  <SelectItem value="bundle">הנחת חבילה</SelectItem>
                  <SelectItem value="volume">הנחה לפי כמות (Volume)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.discount_type !== 'free_shipping' && (
              <div>
                <Label htmlFor="value">
                  ערך ההנחה * 
                  {formData.discount_type === 'percentage' ? ' (%)' : ' (₪)'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '50'}
                  required
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="priority">עדיפות</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                placeholder="0"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">גבוה יותר = עדיפות גבוהה יותר</p>
            </div>

            <div>
              <Label htmlFor="applies_to">חל על</Label>
              <Select
                value={formData.applies_to}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, applies_to: value as 'all' | 'specific_products' | 'specific_collections' | 'specific_tags' })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר">
                    {formData.applies_to === 'all' ? 'כל המוצרים' :
                     formData.applies_to === 'specific_products' ? 'מוצרים ספציפיים' :
                     formData.applies_to === 'specific_collections' ? 'אוספים ספציפיים' :
                     formData.applies_to === 'specific_tags' ? 'תגיות ספציפיות' :
                     'בחר'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המוצרים</SelectItem>
                  <SelectItem value="specific_products">מוצרים ספציפיים</SelectItem>
                  <SelectItem value="specific_collections">אוספים ספציפיים</SelectItem>
                  <SelectItem value="specific_tags">תגיות ספציפיות</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product/Collection/Tag Selection */}
            {formData.applies_to === 'specific_products' && (
              <div className="md:col-span-2">
                <Label>בחר מוצרים</Label>
                <ProductSelector
                  selectedProductIds={formData.product_ids || []}
                  onSelectionChange={(ids) => setFormData({ ...formData, product_ids: ids })}
                />
              </div>
            )}

            {formData.applies_to === 'specific_collections' && (
              <div className="md:col-span-2">
                <Label>בחר אוספים</Label>
                <CollectionSelector
                  selectedCollectionIds={formData.collection_ids || []}
                  onSelectionChange={(ids) => setFormData({ ...formData, collection_ids: ids })}
                />
              </div>
            )}

            {formData.applies_to === 'specific_tags' && (
              <div className="md:col-span-2">
                <Label>בחר תגיות</Label>
                <TagSelector
                  selectedTagNames={formData.tag_names || []}
                  onSelectionChange={(tags) => setFormData({ ...formData, tag_names: tags })}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Order Conditions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">תנאי הזמנה</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="minimum_order_amount">סכום מינימום להזמנה (₪)</Label>
              <Input
                id="minimum_order_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.minimum_order_amount}
                onChange={(e) => setFormData({ ...formData, minimum_order_amount: e.target.value })}
                placeholder="100"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="maximum_order_amount">סכום מקסימום להזמנה (₪)</Label>
              <Input
                id="maximum_order_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.maximum_order_amount}
                onChange={(e) => setFormData({ ...formData, maximum_order_amount: e.target.value })}
                placeholder="1000"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="minimum_quantity">כמות מינימום פריטים</Label>
              <Input
                id="minimum_quantity"
                type="number"
                min="1"
                value={formData.minimum_quantity || ''}
                onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value || undefined })}
                placeholder="3"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="maximum_quantity">כמות מקסימום פריטים</Label>
              <Input
                id="maximum_quantity"
                type="number"
                min="1"
                value={formData.maximum_quantity || ''}
                onChange={(e) => setFormData({ ...formData, maximum_quantity: e.target.value || undefined })}
                placeholder="10"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Customer Conditions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">תנאי לקוח</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="customer_segment">קטע לקוחות</Label>
              <Select
                value={formData.customer_segment || 'all'}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, customer_segment: value as 'all' | 'vip' | 'new_customer' | 'returning_customer' })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הלקוחות</SelectItem>
                  <SelectItem value="vip">לקוחות VIP</SelectItem>
                  <SelectItem value="new_customer">לקוחות חדשים</SelectItem>
                  <SelectItem value="returning_customer">לקוחות חוזרים</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="minimum_orders_count">מינימום הזמנות קודמות</Label>
              <Input
                id="minimum_orders_count"
                type="number"
                min="0"
                value={formData.minimum_orders_count || ''}
                onChange={(e) => setFormData({ ...formData, minimum_orders_count: e.target.value || undefined })}
                placeholder="5"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="minimum_lifetime_value">ערך חיים מינימום (₪)</Label>
              <Input
                id="minimum_lifetime_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.minimum_lifetime_value}
                onChange={(e) => setFormData({ ...formData, minimum_lifetime_value: e.target.value })}
                placeholder="5000"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Time Conditions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">תנאי זמן</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="starts_at">תאריך התחלה</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                className="mt-1"
              />
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
            </div>

            <div className="md:col-span-2">
              <Label>ימים בשבוע</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      (formData.day_of_week || []).includes(day.value)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">השאר ריק לכל הימים</p>
            </div>

            <div>
              <Label htmlFor="hour_start">שעת התחלה (0-23)</Label>
              <Input
                id="hour_start"
                type="number"
                min="0"
                max="23"
                value={formData.hour_start || ''}
                onChange={(e) => setFormData({ ...formData, hour_start: e.target.value || undefined })}
                placeholder="9"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="hour_end">שעת סיום (0-23)</Label>
              <Input
                id="hour_end"
                type="number"
                min="0"
                max="23"
                value={formData.hour_end || ''}
                onChange={(e) => setFormData({ ...formData, hour_end: e.target.value || undefined })}
                placeholder="17"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Combination Rules */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">כללי שילוב</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="can_combine_with_codes"
                  checked={formData.can_combine_with_codes}
                  onCheckedChange={(checked) => setFormData({ ...formData, can_combine_with_codes: checked as boolean })}
                />
                <Label htmlFor="can_combine_with_codes" className="cursor-pointer">
                  ניתן לשלב עם קופונים
                </Label>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="can_combine_with_other_automatic"
                  checked={formData.can_combine_with_other_automatic}
                  onCheckedChange={(checked) => setFormData({ ...formData, can_combine_with_other_automatic: checked as boolean })}
                />
                <Label htmlFor="can_combine_with_other_automatic" className="cursor-pointer">
                  ניתן לשלב עם הנחות אוטומטיות אחרות
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="max_combined_discounts">מקסימום הנחות מצטברות</Label>
              <Input
                id="max_combined_discounts"
                type="number"
                min="1"
                value={formData.max_combined_discounts}
                onChange={(e) => setFormData({ ...formData, max_combined_discounts: e.target.value })}
                placeholder="1"
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
                  הנחה פעילה
                </Label>
              </div>
              <p className="text-sm text-gray-500 mt-1">רק הנחות פעילות מוחלות אוטומטית</p>
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

