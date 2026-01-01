'use client';

import { useState, useEffect, useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { StoryViewer } from './StoryViewer';

export interface Story {
  id: number;
  product_id: number;
  position: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  product_title: string;
  product_handle: string;
  product_price: number;
  product_compare_at_price: number | null;
  product_image: string | null;
  product_description: string | null;
  is_viewed: boolean;
  is_liked: boolean;
  variants: any[];
  options?: any[];
}

export interface StorySettings {
  display_mode: string;
  auto_advance_seconds: number;
  show_product_info: boolean;
  allow_likes: boolean;
  allow_comments: boolean;
  allow_quick_add: boolean;
  circle_border_color: string;
  viewed_border_color: string;
}

interface StoriesBarProps {
  storeSlug: string;
  pageType?: 'home' | 'category' | 'product' | 'other';
}

export function StoriesBar({ storeSlug, pageType = 'home' }: StoriesBarProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [settings, setSettings] = useState<StorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    async function fetchStories() {
      try {
        const res = await fetch(`/api/storefront/stories?store=${storeSlug}`);
        if (res.ok) {
          const data = await res.json();
          setStories(data.stories || []);
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Failed to fetch stories:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStories();
  }, [storeSlug]);

  // Update scroll buttons visibility
  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [stories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Handle story viewed
  const handleStoryViewed = (storyId: number) => {
    setStories((prev) =>
      prev.map((story) =>
        story.id === storyId ? { ...story, is_viewed: true } : story
      )
    );
  };

  // Handle like toggled
  const handleLikeToggled = (storyId: number, isLiked: boolean, likesCount: number) => {
    setStories((prev) =>
      prev.map((story) =>
        story.id === storyId
          ? { ...story, is_liked: isLiked, likes_count: likesCount }
          : story
      )
    );
  };

  // Check display mode
  if (!settings) return null;
  
  const shouldDisplay = 
    settings.display_mode === 'everywhere' ||
    (settings.display_mode === 'home_only' && pageType === 'home') ||
    (settings.display_mode === 'category' && (pageType === 'home' || pageType === 'category'));

  if (!shouldDisplay || stories.length === 0) return null;

  // Sort stories: unviewed first, then viewed
  const sortedStories = [...stories].sort((a, b) => {
    if (a.is_viewed === b.is_viewed) return a.position - b.position;
    return a.is_viewed ? 1 : -1;
  });

  if (loading) {
    return (
      <div className="w-full py-4 px-4 border-b border-gray-100">
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200 animate-pulse" />
              <div className="w-14 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full py-4 border-b border-gray-100 relative">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="גלול ימינה"
          >
            <HiChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Scroll Right Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="גלול שמאלה"
          >
            <HiChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Stories Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-6"
          onScroll={updateScrollButtons}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sortedStories.map((story, index) => (
            <button
              key={story.id}
              onClick={() => setSelectedStoryIndex(index)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group"
            >
              {/* Story Circle */}
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[3px] transition-all duration-200 group-hover:scale-105"
                style={{
                  background: story.is_viewed
                    ? settings.viewed_border_color
                    : `linear-gradient(135deg, ${settings.circle_border_color}, ${settings.circle_border_color}dd)`,
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
                  {story.product_image ? (
                    <img
                      src={story.product_image}
                      alt={story.product_title}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xl">
                      📷
                    </div>
                  )}
                </div>
              </div>

              {/* Story Title */}
              <span className="text-xs text-gray-700 max-w-[70px] md:max-w-[80px] truncate text-center">
                {story.product_title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          stories={sortedStories}
          initialIndex={selectedStoryIndex}
          settings={settings}
          storeSlug={storeSlug}
          onClose={() => setSelectedStoryIndex(null)}
          onStoryViewed={handleStoryViewed}
          onLikeToggled={handleLikeToggled}
        />
      )}
    </>
  );
}

