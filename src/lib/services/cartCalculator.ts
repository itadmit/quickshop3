/**
 * Cart Calculator - מנוע חישוב הנחות וקופונים מרכזי ומתקדם
 * 
 * זהו המנוע המרכזי והבלעדי לחישוב מחירים, הנחות וקופונים במערכת.
 * כל מקום במערכת שמציג מחירים או מחשב הנחות חייב להשתמש במנוע הזה.
 * 
 * עקרונות:
 * 1. Single Source of Truth - מקום אחד שמחשב הכל
 * 2. עקביות - אותו חישוב בכל מקום
 * 3. סדר פעולות נכון - הנחות מחושבות בסדר הנכון
 * 4. תמיכה בכל סוגי ההנחות - קופונים, הנחות אוטומטיות, וכו'
 * 5. עדיפויות - הנחה אוטומטית קודם, אז קופון
 * 6. שילובים - אפשרות למנוע או לאפשר שילוב הנחות
 */

import { query, queryOne } from '@/lib/db';
import { hasEarlyAccessToSales } from './premiumClub';

// ============================================
// Types
// ============================================

export interface CartItem {
  variant_id: number;
  product_id: number;
  product_title: string;
  variant_title: string;
  price: number;
  quantity: number;
  image?: string;
  // אפשרויות המוצר (מידה, צבע וכו')
  properties?: Array<{
    name: string;
    value: string;
  }>;
  // Optional: for discounts that apply to specific products
  collection_ids?: number[];
  tag_names?: string[];
}

export interface DiscountCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' | 'fixed_price' | 'spend_x_pay_y';
  value: number | null;
  minimum_order_amount: number | null;
  maximum_order_amount: number | null;
  minimum_quantity: number | null;
  maximum_quantity: number | null;
  applies_to: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
  can_combine_with_automatic: boolean;
  can_combine_with_other_codes: boolean;
  max_combined_discounts: number;
  priority: number;
  customer_segment: 'all' | 'vip' | 'new_customer' | 'returning_customer' | null;
  minimum_orders_count: number | null;
  minimum_lifetime_value: number | null;
  day_of_week: number[] | null;
  hour_start: number | null;
  hour_end: number | null;
  // BOGO fields
  buy_quantity?: number | null;
  get_quantity?: number | null;
  get_discount_type?: 'free' | 'percentage' | 'fixed_amount' | null;
  get_discount_value?: string | null;
  applies_to_same_product?: boolean | null;
  // Bundle fields
  bundle_min_products?: number | null;
  bundle_discount_type?: 'percentage' | 'fixed_amount' | null;
  bundle_discount_value?: string | null;
  // Volume fields
  volume_tiers?: Array<{
    quantity: number;
    discount_type: 'percentage' | 'fixed_amount';
    value: number;
  }> | null;
  // Fixed Price fields (מחיר קבוע לכמות)
  fixed_price_quantity?: number | null;
  fixed_price_amount?: number | null;
  // Spend X Pay Y fields (קנה ב-X שלם Y)
  spend_amount?: number | null;
  pay_amount?: number | null;
  // Gift product
  gift_product_id?: number | null;
  product_ids?: number[];
  collection_ids?: number[];
  tag_names?: string[];
}

export interface AutomaticDiscount {
  id: number;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume' | 'fixed_price' | 'spend_x_pay_y';
  value: number | null;
  minimum_order_amount: number | null;
  maximum_order_amount: number | null;
  minimum_quantity: number | null;
  maximum_quantity: number | null;
  applies_to: 'all' | 'specific_products' | 'specific_collections' | 'specific_tags';
  priority: number;
  can_combine_with_codes: boolean;
  can_combine_with_other_automatic: boolean;
  max_combined_discounts: number;
  customer_segment: 'all' | 'vip' | 'new_customer' | 'returning_customer' | null;
  minimum_orders_count: number | null;
  minimum_lifetime_value: number | null;
  starts_at: Date | null;
  ends_at: Date | null;
  day_of_week: number[] | null;
  hour_start: number | null;
  hour_end: number | null;
  // BOGO fields
  buy_quantity?: number | null;
  get_quantity?: number | null;
  get_discount_type?: 'free' | 'percentage' | 'fixed_amount' | null;
  get_discount_value?: string | null;
  applies_to_same_product?: boolean | null;
  // Bundle fields
  bundle_min_products?: number | null;
  bundle_discount_type?: 'percentage' | 'fixed_amount' | null;
  bundle_discount_value?: string | null;
  // Volume fields
  volume_tiers?: Array<{
    quantity: number;
    discount_type: 'percentage' | 'fixed_amount';
    value: number;
  }> | null;
  // Fixed Price fields (מחיר קבוע לכמות)
  fixed_price_quantity?: number | null;
  fixed_price_amount?: number | null;
  // Spend X Pay Y fields (קנה ב-X שלם Y)
  spend_amount?: number | null;
  pay_amount?: number | null;
  // Gift product
  gift_product_id?: number | null;
  product_ids?: number[];
  collection_ids?: number[];
  tag_names?: string[];
}

export interface ShippingRate {
  id: number;
  name: string;
  price: number;
  free_shipping_threshold: number | null;
}

export interface CartCalculationInput {
  items: CartItem[];
  discountCode?: string; // קוד הנחה בודד (backward compatible)
  discountCodes?: string[]; // מספר קודי הנחה
  shippingRate?: ShippingRate;
  storeId: number;
  customerId?: number; // For customer-specific discounts
  customerSegment?: 'vip' | 'new_customer' | 'returning_customer';
  customerOrdersCount?: number;
  customerLifetimeValue?: number;
  customerTier?: string | null; // Premium club tier (silver, gold, platinum, etc.)
}

export interface AppliedDiscount {
  id: number;
  name: string;
  code?: string;
  type: string;
  amount: number;
  description: string;
  source: 'automatic' | 'code';
  priority: number;
}

export interface GiftProduct {
  product_id: number;
  variant_id: number;
  product_title: string;
  variant_title: string;
  price: number;
  image?: string;
  discount_id: number;
  discount_name: string;
}

export interface CartCalculationResult {
  // Items
  items: Array<{
    item: CartItem;
    lineTotal: number;
    lineDiscount: number;
    lineTotalAfterDiscount: number;
    appliedDiscounts: AppliedDiscount[];
  }>;
  
  // Totals
  subtotal: number;
  itemsDiscount: number;
  subtotalAfterDiscount: number;
  
  // Shipping
  shipping: number;
  shippingDiscount: number;
  shippingAfterDiscount: number;
  
  // Discounts Applied
  discounts: AppliedDiscount[];
  
  // Gift Products (מתנות אוטומטיות)
  giftProducts: GiftProduct[];
  
  // Final Total
  total: number;
  
  // Metadata
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================
// Main Calculator Class
// ============================================

export class CartCalculator {
  private storeId: number;
  private items: CartItem[];
  private discountCode: DiscountCode | null = null; // Backward compatible - קוד בודד
  private discountCodes: DiscountCode[] = []; // מספר קודי הנחה
  private automaticDiscounts: AutomaticDiscount[] = [];
  private shippingRate: ShippingRate | null = null;
  private customerId?: number;
  private customerSegment?: 'vip' | 'new_customer' | 'returning_customer';
  private customerOrdersCount?: number;
  private customerLifetimeValue?: number;
  private customerTier?: string | null;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor(input: CartCalculationInput) {
    this.storeId = input.storeId;
    this.items = input.items;
    if (input.shippingRate) {
      this.shippingRate = input.shippingRate;
    }
    this.customerId = input.customerId;
    this.customerSegment = input.customerSegment;
    this.customerOrdersCount = input.customerOrdersCount;
    this.customerLifetimeValue = input.customerLifetimeValue;
    this.customerTier = input.customerTier;
  }

