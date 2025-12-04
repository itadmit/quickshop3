'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle, HiDocument } from 'react-icons/hi';
import { Page } from '@/types/content';
import { useDebounce } from '@/hooks/useDebounce';

export default function PagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
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

    loadPages(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm]);

  const loadPages = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Send search to API instead of filtering client-side
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await fetch(`/api/pages?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load pages');
      const data = await response.json();
      setPages(data.pages || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading pages:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const deletePage = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הדף הזה?')) return;
    
    try {
      const response = await fetch(`/api/pages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete page');
      await loadPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('שגיאה במחיקת דף');
    }
  };

  const columns: TableColumn<Page>[] = [
    {
      key: 'title',
      label: 'כותרת',
      render: (page) => (
        <div>
          <div className="font-medium text-gray-900">{page.title}</div>
          <div className="text-sm text-gray-500 font-mono">{page.handle}</div>
        </div>
      ),
    },
    {
      key: 'is_published',
      label: 'סטטוס',
      render: (page) => (
        <div className="flex items-center gap-2">
          {page.is_published ? (
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
      render: (page) => (
        <div className="text-sm text-gray-600">
          {new Date(page.updated_at).toLocaleDateString('he-IL')}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="דפים"
      description="נהל דפי תוכן"
      primaryAction={{
        label: 'דף חדש',
        onClick: () => router.push('/pages/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש דפים..."
      onSearch={setSearchTerm}
      columns={columns}
      data={pages}
      keyExtractor={(page) => page.id}
      selectable
      selectedItems={selectedPages}
      onSelectionChange={(selected) => setSelectedPages(selected as Set<number>)}
      rowActions={(page) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/pages/${page.id}`);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="ערוך"
          >
            <HiPencil className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deletePage(page.id);
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="מחק"
          >
            <HiTrash className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}
      onRowClick={(page) => router.push(`/pages/${page.id}`)}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiDocument className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין דפים</p>
          <button
            onClick={() => router.push('/pages/new')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            צור דף ראשון
          </button>
        </div>
      }
    />
  );
}

