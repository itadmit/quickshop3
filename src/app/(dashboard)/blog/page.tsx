'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle, HiDocumentText } from 'react-icons/hi';
import { BlogPost } from '@/types/content';
import { useDebounce } from '@/hooks/useDebounce';

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
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

    loadPosts(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm]);

  const loadPosts = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Send search to API instead of filtering client-side
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await fetch(`/api/blog/posts?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load posts');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading posts:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const deletePost = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הפוסט הזה?')) return;
    
    try {
      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete post');
      await loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('שגיאה במחיקת פוסט');
    }
  };

  const columns: TableColumn<BlogPost>[] = [
    {
      key: 'title',
      label: 'כותרת',
      render: (post) => (
        <div>
          <div className="font-medium text-gray-900">{post.title}</div>
          {post.excerpt && (
            <div className="text-sm text-gray-500 mt-1 line-clamp-1">{post.excerpt}</div>
          )}
        </div>
      ),
    },
    {
      key: 'tags',
      label: 'תגיות',
      render: (post) => (
        <div className="flex flex-wrap gap-1">
          {post.tags && post.tags.length > 0 ? (
            post.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {tag}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">אין תגיות</span>
          )}
        </div>
      ),
    },
    {
      key: 'is_published',
      label: 'סטטוס',
      render: (post) => (
        <div className="flex items-center gap-2">
          {post.is_published ? (
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
      key: 'published_at',
      label: 'תאריך פרסום',
      render: (post) => (
        <div className="text-sm text-gray-600">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString('he-IL')
            : '-'}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="בלוג"
      description="נהל פוסטי בלוג"
      primaryAction={{
        label: 'פוסט חדש',
        onClick: () => router.push('/blog/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש פוסטים..."
      onSearch={setSearchTerm}
      columns={columns}
      data={posts}
      keyExtractor={(post) => post.id}
      selectable
      selectedItems={selectedPosts}
      onSelectionChange={(selected) => setSelectedPosts(selected as Set<number>)}
      rowActions={(post) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/blog/${post.id}`);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="ערוך"
          >
            <HiPencil className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deletePost(post.id);
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="מחק"
          >
            <HiTrash className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}
      onRowClick={(post) => router.push(`/blog/${post.id}`)}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiDocumentText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין פוסטים</p>
          <button
            onClick={() => router.push('/blog/new')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            צור פוסט ראשון
          </button>
        </div>
      }
    />
  );
}