  /**
   * טוען קופון מהמסד נתונים
   */
  async loadDiscountCode(code: string): Promise<boolean> {
    try {
      const discount = await queryOne<{
        id: number;
        code: string;
        discount_type: string;
        value: string | null;
        minimum_order_amount: string | null;
        maximum_order_amount: string | null;
        minimum_quantity: number | null;
        maximum_quantity: number | null;
        applies_to: string;
        usage_limit: number | null;
        usage_count: number;
        is_active: boolean;
        starts_at: Date | null;
        ends_at: Date | null;
        can_combine_with_automatic: boolean;
        can_combine_with_other_codes: boolean;
        max_combined_discounts: number;
        priority: number;
        customer_segment: string | null;
        minimum_orders_count: number | null;
        minimum_lifetime_value: string | null;
        day_of_week: number[] | null;
        hour_start: number | null;
        hour_end: number | null;
        buy_quantity: number | null;
        get_quantity: number | null;
        get_discount_type: string | null;
        get_discount_value: string | null;
        applies_to_same_product: boolean | null;
        bundle_min_products: number | null;
        bundle_discount_type: string | null;
        bundle_discount_value: string | null;
        volume_tiers: any;
        gift_product_id: number | null;
        fixed_price_quantity: number | null;
        fixed_price_amount: string | null;
      }>(
        `SELECT 
          id, code, discount_type, value,
          minimum_order_amount, maximum_order_amount,
          minimum_quantity, maximum_quantity,
          applies_to, usage_limit, usage_count, is_active,
          starts_at, ends_at,
          COALESCE(can_combine_with_automatic, true) as can_combine_with_automatic,
          COALESCE(can_combine_with_other_codes, false) as can_combine_with_other_codes,
          COALESCE(max_combined_discounts, 1) as max_combined_discounts,
          COALESCE(priority, 0) as priority,
          customer_segment, minimum_orders_count,
          minimum_lifetime_value,
          day_of_week, hour_start, hour_end,
          buy_quantity, get_quantity, get_discount_type, get_discount_value, applies_to_same_product,
          bundle_min_products, bundle_discount_type, bundle_discount_value,
          volume_tiers, gift_product_id,
          fixed_price_quantity, fixed_price_amount,
          spend_amount, pay_amount
        FROM discount_codes
        WHERE store_id = $1 AND code = $2 AND is_active = true`,
        [this.storeId, code.toUpperCase()]
      );

      if (!discount) {
        this.errors.push(`קופון ${code} לא נמצא או לא פעיל`);
        return false;
      }

      // בדיקת תוקף תאריכים
      const now = new Date();
      if (discount.starts_at && new Date(discount.starts_at) > now) {
        this.errors.push(`קופון ${code} עדיין לא פעיל`);
        return false;
      }
      if (discount.ends_at && new Date(discount.ends_at) < now) {
        this.errors.push(`קופון ${code} פג תוקף`);
        return false;
      }

      // בדיקת שימוש
      if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
        this.errors.push(`קופון ${code} הגיע למגבלת השימוש`);
        return false;
      }

      // טעינת product_ids, collection_ids, tag_names
      const [productIds, collectionIds, tagNames] = await Promise.all([
        query<{ product_id: number }>(
          'SELECT product_id FROM discount_code_products WHERE discount_code_id = $1',
          [discount.id]
        ),
        query<{ collection_id: number }>(
          'SELECT collection_id FROM discount_code_collections WHERE discount_code_id = $1',
          [discount.id]
        ),
        query<{ tag_name: string }>(
          'SELECT tag_name FROM discount_code_tags WHERE discount_code_id = $1',
          [discount.id]
        ),
      ]);

      // בדיקת תנאי זמן (יום בשבוע ושעה)
      const currentDay = now.getDay();
      const currentHour = now.getHours();

      if (discount.day_of_week && !discount.day_of_week.includes(currentDay)) {
        this.errors.push(`קופון ${code} תקף רק בימים מסוימים`);
        return false;
      }

      if (discount.hour_start !== null && discount.hour_end !== null) {
        if (currentHour < discount.hour_start || currentHour >= discount.hour_end) {
          this.errors.push(`קופון ${code} תקף רק בשעות מסוימות`);
          return false;
        }
      }

      // בדיקת תנאי לקוח
      if (discount.customer_segment && discount.customer_segment !== 'all') {
        if (!this.customerSegment || discount.customer_segment !== this.customerSegment) {
          this.errors.push(`קופון ${code} תקף רק ללקוחות מסוימים`);
          return false;
        }
      }

      if (discount.minimum_orders_count && 
          (!this.customerOrdersCount || this.customerOrdersCount < discount.minimum_orders_count)) {
        this.errors.push(`קופון ${code} דורש מספר הזמנות מינימלי`);
        return false;
      }

      if (discount.minimum_lifetime_value) {
        const minValue = parseFloat(discount.minimum_lifetime_value);
        if (!this.customerLifetimeValue || this.customerLifetimeValue < minValue) {
          this.errors.push(`קופון ${code} דורש ערך חיים מינימלי`);
          return false;
        }
      }

      // Convert to DiscountCode format
        this.discountCode = {
        id: discount.id,
        code: discount.code,
        discount_type: discount.discount_type as 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume',
        value: discount.value ? parseFloat(discount.value) : null,
        minimum_order_amount: discount.minimum_order_amount ? parseFloat(discount.minimum_order_amount) : null,
        maximum_order_amount: discount.maximum_order_amount ? parseFloat(discount.maximum_order_amount) : null,
        minimum_quantity: discount.minimum_quantity,
        maximum_quantity: discount.maximum_quantity,
        applies_to: discount.applies_to as 'all' | 'specific_products' | 'specific_collections' | 'specific_tags',
        can_combine_with_automatic: discount.can_combine_with_automatic,
        can_combine_with_other_codes: discount.can_combine_with_other_codes,
        max_combined_discounts: discount.max_combined_discounts,
        priority: discount.priority,
        customer_segment: discount.customer_segment as 'all' | 'vip' | 'new_customer' | 'returning_customer' | null,
        minimum_orders_count: discount.minimum_orders_count,
        minimum_lifetime_value: discount.minimum_lifetime_value ? parseFloat(discount.minimum_lifetime_value) : null,
        day_of_week: discount.day_of_week,
        hour_start: discount.hour_start,
        hour_end: discount.hour_end,
        // BOGO fields
        buy_quantity: discount.buy_quantity,
        get_quantity: discount.get_quantity,
        get_discount_type: discount.get_discount_type as 'free' | 'percentage' | 'fixed_amount' | null,
        get_discount_value: discount.get_discount_value || null,
        applies_to_same_product: discount.applies_to_same_product !== null ? discount.applies_to_same_product : true,
        // Bundle fields
        bundle_min_products: discount.bundle_min_products,
        bundle_discount_type: discount.bundle_discount_type as 'percentage' | 'fixed_amount' | null,
        bundle_discount_value: discount.bundle_discount_value || null,
        // Volume fields
        volume_tiers: discount.volume_tiers ? (typeof discount.volume_tiers === 'string' ? JSON.parse(discount.volume_tiers) : discount.volume_tiers) : null,
        // Fixed Price fields
        fixed_price_quantity: discount.fixed_price_quantity,
        fixed_price_amount: discount.fixed_price_amount ? parseFloat(discount.fixed_price_amount) : null,
        // Spend X Pay Y fields
        spend_amount: (discount as any).spend_amount ? parseFloat((discount as any).spend_amount) : null,
        pay_amount: (discount as any).pay_amount ? parseFloat((discount as any).pay_amount) : null,
        // Gift product
        gift_product_id: discount.gift_product_id,
        product_ids: productIds.map(p => p.product_id),
        collection_ids: collectionIds.map(c => c.collection_id),
        tag_names: tagNames.map(t => t.tag_name),
      };

      return true;
    } catch (error) {
      console.error('Error loading discount code:', error);
      this.errors.push('שגיאה בטעינת קופון');
      return false;
    }
  }

  /**
   * טוען מספר קודי הנחה למערך (תמיכה בערימת קופונים)
   */
  async loadMultipleDiscountCodes(codes: string[]): Promise<number> {
    let loadedCount = 0;
    const previousErrors = [...this.errors]; // שמירת שגיאות קודמות
    
    for (const code of codes) {
      if (!code || code.trim() === '') continue;
      
      // טעינת הקופון באופן זמני לתוך this.discountCode
      this.errors = []; // איפוס שגיאות לבדיקה נקייה
      const loaded = await this.loadDiscountCode(code);
      
      if (loaded && this.discountCode) {
        // בדיקת שילוב עם קופונים אחרים
        if (loadedCount > 0 && !this.discountCode.can_combine_with_other_codes) {
          this.warnings.push(`קופון ${code} לא ניתן לשילוב עם קופונים אחרים`);
          continue;
        }
        
        // בדיקה שהקופון הראשון מאפשר שילוב
        if (loadedCount > 0 && this.discountCodes.length > 0) {
          const firstCode = this.discountCodes[0];
          if (!firstCode.can_combine_with_other_codes) {
            this.warnings.push(`קופון ${firstCode.code} לא מאפשר שילוב עם קופונים אחרים`);
            continue;
          }
        }
        
        // הוספת הקופון למערך
        this.discountCodes.push({ ...this.discountCode });
        loadedCount++;
        
        // בדיקת מגבלת שילובים
        if (loadedCount >= (this.discountCodes[0]?.max_combined_discounts || 99)) {
          break;
        }
      } else {
        // החזרת השגיאות למערך הראשי
        this.warnings.push(...this.errors);
      }
    }
    
    // שחזור שגיאות קודמות + שגיאות חדשות
    this.errors = previousErrors;
    
    // עדכון discountCode הישן לתאימות לאחור (הקופון הראשון)
    this.discountCode = this.discountCodes.length > 0 ? this.discountCodes[0] : null;
    
    return loadedCount;
  }

