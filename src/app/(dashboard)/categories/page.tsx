'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiPencil, HiTrash, HiFolder, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';

interface Collection {
  id: number;
  title: string;
  handle: string;
  description: string | null;
  image_url: string | null;
  published_at: Date | null;
  parent_id: number | null;
  parent_title: string | null;
  is_published: boolean;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
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
  }, [debouncedSearchTerm]);

  const loadCollections = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Send search to API instead of filtering client-side
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await fetch(`/api/categories?${params.toString()}`, {
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

  const columns: TableColumn<Collection>[] = [
    {
      key: 'title',
      label: 'שם',
      render: (collection) => (
        <div className="flex items-center gap-2">
          {collection.parent_id && (
            <span className="text-gray-400 text-xs">└─</span>
          )}
          <div className="font-medium text-gray-900">{collection.title}</div>
          {collection.parent_title && (
            <span className="text-xs text-gray-400">
              ({collection.parent_title})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'handle',
      label: 'סלאג',
      render: (collection) => (
        <div className="text-sm text-gray-500 font-mono">{collection.handle}</div>
      ),
    },
    {
      key: 'is_published',
      label: 'סטטוס',
      render: (collection) => (
        <div className="flex items-center gap-2">
          {collection.is_published ? (
            <>
              <HiCheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">פורסם</span>
            </>
          ) : (
            <>
              <HiXCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">לא פורסם</span>
            </>
          )}
        </div>
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
  ];

  return (
    <DataTable
      title="קטגוריות"
      description="נהל קטגוריות ואוספי מוצרים"
      primaryAction={{
        label: 'קטגוריה חדשה',
        onClick: () => router.push('/categories/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש קטגוריות..."
      onSearch={setSearchTerm}
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
              router.push(`/categories/${collection.id}`);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="ערוך"
          >
            <HiPencil className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}
      onRowClick={(collection) => router.push(`/categories/${collection.id}`)}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiFolder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין קטגוריות</p>
          <button
            onClick={() => router.push('/categories/new')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            צור קטגוריה ראשונה
          </button>
        </div>
      }
    />
  );
}

