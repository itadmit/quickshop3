'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HiX, HiHeart, HiOutlineHeart, HiChat, HiShoppingCart, HiChevronLeft, HiChevronRight, HiShare, HiPause, HiPlay } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { Story, StorySettings } from './StoriesBar';
import { useCart } from '@/hooks/useCart';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  settings: StorySettings;
  storeSlug: string;
  onClose: () => void;
  onStoryViewed: (storyId: number) => void;
  onLikeToggled: (storyId: number, isLiked: boolean, likesCount: number) => void;
}

export function StoryViewer({
  stories,
  initialIndex,
  settings,
  storeSlug,
  onClose,
  onStoryViewed,
  onLikeToggled,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [addingToCart, setAddingToCart] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const params = useParams();
  
  const { addToCart } = useCart();
  const currentStory = stories[currentIndex];

  // Mark story as viewed when opening
  useEffect(() => {
    if (currentStory && !currentStory.is_viewed) {
      fetch(`/api/storefront/stories/${currentStory.id}/view`, {
        method: 'POST',
      }).then(() => {
        onStoryViewed(currentStory.id);
      });
    }
  }, [currentStory?.id]);

  // Auto-advance progress
  useEffect(() => {
    if (isPaused || showComments) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      return;
    }

    setProgress(0);
    const duration = settings.auto_advance_seconds * 1000;
    const interval = 50;
    let elapsed = 0;

    progressInterval.current = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        goToNext();
      }
    }, interval);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, isPaused, showComments, settings.auto_advance_seconds]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToNext();
      if (e.key === 'ArrowRight') goToPrevious();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  // Reset selected variant when story changes
  useEffect(() => {
    if (currentStory?.variants?.length > 0) {
      setSelectedVariant(currentStory.variants[0].id);
    }
    setSelectedOptions({});
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Handle like
  const handleLike = async () => {
    try {
      const res = await fetch(`/api/storefront/stories/${currentStory.id}/like`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        onLikeToggled(currentStory.id, data.isLiked, data.likesCount);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/storefront/stories/${currentStory.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  // Open comments panel
  const openComments = () => {
    setShowComments(true);
    fetchComments();
  };

  // Submit comment
  const submitComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/storefront/stories/${currentStory.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, authorName }),
      });
      if (res.ok) {
        setNewComment('');
        // Show success message
        alert('התגובה נשלחה לאישור');
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!currentStory || addingToCart) return;

    const variantId = selectedVariant || currentStory.variants?.[0]?.id;
    if (!variantId) return;

    const variant = currentStory.variants?.find((v: any) => v.id === variantId);

    setAddingToCart(true);
    try {
      await addToCart({
        product_id: currentStory.product_id,
        variant_id: variantId,
        quantity: 1,
        product_title: currentStory.product_title,
        variant_title: variant?.title || '',
        price: variant?.price || currentStory.product_price,
        image: currentStory.product_image || '',
      });
    } finally {
      setAddingToCart(false);
    }
  };

  // Share via WhatsApp
  const shareWhatsApp = () => {
    const url = `${window.location.origin}/shops/${storeSlug}/products/${currentStory.product_handle}`;
    const text = `צפה במוצר: ${currentStory.product_title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  // Share (native)
  const handleShare = async () => {
    const url = `${window.location.origin}/shops/${storeSlug}/products/${currentStory.product_handle}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentStory.product_title,
          url,
        });
      } catch (e) {
        // User cancelled
      }
    }
  };

  if (!currentStory) return null;

  const content = (
    <div 
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onClick={(e) => {
        // Close on background click
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-50"
              style={{
                width:
                  index < currentIndex
                    ? '100%'
                    : index === currentIndex
                    ? `${progress}%`
                    : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <HiX className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
            {currentStory.product_image ? (
              <img
                src={currentStory.product_image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
          <span className="text-white font-medium text-sm max-w-[150px] truncate">
            {currentStory.product_title}
          </span>
        </div>

        <button
          onClick={() => setIsPaused((p) => !p)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          {isPaused ? <HiPlay className="w-5 h-5" /> : <HiPause className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation areas */}
      <button
        onClick={goToPrevious}
        className="absolute right-0 top-0 bottom-0 w-1/4 z-40"
        aria-label="הקודם"
      />
      <button
        onClick={goToNext}
        className="absolute left-0 top-0 bottom-0 w-1/4 z-40"
        aria-label="הבא"
      />

      {/* Navigation arrows (desktop) */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 hidden md:flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <HiChevronRight className="w-8 h-8" />
        </button>
      )}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 hidden md:flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <HiChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Main Image */}
      <div className="w-full h-full max-w-lg mx-auto relative">
        {currentStory.product_image ? (
          <img
            src={currentStory.product_image}
            alt={currentStory.product_title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
            <span className="text-6xl">📷</span>
          </div>
        )}
      </div>

      {/* Side Actions */}
      <div className="absolute left-4 bottom-32 flex flex-col gap-4 z-50">
        {/* Like */}
        {settings.allow_likes && (
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1"
          >
            {currentStory.is_liked ? (
              <HiHeart className="w-8 h-8 text-red-500" />
            ) : (
              <HiOutlineHeart className="w-8 h-8 text-white" />
            )}
            <span className="text-white text-xs">{currentStory.likes_count}</span>
          </button>
        )}

        {/* Comments */}
        {settings.allow_comments && (
          <button
            onClick={openComments}
            className="flex flex-col items-center gap-1"
          >
            <HiChat className="w-8 h-8 text-white" />
            <span className="text-white text-xs">{currentStory.comments_count}</span>
          </button>
        )}

        {/* WhatsApp */}
        <button
          onClick={shareWhatsApp}
          className="flex flex-col items-center gap-1"
        >
          <FaWhatsapp className="w-7 h-7 text-white" />
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1"
        >
          <HiShare className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Product Info & Add to Cart */}
      {settings.show_product_info && (
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
          <div className="max-w-lg mx-auto">
            <h3 className="text-white text-lg font-bold mb-1">
              {currentStory.product_title}
            </h3>
            <p className="text-gray-300 text-sm mb-2 line-clamp-2">
              {currentStory.product_description?.replace(/<[^>]*>/g, '')}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white text-xl font-bold">
                  ₪{currentStory.product_price?.toFixed(2)}
                </span>
                {currentStory.product_compare_at_price && (
                  <span className="text-gray-400 line-through text-sm">
                    ₪{currentStory.product_compare_at_price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Variant Selector */}
              {currentStory.options && currentStory.options.length > 0 && (
                <div className="flex items-center gap-2">
                  {currentStory.options.slice(0, 1).map((option: any) => (
                    <div key={option.id} className="flex gap-1">
                      {option.values?.slice(0, 4).map((val: any) => (
                        <button
                          key={val.id}
                          onClick={() => setSelectedOptions({ ...selectedOptions, [option.name]: val.value })}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${
                            selectedOptions[option.name] === val.value
                              ? 'border-white bg-white text-black'
                              : 'border-white/50 text-white'
                          }`}
                        >
                          {val.value.charAt(0)}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            {settings.allow_quick_add && (
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="mt-3 w-full py-3 bg-white text-black rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <HiShoppingCart className="w-5 h-5" />
                {addingToCart ? 'מוסיף...' : 'הוסף מהר'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comments Panel */}
      {showComments && (
        <div 
          className="absolute inset-0 z-[60] bg-black/50 flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowComments(false);
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-t-2xl max-h-[70vh] flex flex-col">
            {/* Comments Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold">תגובות</span>
              <button onClick={() => setShowComments(false)}>
                <HiX className="w-6 h-6" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4">
              {comments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <HiChat className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>אין תגובות עדיין</p>
                  <p className="text-sm">היה הראשון להגיב!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                        {comment.author_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <span className="font-medium text-sm">{comment.author_name}</span>
                        <p className="text-gray-700 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <div className="p-4 border-t">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="השם שלך"
                className="w-full px-4 py-2 border rounded-lg mb-2 text-right"
                dir="rtl"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="מה דעתך על המוצר?"
                  className="flex-1 px-4 py-2 border rounded-lg text-right"
                  dir="rtl"
                />
                <button
                  onClick={submitComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {submittingComment ? '...' : '➤ שלח'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Use portal to render at document body level
  if (typeof window !== 'undefined') {
    return createPortal(content, document.body);
  }
  
  return content;
}

