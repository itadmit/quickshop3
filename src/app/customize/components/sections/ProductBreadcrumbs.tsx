'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { HiHome, HiChevronLeft } from 'react-icons/hi';

interface ProductBreadcrumbsProps {
  section: SectionSettings;
  product?: any;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function ProductBreadcrumbs({ section, product, onUpdate }: ProductBreadcrumbsProps) {
  const settings = section.settings || {};
  const style = section.style || {};

  // Get settings
  const showHome = settings.show_home !== false;
  const showCategory = settings.show_category !== false;
  const separator = settings.separator || 'chevron'; // chevron, slash, arrow
  const textSize = settings.text_size || 'small'; // small, medium
  const alignment = settings.alignment || 'right'; // right, center, left

  // Typography
  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#6B7280';
  const linkColor = settings.link_color || '#111827';

  // Separator component
  const Separator = () => {
    switch (separator) {
      case 'slash':
        return <span className="mx-2 text-gray-300">/</span>;
      case 'arrow':
        return <span className="mx-2 text-gray-300">←</span>;
      default:
        return <HiChevronLeft className="w-4 h-4 mx-1 text-gray-300" />;
    }
  };

  // Text size classes
  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
  }[textSize] || 'text-xs';

  // Alignment classes
  const alignmentClasses = {
    right: 'justify-end',
    center: 'justify-center',
    left: 'justify-start',
  }[alignment] || 'justify-end';

  // Build breadcrumb items
  const breadcrumbs = [];

  if (showHome) {
    breadcrumbs.push({
      label: 'בית',
      url: '/',
      icon: settings.home_icon !== false ? HiHome : null,
    });
  }

  if (showCategory && product?.category) {
    breadcrumbs.push({
      label: product.category.name || 'קטגוריה',
      url: `/categories/${product.category.handle || product.category.slug || 'all'}`,
    });
  } else if (showCategory) {
    // Placeholder for customizer preview
    breadcrumbs.push({
      label: 'קטגוריה',
      url: '#',
    });
  }

  // Current product
  breadcrumbs.push({
    label: product?.title || product?.name || 'שם המוצר',
    url: null, // Current page - no link
    isCurrent: true,
  });

  return (
    <nav 
      className="w-full py-3"
      style={{ fontFamily }}
      aria-label="פירורי לחם"
      dir="rtl"
    >
      <div className="container mx-auto px-4">
        <ol className={`flex items-center flex-wrap ${alignmentClasses} ${textSizeClasses}`}>
          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <Separator />}
              
              {crumb.isCurrent ? (
                <span 
                  className="font-medium truncate max-w-[200px]"
                  style={{ color: textColor }}
                  aria-current="page"
                >
                  {crumb.icon && <crumb.icon className="w-4 h-4 inline-block ml-1" />}
                  {crumb.label}
                </span>
              ) : (
                <a 
                  href={crumb.url || '#'}
                  className="hover:underline transition-colors flex items-center"
                  style={{ color: linkColor }}
                >
                  {crumb.icon && <crumb.icon className="w-4 h-4 ml-1" />}
                  {crumb.label}
                </a>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

