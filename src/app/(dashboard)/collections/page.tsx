'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiPencil, HiTrash, HiFolder, HiCheckCircle, HiXCircle } from 'react-icons/hi';
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

export default function CollectionsPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
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
  }, [debouncedSearchTerm, publishedFilter]);

  const loadCollections = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (publishedFilter) params.append('published', publishedFilter);

      const response = await fetch(`/api/collections?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load collections');
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading collections:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
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

  const columns: TableColumn<Collection>[] = [
    {
      key: 'title',
      label: 'שם',
      render: (collection) => (
        <div className="font-medium text-gray-900">{collection.title}</div>
      ),
    },
    {
      key: 'handle',
      label: 'Handle',
      render: (collection) => (
        <div className="text-sm text-gray-500 font-mono">{collection.handle}</div>
      ),
    },
    {
      key: 'description',
      label: 'תיאור',
      render: (collection) => (
        <div className="text-sm text-gray-600 line-clamp-2">
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
      onChange: (value: string) => setPublishedFilter(value),
    },
  ];

  return (
    <DataTable
      title="אוספי מוצרים"
      description="נהל אוספי מוצרים וקטגוריות"
      primaryAction={{
        label: 'אוסף חדש',
        onClick: () => router.push('/collections/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש אוספים..."
      onSearch={setSearchTerm}
      filters={filters}
      columns={columns}
      data={collections}
      keyExtractor={(collection) => collection.id}
      selectable
      selectedItems={selectedCollections}
      onSelectionChange={(selected) => setSelectedCollections(selected as Set<number>)}
      rowActions={(collection) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/collections/${collection.id}`);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="ערוך"
          >
            <HiPencil className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteCollection(collection.id);
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="מחק"
          >
            <HiTrash className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}
      onRowClick={(collection) => router.push(`/collections/${collection.id}`)}
      loading={loading}
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
  );
}