  /**
   * טוען הנחות אוטומטיות מהמסד נתונים
   */
  async loadAutomaticDiscounts(): Promise<void> {
    try {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();

      // Check if customer has early access to sales
      const hasEarlyAccess = this.customerTier 
        ? await hasEarlyAccessToSales(this.storeId, this.customerTier)
        : false;

      // Build date filter - if customer has early access, include future discounts
      let dateFilter = '';
      let dateParams: any[] = [];
      
      if (hasEarlyAccess) {
        // With early access, only filter by end date (don't filter by start date)
        // Parameters: $1=storeId, $2=now, $3=currentDay, $4=currentHour
        dateFilter = `AND (ends_at IS NULL OR ends_at >= $2)`;
        dateParams = [now];
      } else {
        // Without early access, filter by both start and end dates
        // Parameters: $1=storeId, $2=now (starts_at), $3=now (ends_at), $4=currentDay, $5=currentHour
        dateFilter = `AND (starts_at IS NULL OR starts_at <= $2)
          AND (ends_at IS NULL OR ends_at >= $3)`;
        dateParams = [now, now]; // Two parameters for two date checks
      }

      // Calculate parameter indices for day_of_week and hour checks
      // After storeId ($1) and dateParams, next params are currentDay and currentHour
      // If hasEarlyAccess: $1=storeId, $2=now, $3=currentDay, $4=currentHour
      // If !hasEarlyAccess: $1=storeId, $2=now(starts_at), $3=now(ends_at), $4=currentDay, $5=currentHour
      const dayParamIndex = dateParams.length + 2; // $3 or $4
      const hourParamIndex = dateParams.length + 3; // $4 or $5

      const discounts = await query<{
        id: number;
        name: string;
        description: string | null;
        discount_type: string;
        value: string | null;
        minimum_order_amount: string | null;
        maximum_order_amount: string | null;
        minimum_quantity: number | null;
        maximum_quantity: number | null;
        applies_to: string;
        priority: number;
        can_combine_with_codes: boolean;
        can_combine_with_other_automatic: boolean;
        max_combined_discounts: number;
        customer_segment: string | null;
        minimum_orders_count: number | null;
        minimum_lifetime_value: string | null;
        starts_at: Date | null;
        ends_at: Date | null;
        day_of_week: number[] | null;
        hour_start: number | null;
        hour_end: number | null;
        buy_quantity: number | null;
        get_quantity: number | null;
        get_discount_type: string | null;
        get_discount_value: string | null;
        applies_to_same_product: boolean | null;
        bundle_min_products: number | null;
        bundle_discount_type: string | null;
        bundle_discount_value: string | null;
        volume_tiers: any;
        gift_product_id: number | null;
        fixed_price_quantity: number | null;
        fixed_price_amount: string | null;
      }>(
        `SELECT 
          id, name, description, discount_type, value,
          minimum_order_amount, maximum_order_amount,
          minimum_quantity, maximum_quantity,
          applies_to, priority,
          can_combine_with_codes,
          can_combine_with_other_automatic,
          COALESCE(max_combined_discounts, 1) as max_combined_discounts,
          customer_segment, minimum_orders_count,
          minimum_lifetime_value,
          starts_at, ends_at,
          day_of_week, hour_start, hour_end,
          buy_quantity, get_quantity, get_discount_type, get_discount_value, applies_to_same_product,
          bundle_min_products, bundle_discount_type, bundle_discount_value,
          volume_tiers, gift_product_id,
          fixed_price_quantity, fixed_price_amount,
          spend_amount, pay_amount
        FROM automatic_discounts
        WHERE store_id = $1 
          AND is_active = true
          ${dateFilter}
          AND (day_of_week IS NULL OR $${dayParamIndex}::integer = ANY(day_of_week))
          AND (hour_start IS NULL OR hour_end IS NULL OR ($${hourParamIndex}::integer >= hour_start AND $${hourParamIndex}::integer < hour_end))
        ORDER BY priority DESC`,
        [this.storeId, ...dateParams, currentDay, currentHour]
      );

      // בדיקת תנאי לקוח לכל הנחה
      const validDiscounts: AutomaticDiscount[] = [];

      for (const discount of discounts) {
        // בדיקת customer_segment
        if (discount.customer_segment && discount.customer_segment !== 'all') {
          if (!this.customerSegment || discount.customer_segment !== this.customerSegment) {
            continue;
          }
        }

        // בדיקת minimum_orders_count
        if (discount.minimum_orders_count && 
            (!this.customerOrdersCount || this.customerOrdersCount < discount.minimum_orders_count)) {
          continue;
        }

        // בדיקת minimum_lifetime_value
        if (discount.minimum_lifetime_value) {
          const minValue = parseFloat(discount.minimum_lifetime_value);
          if (!this.customerLifetimeValue || this.customerLifetimeValue < minValue) {
            continue;
          }
        }

        // טעינת product_ids, collection_ids, tag_names
        const [productIds, collectionIds, tagNames] = await Promise.all([
          query<{ product_id: number }>(
            'SELECT product_id FROM automatic_discount_products WHERE automatic_discount_id = $1',
            [discount.id]
          ),
          query<{ collection_id: number }>(
            'SELECT collection_id FROM automatic_discount_collections WHERE automatic_discount_id = $1',
            [discount.id]
          ),
          query<{ tag_name: string }>(
            'SELECT tag_name FROM automatic_discount_tags WHERE automatic_discount_id = $1',
            [discount.id]
          ),
        ]);

        validDiscounts.push({
          id: discount.id,
          name: (discount as AutomaticDiscount).name,
          description: (discount as AutomaticDiscount).description || '',
          discount_type: discount.discount_type as 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume',
          value: discount.value ? parseFloat(discount.value) : null,
          minimum_order_amount: discount.minimum_order_amount ? parseFloat(discount.minimum_order_amount) : null,
          maximum_order_amount: discount.maximum_order_amount ? parseFloat(discount.maximum_order_amount) : null,
          minimum_quantity: discount.minimum_quantity,
          maximum_quantity: discount.maximum_quantity,
          applies_to: discount.applies_to as 'all' | 'specific_products' | 'specific_collections' | 'specific_tags',
          priority: discount.priority,
          can_combine_with_codes: discount.can_combine_with_codes,
          can_combine_with_other_automatic: discount.can_combine_with_other_automatic,
          max_combined_discounts: discount.max_combined_discounts,
          customer_segment: discount.customer_segment as 'all' | 'vip' | 'new_customer' | 'returning_customer' | null,
          minimum_orders_count: discount.minimum_orders_count,
          minimum_lifetime_value: discount.minimum_lifetime_value ? parseFloat(discount.minimum_lifetime_value) : null,
          starts_at: discount.starts_at,
          ends_at: discount.ends_at,
          day_of_week: discount.day_of_week,
          hour_start: discount.hour_start,
          hour_end: discount.hour_end,
          buy_quantity: discount.buy_quantity,
          get_quantity: discount.get_quantity,
          get_discount_type: discount.get_discount_type as 'free' | 'percentage' | 'fixed_amount' | null,
          get_discount_value: discount.get_discount_value ? String(discount.get_discount_value) : null,
          applies_to_same_product: discount.applies_to_same_product !== null ? discount.applies_to_same_product : true,
          bundle_min_products: discount.bundle_min_products,
          bundle_discount_type: discount.bundle_discount_type as 'percentage' | 'fixed_amount' | null,
          bundle_discount_value: discount.bundle_discount_value ? String(discount.bundle_discount_value) : null,
          volume_tiers: discount.volume_tiers ? (typeof discount.volume_tiers === 'string' ? JSON.parse(discount.volume_tiers) : discount.volume_tiers) : null,
          // Fixed Price fields
          fixed_price_quantity: discount.fixed_price_quantity,
          fixed_price_amount: discount.fixed_price_amount ? parseFloat(discount.fixed_price_amount) : null,
          // Spend X Pay Y fields
          spend_amount: (discount as any).spend_amount ? parseFloat((discount as any).spend_amount) : null,
          pay_amount: (discount as any).pay_amount ? parseFloat((discount as any).pay_amount) : null,
          gift_product_id: discount.gift_product_id,
          product_ids: productIds.map(p => p.product_id),
          collection_ids: collectionIds.map(c => c.collection_id),
          tag_names: tagNames.map(t => t.tag_name),
        });
      }

      this.automaticDiscounts = validDiscounts;
    } catch (error) {
      console.error('Error loading automatic discounts:', error);
      // לא נוסיף שגיאה - הנחות אוטומטיות הן אופציונליות
    }
  }

