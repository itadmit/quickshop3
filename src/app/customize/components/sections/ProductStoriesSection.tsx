'use client';

import React, { useState, useEffect } from 'react';
import { HiHeart, HiChat, HiEye } from 'react-icons/hi';
import { SectionSettings } from '@/lib/customizer/types';

interface ProductStoriesSectionProps {
  section: SectionSettings;
  product?: any;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  isPreview?: boolean;
}

interface StoryStats {
  likes_count: number;
  comments_count: number;
  views_count: number;
}

export function ProductStoriesSection({ section, product, onUpdate, isPreview = true }: ProductStoriesSectionProps) {
  const [stats, setStats] = useState<StoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  const settings = section.settings || {};

  // Fetch stats if not preview and product exists
  useEffect(() => {
    if (!isPreview && product?.id) {
      fetchStats();
    }
  }, [isPreview, product?.id]);

  const fetchStats = async () => {
    if (!product?.id) return;
    setLoading(true);
    try {
      // This would need an API endpoint to get story stats for a product
      const res = await fetch(`/api/storefront/stories/product/${product.id}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch story stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use demo data for preview
  const displayStats = isPreview 
    ? { likes_count: 72, comments_count: 12, views_count: 1284 }
    : stats;

  if (!displayStats && !loading) return null;

  const showLikes = settings.show_likes !== false;
  const showComments = settings.show_comments !== false;
  const showViews = settings.show_views !== false;
  const layout = settings.layout || 'horizontal';
  const size = settings.size || 'medium';

  const sizeClasses = {
    small: 'text-sm gap-3',
    medium: 'text-base gap-4',
    large: 'text-lg gap-6',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  if (loading) {
    return (
      <div className={`flex items-center ${sizeClasses[size as keyof typeof sizeClasses]} animate-pulse`}>
        <div className="w-16 h-6 bg-gray-200 rounded" />
        <div className="w-16 h-6 bg-gray-200 rounded" />
        <div className="w-16 h-6 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div 
      className={`flex ${layout === 'vertical' ? 'flex-col' : 'items-center'} ${sizeClasses[size as keyof typeof sizeClasses]}`}
      style={{ 
        color: settings.text_color || 'inherit',
      }}
    >
      {showLikes && displayStats && (
        <div className="flex items-center gap-1.5">
          <HiHeart 
            className={`${iconSizes[size as keyof typeof iconSizes]} ${settings.icon_color ? '' : 'text-red-500'}`}
            style={{ color: settings.icon_color }}
          />
          <span className="font-medium">{displayStats.likes_count}</span>
          {settings.show_labels && <span className="text-gray-500">לייקים</span>}
        </div>
      )}

      {showComments && displayStats && (
        <div className="flex items-center gap-1.5">
          <HiChat 
            className={`${iconSizes[size as keyof typeof iconSizes]}`}
            style={{ color: settings.icon_color || '#6b7280' }}
          />
          <span className="font-medium">{displayStats.comments_count}</span>
          {settings.show_labels && <span className="text-gray-500">תגובות</span>}
        </div>
      )}

      {showViews && displayStats && (
        <div className="flex items-center gap-1.5">
          <HiEye 
            className={`${iconSizes[size as keyof typeof iconSizes]}`}
            style={{ color: settings.icon_color || '#6b7280' }}
          />
          <span className="font-medium">{displayStats.views_count}</span>
          {settings.show_labels && <span className="text-gray-500">צפיות</span>}
        </div>
      )}
    </div>
  );
}

