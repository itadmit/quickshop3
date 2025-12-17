'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  HiSave, 
  HiX, 
  HiPhotograph, 
  HiPlus, 
  HiTrash,
  HiChevronDown 
} from 'react-icons/hi';
import { ProductWithDetails } from '@/types/product';
import { ImageGallery } from '@/components/products/ImageGallery';
import { VariantsManager } from '@/components/products/VariantsManager';
import { InventoryManager } from '@/components/products/InventoryManager';
import { BasicInfoCard } from '@/components/products/BasicInfoCard';
import { PricingCard } from '@/components/products/PricingCard';
import { ProductDetailsCard } from '@/components/products/ProductDetailsCard';
import { ShippingCard } from '@/components/products/ShippingCard';
import { StatusCard } from '@/components/products/StatusCard';
import { CategoryTreeSelector } from '@/components/products/CategoryTreeSelector';
import { TagsCard } from '@/components/products/TagsCard';
import { SEOCard } from '@/components/products/SEOCard';
import { CustomFieldsCard } from '@/components/products/CustomFieldsCard';
import { MetaFieldsCard } from '@/components/products/MetaFieldsCard';
import { ProductAddonsCard } from '@/components/products/ProductAddonsCard';
import { BadgesCard } from '@/components/products/BadgesCard';
import { PremiumClubCard } from '@/components/products/PremiumClubCard';
import { SizeChartsCard } from '@/components/products/SizeChartsCard';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { generateSlugFromHebrew } from '@/lib/utils/hebrewSlug';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const productSlug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [hasVariants, setHasVariants] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    vendor: '' as string | null,
    price: '',
    comparePrice: '',
    cost: '',
    taxEnabled: true,
    inventoryEnabled: true,
    inventoryQty: '',
    lowStockAlert: '',
    availability: 'IN_STOCK' as 'IN_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER' | 'BACKORDER' | 'DISCONTINUED',
    availableDate: '',
    sellWhenSoldOut: false,
    priceByWeight: false,
    showPricePer100ml: false,
    pricePer100ml: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
    },
    status: 'active' as 'draft' | 'active' | 'archived',
    scheduledPublishDate: '',
    scheduledArchiveDate: '',
    notifyOnPublish: false,
    sku: '',
    video: '',
    seoTitle: '',
    seoDescription: '',
    slug: '',
    tags: [] as string[],
    categories: [] as number[],
    badges: [] as any[],
    exclusiveToTier: [] as string[],
  });

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [productAddonIds, setProductAddonIds] = useState<string[]>([]);
  const [selectedSizeChartId, setSelectedSizeChartId] = useState<number | null>(null);

  // Load product data
  useEffect(() => {
    if (productSlug && productSlug !== 'new') {
      loadProduct();
    } else {
      // New product
      setProduct({
        id: 0,
        store_id: 0, // Will be set by server from auth
        title: '',
        handle: '',
        body_html: '',
        vendor: null,
        product_type: null,
        status: 'active',
        published_at: null,
        published_scope: 'web',
        template_suffix: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as ProductWithDetails);
      setFormData({
        name: '',
        description: '',
        vendor: '',
        price: '',
        comparePrice: '',
        cost: '',
        taxEnabled: true,
        inventoryEnabled: true,
        inventoryQty: '',
        lowStockAlert: '',
        availability: 'IN_STOCK',
        availableDate: '',
        sellWhenSoldOut: false,
        priceByWeight: false,
        showPricePer100ml: false,
        pricePer100ml: '',
        weight: '',
        dimensions: { length: '', width: '', height: '' },
        status: 'active',
        scheduledPublishDate: '',
        scheduledArchiveDate: '',
        notifyOnPublish: false,
        sku: '',
        video: '',
        seoTitle: '',
        seoDescription: '',
        slug: '',
        tags: [],
        categories: [],
        badges: [],
        exclusiveToTier: [],
      });
      setLoading(false);
    }
  }, [productSlug]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      // Check if productSlug is a numeric ID or a string handle
      const isNumericId = /^\d+$/.test(productSlug);
      
      let response;
      if (isNumericId) {
        // If it's a numeric ID, use the /api/products/[id] endpoint
        response = await fetch(`/api/products/${productSlug}`, {
          credentials: 'include',
        });
      } else {
        // If it's a string handle, use the /api/products/slug/[slug] endpoint
        // Next.js already decodes the slug from params automatically
        // We need to encode it for the fetch URL
        response = await fetch(`/api/products/slug/${encodeURIComponent(productSlug)}`, {
          credentials: 'include',
        });
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'שגיאה',
            description: 'המוצר לא נמצא',
            variant: 'destructive',
          });
          router.push('/products');
          return;
        }
        throw new Error('Failed to load product');
      }
      const data = await response.json();
      setProduct(data.product);
      // hasVariants = true רק אם יש options או יותר מ-variant אחד
      setHasVariants((data.product.options?.length || 0) > 0 || (data.product.variants?.length || 0) > 1);
      
      // Helper function to format date for datetime-local input (in local timezone)
      const formatDateForInput = (dateStr: string | Date | null | undefined): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // Format in local timezone: YYYY-MM-DDTHH:MM
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Format availableDate for datetime-local input (in local timezone)
      const availableDateFormatted = formatDateForInput(data.product.availableDate);

      // טעינת נתוני המוצר לטופס
      // לפי האפיון: כל מוצר חייב לפחות variant אחד
      const firstVariant = data.product.variants?.[0] || null;
      const prod = data.product as any;
      
      // Format scheduled publish date (in local timezone)
      const scheduledPublishFormatted = formatDateForInput(prod.published_at);

      // Format scheduled archive date (in local timezone)
      const scheduledArchiveFormatted = formatDateForInput(prod.archived_at);
      
      setFormData({
        name: prod.title || '',
        description: prod.body_html || '',
        vendor: prod.vendor || '',
        price: firstVariant?.price?.toString() || prod.price?.toString() || '',
        comparePrice: firstVariant?.compare_at_price?.toString() || prod.compare_at_price?.toString() || '',
        cost: prod.cost_per_item?.toString() || '',
        taxEnabled: firstVariant?.taxable ?? prod.taxable ?? true,
        inventoryEnabled: prod.track_inventory !== false,
        inventoryQty: firstVariant?.inventory_quantity?.toString() || '0',
        lowStockAlert: prod.low_stock_alert?.toString() || '',
        availability: prod.availability || 'IN_STOCK',
        availableDate: availableDateFormatted,
        sellWhenSoldOut: prod.sell_when_sold_out || false,
        priceByWeight: prod.sold_by_weight || false,
        showPricePer100ml: prod.show_price_per_100ml || false,
        pricePer100ml: prod.price_per_100ml?.toString() || '',
        weight: prod.weight?.toString() || firstVariant?.weight?.toString() || '',
        dimensions: {
          length: prod.length?.toString() || '',
          width: prod.width?.toString() || '',
          height: prod.height?.toString() || '',
        },
        status: prod.status || 'draft',
        scheduledPublishDate: scheduledPublishFormatted,
        scheduledArchiveDate: scheduledArchiveFormatted,
        notifyOnPublish: false,
        sku: prod.sku || firstVariant?.sku || '',
        video: prod.video_url || '',
        seoTitle: prod.seo_title || '',
        seoDescription: prod.seo_description || '',
        slug: prod.handle || '',
        tags: Array.isArray(prod.tags) ? prod.tags.map((t: any) => (typeof t === 'string' ? t : t.name)) : [],
        categories: Array.isArray(prod.collections) ? prod.collections.map((c: any) => c.id).filter((id: any): id is number => typeof id === 'number') : [],
        badges: [],
        exclusiveToTier: prod.exclusive_to_tiers ? (Array.isArray(prod.exclusive_to_tiers) ? prod.exclusive_to_tiers : JSON.parse(prod.exclusive_to_tiers || '[]')) : [],
      });
    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת המוצר',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product || !formData.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'שם המוצר הוא שדה חובה',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const isNew = productSlug === 'new' || !product.id;
      const url = isNew ? '/api/products' : `/api/products/${product.id}`;
      const method = isNew ? 'POST' : 'PUT';

      // Product-level data (not variant-level)
      // Generate URL-safe slug from product name using the helper function
      const safeHandle = formData.slug 
        ? generateSlugFromHebrew(formData.slug) 
        : generateSlugFromHebrew(formData.name);
      
      const payload: any = {
        title: formData.name,
        handle: safeHandle,
        body_html: formData.description || null,
        vendor: formData.vendor || product.vendor || null,
        product_type: product.product_type || null,
        status: formData.status,
        published_at: formData.scheduledPublishDate ? new Date(formData.scheduledPublishDate).toISOString() : null,
        archived_at: formData.scheduledArchiveDate ? new Date(formData.scheduledArchiveDate).toISOString() : null,
        // Product-level fields
        track_inventory: formData.inventoryEnabled,
        low_stock_alert: formData.lowStockAlert ? parseInt(formData.lowStockAlert) : null,
        availability: formData.availability,
        available_date: formData.availableDate ? new Date(formData.availableDate).toISOString() : null,
        length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : null,
        width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : null,
        height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : null,
        video_url: formData.video || null,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        sell_when_sold_out: formData.sellWhenSoldOut,
        sold_by_weight: formData.priceByWeight,
        show_price_per_100ml: formData.showPricePer100ml,
        price_per_100ml: formData.pricePer100ml ? parseFloat(formData.pricePer100ml) : null,
        images: product.images || [],
        tags: formData.tags,
        collections: formData.categories,
        custom_fields: customFieldValues,
        addon_ids: productAddonIds,
        badges: formData.badges,
        exclusive_to_tier: formData.exclusiveToTier,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      const savedProduct = await response.json();
      const finalProduct = savedProduct.product;
      const finalProductId = finalProduct.id;
      const finalSlug = finalProduct.handle;

      // Sync options and variants אם יש וריאציות
      if (hasVariants) {
        const validOptions = (product.options || []).filter(
          (opt) => opt.name?.trim() && opt.values && opt.values.length > 0
        );
        const variantsToSync = Array.from(
          new Map(
            (product.variants || [])
              .filter((v) => v.title && v.title.trim().length > 0)
              .map((v) => [v.title, v])
          ).values()
        );

        if (validOptions.length === 0 || variantsToSync.length === 0) {
          toast({
            title: 'שגיאה',
            description: 'דרושה לפחות אפשרות אחת עם ערכים כדי לשמור וריאציות',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        await fetch(`/api/products/${finalProductId}/options/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ options: validOptions }),
        });

        await fetch(`/api/products/${finalProductId}/variants/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variants: variantsToSync }),
        });
      }

      // עבור מוצר רגיל (ללא hasVariants), עדכן את ה-variant הראשון עם כל הנתונים
      if (!hasVariants) {
        // שלוף את ה-variant הראשון ועדכן אותו ישירות
        // לפי האפיון: כל מוצר חייב לפחות variant אחד
        const variantsResponse = await fetch(`/api/products/${finalProductId}/variants`);
        if (variantsResponse.ok) {
          const variantsData = await variantsResponse.json();
          if (variantsData.variants && variantsData.variants.length > 0) {
            const firstVariant = variantsData.variants[0];
            
            // בנה אובייקט עדכון רק עם השדות שיש להם ערך (לא מאפס שדות שלא נשלחו)
            const variantUpdate: any = {};
            
            // עדכן מחיר רק אם יש ערך תקין
            if (formData.price && formData.price.trim() !== '') {
              const priceValue = parseFloat(formData.price);
              if (!isNaN(priceValue) && priceValue >= 0) {
                variantUpdate.price = priceValue;
              }
            }
            
            // עדכן מחיר השוואה רק אם יש ערך תקין
            if (formData.comparePrice && formData.comparePrice.trim() !== '') {
              const comparePriceValue = parseFloat(formData.comparePrice);
              if (!isNaN(comparePriceValue) && comparePriceValue >= 0) {
                variantUpdate.compare_at_price = comparePriceValue;
              }
            }
            
            // עדכן SKU רק אם יש ערך
            if (formData.sku !== undefined) {
              variantUpdate.sku = formData.sku || null;
            }
            
            // עדכן taxable רק אם יש ערך
            if (formData.taxEnabled !== undefined) {
              variantUpdate.taxable = formData.taxEnabled;
            }
            
            // עדכן מלאי - תמיד עדכן גם אם הערך הוא 0 או ריק
            if (formData.inventoryQty !== undefined) {
              const inventoryValue = formData.inventoryQty.trim() === '' ? 0 : parseInt(formData.inventoryQty);
              if (!isNaN(inventoryValue) && inventoryValue >= 0) {
                variantUpdate.inventory_quantity = inventoryValue;
              }
            }
            
            // עדכן משקל רק אם יש ערך תקין
            if (formData.weight && formData.weight.trim() !== '') {
              const weightValue = parseFloat(formData.weight);
              if (!isNaN(weightValue) && weightValue >= 0) {
                variantUpdate.weight = weightValue;
              }
            }
            
            // עדכן את ה-variant רק אם יש שדות לעדכן
            if (Object.keys(variantUpdate).length > 0) {
              await fetch(`/api/variants/${firstVariant.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(variantUpdate),
              });
            }
          }
        }
      }

      toast({
        title: 'הצלחה',
        description: 'המוצר נשמר בהצלחה',
      });

      // Redirect to products list
      setTimeout(() => {
        router.push('/products');
      }, 800);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשמירת המוצר',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/products');
  };

  if (loading || !product) {
    return (
      <div className="space-y-6 p-4 md:p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-64 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Skeleton - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card Skeleton */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </Card>

            {/* Images Card Skeleton */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="aspect-square bg-gray-200 rounded"></div>
                  <div className="aspect-square bg-gray-200 rounded"></div>
                  <div className="aspect-square bg-gray-200 rounded"></div>
                </div>
              </div>
            </Card>

            {/* Pricing Card Skeleton */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </Card>

            {/* Inventory Card Skeleton */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </Card>

            {/* Variants Card Skeleton */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </Card>
          </div>

          {/* Sidebar Skeleton - 1/3 */}
          <div className="space-y-6">
            {/* Status Card Skeleton */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </Card>

            {/* Categories Card Skeleton */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </Card>

            {/* Details Card Skeleton */}
            <Card>
              <div className="p-6 space-y-4">
                <div className="h-6 w-28 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {productSlug === 'new' ? 'מוצר חדש' : 'עריכת מוצר'}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {productSlug === 'new' ? 'צרו מוצר חדש' : `ערכו את פרטי המוצר ${product.title}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-4 py-2 text-sm border-gray-300"
          >
            ביטול
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm"
          >
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <BasicInfoCard
            data={{
              name: formData.name,
              description: formData.description,
            }}
            onNameChange={(name) => {
              setFormData(prev => ({ ...prev, name }));
              setProduct(prev => prev ? { ...prev, title: name } : null);
            }}
            onDescriptionChange={(description) => {
              setFormData(prev => ({ ...prev, description }));
              setProduct(prev => prev ? { ...prev, body_html: description } : null);
            }}
          />

          {/* Images */}
          <ImageGallery
            images={product.images || []}
            onImagesChange={(images) => setProduct({ ...product, images })}
            productId={product.id || 0}
            shopId={product.store_id}
          />

          {/* Pricing */}
          <PricingCard
            data={{
              price: formData.price,
              comparePrice: formData.comparePrice,
              cost: formData.cost,
              taxEnabled: formData.taxEnabled,
            }}
            onChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
            hidden={hasVariants}
          />

          {/* Inventory */}
          {/* למוצר רגיל (variant אחד בלי options) מציגים את שדה המלאי ישירות */}
          {!hasVariants && (
            <InventoryManager
              data={{
                inventoryEnabled: formData.inventoryEnabled,
                inventoryQty: formData.inventoryQty,
                lowStockAlert: formData.lowStockAlert,
                availability: formData.availability,
                availableDate: formData.availableDate,
                sellWhenSoldOut: formData.sellWhenSoldOut,
                priceByWeight: formData.priceByWeight,
                showPricePer100ml: formData.showPricePer100ml,
                pricePer100ml: formData.pricePer100ml,
              }}
              onChange={(data) => {
                setFormData(prev => ({ ...prev, ...data as any }));
                // עדכון גם את ה-variant הראשון
                // לפי האפיון: כל מוצר חייב לפחות variant אחד
                if (data.inventoryQty !== undefined && product.variants && product.variants.length > 0) {
                  const updatedVariants = [...product.variants];
                  updatedVariants[0] = {
                    ...updatedVariants[0],
                    inventory_quantity: parseInt(data.inventoryQty) || 0,
                  };
                  setProduct({ ...product, variants: updatedVariants });
                }
              }}
              variants={[]}
              hidden={false}
            />
          )}

          {/* Variants */}
          <VariantsManager
            options={product.options || []}
            variants={product.variants || []}
            hasVariants={hasVariants}
            onHasVariantsChange={setHasVariants}
            onOptionsChange={(options) => {
              setProduct({ ...product, options });
              // Update hasVariants based on options
              setHasVariants(options.length > 0);
            }}
            onVariantsChange={(variants) => {
              setProduct({ ...product, variants });
            }}
            productId={product.id || 0}
            defaultVariantId={product.defaultVariantId || null}
            onDefaultVariantChange={(variantId) => {
              setProduct({ ...product, defaultVariantId: variantId });
            }}
            shopId={product.store_id?.toString()}
            defaultPrice={formData.price}
            defaultCompareAtPrice={formData.comparePrice}
          />

          {/* Product Add-ons */}
          <ProductAddonsCard
            productId={product.id || undefined}
            shopId={product.store_id}
            categoryIds={formData.categories}
            onChange={(ids) => setProductAddonIds(ids.map(String))}
          />

          {/* Custom Fields */}
          <CustomFieldsCard
            productId={product.id || undefined}
            shopId={product.store_id}
            categoryIds={formData.categories.map(String)}
            values={customFieldValues}
            onChange={setCustomFieldValues}
          />

          {/* Meta Fields */}
          <MetaFieldsCard
            productId={product.id || undefined}
            shopId={product.store_id}
            categoryIds={formData.categories}
            values={customFieldValues}
            onChange={setCustomFieldValues}
          />

          {/* Size Charts */}
          <SizeChartsCard
            productId={product.id || undefined}
            shopId={product.store_id}
            categoryIds={formData.categories}
            selectedChartId={selectedSizeChartId}
            onChange={setSelectedSizeChartId}
          />
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Status */}
          <StatusCard
            status={formData.status}
            onChange={(status) => {
              setFormData(prev => ({ ...prev, status }));
              setProduct(prev => prev ? { ...prev, status } : null);
            }}
            scheduledPublishDate={formData.scheduledPublishDate}
            onScheduledPublishDateChange={(date) => setFormData(prev => ({ ...prev, scheduledPublishDate: date }))}
            scheduledArchiveDate={formData.scheduledArchiveDate}
            onScheduledArchiveDateChange={(date) => setFormData(prev => ({ ...prev, scheduledArchiveDate: date }))}
            notifyOnPublish={formData.notifyOnPublish}
            onNotifyOnPublishChange={(notify) => setFormData(prev => ({ ...prev, notifyOnPublish: notify }))}
          />

          {/* Premium Club */}
          {product && (
            <PremiumClubCard
              exclusiveToTier={formData.exclusiveToTier}
              onExclusiveToTierChange={(tiers) =>
                setFormData(prev => ({ ...prev, exclusiveToTier: tiers }))
              }
              shopId={product.store_id}
            />
          )}

          {/* Categories */}
          <CategoryTreeSelector
            selectedCategoryIds={formData.categories}
            onSelectionChange={(categoryIds) => setFormData(prev => ({ ...prev, categories: categoryIds }))}
            storeId={product.store_id}
            productId={product.id || undefined}
          />

          {/* Product Details */}
          <ProductDetailsCard
            data={{
              sku: formData.sku,
              video: formData.video,
              vendor: formData.vendor || product.vendor || null,
            }}
            onChange={(data) => {
              setFormData(prev => ({ ...prev, ...data }));
              if (data.vendor !== undefined) {
                setProduct(prev => prev ? { ...prev, vendor: data.vendor || null } : null);
              }
            }}
          />

          {/* Shipping */}
          <ShippingCard
            data={{
              weight: formData.weight,
              dimensions: formData.dimensions,
            }}
            onChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
          />

          {/* Tags */}
          <TagsCard
            tags={formData.tags}
            onAdd={(tag) => setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))}
            onRemove={(tag) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
            productId={product?.id}
          />

          {/* Badges */}
          <BadgesCard
            badges={formData.badges}
            onChange={(badges) => setFormData(prev => ({ ...prev, badges }))}
          />

          {/* SEO */}
          <SEOCard
            data={{
              seoTitle: formData.seoTitle,
              slug: formData.slug,
              seoDescription: formData.seoDescription,
            }}
            onChange={(data) => {
              setFormData(prev => ({ ...prev, ...data }));
              if (data.slug) {
                setProduct(prev => prev ? { ...prev, handle: data.slug! } : null);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