  /**
   * מחשב את כל העגלה
   */
  async calculate(): Promise<CartCalculationResult> {
    this.errors = [];
    this.warnings = [];

    if (this.items.length === 0) {
      return this.createEmptyResult();
    }

    // טעינת הנחות אוטומטיות
    await this.loadAutomaticDiscounts();

    // 1. חישוב subtotal בסיסי
    // ✅ Helper function לבדיקה אם פריט הוא מתנה
    const isGiftItem = (item: CartItem): boolean => {
      return item.properties?.some(prop => prop.name === 'מתנה') || false;
    };

    const itemsWithTotals = this.items.map((item) => ({
      item,
      lineTotal: item.price * item.quantity,
      lineDiscount: 0,
      lineTotalAfterDiscount: item.price * item.quantity,
      appliedDiscounts: [] as AppliedDiscount[],
    }));

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.lineTotal, 0);
    // ✅ חישוב totalQuantity ללא מתנות (מתנות לא נספרות להנחות אוטומטיות)
    const totalQuantity = itemsWithTotals.reduce((sum, item) => {
      return isGiftItem(item.item) ? sum : sum + item.item.quantity;
    }, 0);

    // טעינת premium club discount אם יש customer tier
    let premiumClubDiscount = 0;
    if (this.customerTier) {
      const { calculatePremiumClubDiscount } = await import('./premiumClub');
      premiumClubDiscount = await calculatePremiumClubDiscount(
        this.storeId,
        this.customerTier,
        subtotal
      );
    }

    // 2. חישוב הנחות - עדיפות: אוטומטיות קודם, אז premium club, אז קופון
    let itemsDiscount = 0;
    const allAppliedDiscounts: AppliedDiscount[] = [];

    // 2.1 הנחות אוטומטיות (עדיפות גבוהה)
    const applicableAutomaticDiscounts = this.getApplicableAutomaticDiscounts(
      itemsWithTotals,
      subtotal,
      totalQuantity
    );

    // מיון לפי עדיפות (גבוה יותר = קודם)
    applicableAutomaticDiscounts.sort((a, b) => b.priority - a.priority);

    // החלת הנחות אוטומטיות
    let remainingSubtotal = subtotal;
    let appliedAutomaticCount = 0;
    // ✅ שמירת ההנחות האוטומטיות שהוחלו כדי לבדוק אותן מול קופונים
    const appliedAutomaticDiscounts: AutomaticDiscount[] = [];

    for (const autoDiscount of applicableAutomaticDiscounts) {
      // בדיקת שילוב עם הנחות אוטומטיות אחרות
      if (appliedAutomaticCount > 0 && !autoDiscount.can_combine_with_other_automatic) {
        continue;
      }

      if (appliedAutomaticCount >= autoDiscount.max_combined_discounts) {
        continue;
      }

      const discountResult = this.calculateDiscount(
        itemsWithTotals,
        autoDiscount,
        remainingSubtotal,
        'automatic'
      );

        // יצירת AppliedDiscount object
        const appliedDiscount: AppliedDiscount = {
          id: autoDiscount.id,
          name: autoDiscount.name,
          type: autoDiscount.discount_type,
          amount: discountResult.amount,
        description: discountResult.description || (autoDiscount.gift_product_id ? 'מתנה חינם' : ''),
          source: 'automatic',
          priority: autoDiscount.priority,
        };

      if (discountResult.amount > 0) {
        itemsDiscount += discountResult.amount;
        remainingSubtotal -= discountResult.amount;

        // עדכון פריטים + עדכון appliedDiscounts על כל פריט שההנחה חלה עליו
        discountResult.items.forEach((itemDiscount, index) => {
          if (itemDiscount > 0) {
            itemsWithTotals[index].lineDiscount += itemDiscount;
            itemsWithTotals[index].lineTotalAfterDiscount -= itemDiscount;
            // עדכון appliedDiscounts על הפריט
            itemsWithTotals[index].appliedDiscounts.push({
              ...appliedDiscount,
              amount: itemDiscount, // סכום ההנחה על הפריט הספציפי
            });
          }
        });
      }

      // הוספת ההנחה לרשימת ההנחות המוחלות
      // גם אם ההנחה 0 - עבור מתנות או משלוח חינם
      if (discountResult.amount > 0 || autoDiscount.gift_product_id || autoDiscount.discount_type === 'free_shipping') {
        allAppliedDiscounts.push(appliedDiscount);
        appliedAutomaticDiscounts.push(autoDiscount); // ✅ שמירת ההנחה האוטומטית שהוחלה
        appliedAutomaticCount++;
      }
    }

    // 2.2 Premium Club Discount (אחרי הנחות אוטומטיות, לפני קופון)
    if (premiumClubDiscount > 0 && this.customerTier) {
      // חישוב ההנחה על הפריטים (אחוזי מהמחיר המקורי)
      const discountPerItem = premiumClubDiscount / subtotal;
      
      itemsWithTotals.forEach((itemTotal) => {
        const itemDiscount = itemTotal.lineTotal * discountPerItem;
        itemTotal.lineDiscount += itemDiscount;
        itemTotal.lineTotalAfterDiscount -= itemDiscount;
        itemTotal.appliedDiscounts.push({
          id: 0,
          name: `הנחת מועדון פרימיום`,
          type: 'percentage',
          amount: itemDiscount,
          description: `הנחה לרמה ${this.customerTier}`,
          source: 'automatic',
          priority: 1000, // עדיפות גבוהה
        });
      });

      itemsDiscount += premiumClubDiscount;
      remainingSubtotal -= premiumClubDiscount;
      
      allAppliedDiscounts.push({
        id: 0,
        name: 'הנחת מועדון פרימיום',
        type: 'percentage',
        amount: premiumClubDiscount,
        description: `הנחה לרמה ${this.customerTier}`,
        source: 'automatic',
        priority: 1000,
      });
    }

    // 2.3 קופונים (אחרי הנחות אוטומטיות ו-premium club)
    // תמיכה בקופון בודד (תאימות לאחור) וגם במערך קופונים
    const codesToProcess = this.discountCodes.length > 0 
      ? this.discountCodes 
      : (this.discountCode ? [this.discountCode] : []);
    
    let appliedCodesCount = 0;
    
