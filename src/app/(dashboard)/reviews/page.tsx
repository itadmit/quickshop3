'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { HiStar, HiCheckCircle, HiXCircle, HiPlus, HiDotsVertical, HiPencil, HiTrash, HiCheck, HiX } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface Review {
  id: number;
  product_id: number;
  product_title: string;
  customer_id: number | null;
  rating: number;
  title: string | null;
  review_text: string;
  reviewer_name: string | null;
  reviewer_email: string | null;
  is_approved: boolean;
  is_published: boolean;
  is_verified_purchase: boolean;
  created_at: Date;
}

interface Product {
  id: number;
  title: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviews, setSelectedReviews] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useOptimisticToast();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    rating: 5,
    title: '',
    review_text: '',
    reviewer_name: '',
    reviewer_email: '',
    is_verified_purchase: false,
    is_approved: true,
    is_published: true,
  });

  useEffect(() => {
    loadReviews();
    loadProducts();
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
                };
              }
            } catch (e) {
              // Ignore errors
            }
          }
          return {
            ...review,
            product_title: 'מוצר לא נמצא',
          };
        })
      );
      
      setReviews(reviewsWithTitles);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת הביקורות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const openCreateModal = () => {
    setEditingReview(null);
    setFormData({
      product_id: '',
      rating: 5,
      title: '',
      review_text: '',
      reviewer_name: '',
      reviewer_email: '',
      is_verified_purchase: false,
      is_approved: true,
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (review: Review) => {
    setEditingReview(review);
    setFormData({
      product_id: String(review.product_id),
      rating: review.rating,
      title: review.title || '',
      review_text: review.review_text || '',
      reviewer_name: review.reviewer_name || '',
      reviewer_email: review.reviewer_email || '',
      is_verified_purchase: review.is_verified_purchase || false,
      is_approved: review.is_approved,
      is_published: review.is_published ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.product_id) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור מוצר',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.review_text.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין תוכן ביקורת',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        product_id: parseInt(formData.product_id),
        rating: formData.rating,
        title: formData.title || null,
        review_text: formData.review_text,
        reviewer_name: formData.reviewer_name || null,
        reviewer_email: formData.reviewer_email || null,
        is_verified_purchase: formData.is_verified_purchase,
        is_approved: formData.is_approved,
        is_published: formData.is_published,
      };

      if (editingReview) {
        // Update
        const response = await fetch(`/api/reviews/${editingReview.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to update review');

        toast({
          title: 'הצלחה',
          description: 'הביקורת עודכנה בהצלחה',
        });
      } else {
        // Create
        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to create review');

        toast({
          title: 'הצלחה',
          description: 'הביקורת נוספה בהצלחה',
        });
      }

      setIsModalOpen(false);
      loadReviews();
    } catch (error) {
      console.error('Error saving review:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בשמירת הביקורת',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הביקורת?')) return;

    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete review');

      toast({
        title: 'הצלחה',
        description: 'הביקורת נמחקה בהצלחה',
      });
      
      loadReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה במחיקת הביקורת',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (review: Review, approved: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: approved }),
      });

      if (!response.ok) throw new Error('Failed to update review');

      toast({
        title: 'הצלחה',
        description: approved ? 'הביקורת אושרה' : 'הביקורת נדחתה',
      });
      
      loadReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון הביקורת',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: 'approve' | 'unapprove' | 'delete') => {
    if (selectedReviews.size === 0) return;

    const confirmed = action === 'delete' 
      ? confirm(`האם אתה בטוח שברצונך למחוק ${selectedReviews.size} ביקורות?`)
      : true;
    
    if (!confirmed) return;

    try {
      for (const id of selectedReviews) {
        if (action === 'delete') {
          await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
        } else {
          await fetch(`/api/reviews/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_approved: action === 'approve' }),
          });
        }
      }

      toast({
        title: 'הצלחה',
        description: action === 'delete' 
          ? `${selectedReviews.size} ביקורות נמחקו`
          : action === 'approve'
          ? `${selectedReviews.size} ביקורות אושרו`
          : `${selectedReviews.size} ביקורות נדחו`,
      });

      setSelectedReviews(new Set());
      loadReviews();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה בביצוע הפעולה',
        variant: 'destructive',
      });
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
      key: 'reviewer',
      label: 'כותב הביקורת',
      render: (review) => (
        <div>
          <div className="font-medium text-gray-900">{review.reviewer_name || 'אנונימי'}</div>
          {review.reviewer_email && (
            <div className="text-xs text-gray-500">{review.reviewer_email}</div>
          )}
        </div>
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
      key: 'content',
      label: 'תוכן',
      render: (review) => (
        <div>
          {review.title && (
            <div className="font-medium text-gray-900 mb-1">{review.title}</div>
          )}
          <div className="text-sm text-gray-600 line-clamp-2">{review.review_text}</div>
        </div>
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
    {
      key: 'actions',
      label: 'פעולות',
      render: (review) => (
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <HiDotsVertical className="h-4 w-4" />
            </Button>
          }
          items={[
            {
              label: 'עריכה',
              icon: <HiPencil className="w-4 h-4" />,
              onClick: () => openEditModal(review),
            },
            review.is_approved
              ? {
                  label: 'ביטול אישור',
                  icon: <HiX className="w-4 h-4" />,
                  onClick: () => handleApprove(review, false),
                }
              : {
                  label: 'אישור',
                  icon: <HiCheck className="w-4 h-4" />,
                  onClick: () => handleApprove(review, true),
                },
            {
              label: 'מחיקה',
              icon: <HiTrash className="w-4 h-4" />,
              onClick: () => handleDelete(review),
              variant: 'destructive' as const,
            },
          ]}
          align="end"
        />
      ),
    },
  ];

  return (
    <>
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
        headerActions={
          <div className="flex items-center gap-2">
            {selectedReviews.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <HiCheck className="w-4 h-4 ml-1" />
                  אישור ({selectedReviews.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('unapprove')}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <HiX className="w-4 h-4 ml-1" />
                  ביטול אישור ({selectedReviews.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <HiTrash className="w-4 h-4 ml-1" />
                  מחיקה ({selectedReviews.size})
                </Button>
              </>
            )}
            <Button onClick={openCreateModal} className="bg-emerald-500 hover:bg-emerald-600">
              <HiPlus className="w-4 h-4 ml-2" />
              הוסף ביקורת
            </Button>
          </div>
        }
        emptyState={
          <div className="text-center py-12">
            <HiStar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">אין ביקורות</p>
            <Button onClick={openCreateModal} className="bg-emerald-500 hover:bg-emerald-600">
              <HiPlus className="w-4 h-4 ml-2" />
              הוסף ביקורת ראשונה
            </Button>
          </div>
        }
      />

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingReview ? 'עריכת ביקורת' : 'הוספת ביקורת חדשה'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Selection */}
            <div>
              <Label htmlFor="product_id">מוצר *</Label>
              <select
                id="product_id"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                disabled={!!editingReview}
              >
                <option value="">בחר מוצר...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <Label>דירוג *</Label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <HiStar
                      className={`w-8 h-8 ${
                        star <= formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Reviewer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reviewer_name">שם הכותב</Label>
                <Input
                  id="reviewer_name"
                  value={formData.reviewer_name}
                  onChange={(e) => setFormData({ ...formData, reviewer_name: e.target.value })}
                  placeholder="שם הכותב"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reviewer_email">אימייל הכותב</Label>
                <Input
                  id="reviewer_email"
                  type="email"
                  value={formData.reviewer_email}
                  onChange={(e) => setFormData({ ...formData, reviewer_email: e.target.value })}
                  placeholder="email@example.com"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">כותרת הביקורת</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="כותרת קצרה לביקורת"
                className="mt-1"
              />
            </div>

            {/* Review Text */}
            <div>
              <Label htmlFor="review_text">תוכן הביקורת *</Label>
              <Textarea
                id="review_text"
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                placeholder="הזן את תוכן הביקורת..."
                rows={4}
                className="mt-1"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_verified_purchase"
                  checked={formData.is_verified_purchase}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_verified_purchase: checked as boolean })
                  }
                />
                <Label htmlFor="is_verified_purchase" className="cursor-pointer">
                  רכישה מאומתת
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_approved"
                  checked={formData.is_approved}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_approved: checked as boolean })
                  }
                />
                <Label htmlFor="is_approved" className="cursor-pointer">
                  ביקורת מאושרת
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_published: checked as boolean })
                  }
                />
                <Label htmlFor="is_published" className="cursor-pointer">
                  פרסום הביקורת באתר
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {saving ? 'שומר...' : editingReview ? 'עדכון' : 'הוסף ביקורת'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
