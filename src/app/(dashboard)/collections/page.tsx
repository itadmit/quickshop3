'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiFolder, 
  HiCheckCircle, 
  HiXCircle,
  HiDotsVertical,
  HiExternalLink,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface Collection {
  id: number;
  title: string;
  handle: string;
  description: string | null;
  image_url: string | null;
  published_at: Date | null;
  published_scope: string;
  sort_order: string;
  created_at: Date;
  updated_at: Date;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CollectionsPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Pagination
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    // Load store info for preview links
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user?.store?.slug) {
          setStoreSlug(data.user.store.slug);
        }
      })
      .catch(() => {});

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    loadCollections(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm, publishedFilter, pagination.page]);

  const loadCollections = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (publishedFilter) params.append('published', publishedFilter);
      params.append('limit', pagination.limit.toString());
      params.append('page', pagination.page.toString());

      const response = await fetch(`/api/collections?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load collections');
      const data = await response.json();
      setCollections(data.collections || []);
      
      // Update pagination if provided
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading collections:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת האוספים',
        variant: 'destructive',
      });
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedArray = Array.from(selectedCollections);
    if (selectedArray.length === 0) {
      toast({
        title: 'שים לב',
        description: 'לא נבחרו אוספים למחיקה',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedArray.length} אוספים?`)) {
      return;
    }

    try {
      for (const collectionId of selectedArray) {
        const response = await fetch(`/api/collections/${collectionId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to delete collection');
      }
      toast({
        title: 'הצלחה',
        description: `${selectedArray.length} אוספים נמחקו בהצלחה`,
      });
      setSelectedCollections(new Set());
      loadCollections();
    } catch (error: any) {
      console.error('Error deleting collections:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת האוספים',
        variant: 'destructive',
      });
    }
  };

  const deleteCollection = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את האוסף הזה?')) return;
    
    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete collection');
      toast({
        title: 'הצלחה',
        description: 'אוסף נמחק בהצלחה',
      });
      await loadCollections();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה במחיקת אוסף',
        variant: 'destructive',
      });
    }
  };

  const handleViewInStorefront = (handle: string) => {
    if (!storeSlug) {
      toast({
        title: 'שגיאה',
        description: 'לא נמצא slug של החנות',
        variant: 'destructive',
      });
      return;
    }
    window.open(`/${storeSlug}/collections/${handle}`, '_blank');
  };

  const columns: TableColumn<Collection>[] = [
    {
      key: 'title',
      label: 'שם',
      render: (collection) => (
        <div>
          <div className="font-medium text-gray-900">{collection.title}</div>
          <div className="text-sm text-gray-500 font-mono">{collection.handle}</div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'תיאור',
      render: (collection) => (
        <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">
          {collection.description || '-'}
        </div>
      ),
    },
    {
      key: 'published_at',
      label: 'סטטוס',
      render: (collection) => (
        <div className="flex items-center gap-2">
          {collection.published_at ? (
            <>
              <HiCheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">פורסם</span>
            </>
          ) : (
            <>
              <HiXCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">טיוטה</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'updated_at',
      label: 'עודכן לאחרונה',
      render: (collection) => (
        <div className="text-sm text-gray-600">
          {new Date(collection.updated_at).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      ),
    },
  ];

  const filters = [
    {
      type: 'select' as const,
      label: 'פרסום',
      options: [
        { value: '', label: 'הכל' },
        { value: 'true', label: 'פורסם' },
        { value: 'false', label: 'טיוטה' },
      ],
      value: publishedFilter,
      onChange: (value: string) => {
        setPublishedFilter(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">אוספי מוצרים</h1>
          <p className="text-sm md:text-base text-gray-600">נהל אוספי מוצרים וקטגוריות</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedCollections.size > 0 && (
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              className="hidden md:flex"
            >
              <HiTrash className="w-4 h-4 ml-2" />
              מחק {selectedCollections.size} נבחרו
            </Button>
          )}
          <Button 
            onClick={() => router.push('/collections/new')}
            className="whitespace-nowrap"
          >
            <HiPlus className="w-4 h-4 ml-2" />
            <span className="hidden md:inline">אוסף חדש</span>
            <span className="md:hidden">חדש</span>
          </Button>
        </div>
      </div>

      {/* Collections Table */}
      <DataTable
        title=""
        description=""
        primaryAction={undefined}
        secondaryActions={undefined}
        searchPlaceholder="חיפוש אוספים..."
        onSearch={(value) => {
          setSearchTerm(value);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        filters={filters}
        columns={columns}
        data={collections}
        keyExtractor={(collection) => collection.id}
        loading={loading}
        selectable
        selectedItems={selectedCollections as Set<string | number>}
        onSelectionChange={(selected) => setSelectedCollections(selected as Set<number>)}
        onRowClick={(collection) => router.push(`/collections/${collection.id}`)}
        rowActions={(collection) => {
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
                    ...(collection.published_at && storeSlug ? [{
                      label: 'צפה בחנות',
                      icon: <HiExternalLink className="w-4 h-4" />,
                      onClick: () => handleViewInStorefront(collection.handle),
                    }] : []),
                    {
                      label: 'ערוך',
                      icon: <HiPencil className="w-4 h-4" />,
                      onClick: () => router.push(`/collections/${collection.id}`),
                    },
                    {
                      label: 'מחק',
                      icon: <HiTrash className="w-4 h-4" />,
                      onClick: () => deleteCollection(collection.id),
                      variant: 'destructive' as const,
                    },
                  ]}
                  align="end"
                />
              </div>
              
              {/* Mobile: Action buttons */}
              <div className="md:hidden flex w-full gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => router.push(`/collections/${collection.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <HiPencil className="w-4 h-4 flex-shrink-0" />
                  <span>ערוך</span>
                </button>
                {collection.published_at && storeSlug && (
                  <button 
                    onClick={() => handleViewInStorefront(collection.handle)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <HiExternalLink className="w-4 h-4 flex-shrink-0" />
                    <span>צפה</span>
                  </button>
                )}
                <button 
                  onClick={() => deleteCollection(collection.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <HiTrash className="w-4 h-4 flex-shrink-0" />
                  <span>מחק</span>
                </button>
              </div>
            </>
          );
        }}
        emptyState={
          <div className="text-center py-12">
            <HiFolder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין אוספים</p>
            <button
              onClick={() => router.push('/collections/new')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              צור אוסף ראשון
            </button>
          </div>
        }
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            מציג {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} מתוך {pagination.total} אוספים
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
    </div>
  );
}
