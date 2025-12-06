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
import { CategoriesCard } from '@/components/products/CategoriesCard';
import { TagsCard } from '@/components/products/TagsCard';
import { SEOCard } from '@/components/products/SEOCard';
import { CustomFieldsCard } from '@/components/products/CustomFieldsCard';
import { MetaFieldsCard } from '@/components/products/MetaFieldsCard';
import { ProductAddonsCard } from '@/components/products/ProductAddonsCard';
import { BadgesCard } from '@/components/products/BadgesCard';
import { PremiumClubCard } from '@/components/products/PremiumClubCard';
import { SizeChartsCard } from '@/components/products/SizeChartsCard';

export default function EditProductPage() {
  const params = useParams<{ handle?: string }>();
  const router = useRouter();
  const productId = params.handle as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [hasVariants, setHasVariants] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
    status: 'draft' as 'draft' | 'active' | 'archived',
    scheduledPublishDate: '',
    notifyOnPublish: false,
    sku: '',
    video: '',
    seoTitle: '',
    seoDescription: '',
    slug: '',
    tags: [] as string[],
    categories: [] as string[],
    badges: [] as any[],
    exclusiveToTier: [] as string[],
  });

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [productAddonIds, setProductAddonIds] = useState<string[]>([]);
  const [selectedSizeChartId, setSelectedSizeChartId] = useState<number | null>(null);

  // Load product data
  useEffect(() => {
    if (productId && productId !== 'new') {
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
        status: 'draft',
        published_at: null,
        published_scope: 'web',
        template_suffix: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as ProductWithDetails);
      setFormData({
        name: '',
        description: '',
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
        status: 'draft',
        scheduledPublishDate: '',
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
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to load product');
      const data = await response.json();
      setProduct(data.product);
      setHasVariants((data.product.options?.length || 0) > 0 || (data.product.variants?.length || 0) > 1);
      
      // Format availableDate for datetime-local input
      let availableDateFormatted = '';
      if (data.product.availableDate) {
        const date = new Date(data.product.availableDate);
        availableDateFormatted = date.toISOString().slice(0, 16);
      }

      setFormData({
        name: data.product.title || '',
        description: data.product.body_html || '',
        price: data.product.price?.toString() || '',
        comparePrice: data.product.compare_at_price?.toString() || '',
        cost: data.product.cost_per_item?.toString() || '',
        taxEnabled: data.product.taxable ?? true,
        inventoryEnabled: data.product.track_inventory ?? true,
        inventoryQty: data.product.inventory_quantity?.toString() || '',
        lowStockAlert: data.product.low_stock_alert?.toString() || '',
        availability: data.product.availability || 'IN_STOCK',
        availableDate: availableDateFormatted,
        sellWhenSoldOut: data.product.sellWhenSoldOut ?? false,
        priceByWeight: data.product.priceByWeight ?? false,
        showPricePer100ml: data.product.showPricePer100ml ?? false,
        pricePer100ml: data.product.pricePer100ml?.toString() || '',
        weight: data.product.weight?.toString() || '',
        dimensions: {
          length: data.product.length?.toString() || '',
          width: data.product.width?.toString() || '',
          height: data.product.height?.toString() || '',
        },
        status: data.product.status || 'draft',
        scheduledPublishDate: data.product.scheduledPublishDate ? new Date(data.product.scheduledPublishDate).toISOString().slice(0, 16) : '',
        notifyOnPublish: data.product.notifyOnPublish || false,
        sku: data.product.sku || '',
        video: data.product.video_url || '',
        seoTitle: data.product.seo_title || '',
        seoDescription: data.product.seo_description || '',
        slug: data.product.handle || '',
        tags: Array.isArray(data.product.tags) ? data.product.tags.map((t: any) => (typeof t === 'string' ? t : t.name)) : [],
        categories: data.product.collections?.map((c: any) => c.collection_id?.toString()) || [],
        badges: Array.isArray(data.product.badges) ? data.product.badges : [],
        exclusiveToTier: Array.isArray(data.product.exclusiveToTier) ? data.product.exclusiveToTier : [],
      });
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product || !formData.name.trim()) {
      alert('שם המוצר הוא שדה חובה');
      return;
    }

    try {
      setSaving(true);
      const url = productId === 'new' ? '/api/products' : `/api/products/${productId}`;
      const method = productId === 'new' ? 'POST' : 'PUT';

      const payload: any = {
        title: formData.name,
        handle: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        body_html: formData.description || null,
        vendor: product.vendor || null,
        product_type: product.product_type || null,
        status: formData.status,
        published_at: formData.scheduledPublishDate ? new Date(formData.scheduledPublishDate).toISOString() : null,
        price: hasVariants ? 0 : parseFloat(formData.price) || 0,
        compare_at_price: hasVariants ? null : (formData.comparePrice ? parseFloat(formData.comparePrice) : null),
        cost_per_item: hasVariants ? null : (formData.cost ? parseFloat(formData.cost) : null),
        taxable: formData.taxEnabled,
        track_inventory: formData.inventoryEnabled,
        inventory_quantity: hasVariants ? 0 : (parseInt(formData.inventoryQty) || 0),
        low_stock_alert: formData.lowStockAlert ? parseInt(formData.lowStockAlert) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : null,
        width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : null,
        height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : null,
        sku: formData.sku || null,
        video_url: formData.video || null,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        images: product.images || [],
        tags: formData.tags,
        collections: formData.categories.map(id => parseInt(id)),
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
      const finalProductId = savedProduct.product?.id || parseInt(productId);

      // Sync options and variants if they exist
      if (hasVariants && product.options && product.options.length > 0) {
        await fetch(`/api/products/${finalProductId}/options/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ options: product.options }),
        });
      }

      if (hasVariants && product.variants && product.variants.length > 0) {
        await fetch(`/api/products/${finalProductId}/variants/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variants: product.variants }),
        });
      }

      router.push('/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(error.message || 'שגיאה בשמירת המוצר');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/products');
  };

  if (loading || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">טוען...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {productId === 'new' ? 'מוצר חדש' : 'עריכת מוצר'}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {productId === 'new' ? 'צרו מוצר חדש' : `ערכו את פרטי המוצר ${product.title}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="px-3 py-2 text-sm"
          >
            ביטול
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-2 text-sm"
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
            onChange={(data) => setFormData(prev => ({ ...prev, ...data as any }))}
            variants={product.variants || []}
            hidden={hasVariants}
          />

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
          />

          {/* Product Add-ons */}
          <ProductAddonsCard
            productId={product.id || undefined}
            shopId={product.store_id}
            categoryIds={formData.categories}
            onChange={setProductAddonIds}
          />

          {/* Custom Fields */}
          <CustomFieldsCard
            productId={product.id || undefined}
            shopId={product.store_id}
            categoryIds={formData.categories}
            values={customFieldValues}
            onChange={setCustomFieldValues}
          />

          {/* Meta Fields */}
          <MetaFieldsCard
            productId={product.id || undefined}
            shopId={product.store_id}
            values={customFieldValues}
            onChange={setCustomFieldValues}
          />

          {/* Size Charts */}
          <SizeChartsCard
            productId={product.id || undefined}
            shopId={product.store_id}
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
          <CategoriesCard
            selectedCategories={formData.categories}
            onChange={(categories) => setFormData(prev => ({ ...prev, categories }))}
            shopId={product.store_id}
            productId={product.id || undefined}
          />

          {/* Product Details */}
          <ProductDetailsCard
            data={{
              sku: formData.sku,
              video: formData.video,
            }}
            onChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
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

