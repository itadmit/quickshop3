'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { HiPlus, HiPhotograph, HiPencil, HiDuplicate, HiTrash, HiCube, HiDotsVertical } from 'react-icons/hi';
import { ProductWithDetails, ProductOption, ProductVariant } from '@/types/product';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

export default function ProductsPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<ProductWithDetails>[] = [
    {
      key: 'image',
      label: 'תמונה',
      width: '100px',
      render: (product) => (
        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
          <HiPhotograph className="w-8 h-8 text-gray-400" />
        </div>
      ),
    },
    {
      key: 'title',
      label: 'שם מוצר',
      render: (product) => (
        <div className="font-medium text-gray-900">{product.title}</div>
      ),
    },
    {
      key: 'price',
      label: 'מחיר',
      render: (product) => {
        const price = product.variants && product.variants.length > 0
          ? product.variants[0].price
          : '0.00';
        return `₪${parseFloat(price).toFixed(2)}`;
      },
    },
    {
      key: 'sku',
      label: 'מקט',
      render: (product) => {
        const sku = product.variants && product.variants.length > 0
          ? product.variants[0].sku
          : '-';
        return <span className="text-gray-600">{sku || '-'}</span>;
      },
    },
    {
      key: 'options',
      label: 'אפשרויות',
      render: (product) => {
        if (!product.options || product.options.length === 0) return '-';
        return (
          <div className="text-sm text-gray-600">
            {product.options.map((option: ProductOption, i: number) => (
              <div key={i}>{option.name}</div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'collections',
      label: 'קטגוריות',
      render: (product) => {
        if (!product.collections || product.collections.length === 0) return '-';
        return (
          <div className="flex flex-wrap gap-1">
            {product.collections.map((collection: any) => (
              <span key={collection.id} className="px-2 py-0.5 bg-gray-100 rounded text-xs md:text-sm">
                {collection.title}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'stock',
      label: 'מלאי',
      render: (product) => {
        const stock = product.variants && product.variants.length > 0
          ? product.variants.reduce((sum: number, v: ProductVariant) => sum + (v.inventory_quantity || 0), 0)
          : 0;
        return (
          <span className={stock < 10 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
            {stock}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      title="מוצרים"
      description="נהל את כל המוצרים שלך"
      
      primaryAction={{
        label: 'מוצר חדש',
        onClick: () => router.push('/products/edit/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      
      onRowClick={(product) => {
        const slug = product.handle || product.id.toString();
        router.push(`/products/edit/${slug}`);
      }}
      
      secondaryActions={[
        { label: 'ייבוא', onClick: () => console.log('Import') },
        { label: 'ייצוא', onClick: () => console.log('Export') },
      ]}
      
      searchPlaceholder="חיפוש לפי שם, מקט..."
      onSearch={(value) => console.log('Search:', value)}
      
      filters={[
        {
          type: 'select',
          label: 'סטטוס',
          options: [
            { value: 'all', label: 'כל המוצרים' },
            { value: 'active', label: 'פעילים' },
            { value: 'draft', label: 'טיוטה' },
            { value: 'archived', label: 'ארכיון' },
          ],
          onChange: (value) => console.log('Filter status:', value),
        },
        {
          type: 'select',
          label: 'קטגוריה',
          options: [
            { value: 'all', label: 'כל הקטגוריות' },
          ],
          onChange: (value) => console.log('Filter category:', value),
        },
        {
          type: 'select',
          label: 'מיון',
          options: [
            { value: 'date_desc', label: 'תאריך (חדש לישן)' },
            { value: 'date_asc', label: 'תאריך (ישן לחדש)' },
            { value: 'name_asc', label: 'שם (א-ת)' },
            { value: 'name_desc', label: 'שם (ת-א)' },
          ],
          onChange: (value) => console.log('Sort by:', value),
        },
      ]}
      
      columns={columns}
      data={products}
      keyExtractor={(product) => product.id}
      
      // Mobile: Show image, title, price, collections, stock
      mobileColumns={[0, 1, 2, 4, 5]}  // תמונה, שם, מחיר, קטגוריות, מלאי
      
      loading={loading}
      
      selectable
      selectedItems={selectedProducts as Set<string | number>}
      onSelectionChange={(selected) => setSelectedProducts(selected as Set<number>)}
      
      rowActions={(product) => {
        const handleEdit = (e?: React.MouseEvent) => {
          e?.stopPropagation();
          const slug = product.handle || product.id.toString();
          router.push(`/products/edit/${slug}`);
        };

        const handleDuplicate = async (e?: React.MouseEvent) => {
          e?.stopPropagation();
          try {
            const response = await fetch(`/api/products/${product.id}/duplicate`, {
              method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to duplicate product');
            const data = await response.json();
            toast({
              title: 'הצלחה',
              description: `המוצר "${data.product?.title || product.title}" שוכפל בהצלחה`,
            });
            loadProducts();
            // Redirect to edit the duplicated product
            if (data.product?.handle) {
              setTimeout(() => {
                router.push(`/products/edit/${data.product.handle}`);
              }, 1000);
            }
          } catch (error: any) {
            toast({
              title: 'שגיאה',
              description: error.message || 'אירעה שגיאה בשכפול המוצר',
              variant: 'destructive',
            });
          }
        };

        const handleDelete = async (e?: React.MouseEvent) => {
          e?.stopPropagation();
          if (!confirm('האם אתה בטוח שברצונך למחוק את המוצר?')) return;
          
          try {
            const response = await fetch(`/api/products/${product.id}`, {
              method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete product');
            toast({
              title: 'הצלחה',
              description: 'המוצר נמחק בהצלחה',
            });
            loadProducts();
          } catch (error: any) {
            toast({
              title: 'שגיאה',
              description: error.message || 'אירעה שגיאה במחיקת המוצר',
              variant: 'destructive',
            });
          }
        };

        return (
          <>
            {/* Desktop: Dropdown Menu */}
            <div className="hidden md:block" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu
                trigger={
                  <button 
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    <HiDotsVertical className="w-5 h-5 text-gray-600" />
                  </button>
                }
                items={[
                  {
                    label: 'ערוך',
                    icon: <HiPencil className="w-4 h-4" />,
                    onClick: handleEdit,
                  },
                  {
                    label: 'שכפל',
                    icon: <HiDuplicate className="w-4 h-4" />,
                    onClick: handleDuplicate,
                  },
                  {
                    label: 'מחק',
                    icon: <HiTrash className="w-4 h-4" />,
                    onClick: handleDelete,
                    variant: 'destructive',
                  },
                ]}
                align="end"
              />
            </div>
            
            {/* Mobile: Action buttons in a single row */}
            <div className="md:hidden flex w-full gap-2" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <HiPencil className="w-4 h-4 flex-shrink-0" />
                <span>ערוך</span>
              </button>
              <button 
                onClick={handleDuplicate}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <HiDuplicate className="w-4 h-4 flex-shrink-0" />
                <span>שכפל</span>
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
              >
                <HiTrash className="w-4 h-4 flex-shrink-0" />
                <span>מחק</span>
              </button>
            </div>
          </>
        );
      }}
    />
  );
}
