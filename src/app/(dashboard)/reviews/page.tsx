'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiStar, HiCheckCircle, HiXCircle } from 'react-icons/hi';

interface Review {
  id: number;
  product_id: number;
  product_title: string;
  customer_id: number | null;
  rating: number;
  title: string | null;
  body: string;
  is_approved: boolean;
  created_at: Date;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviews, setSelectedReviews] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReviews();
  }, [searchTerm]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error('Failed to load reviews');
      const data = await response.json();
      
      // Fetch product titles for each review
      const reviewsWithTitles = await Promise.all(
        (data.reviews || []).map(async (review: any) => {
          if (review.product_id) {
            try {
              const productRes = await fetch(`/api/products/${review.product_id}`);
              if (productRes.ok) {
                const productData = await productRes.json();
                return {
                  ...review,
                  product_title: productData.product?.title || 'מוצר לא נמצא',
                  body: review.review_text || review.title || '',
                };
              }
            } catch (e) {
              // Ignore errors
            }
          }
          return {
            ...review,
            product_title: 'מוצר לא נמצא',
            body: review.review_text || review.title || '',
          };
        })
      );
      
      setReviews(reviewsWithTitles);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<Review>[] = [
    {
      key: 'product',
      label: 'מוצר',
      render: (review) => (
        <div className="font-medium text-gray-900">{review.product_title}</div>
      ),
    },
    {
      key: 'rating',
      label: 'דירוג',
      render: (review) => (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <HiStar
              key={star}
              className={`w-5 h-5 ${
                star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'body',
      label: 'תגובה',
      render: (review) => (
        <div className="text-sm text-gray-600 line-clamp-2">{review.body}</div>
      ),
    },
    {
      key: 'is_approved',
      label: 'סטטוס',
      render: (review) => (
        <div className="flex items-center gap-2">
          {review.is_approved ? (
            <>
              <HiCheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">מאושר</span>
            </>
          ) : (
            <>
              <HiXCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">ממתין לאישור</span>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="ביקורות"
      description="נהל ביקורות מוצרים"
      searchPlaceholder="חיפוש ביקורות..."
      onSearch={setSearchTerm}
      columns={columns}
      data={reviews}
      keyExtractor={(review) => review.id}
      selectable
      selectedItems={selectedReviews}
      onSelectionChange={(selected) => setSelectedReviews(selected as Set<number>)}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiStar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">אין ביקורות</p>
        </div>
      }
    />
  );
}