    for (const currentCode of codesToProcess) {
      const currentSubtotal = remainingSubtotal;
      let canApplyCode = true;
      const codeErrors: string[] = [];

      // בדיקת שילוב עם קופונים אחרים
      if (appliedCodesCount > 0) {
        // בדיקה שהקופון הנוכחי מאפשר שילוב
        if (!currentCode.can_combine_with_other_codes) {
          codeErrors.push(
            `קופון ${currentCode.code} לא ניתן לשילוב עם קופונים אחרים`
          );
          canApplyCode = false;
        }
        
        // בדיקה שהקופון הראשון מאפשר שילוב
        const firstAppliedCode = codesToProcess[0];
        if (firstAppliedCode && !firstAppliedCode.can_combine_with_other_codes) {
          codeErrors.push(
            `קופון ${firstAppliedCode.code} לא מאפשר שילוב עם קופונים אחרים`
          );
          canApplyCode = false;
        }
      }

      // בדיקת סכום מינימום/מקסימום
      if (canApplyCode && currentCode.minimum_order_amount && currentSubtotal < currentCode.minimum_order_amount) {
        codeErrors.push(
          `קופון ${currentCode.code} דורש סכום מינימום של ₪${currentCode.minimum_order_amount.toFixed(2)}`
        );
        canApplyCode = false;
      } else if (canApplyCode && currentCode.maximum_order_amount && currentSubtotal > currentCode.maximum_order_amount) {
        codeErrors.push(
          `קופון ${currentCode.code} תקף עד סכום מקסימום של ₪${currentCode.maximum_order_amount.toFixed(2)}`
        );
        canApplyCode = false;
      }

      // בדיקת כמות מינימום/מקסימום
      if (canApplyCode && currentCode.minimum_quantity && totalQuantity < currentCode.minimum_quantity) {
        codeErrors.push(
          `קופון ${currentCode.code} דורש כמות מינימום של ${currentCode.minimum_quantity} פריטים`
        );
        canApplyCode = false;
      } else if (canApplyCode && currentCode.maximum_quantity && totalQuantity > currentCode.maximum_quantity) {
        codeErrors.push(
          `קופון ${currentCode.code} תקף עד כמות מקסימום של ${currentCode.maximum_quantity} פריטים`
        );
        canApplyCode = false;
      }

      // ✅ בדיקת שילוב עם הנחות אוטומטיות - בדיקה דו-כיוונית
      if (canApplyCode && appliedAutomaticCount > 0) {
        // בדיקה 1: האם הקופון מאפשר שילוב עם הנחות אוטומטיות
        if (!currentCode.can_combine_with_automatic) {
          codeErrors.push(
            `קופון ${currentCode.code} לא ניתן לשילוב עם הנחות אוטומטיות`
          );
          canApplyCode = false;
        }
        
        // ✅ בדיקה 2: האם ההנחות האוטומטיות שהוחלו מאפשרות שילוב עם קופונים
        const blockingAutomaticDiscount = appliedAutomaticDiscounts.find(
          ad => !ad.can_combine_with_codes
        );
        if (blockingAutomaticDiscount) {
          codeErrors.push(
            `הנחה אוטומטית "${blockingAutomaticDiscount.name}" לא מאפשרת שילוב עם קופונים`
          );
          canApplyCode = false;
        }
      }

      if (canApplyCode) {
        // בדיקה אם הקופון חל על הפריטים
        const hasApplicableItems = this.checkDiscountAppliesToItems(itemsWithTotals, currentCode);
        
        if (!hasApplicableItems) {
          codeErrors.push(
            `קופון ${currentCode.code} לא חל על הפריטים בעגלה`
          );
          canApplyCode = false;
        }
      }

      if (canApplyCode) {
        const discountResult = this.calculateDiscount(
          itemsWithTotals,
          currentCode,
          currentSubtotal,
          'code'
        );

        // יצירת AppliedDiscount object - גם אם ההנחה היא 0 (כדי לאפשר מתנות)
        const appliedDiscount: AppliedDiscount = {
          id: currentCode.id,
          name: currentCode.code,
          code: currentCode.code,
          type: currentCode.discount_type,
          amount: discountResult.amount,
          description: discountResult.description || (currentCode.gift_product_id ? 'מתנה חינם' : ''),
          source: 'code',
          priority: currentCode.priority,
        };

        if (discountResult.amount > 0) {
          itemsDiscount += discountResult.amount;
          remainingSubtotal -= discountResult.amount;

          // עדכון פריטים + עדכון appliedDiscounts על כל פריט שההנחה חלה עליו
          discountResult.items.forEach((itemDiscount, index) => {
            if (itemDiscount > 0) {
              itemsWithTotals[index].lineDiscount += itemDiscount;
              itemsWithTotals[index].lineTotalAfterDiscount -= itemDiscount;
              // עדכון appliedDiscounts על הפריט
              itemsWithTotals[index].appliedDiscounts.push({
                ...appliedDiscount,
                amount: itemDiscount, // סכום ההנחה על הפריט הספציפי
              });
            }
          });
        }

        // הוספת הקופון לרשימת ההנחות המוחלות (גם אם ההנחה 0 - עבור מתנות)
        // או אם יש סכום הנחה, או מתנה, או free_shipping
        if (discountResult.amount > 0 || currentCode.gift_product_id || currentCode.discount_type === 'free_shipping') {
          allAppliedDiscounts.push(appliedDiscount);
          appliedCodesCount++;
        }
      } else {
        // הוספת אזהרות/שגיאות
        codeErrors.forEach(error => this.warnings.push(error));
      }
    }

    const subtotalAfterDiscount = subtotal - itemsDiscount;

    // 3. חישוב משלוח
    let shipping = 0;
    let shippingDiscount = 0;
    
    if (this.shippingRate) {
      // בדיקת משלוח חינם מהנחות
      const hasFreeShippingFromDiscounts = allAppliedDiscounts.some(
        d => d.type === 'free_shipping'
      );

      // ✅ בדיקת משלוח חינם לפי סף - בודק אחרי הנחות על מוצרים
      // 🔍 CRITICAL: משתמש ב-freeShippingThreshold מה-premium club config (אם קיים) או מה-shipping rate
      // זה מבטיח שהחישוב משתמש באותה הגדרה כמו ה-progress bar
      let freeShippingThreshold: number | null = null;
      let thresholdSource: 'premium_club_config' | 'shipping_rate' | null = null;
      
      // נסה לטעון את ה-premium club config כדי לקבל את ה-freeShippingThreshold הגלובלי
      try {
        const { getPremiumClubConfig } = await import('./premiumClub');
        const premiumConfig = await getPremiumClubConfig(this.storeId);
        if (premiumConfig?.benefits?.freeShippingThreshold) {
          freeShippingThreshold = premiumConfig.benefits.freeShippingThreshold;
          thresholdSource = 'premium_club_config';
        }
      } catch (error) {
        // Silent error - fallback to shipping rate threshold
      }
      
      // אם אין הגדרה ב-premium club config, משתמש ב-free_shipping_threshold מה-shipping rate
      if (!freeShippingThreshold && this.shippingRate.free_shipping_threshold) {
        freeShippingThreshold = this.shippingRate.free_shipping_threshold;
        thresholdSource = 'shipping_rate';
      }
      
      const hasFreeShippingThreshold = freeShippingThreshold && subtotalAfterDiscount >= freeShippingThreshold;

      // בדיקת משלוח חינם לפי premium club tier
      let hasFreeShippingFromTier = false;
      if (this.customerTier) {
        const { hasFreeShippingBenefit } = await import('./premiumClub');
        hasFreeShippingFromTier = await hasFreeShippingBenefit(this.storeId, this.customerTier);
      }

      // ✅ תמיד מעדכן את shipping לפי התעריף הנוכחי
      shipping = this.shippingRate.price;
      
      if (hasFreeShippingFromDiscounts || hasFreeShippingThreshold || hasFreeShippingFromTier) {
        // ✅ עדכון shippingDiscount לפי התעריף הנוכחי (תמיד)
        shippingDiscount = this.shippingRate.price;
        if (hasFreeShippingFromDiscounts) {
          const freeShippingDiscount = allAppliedDiscounts.find(d => d.type === 'free_shipping');
          if (freeShippingDiscount) {
            // ✅ עדכון תיאור וגם amount לפי התעריף הנוכחי
            // ✅ מציג רק "משלוח חינם" - הקוד יוצג בנפרד ברכיבי ה-UI
            freeShippingDiscount.description = 'משלוח חינם';
            freeShippingDiscount.amount = this.shippingRate.price; // ✅ עדכון הסכום לפי התעריף הנוכחי
          }
        } else if (hasFreeShippingThreshold && freeShippingThreshold) {
          // הוספת הנחת משלוח חינם לרשימת ההנחות
          allAppliedDiscounts.push({
            id: 0,
            name: 'משלוח חינם',
            type: 'free_shipping',
            amount: this.shippingRate.price,
            description: `משלוח חינם מעל ₪${freeShippingThreshold}`,
            source: 'automatic',
            priority: 1000,
          });
        } else if (hasFreeShippingFromTier) {
          // הוספת הנחת משלוח חינם לרשימת ההנחות
          allAppliedDiscounts.push({
            id: 0,
            name: 'משלוח חינם - מועדון פרימיום',
            type: 'free_shipping',
            amount: this.shippingRate.price,
            description: `משלוח חינם לרמה ${this.customerTier}`,
            source: 'automatic',
            priority: 1000,
          });
        }
      }
    }

    const shippingAfterDiscount = shipping - shippingDiscount;

