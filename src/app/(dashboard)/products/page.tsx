'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  HiPlus, 
  HiPhotograph, 
  HiPencil, 
  HiDuplicate, 
  HiTrash, 
  HiCube, 
  HiDotsVertical,
  HiEye,
  HiEyeOff,
  HiArchive,
  HiUpload,
  HiDownload,
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi';
import { ProductWithDetails, ProductOption, ProductVariant } from '@/types/product';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface Category {
  id: number;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  
  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isSearching, setIsSearching] = useState(false);
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Pagination
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // Import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testLimit, setTestLimit] = useState(3);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: number;
    errorDetails: string[];
    products: Array<{ id: string; name: string }>;
    totalRows?: number;
    limited?: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Unified effect with debounced search
  useEffect(() => {
    // Show searching indicator when user types
    if (search) {
      setIsSearching(true);
    }
    
    // Debounce search - wait 600ms after user stops typing
    const timer = setTimeout(() => {
      setIsSearching(false);
      loadProducts();
    }, search ? 600 : 0); // No delay if search is empty

    return () => clearTimeout(timer);
  }, [pagination.page, statusFilter, categoryFilter, sortBy, sortOrder, search]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories((data.collections || []).map((c: any) => ({
          id: c.id,
          name: c.title || c.name,
        })));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setIsSearching(false);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { categoryId: categoryFilter }),
        ...(search && { search }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      setProducts(data.products || []);
      
      // Update pagination if provided
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        // Estimate pagination
        setPagination(prev => ({
          ...prev,
          total: data.products?.length || 0,
          totalPages: Math.ceil((data.products?.length || 0) / prev.limit),
        }));
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת המוצרים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const selectedArray = Array.from(selectedProducts);
    if (selectedArray.length === 0) {
      toast({
        title: 'שים לב',
        description: 'לא נבחרו מוצרים למחיקה',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedArray.length} מוצרים?`)) {
      return;
    }

    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          product_ids: selectedArray,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const succeeded = data.results?.filter((r: any) => r.success).length || 0;
        const failed = data.results?.filter((r: any) => !r.success).length || 0;
        toast({
          title: 'הצלחה',
          description: `${succeeded} מוצרים נמחקו בהצלחה${failed > 0 ? `, ${failed} נכשלו` : ''}`,
        });
        setSelectedProducts(new Set());
        loadProducts();
      } else {
        toast({
          title: 'שגיאה',
          description: data.error || 'לא הצלחנו למחוק את המוצרים',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error bulk deleting products:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת המוצרים',
        variant: 'destructive',
      });
    }
  };

  const handleBulkEdit = () => {
    const selectedArray = Array.from(selectedProducts);
    if (selectedArray.length === 0) {
      toast({
        title: 'שים לב',
        description: 'לא נבחרו מוצרים לעריכה',
        variant: 'destructive',
      });
      return;
    }
    const ids = selectedArray.join(',');
    router.push(`/bulk-edit?ids=${ids}`);
  };

  const handleToggleVisibility = async (productId: number, currentStatus: string) => {
    try {
      // Toggle between active and draft
      const newStatus = currentStatus === 'active' ? 'draft' : 'active';
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: newStatus === 'active' ? 'המוצר הוצג בחנות' : 'המוצר הוסתר מהחנות',
        });
        loadProducts();
      } else {
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו לעדכן את המוצר',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון המוצר',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'המוצר הועבר לארכיון',
        });
        loadProducts();
      }
    } catch (error) {
      console.error('Error archiving product:', error);
    }
  };

  const handleViewProduct = async (product: ProductWithDetails) => {
    // Get store slug from user session
    try {
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const storeSlug = userData.store?.slug || 'shop';
        
        if (product.status !== 'active') {
          toast({
            title: 'שגיאה',
            description: 'המוצר לא פורסם - לא ניתן לצפות בו בחנות',
            variant: 'destructive',
          });
          return;
        }

        const productHandle = product.handle || product.id.toString();
        const url = `/shops/${storeSlug}/products/${productHandle}`;
        window.open(url, '_blank');
      } else {
        throw new Error('Failed to get store info');
      }
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לצפות במוצר - חנות לא זוהתה',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.CSV')) {
        toast({
          title: 'שגיאה',
          description: 'יש לבחור קובץ CSV בלבד',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור קובץ',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Add limit if test mode is enabled
      if (testMode && testLimit > 0) {
        formData.append('limit', testLimit.toString());
      }

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בייבוא מוצרים');
      }

      setImportResult(data);

      if (data.imported > 0) {
        toast({
          title: 'ייבוא הושלם',
          description: `יובאו ${data.imported} מוצרים בהצלחה${data.errors > 0 ? `, ${data.errors} שגיאות` : ''}`,
        });
        loadProducts();
      } else {
        toast({
          title: 'ייבוא נכשל',
          description: 'לא יובאו מוצרים. בדוק את השגיאות',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error importing products:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בייבוא המוצרים',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
    setImportResult(null);
    setTestMode(false);
    setTestLimit(3);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: 'פעיל', className: 'bg-green-100 text-green-800 rounded-md' },
      draft: { label: 'טיוטה', className: 'bg-gray-100 text-gray-800 rounded-md' },
      archived: { label: 'ארכיון', className: 'bg-yellow-100 text-yellow-800 rounded-md' },
    };
    const variant = variants[status] || variants.draft;
    return <span className={`px-2 py-0.5 text-xs font-medium ${variant.className}`}>{variant.label}</span>;
  };

  const columns: TableColumn<ProductWithDetails>[] = [
    {
      key: 'image',
      label: 'תמונה',
      width: '100px',
      render: (product) => (
        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].src}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <HiPhotograph className="w-8 h-8 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'title',
      label: 'שם מוצר',
      render: (product) => (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-medium text-gray-900">{product.title}</div>
          {product.status !== 'active' && getStatusBadge(product.status)}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'מחיר',
      render: (product) => {
        // לפי האפיון: כל מוצר חייב לפחות variant אחד
        // סינון variants תקינים עם מחיר גדול מ-0
        const variants = product.variants || [];
        const prices = variants
          .map((v) => parseFloat(v.price || '0'))
          .filter((p) => !isNaN(p) && p > 0);
        
        // אם אין מחירים תקינים, נסה לקחת את הראשון גם אם הוא 0
        const minPrice = prices.length > 0 ? Math.min(...prices) : parseFloat(variants[0]?.price || '0');
        const maxPrice = prices.length > 0 ? Math.max(...prices) : minPrice;
        const hasVariants = (product.options?.length || 0) > 0 || variants.length > 1;
        
        // מחיר לפני הנחה - רק אם יש וריאנט אחד
        const comparePrice = !hasVariants ? (variants[0]?.compare_at_price || null) : null;
        
        return (
          <div>
            <div className="font-medium text-gray-900">
              {hasVariants && minPrice !== maxPrice 
                ? `₪${minPrice.toFixed(2)} - ₪${maxPrice.toFixed(2)}`
                : `₪${minPrice.toFixed(2)}`
              }
            </div>
            {comparePrice && (
              <div className="text-sm text-gray-500 line-through">₪{parseFloat(comparePrice).toFixed(2)}</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'sku',
      label: 'מקט',
      render: (product) => {
        // לפי האפיון: כל מוצר חייב לפחות variant אחד
        const sku = product.variants?.[0]?.sku || null;
        return <span className="text-gray-600">{sku || '-'}</span>;
      },
    },
    {
      key: 'options',
      label: 'אפשרויות',
      render: (product) => {
        // לפי האפיון: מוצר עם variants = יש options או יותר מ-variant אחד
        const hasVariants = (product.options?.length || 0) > 0 || (product.variants?.length || 0) > 1;
        
        if (!product.options || product.options.length === 0) {
          return hasVariants ? (
            <span className="text-blue-600">{product.variants?.length || 0} אפשרויות</span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        }
        return (
          <div className="text-sm text-gray-600">
            {product.options.map((option: ProductOption, i: number) => {
              let values = '';
              
              // Helper function to extract value from any format (for backward compatibility)
              const extractValue = (v: any): string => {
                if (!v) return '';
                if (typeof v === 'string') return v;
                if (typeof v === 'number') return String(v);
                if (typeof v === 'object') {
                  return v.value || v.label || v.name || v.text || '';
                }
                return '';
              };
              
              let optionValues = option.values;
              
              // If values is a string, try to parse it as JSON (backward compatibility)
              if (typeof optionValues === 'string') {
                console.log(`  - Values is string, attempting to parse...`);
                try {
                  optionValues = JSON.parse(optionValues);
                  console.log(`  - Parsed successfully:`, JSON.stringify(optionValues, null, 2));
                } catch (e) {
                  console.log(`  - Parse failed:`, e);
                  // If parsing fails, treat as single string value
                  values = optionValues;
                  return (
                    <div key={i} className="text-xs">
                      <span className="font-medium text-gray-700">{option.name}:</span>{' '}
                      <span className="text-gray-600">{values || '-'}</span>
                    </div>
                  );
                }
              }
              
              // Handle array of values
              if (Array.isArray(optionValues)) {
                const extractedValues = optionValues
                  .map(extractValue)
                  .filter(Boolean)
                  .filter((v, idx, arr) => arr.indexOf(v) === idx); // Remove duplicates
                values = extractedValues.join(', ');
              } else if (optionValues && typeof optionValues === 'object') {
                // Single object value (backward compatibility)
                values = extractValue(optionValues);
              } else if (optionValues !== null && optionValues !== undefined) {
                // Primitive value
                values = String(optionValues);
              }
              
              return (
                <div key={i} className="text-xs">
                  <span className="font-medium text-gray-700">{option.name}:</span>{' '}
                  <span className="text-gray-600">{values || '-'}</span>
                </div>
              );
            })}
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
            {product.collections.slice(0, 2).map((collection: any) => (
              <span key={collection.id} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                {collection.title || collection.name}
              </span>
            ))}
            {product.collections.length > 2 && (
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                +{product.collections.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'stock',
      label: 'מלאי',
      render: (product) => {
        // לפי האפיון: כל מוצר חייב לפחות variant אחד
        // חישוב מלאי כולל מכל הווריאנטים
        let stock = 0;
        if (product.variants && product.variants.length > 0) {
          stock = product.variants.reduce((sum: number, v: ProductVariant) => {
            const qty = typeof v.inventory_quantity === 'number' ? v.inventory_quantity : 0;
            return sum + qty;
          }, 0);
        }
        
        return (
          <span className={stock < 10 && stock > 0 ? 'text-orange-600 font-semibold' : stock === 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
            {stock}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">מוצרים</h1>
          <p className="text-sm md:text-base text-gray-600">נהל את כל המוצרים שלך</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedProducts.size > 0 && (
            <>
              <Button
                onClick={handleBulkEdit}
                variant="default"
                className="hidden md:flex"
              >
                <HiPencil className="w-4 h-4 ml-2" />
                עריכה קבוצתית ({selectedProducts.size})
              </Button>
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                className="hidden md:flex"
              >
                <HiTrash className="w-4 h-4 ml-2" />
                מחיקה קבוצתית ({selectedProducts.size})
              </Button>
            </>
          )}
          <div className="hidden md:flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setImportDialogOpen(true)}
            >
              <HiUpload className="w-4 h-4 ml-2" />
              ייבוא
            </Button>
            <Button variant="outline" onClick={() => toast({ title: 'בפיתוח', description: 'תכונת ייצוא תהיה זמינה בקרוב' })}>
              <HiDownload className="w-4 h-4 ml-2" />
              ייצוא
            </Button>
          </div>
          <Button 
            onClick={() => router.push('/products/edit/new')}
            className="whitespace-nowrap"
          >
            <HiPlus className="w-4 h-4 ml-2" />
            <span className="hidden md:inline">מוצר חדש</span>
            <span className="md:hidden">חדש</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="חיפוש לפי שם, מקט..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="pr-10"
              />
              {isSearching && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all w-full md:w-[200px] flex-shrink-0"
            >
              <option value="all">כל הקטגוריות</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all w-full md:w-[160px] flex-shrink-0"
            >
              <option value="all">כל המוצרים</option>
              <option value="active">פעיל</option>
              <option value="draft">טיוטה</option>
              <option value="archived">ארכיון</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all w-full md:w-[180px] flex-shrink-0"
            >
              <option value="created_at-desc">תאריך (חדש לישן)</option>
              <option value="created_at-asc">תאריך (ישן לחדש)</option>
              <option value="title-asc">שם (א-ת)</option>
              <option value="title-desc">שם (ת-א)</option>
              <option value="price-asc">מחיר (נמוך לגבוה)</option>
              <option value="price-desc">מחיר (גבוה לנמוך)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <DataTable
        title=""
        description=""
        primaryAction={undefined}
        secondaryActions={undefined}
        searchPlaceholder=""
        onSearch={undefined}
        filters={undefined}
        columns={columns}
        data={products}
        keyExtractor={(product) => product.id}
        mobileColumns={[0, 1, 2, 4, 5]}
        loading={loading}
        selectable
        selectedItems={selectedProducts as Set<string | number>}
        onSelectionChange={(selected) => setSelectedProducts(selected as Set<number>)}
        onRowClick={(product) => {
          // Use product ID for navigation - more reliable than handle
          router.push(`/products/edit/${product.id}`);
        }}
        rowActions={(product) => {
          const handleEdit = (e?: React.MouseEvent) => {
            e?.stopPropagation();
            // Use product ID for navigation - more reliable than handle
            router.push(`/products/edit/${product.id}`);
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
              if (data.product?.id) {
                setTimeout(() => {
                  router.push(`/products/edit/${data.product.id}`);
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
                      label: 'צפייה בחנות',
                      icon: <HiEye className="w-4 h-4" />,
                      onClick: () => handleViewProduct(product),
                    },
                    {
                      label: 'שכפל',
                      icon: <HiDuplicate className="w-4 h-4" />,
                      onClick: handleDuplicate,
                    },
                    {
                      label: product.status === 'active' ? 'הסתר מהחנות' : 'הצג בחנות',
                      icon: product.status === 'active' ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />,
                      onClick: () => handleToggleVisibility(product.id, product.status),
                    },
                    {
                      label: 'העבר לארכיון',
                      icon: <HiArchive className="w-4 h-4" />,
                      onClick: () => handleArchive(product.id),
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
              
              {/* Mobile: Action buttons */}
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            מציג {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} מתוך {pagination.total} מוצרים
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              <HiChevronRight className="w-4 h-4" />
              קודם
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
            >
              הבא
              <HiChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {importDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" dir="rtl">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">ייבוא מוצרים מקובץ CSV</h2>
              <p className="text-gray-600 mb-4">
                העלה קובץ CSV עם פרטי המוצרים. השדות החובה הם: name, price
              </p>

              <div className="space-y-4 py-4">
                {!importResult && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-file-input"
                      />
                      <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <HiUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-2">
                          {selectedFile ? selectedFile.name : 'לחץ לבחירת קובץ CSV'}
                        </p>
                        <Button variant="outline" type="button">
                          <HiUpload className="w-4 h-4 ml-2" />
                          בחר קובץ
                        </Button>
                      </div>
                    </div>

                    {selectedFile && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <HiCube className="w-5 h-5 text-gray-600" />
                        <span className="flex-1 text-sm text-gray-700">{selectedFile.name}</span>
                        <span className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </span>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <HiTrash className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    )}

                    {/* Test Mode Option */}
                    {selectedFile && (
                      <Card className="bg-yellow-50 border-yellow-200">
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="test-mode"
                              checked={testMode}
                              onChange={(e) => {
                                setTestMode(e.target.checked);
                                if (!e.target.checked) {
                                  setTestLimit(3);
                                }
                              }}
                              className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                            />
                            <label htmlFor="test-mode" className="text-sm font-semibold text-yellow-900 cursor-pointer">
                              מצב בדיקה - ייבא רק מספר מוצרים מוגבל
                            </label>
                          </div>
                          {testMode && (
                            <div className="mr-6 space-y-2">
                              <label htmlFor="test-limit" className="block text-sm text-yellow-800">
                                מספר מוצרים לייבא (ברירת מחדל: 3):
                              </label>
                              <input
                                type="number"
                                id="test-limit"
                                min="1"
                                max="100"
                                value={testLimit}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 3;
                                  setTestLimit(Math.max(1, Math.min(100, value)));
                                }}
                                className="w-24 px-3 py-1.5 text-sm border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                              />
                              <p className="text-xs text-yellow-700 mt-1">
                                זה יעצור אחרי {testLimit} מוצרים כדי לבדוק שהכל עובד נכון
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    <Card className="bg-blue-50 border-blue-200">
                      <div className="p-4">
                        <p className="text-sm text-blue-800 font-semibold mb-2">פורמט הקובץ:</p>
                        <p className="text-sm text-blue-800 mb-1">השדות החובה: <strong>name, price</strong></p>
                        <p className="text-sm text-blue-800 mb-1">שדות אופציונליים: description, sku, comparePrice, inventoryQty, status</p>
                        <p className="text-sm text-blue-800 mt-2">
                          <strong>תמיכה בפורמט הישן:</strong> כל השדות בעברית נתמכים (שם מוצר, מחיר רגיל, מקט, וכו')
                        </p>
                      </div>
                    </Card>
                  </div>
                )}

                {importResult && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="font-semibold text-green-700">
                            יובאו {importResult.imported} מוצרים בהצלחה
                            {importResult.limited && importResult.totalRows && (
                              <span className="text-yellow-700 mr-2">
                                {' '}(מתוך {importResult.totalRows} בקובץ - מצב בדיקה)
                              </span>
                            )}
                          </span>
                        </div>
                        {importResult.errors > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✗</span>
                            </div>
                            <span className="font-semibold text-red-700">
                              {importResult.errors} שגיאות
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                      <Card className="border-red-200">
                        <div className="p-4">
                          <h3 className="text-red-700 text-base font-semibold mb-2">פרטי שגיאות:</h3>
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {importResult.errorDetails.map((error, index) => (
                              <div key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                                {error}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}

                    {importResult.products && importResult.products.length > 0 && (
                      <Card>
                        <div className="p-4">
                          <h3 className="text-base font-semibold mb-2">מוצרים שיובאו:</h3>
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {importResult.products.map((product: any) => (
                              <div key={product.id} className="text-sm p-2 bg-green-50 rounded">
                                {product.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                {!importResult ? (
                  <>
                    <Button variant="outline" onClick={handleCloseImportDialog}>
                      ביטול
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!selectedFile || importing}
                    >
                      {importing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                          מייבא...
                        </>
                      ) : (
                        <>
                          <HiUpload className="w-4 h-4 ml-2" />
                          ייבא מוצרים
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleCloseImportDialog}>
                    סגור
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
