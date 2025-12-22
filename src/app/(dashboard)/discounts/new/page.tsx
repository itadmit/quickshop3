'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { HiSave, HiX, HiTag, HiPlus, HiGift } from 'react-icons/hi';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { CreateDiscountCodeRequest } from '@/types/discount';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { ProductSelector } from '@/components/discounts/ProductSelector';
import { CollectionSelector } from '@/components/discounts/CollectionSelector';
import { TagSelector } from '@/components/discounts/TagSelector';
import { GiftProductSelector } from '@/components/discounts/GiftProductSelector';

export default function NewDiscountPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    code: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' | 'fixed_price' | 'spend_x_pay_y';
    value?: string;
    minimum_order_amount?: string;
    maximum_order_amount?: string;
    minimum_quantity?: string;
    maximum_quantity?: string;
    usage_limit?: string;
    applies_to?: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
    priority?: string;
    can_combine_with_automatic?: boolean;
    can_combine_with_other_codes?: boolean;
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
    // Fixed Price fields
    fixed_price_quantity?: string;
    fixed_price_amount?: string;
    // Spend X Pay Y fields
    spend_amount?: string;
    pay_amount?: string;
    // Gift Product
    gift_product_id?: number | null;
  }>({
    code: '',
    discount_type: 'percentage',
    value: '',
    minimum_order_amount: '',
    maximum_order_amount: '',
    minimum_quantity: undefined,
    maximum_quantity: undefined,
    usage_limit: undefined,
    applies_to: 'all',
    priority: '0',
    can_combine_with_automatic: true,
    can_combine_with_other_codes: false,
    max_combined_discounts: '1',
    customer_segment: 'all',
    minimum_orders_count: undefined,
    minimum_lifetime_value: '',
    starts_at: undefined,
    ends_at: undefined,
    day_of_week: [],
    hour_start: undefined,
    hour_end: undefined,
    is_active: true,
    product_ids: [],
    collection_ids: [],
    tag_names: [],
    // BOGO defaults
    buy_quantity: undefined,
    get_quantity: undefined,
    get_discount_type: 'free',
    get_discount_value: undefined,
    applies_to_same_product: true,
    // Bundle defaults
    bundle_min_products: undefined,
    bundle_discount_type: 'percentage',
    bundle_discount_value: undefined,
    // Volume defaults
    volume_tiers: [],
    // Fixed Price defaults
    fixed_price_quantity: undefined,
    fixed_price_amount: undefined,
    // Spend X Pay Y defaults
    spend_amount: undefined,
    pay_amount: undefined,
    // Gift Product default
    gift_product_id: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.code.trim()) {
      toast({
        title: 'שגיאה',
        description: 'קוד הנחה הוא שדה חובה',
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
    } else if (formData.discount_type === 'fixed_price') {
      if (!formData.fixed_price_quantity || !formData.fixed_price_amount) {
        toast({
          title: 'שגיאה',
          description: 'כמות פריטים ומחיר קבוע הם שדות חובה',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.discount_type === 'spend_x_pay_y') {
      if (!formData.spend_amount || !formData.pay_amount) {
        toast({
          title: 'שגיאה',
          description: 'סכום הקנייה וסכום התשלום הם שדות חובה',
          variant: 'destructive',
        });
        return;
      }
      if (parseFloat(formData.pay_amount) >= parseFloat(formData.spend_amount)) {
        toast({
          title: 'שגיאה',
          description: 'סכום התשלום חייב להיות נמוך מסכום הקנייה',
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
      setLoading(true);
      
      const payload: CreateDiscountCodeRequest = {
        code: formData.code!.toUpperCase().trim(),
        discount_type: formData.discount_type!,
        value: (formData.discount_type !== 'free_shipping' && formData.discount_type !== 'bogo' && formData.discount_type !== 'bundle' && formData.discount_type !== 'volume' && formData.discount_type !== 'fixed_price' && formData.discount_type !== 'spend_x_pay_y') ? (formData.value || null) : null,
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
        // Fixed Price fields
        fixed_price_quantity: formData.discount_type === 'fixed_price' && formData.fixed_price_quantity ? parseInt(formData.fixed_price_quantity) : null,
        fixed_price_amount: formData.discount_type === 'fixed_price' && formData.fixed_price_amount ? formData.fixed_price_amount : null,
        // Spend X Pay Y fields
        spend_amount: formData.discount_type === 'spend_x_pay_y' && formData.spend_amount ? formData.spend_amount : null,
        pay_amount: formData.discount_type === 'spend_x_pay_y' && formData.pay_amount ? formData.pay_amount : null,
        minimum_order_amount: formData.minimum_order_amount || null,
        maximum_order_amount: formData.maximum_order_amount || null,
        minimum_quantity: formData.minimum_quantity ? parseInt(formData.minimum_quantity) : null,
        maximum_quantity: formData.maximum_quantity ? parseInt(formData.maximum_quantity) : null,
        usage_limit: formData.usage_limit ? parseInt(String(formData.usage_limit)) : null,
        applies_to: formData.applies_to || 'all',
        priority: formData.priority ? parseInt(formData.priority) : 0,
        can_combine_with_automatic: formData.can_combine_with_automatic !== undefined ? formData.can_combine_with_automatic : true,
        can_combine_with_other_codes: formData.can_combine_with_other_codes !== undefined ? formData.can_combine_with_other_codes : false,
        max_combined_discounts: formData.max_combined_discounts ? parseInt(formData.max_combined_discounts) : 1,
        customer_segment: formData.customer_segment || 'all',
        minimum_orders_count: formData.minimum_orders_count ? parseInt(formData.minimum_orders_count) : null,
        minimum_lifetime_value: formData.minimum_lifetime_value || null,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        day_of_week: formData.day_of_week && formData.day_of_week.length > 0 ? formData.day_of_week : null,
        hour_start: formData.hour_start ? parseInt(formData.hour_start) : null,
        hour_end: formData.hour_end ? parseInt(formData.hour_end) : null,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        product_ids: formData.product_ids && formData.product_ids.length > 0 ? formData.product_ids : [],
        collection_ids: formData.collection_ids && formData.collection_ids.length > 0 ? formData.collection_ids : [],
        tag_names: formData.tag_names && formData.tag_names.length > 0 ? formData.tag_names : [],
        // Gift Product
        gift_product_id: formData.gift_product_id || null,
      };

      const response = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה ביצירת קוד הנחה');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `קוד הנחה "${data.discount?.code || formData.code}" נוצר בהצלחה`,
      });

      router.push('/discounts');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת קוד הנחה',
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
          <h1 className="text-2xl font-bold text-gray-900">קוד הנחה חדש</h1>
          <p className="text-gray-500 mt-1">צור קוד הנחה חדש</p>
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
            <HiTag className="w-5 h-5" />
            פרטי קוד הנחה
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="code">קוד הנחה *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="SUMMER2024"
                required
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">הקוד יומר לאותיות גדולות אוטומטית</p>
            </div>

            <div>
              <Label htmlFor="discount_type">סוג הנחה *</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, discount_type: value as 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' | 'fixed_price' })
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
                  <SelectItem value="fixed_price">מחיר קבוע לכמות</SelectItem>
                  <SelectItem value="spend_x_pay_y">קנה ב-X שלם Y</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Value field for percentage and fixed_amount */}
            {(formData.discount_type === 'percentage' || formData.discount_type === 'fixed_amount') && (
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

            {/* BOGO Fields */}
            {formData.discount_type === 'bogo' && (
              <>
                <div>
                  <Label htmlFor="buy_quantity">כמות לקנייה *</Label>
                  <Input
                    id="buy_quantity"
                    type="number"
                    min="1"
                    value={formData.buy_quantity || ''}
                    onChange={(e) => setFormData({ ...formData, buy_quantity: e.target.value })}
                    placeholder="1"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="get_quantity">כמות לקבלה *</Label>
                  <Input
                    id="get_quantity"
                    type="number"
                    min="1"
                    value={formData.get_quantity || ''}
                    onChange={(e) => setFormData({ ...formData, get_quantity: e.target.value })}
                    placeholder="1"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="get_discount_type">סוג הנחה על מה שמקבלים *</Label>
                  <Select
                    value={formData.get_discount_type || 'free'}
                    onValueChange={(value: string) => 
                      setFormData({ ...formData, get_discount_type: value as 'free' | 'percentage' | 'fixed_amount' })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="בחר" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">חינם</SelectItem>
                      <SelectItem value="percentage">אחוזים (%)</SelectItem>
                      <SelectItem value="fixed_amount">סכום קבוע (₪)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.get_discount_type !== 'free' && (
                  <div>
                    <Label htmlFor="get_discount_value">
                      ערך ההנחה על מה שמקבלים * 
                      {formData.get_discount_type === 'percentage' ? ' (%)' : ' (₪)'}
                    </Label>
                    <Input
                      id="get_discount_value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.get_discount_value || ''}
                      onChange={(e) => setFormData({ ...formData, get_discount_value: e.target.value })}
                      placeholder={formData.get_discount_type === 'percentage' ? '50' : '25'}
                      required
                      className="mt-1"
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="applies_to_same_product"
                      checked={formData.applies_to_same_product !== false}
                      onCheckedChange={(checked) => setFormData({ ...formData, applies_to_same_product: checked as boolean })}
                    />
                    <Label htmlFor="applies_to_same_product" className="cursor-pointer">
                      חל רק על אותו המוצר
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.applies_to_same_product !== false 
                      ? 'הלקוח חייב לקנות את הכמות הנדרשת מאותו מוצר בדיוק'
                      : 'הלקוח יכול לקנות מוצרים שונים (ההנחה תחול על הזולים ביותר)'}
                  </p>
                </div>
              </>
            )}

            {/* Bundle Fields */}
            {formData.discount_type === 'bundle' && (
              <>
                <div>
                  <Label htmlFor="bundle_min_products">מינימום מוצרים בחבילה *</Label>
                  <Input
                    id="bundle_min_products"
                    type="number"
                    min="2"
                    value={formData.bundle_min_products || ''}
                    onChange={(e) => setFormData({ ...formData, bundle_min_products: e.target.value })}
                    placeholder="3"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bundle_discount_type">סוג הנחה על החבילה *</Label>
                  <Select
                    value={formData.bundle_discount_type || 'percentage'}
                    onValueChange={(value: string) => 
                      setFormData({ ...formData, bundle_discount_type: value as 'percentage' | 'fixed_amount' })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="בחר" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">אחוזים (%)</SelectItem>
                      <SelectItem value="fixed_amount">סכום קבוע (₪)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bundle_discount_value">
                    ערך ההנחה על החבילה * 
                    {formData.bundle_discount_type === 'percentage' ? ' (%)' : ' (₪)'}
                  </Label>
                  <Input
                    id="bundle_discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.bundle_discount_value || ''}
                    onChange={(e) => setFormData({ ...formData, bundle_discount_value: e.target.value })}
                    placeholder={formData.bundle_discount_type === 'percentage' ? '15' : '50'}
                    required
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {/* Volume Fields */}
            {formData.discount_type === 'volume' && (
              <div className="md:col-span-2">
                <Label>דרגות הנחה לפי כמות *</Label>
                <div className="space-y-3 mt-2">
                  {(formData.volume_tiers || []).map((tier, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500">כמות מינימום</Label>
                        <Input
                          type="number"
                          min="1"
                          value={tier.quantity}
                          onChange={(e) => {
                            const newTiers = [...(formData.volume_tiers || [])];
                            newTiers[index].quantity = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, volume_tiers: newTiers });
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500">סוג הנחה</Label>
                        <Select
                          value={tier.discount_type}
                          onValueChange={(value: string) => {
                            const newTiers = [...(formData.volume_tiers || [])];
                            newTiers[index].discount_type = value as 'percentage' | 'fixed_amount';
                            setFormData({ ...formData, volume_tiers: newTiers });
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">אחוזים (%)</SelectItem>
                            <SelectItem value="fixed_amount">סכום קבוע (₪)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500">ערך</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tier.value}
                          onChange={(e) => {
                            const newTiers = [...(formData.volume_tiers || [])];
                            newTiers[index].value = parseFloat(e.target.value) || 0;
                            setFormData({ ...formData, volume_tiers: newTiers });
                          }}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newTiers = (formData.volume_tiers || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, volume_tiers: newTiers });
                        }}
                        className="mt-6"
                      >
                        <HiX className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newTiers = [...(formData.volume_tiers || []), { quantity: 1, discount_type: 'percentage' as const, value: 0 }];
                      setFormData({ ...formData, volume_tiers: newTiers });
                    }}
                    className="flex items-center gap-2"
                  >
                    <HiPlus className="w-4 h-4" />
                    הוסף דרגה
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">הדרגה הגבוהה ביותר שהכמות מגיעה אליה תוחל</p>
              </div>
            )}

            {/* Fixed Price Fields */}
            {formData.discount_type === 'fixed_price' && (
              <>
                <div>
                  <Label htmlFor="fixed_price_quantity">כמות פריטים *</Label>
                  <Input
                    id="fixed_price_quantity"
                    type="number"
                    min="1"
                    value={formData.fixed_price_quantity || ''}
                    onChange={(e) => setFormData({ ...formData, fixed_price_quantity: e.target.value })}
                    placeholder="2"
                    required
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">כמות הפריטים לחבילה (לדוגמא: 2)</p>
                </div>
                <div>
                  <Label htmlFor="fixed_price_amount">מחיר קבוע (₪) *</Label>
                  <Input
                    id="fixed_price_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.fixed_price_amount || ''}
                    onChange={(e) => setFormData({ ...formData, fixed_price_amount: e.target.value })}
                    placeholder="55"
                    required
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">המחיר הכולל לכמות שנבחרה (לדוגמא: 55 ש"ח ל-2 פריטים)</p>
                </div>
              </>
            )}

            {/* Spend X Pay Y Fields */}
            {formData.discount_type === 'spend_x_pay_y' && (
              <>
                <div>
                  <Label htmlFor="spend_amount">סכום קנייה (₪) *</Label>
                  <Input
                    id="spend_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.spend_amount || ''}
                    onChange={(e) => setFormData({ ...formData, spend_amount: e.target.value })}
                    placeholder="300"
                    required
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">הסכום המינימלי לקנייה (לדוגמא: 300 ש"ח)</p>
                </div>
                <div>
                  <Label htmlFor="pay_amount">סכום לתשלום (₪) *</Label>
                  <Input
                    id="pay_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pay_amount || ''}
                    onChange={(e) => setFormData({ ...formData, pay_amount: e.target.value })}
                    placeholder="200"
                    required
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">הסכום שהלקוח ישלם בפועל (לדוגמא: 200 ש"ח)</p>
                </div>
              </>
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  קוד פעיל
                </Label>
              </div>
              <p className="text-sm text-gray-500 mt-1">רק קודים פעילים יכולים לשמש בהזמנות</p>
            </div>
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

            <div>
              <Label htmlFor="usage_limit">מגבלת שימושים</Label>
              <Input
                id="usage_limit"
                type="number"
                min="1"
                value={formData.usage_limit || ''}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value || undefined })}
                placeholder="ללא הגבלה"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">השאר ריק למגבלה ללא הגבלה</p>
            </div>
          </div>
        </Card>

        {/* Gift Product */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiGift className="w-5 h-5" />
            מתנה אוטומטית
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            מוצר שיתווסף אוטומטית לעגלה כאשר קוד ההנחה מוחל
          </p>
          <GiftProductSelector
            selectedProductId={formData.gift_product_id || null}
            onProductChange={(productId) => setFormData({ ...formData, gift_product_id: productId })}
          />
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
                value={formData.starts_at || ''}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value || undefined })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ends_at">תאריך סיום</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                value={formData.ends_at || ''}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value || undefined })}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label>ימים בשבוע</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { value: 0, label: 'ראשון' },
                  { value: 1, label: 'שני' },
                  { value: 2, label: 'שלישי' },
                  { value: 3, label: 'רביעי' },
                  { value: 4, label: 'חמישי' },
                  { value: 5, label: 'שישי' },
                  { value: 6, label: 'שבת' },
                ].map((day) => {
                  const toggleDayOfWeek = (dayValue: number) => {
                    const currentDays = formData.day_of_week || [];
                    if (currentDays.includes(dayValue)) {
                      setFormData({ ...formData, day_of_week: currentDays.filter(d => d !== dayValue) });
                    } else {
                      setFormData({ ...formData, day_of_week: [...currentDays, dayValue] });
                    }
                  };
                  return (
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
                  );
                })}
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
                  id="can_combine_with_automatic"
                  checked={formData.can_combine_with_automatic}
                  onCheckedChange={(checked) => setFormData({ ...formData, can_combine_with_automatic: checked as boolean })}
                />
                <Label htmlFor="can_combine_with_automatic" className="cursor-pointer">
                  ניתן לשלב עם הנחות אוטומטיות
                </Label>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="can_combine_with_other_codes"
                  checked={formData.can_combine_with_other_codes}
                  onCheckedChange={(checked) => setFormData({ ...formData, can_combine_with_other_codes: checked as boolean })}
                />
                <Label htmlFor="can_combine_with_other_codes" className="cursor-pointer">
                  ניתן לשלב עם קופונים אחרים
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
                  קוד פעיל
                </Label>
              </div>
              <p className="text-sm text-gray-500 mt-1">רק קודים פעילים יכולים לשמש בהזמנות</p>
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
            {loading ? 'שומר...' : 'שמור קוד הנחה'}
          </Button>
        </div>
      </form>
    </div>
  );
}