    // 4. איסוף מתנות אוטומטיות מההנחות שהוחלו
    const giftProducts: GiftProduct[] = [];
    
    // Helper function to load gift product
    const loadGiftProduct = async (giftProductId: number, discountId: number, discountName: string) => {
      try {
        // טעינת פרטי המוצר והתמונה הראשונה שלו
        const productResult = await query<{
          id: number;
          title: string;
        }>(
          `SELECT id, title FROM products WHERE id = $1 AND store_id = $2`,
          [giftProductId, this.storeId]
        );

        if (productResult.length > 0) {
          const product = productResult[0];
          
          // טעינת התמונה הראשונה של המוצר
          const imageResult = await query<{
            src: string;
          }>(
            `SELECT src 
             FROM product_images 
             WHERE product_id = $1 
             ORDER BY position ASC, id ASC 
             LIMIT 1`,
            [product.id]
          );
          
          const productImage = imageResult.length > 0 ? imageResult[0].src : undefined;
          
          // טעינת הגרסה הראשונה של המוצר
          const variantResult = await query<{
            id: number;
            title: string;
            price: string;
          }>(
            `SELECT id, title, price 
             FROM product_variants 
             WHERE product_id = $1 
             ORDER BY id ASC 
             LIMIT 1`,
            [product.id]
          );

          if (variantResult.length > 0) {
            const variant = variantResult[0];
            giftProducts.push({
              product_id: product.id,
              variant_id: variant.id,
              product_title: product.title,
              variant_title: variant.title || 'Default',
              price: parseFloat(variant.price),
              image: productImage,
              discount_id: discountId,
              discount_name: discountName,
            });
          }
        }
      } catch (error) {
        console.error(`Error loading gift product ${giftProductId}:`, error);
        this.warnings.push(`לא ניתן לטעון מתנה מההנחה "${discountName}"`);
      }
    };

    // איסוף מתנות מהנחות אוטומטיות
    const appliedAutomaticDiscountIds = allAppliedDiscounts
      .filter(d => d.source === 'automatic')
      .map(d => d.id);

    for (const discountId of appliedAutomaticDiscountIds) {
      const discount = this.automaticDiscounts.find(d => d.id === discountId);
      if (discount?.gift_product_id) {
        await loadGiftProduct(discount.gift_product_id, discount.id, discount.name);
      }
    }

    // איסוף מתנות מקודי הנחה (קופונים) - תמיכה במספר קופונים
    const appliedCodeDiscountIds = allAppliedDiscounts
      .filter(d => d.source === 'code')
      .map(d => d.id);

    // מחפש במערך הקופונים (תמיכה במספר קופונים)
    const allCodes = this.discountCodes.length > 0 
      ? this.discountCodes 
      : (this.discountCode ? [this.discountCode] : []);

    for (const discountId of appliedCodeDiscountIds) {
      const matchingCode = allCodes.find(c => c.id === discountId);
      if (matchingCode?.gift_product_id) {
        await loadGiftProduct(matchingCode.gift_product_id, matchingCode.id, matchingCode.code);
      }
    }

    // 5. חישוב סה"כ סופי
    const total = subtotalAfterDiscount + shippingAfterDiscount;

    return {
      items: itemsWithTotals.map(item => ({
        item: item.item,
        lineTotal: item.lineTotal,
        lineDiscount: item.lineDiscount,
        lineTotalAfterDiscount: item.lineTotalAfterDiscount,
        appliedDiscounts: item.appliedDiscounts,
      })),
      subtotal,
      itemsDiscount,
      subtotalAfterDiscount,
      shipping,
      shippingDiscount,
      shippingAfterDiscount,
      discounts: allAppliedDiscounts,
      giftProducts,
      total,
      isValid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }

  /**
   * בודק אם הנחה/קופון חל על הפריטים בעגלה
   */
  private checkDiscountAppliesToItems(
    items: Array<{ item: CartItem; lineTotal: number }>,
    discount: AutomaticDiscount | DiscountCode
  ): boolean {
    // ✅ Helper function לבדיקה אם פריט הוא מתנה
    const isGiftItem = (item: CartItem): boolean => {
      return item.properties?.some(prop => prop.name === 'מתנה') || false;
    };

    // ✅ מסנן מתנות - מתנות לא נספרות להנחות
    const nonGiftItems = items.filter(itemData => !isGiftItem(itemData.item));

    if (discount.applies_to === 'all') {
      return nonGiftItems.length > 0;
    }

    // בדיקה אם יש פריטים שמתאימים (ללא מתנות)
    return nonGiftItems.some(itemData => {
      const item = itemData.item;

      if (discount.applies_to === 'specific_products' && discount.product_ids) {
        return discount.product_ids.includes(item.product_id);
      }

      if (discount.applies_to === 'specific_collections' && discount.collection_ids && item.collection_ids) {
        return item.collection_ids.some(id => discount.collection_ids!.includes(id));
      }

      if (discount.applies_to === 'specific_tags' && discount.tag_names && item.tag_names) {
        return item.tag_names.some(tag => discount.tag_names!.includes(tag));
      }

      return false;
    });
  }

  /**
   * בודק אילו הנחות אוטומטיות חלות על העגלה
   */
  private getApplicableAutomaticDiscounts(
    items: Array<{ item: CartItem; lineTotal: number }>,
    subtotal: number,
    totalQuantity: number
  ): AutomaticDiscount[] {
    return this.automaticDiscounts.filter(discount => {
      // בדיקת סכום מינימום/מקסימום
      if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
        return false;
      }
      if (discount.maximum_order_amount && subtotal > discount.maximum_order_amount) {
        return false;
      }

      // בדיקת כמות מינימום/מקסימום
      if (discount.minimum_quantity && totalQuantity < discount.minimum_quantity) {
        return false;
      }
      if (discount.maximum_quantity && totalQuantity > discount.maximum_quantity) {
        return false;
      }

      // בדיקת החלה על פריטים
      return this.checkDiscountAppliesToItems(items, discount);
    });
  }

  /**
   * מחשב הנחה (אוטומטית או קופון)
   */
  private calculateDiscount(
    items: Array<{ item: CartItem; lineTotal: number; lineTotalAfterDiscount: number }>,
    discount: AutomaticDiscount | DiscountCode,
    currentSubtotal: number,
    source: 'automatic' | 'code'
  ): { amount: number; items: number[]; description: string } {
    let totalDiscount = 0;
    const itemDiscounts: number[] = new Array(items.length).fill(0);

    // ✅ Helper function לבדיקה אם פריט הוא מתנה
    const isGiftItem = (item: CartItem): boolean => {
      return item.properties?.some(prop => prop.name === 'מתנה') || false;
    };

    // קביעת פריטים שההנחה חלה עליהם
    // ✅ מסנן מתנות - מתנות לא נספרות להנחות אוטומטיות
    const applicableItems = items.filter((itemData, index) => {
      const item = itemData.item;
      
      // ✅ מתנות לא נספרות להנחות אוטומטיות
      if (isGiftItem(item)) {
        return false;
      }
      
      if (discount.applies_to === 'all') {
        return true;
      }
      
      if (discount.applies_to === 'specific_products' && discount.product_ids) {
        return discount.product_ids.includes(item.product_id);
      }
      
      if (discount.applies_to === 'specific_collections' && discount.collection_ids && item.collection_ids) {
        return item.collection_ids.some(id => discount.collection_ids!.includes(id));
      }
      
      if (discount.applies_to === 'specific_tags' && discount.tag_names && item.tag_names) {
        return item.tag_names.some(tag => discount.tag_names!.includes(tag));
      }
      
      return false;
    });

    if (applicableItems.length === 0) {
      return { amount: 0, items: itemDiscounts, description: '' };
    }

    // חישוב הנחה לפי סוג
    const applicableTotal = applicableItems.reduce(
      (sum, itemData) => sum + itemData.lineTotalAfterDiscount, // אחרי הנחות קודמות
      0
    );

    let discountAmount = 0;
    let description = '';

    switch (discount.discount_type) {
      case 'percentage':
        if (discount.value) {
          discountAmount = (applicableTotal * discount.value) / 100;
          description = source === 'automatic' 
            ? `${(discount as AutomaticDiscount).name}: ${discount.value}% הנחה`
            : `${discount.value}% הנחה`;
        }
        break;

      case 'fixed_amount':
        if (discount.value) {
          discountAmount = Math.min(discount.value, applicableTotal);
          description = source === 'automatic'
            ? `${(discount as AutomaticDiscount).name}: ₪${discount.value.toFixed(2)} הנחה`
            : `₪${discount.value.toFixed(2)} הנחה`;
        }
        break;

      case 'free_shipping':
        // משלוח חינם מטופל בנפרד
        return { amount: 0, items: itemDiscounts, description: '' };

      case 'bogo':
        // BOGO - Buy One Get One (עובד גם אוטומטי וגם קופון)
        const bogoDiscount = discount as AutomaticDiscount | DiscountCode;
        if (bogoDiscount.buy_quantity && bogoDiscount.get_quantity) {
          const bogoResult = this.calculateBOGO(
            applicableItems,
            bogoDiscount.buy_quantity,
            bogoDiscount.get_quantity,
            bogoDiscount.get_discount_type || 'free',
            bogoDiscount.get_discount_value ? parseFloat(bogoDiscount.get_discount_value) : null,
            bogoDiscount.applies_to_same_product !== false
          );
          discountAmount = bogoResult.amount;
          // עדכון itemDiscounts לפי התוצאה
          applicableItems.forEach((itemData, idx) => {
            const originalIdx = items.findIndex(i => i.item === itemData.item);
            if (originalIdx >= 0 && bogoResult.itemDiscounts[idx]) {
              itemDiscounts[originalIdx] = bogoResult.itemDiscounts[idx];
            }
          });
          if (source === 'automatic') {
            description = `${(bogoDiscount as AutomaticDiscount).name}: קנה ${bogoDiscount.buy_quantity} קבל ${bogoDiscount.get_quantity} ${
              bogoDiscount.get_discount_type === 'free' ? 'חינם' :
              bogoDiscount.get_discount_type === 'percentage' ? `ב-${bogoDiscount.get_discount_value}% הנחה` :
              `ב-₪${bogoDiscount.get_discount_value}`
            }`;
          } else {
            description = `קנה ${bogoDiscount.buy_quantity} קבל ${bogoDiscount.get_quantity} ${
              bogoDiscount.get_discount_type === 'free' ? 'חינם' :
              bogoDiscount.get_discount_type === 'percentage' ? `ב-${bogoDiscount.get_discount_value}% הנחה` :
              `ב-₪${bogoDiscount.get_discount_value}`
            }`;
          }
        }
        break;

      case 'bundle':
        // Bundle - הנחה על חבילת מוצרים (עובד גם אוטומטי וגם קופון)
        const bundleDiscount = discount as AutomaticDiscount | DiscountCode;
        if (bundleDiscount.bundle_min_products && applicableItems.length >= bundleDiscount.bundle_min_products) {
          const bundleTotal = applicableItems.reduce((sum, item) => sum + item.lineTotalAfterDiscount, 0);
          if (bundleDiscount.bundle_discount_type === 'percentage' && bundleDiscount.bundle_discount_value) {
            discountAmount = (bundleTotal * parseFloat(bundleDiscount.bundle_discount_value)) / 100;
          } else if (bundleDiscount.bundle_discount_type === 'fixed_amount' && bundleDiscount.bundle_discount_value) {
            discountAmount = Math.min(parseFloat(bundleDiscount.bundle_discount_value), bundleTotal);
          }
          if (source === 'automatic') {
            description = `${(bundleDiscount as AutomaticDiscount).name}: הנחה על חבילה של ${bundleDiscount.bundle_min_products}+ מוצרים`;
          } else {
            description = `הנחה על חבילה של ${bundleDiscount.bundle_min_products}+ מוצרים`;
          }
        }
        break;

      case 'volume':
        // Volume - הנחה לפי כמות (tiers) (עובד גם אוטומטי וגם קופון)
        const volumeDiscount = discount as AutomaticDiscount | DiscountCode;
        if (volumeDiscount.volume_tiers && volumeDiscount.volume_tiers.length > 0) {
          // ✅ חישוב totalQuantity ללא מתנות (מתנות כבר מסוננות ב-applicableItems)
          const totalQuantity = applicableItems.reduce((sum, item) => sum + item.item.quantity, 0);
          // מציאת ה-tier המתאים (הגבוה ביותר שהכמות מגיעה אליו)
          let applicableTier = null;
          for (const tier of volumeDiscount.volume_tiers.sort((a, b) => b.quantity - a.quantity)) {
            if (totalQuantity >= tier.quantity) {
              applicableTier = tier;
              break;
            }
          }
          if (applicableTier) {
            const volumeTotal = applicableItems.reduce((sum, item) => sum + item.lineTotalAfterDiscount, 0);
            if (applicableTier.discount_type === 'percentage') {
              discountAmount = (volumeTotal * applicableTier.value) / 100;
            } else {
              discountAmount = Math.min(applicableTier.value, volumeTotal);
            }
            if (source === 'automatic') {
              description = `${(volumeDiscount as AutomaticDiscount).name}: ${applicableTier.discount_type === 'percentage' ? `${applicableTier.value}%` : `₪${applicableTier.value}`} הנחה על ${applicableTier.quantity}+ פריטים`;
            } else {
              description = `${applicableTier.discount_type === 'percentage' ? `${applicableTier.value}%` : `₪${applicableTier.value}`} הנחה על ${applicableTier.quantity}+ פריטים`;
            }
          }
        }
        break;

      case 'fixed_price':
        // Fixed Price - מחיר קבוע לכמות (לדוגמא: 2 פריטים ב-55 ש"ח)
        const fixedPriceDiscount = discount as AutomaticDiscount | DiscountCode;
        if (fixedPriceDiscount.fixed_price_quantity && fixedPriceDiscount.fixed_price_amount) {
          const fixedQuantity = fixedPriceDiscount.fixed_price_quantity;
          const fixedPrice = fixedPriceDiscount.fixed_price_amount;
          
          // ✅ חישוב כמה "חבילות" של מחיר קבוע יש (מתנות כבר מסוננות ב-applicableItems)
          const totalQuantity = applicableItems.reduce((sum, item) => sum + item.item.quantity, 0);
          const bundleCount = Math.floor(totalQuantity / fixedQuantity);
          
          if (bundleCount > 0) {
            // מחשב את המחיר המקורי של הפריטים בחבילות
            // ממיין מהזול לייקר ובוחר את הפריטים לחבילות
            const allUnits: Array<{ price: number; originalIdx: number }> = [];
            applicableItems.forEach((itemData, idx) => {
              const originalIdx = items.findIndex(i => i.item === itemData.item);
              const pricePerUnit = itemData.item.price;
              for (let i = 0; i < itemData.item.quantity; i++) {
                allUnits.push({ price: pricePerUnit, originalIdx });
              }
            });
            
            // מיון מהזול לייקר - הפריטים הזולים יהיו בחבילות (כדי למקסם חיסכון ללקוח)
            allUnits.sort((a, b) => a.price - b.price);
            
            const unitsInBundles = bundleCount * fixedQuantity;
            const originalPriceForBundles = allUnits.slice(0, unitsInBundles).reduce((sum, u) => sum + u.price, 0);
            const fixedPriceForBundles = bundleCount * fixedPrice;
            
            // ההנחה היא ההפרש בין המחיר המקורי למחיר הקבוע
            discountAmount = Math.max(0, originalPriceForBundles - fixedPriceForBundles);
            
            // חלוקת ההנחה על הפריטים שבחבילות
            if (discountAmount > 0) {
              const discountPerUnit = discountAmount / unitsInBundles;
              const unitCountPerItem: { [key: number]: number } = {};
              
              for (let i = 0; i < unitsInBundles; i++) {
                const unit = allUnits[i];
                unitCountPerItem[unit.originalIdx] = (unitCountPerItem[unit.originalIdx] || 0) + 1;
              }
              
              Object.entries(unitCountPerItem).forEach(([idx, count]) => {
                itemDiscounts[parseInt(idx)] = discountPerUnit * count;
              });
            }
            
            if (source === 'automatic') {
              description = `${(fixedPriceDiscount as AutomaticDiscount).name}: ${fixedQuantity} פריטים ב-₪${fixedPrice.toFixed(2)}`;
            } else {
              description = `${fixedQuantity} פריטים ב-₪${fixedPrice.toFixed(2)}`;
            }
          }
        }
        break;

      case 'spend_x_pay_y':
        // Spend X Pay Y - קנה ב-X שלם Y (לדוגמא: קנה ב-300 שלם 200)
        const spendDiscount = discount as AutomaticDiscount | DiscountCode;
        const spendAmount = (spendDiscount as any).spend_amount;
        const payAmount = (spendDiscount as any).pay_amount;
        
        if (spendAmount && payAmount && applicableTotal >= spendAmount) {
          // ההנחה היא ההפרש בין סכום הקנייה לסכום התשלום
          // אבל לא יותר מסכום ההזמנה
          discountAmount = Math.min(spendAmount - payAmount, applicableTotal);
          
          if (source === 'automatic') {
            description = `${(spendDiscount as AutomaticDiscount).name}: קנה ב-₪${spendAmount} שלם ₪${payAmount}`;
          } else {
            description = `קנה ב-₪${spendAmount} שלם ₪${payAmount}`;
          }
        }
        break;
    }

    // חלוקת ההנחה בין הפריטים (יחסית)
    if (discountAmount > 0 && applicableTotal > 0) {
      const discountRatio = discountAmount / applicableTotal;
      
      items.forEach((itemData, index) => {
        if (applicableItems.includes(itemData)) {
          const itemDiscount = itemData.lineTotalAfterDiscount * discountRatio;
          itemDiscounts[index] = itemDiscount;
        }
      });
    }

    return {
      amount: discountAmount,
      items: itemDiscounts,
      description,
    };
  }

  /**
   * מחשב הנחת BOGO (Buy One Get One)
   */
  private calculateBOGO(
    items: Array<{ item: CartItem; lineTotal: number; lineTotalAfterDiscount: number }>,
    buyQuantity: number,
    getQuantity: number,
    getDiscountType: 'free' | 'percentage' | 'fixed_amount',
    getDiscountValue: number | null,
    appliesToSameProduct: boolean
  ): { amount: number; itemDiscounts: number[] } {
    const itemDiscounts: number[] = new Array(items.length).fill(0);
    let totalDiscount = 0;

    if (appliesToSameProduct) {
      // BOGO על אותו מוצר
      items.forEach((itemData, index) => {
        const item = itemData.item;
        const totalQuantity = item.quantity;
        
        // כמה "חבילות" של buy+get יש
        const bundles = Math.floor(totalQuantity / (buyQuantity + getQuantity));
        const freeQuantity = bundles * getQuantity;
        
        if (freeQuantity > 0) {
          const pricePerUnit = item.price;
          let discountPerUnit = 0;
          
          if (getDiscountType === 'free') {
            discountPerUnit = pricePerUnit;
          } else if (getDiscountType === 'percentage' && getDiscountValue) {
            discountPerUnit = (pricePerUnit * getDiscountValue) / 100;
          } else if (getDiscountType === 'fixed_amount' && getDiscountValue) {
            discountPerUnit = Math.min(getDiscountValue, pricePerUnit);
          }
          
          const itemDiscount = discountPerUnit * freeQuantity;
          itemDiscounts[index] = itemDiscount;
          totalDiscount += itemDiscount;
        }
      });
    } else {
      // BOGO על מוצרים שונים - ההנחה ניתנת על המוצרים הזולים ביותר
      // יוצרים רשימה של כל היחידות ממוינות לפי מחיר (מהזול לייקר)
      const allUnits: Array<{ index: number; price: number }> = [];
      
      items.forEach((itemData, index) => {
        const unitPrice = itemData.item.price;
        for (let i = 0; i < itemData.item.quantity; i++) {
          allUnits.push({ index, price: unitPrice });
        }
      });
      
      // מיון מהזול לייקר - המוצרים הזולים יקבלו את ההנחה
      allUnits.sort((a, b) => a.price - b.price);
      
      const totalApplicableQuantity = allUnits.length;
      const bundles = Math.floor(totalApplicableQuantity / (buyQuantity + getQuantity));
      const freeQuantity = bundles * getQuantity;
      
      if (freeQuantity > 0) {
        // ההנחה ניתנת על היחידות הזולות ביותר
        for (let i = 0; i < freeQuantity && i < allUnits.length; i++) {
          const unit = allUnits[i];
          let discountAmount = 0;
          
          if (getDiscountType === 'free') {
            discountAmount = unit.price;
          } else if (getDiscountType === 'percentage' && getDiscountValue) {
            discountAmount = (unit.price * getDiscountValue) / 100;
          } else if (getDiscountType === 'fixed_amount' && getDiscountValue) {
            discountAmount = Math.min(getDiscountValue, unit.price);
          }
          
          itemDiscounts[unit.index] += discountAmount;
          totalDiscount += discountAmount;
        }
      }
    }

    return { amount: totalDiscount, itemDiscounts };
  }

  /**
   * יוצר תוצאה ריקה
   */
  private createEmptyResult(): CartCalculationResult {
    return {
      items: [],
      subtotal: 0,
      itemsDiscount: 0,
      subtotalAfterDiscount: 0,
      shipping: 0,
      shippingDiscount: 0,
      shippingAfterDiscount: 0,
      discounts: [],
      giftProducts: [],
      total: 0,
      isValid: true,
      errors: [],
      warnings: [],
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * מחשב עגלה - פונקציה עטיפה נוחה
 */
export async function calculateCart(
  input: CartCalculationInput
): Promise<CartCalculationResult> {
  const calculator = new CartCalculator(input);

  if (input.discountCode) {
    await calculator.loadDiscountCode(input.discountCode);
  }

  return await calculator.calculate();
}

/**
 * מאמת קופון ללא חישוב מלא
 */
export async function validateDiscountCode(
  code: string,
  storeId: number,
  subtotal: number
): Promise<{ valid: boolean; error?: string; discount?: DiscountCode }> {
  try {
    const discount = await queryOne<{
      id: number;
      code: string;
      discount_type: string;
      value: string | null;
      minimum_order_amount: string | null;
      maximum_order_amount: string | null;
      usage_limit: number | null;
      usage_count: number;
      applies_to: string;
      is_active: boolean;
      starts_at: Date | null;
      ends_at: Date | null;
    }>(
      `SELECT 
        id, code, discount_type, value,
        minimum_order_amount, maximum_order_amount,
        usage_limit, usage_count, applies_to, is_active,
        starts_at, ends_at
      FROM discount_codes
      WHERE store_id = $1 AND code = $2 AND is_active = true`,
      [storeId, code.toUpperCase()]
    );

    if (!discount) {
      return { valid: false, error: 'קופון לא נמצא או לא פעיל' };
    }

    // בדיקת תוקף תאריכים
    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return { valid: false, error: 'קופון עדיין לא פעיל' };
    }
    if (discount.ends_at && new Date(discount.ends_at) < now) {
      return { valid: false, error: 'קופון פג תוקף' };
    }

    // בדיקת שימוש
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      return { valid: false, error: 'קופון הגיע למגבלת השימוש' };
    }

    // Convert to DiscountCode format
    const discountCode: DiscountCode = {
      id: discount.id,
      code: discount.code,
      discount_type: discount.discount_type as 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle' | 'volume',
      value: discount.value ? parseFloat(discount.value) : null,
      minimum_order_amount: discount.minimum_order_amount ? parseFloat(discount.minimum_order_amount) : null,
      maximum_order_amount: discount.maximum_order_amount ? parseFloat(discount.maximum_order_amount) : null,
      minimum_quantity: null,
      maximum_quantity: null,
      applies_to: discount.applies_to as 'all' | 'specific_products' | 'specific_collections' | 'specific_tags',
      can_combine_with_automatic: true,
      can_combine_with_other_codes: false,
      max_combined_discounts: 1,
      priority: 0,
      customer_segment: null,
      minimum_orders_count: null,
      minimum_lifetime_value: null,
      day_of_week: null,
      hour_start: null,
      hour_end: null,
    };

    // בדיקת סכום מינימום/מקסימום
    if (discountCode.minimum_order_amount && subtotal < discountCode.minimum_order_amount) {
      return {
        valid: false,
        error: `קופון דורש סכום מינימום של ₪${discountCode.minimum_order_amount.toFixed(2)}`,
        discount: discountCode,
      };
    }
    if (discountCode.maximum_order_amount && subtotal > discountCode.maximum_order_amount) {
      return {
        valid: false,
        error: `קופון תקף עד סכום מקסימום של ₪${discountCode.maximum_order_amount.toFixed(2)}`,
        discount: discountCode,
      };
    }

    return { valid: true, discount: discountCode };
  } catch (error) {
    console.error('Error validating discount code:', error);
    return { valid: false, error: 'שגיאה באימות קופון' };
  }
}
