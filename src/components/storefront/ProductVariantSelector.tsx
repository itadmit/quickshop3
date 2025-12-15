'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { VariantSelector } from './VariantSelector';

interface Variant {
  id: number;
  title: string;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  available: number;
}

interface ProductOption {
  id: number;
  name: string;
  type?: 'button' | 'color' | 'pattern' | 'image';
  position: number;
  values?: Array<{
    id: number;
    value: string;
    position: number;
    metadata?: {
      color?: string;
      image?: string;
      images?: string[];
      pattern?: string;
    };
  }>;
}

interface ProductVariantSelectorProps {
  variants: Variant[];
  options: ProductOption[];
  onVariantChange: (variantId: number) => void;
  selectedVariantId?: number;
}

// Helper function to get initial variant from URL or default
function getInitialVariant(
  searchParams: ReadonlyURLSearchParams,
  variants: Variant[],
  options: ProductOption[],
  selectedVariantId?: number
): Variant | null {
  // Try to extract variant from URL params
  const urlParams: Record<string, string> = {};
  let foundAnyParam = false;
  
  // Collect all URL params (decoded)
  const allUrlParams: Array<{ key: string; value: string }> = [];
  searchParams.forEach((value, key) => {
    try {
      allUrlParams.push({
        key: decodeURIComponent(key).toLowerCase(),
        value: decodeURIComponent(value),
      });
    } catch {
      allUrlParams.push({ 
        key: key.toLowerCase(), 
        value: value 
      });
    }
  });

  // Try to match by option name
  options.forEach((opt, index) => {
    const optionNameLower = opt.name.toLowerCase();
    const matchedParam = allUrlParams.find(p => p.key.toLowerCase() === optionNameLower);
    
    if (matchedParam) {
      foundAnyParam = true;
      urlParams[`option${index + 1}`] = matchedParam.value;
    }
  });

  // If we found params, try to find matching variant
  if (foundAnyParam && Object.keys(urlParams).length > 0) {
    const matchingVariant = findVariantByOptions(variants, urlParams);
    if (matchingVariant) {
      return matchingVariant;
    }
  }

  // Fall back to selectedVariantId or first variant
  return variants.find(v => v.id === selectedVariantId) || variants[0] || null;
}

export function ProductVariantSelector({
  variants,
  options,
  onVariantChange,
  selectedVariantId,
}: ProductVariantSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => 
    getInitialVariant(searchParams, variants, options, selectedVariantId)
  );
  const previousVariantRef = useRef<Variant | null>(null);
  const isUpdatingFromURLRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // מיפוי options לפי position (option1 = position 0, option2 = position 1, option3 = position 2)
  const optionMap = new Map<number, ProductOption>();
  options.forEach((opt, index) => {
    optionMap.set(index, opt);
  });

  // יצירת mapping בין option position ל-variant option field
  const getVariantOptionValue = (variant: Variant, position: number): string | null => {
    if (position === 0) return variant.option1;
    if (position === 1) return variant.option2;
    if (position === 2) return variant.option3;
    return null;
  };

  // Call onVariantChange when component mounts with initial variant from URL
  useEffect(() => {
    if (selectedVariant && !hasInitializedRef.current) {
      onVariantChange(selectedVariant.id);
      previousVariantRef.current = selectedVariant;
      hasInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update URL when variant changes (only if it actually changed)
  useEffect(() => {
    if (!selectedVariant || selectedVariant.id === previousVariantRef.current?.id) {
      return;
    }

    // Skip if we're updating from URL
    if (isUpdatingFromURLRef.current) {
      previousVariantRef.current = selectedVariant;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    
    options.forEach((opt, index) => {
      const value = getVariantOptionValue(selectedVariant, index);
      if (value) {
        params.set(opt.name.toLowerCase(), value);
      } else {
        params.delete(opt.name.toLowerCase());
      }
    });
    
    const newURL = `?${params.toString()}`;
    const currentURL = `?${searchParams.toString()}`;
    
    // Only update URL if it actually changed
    if (newURL !== currentURL) {
      router.replace(newURL, { scroll: false });
    }
    
    previousVariantRef.current = selectedVariant;
  }, [selectedVariant, router, searchParams, options]);

  const handleOptionSelect = (optionPosition: number, value: string) => {
    const currentOptions: Record<string, string> = {};
    
    // שמירת הערכים הנוכחיים
    options.forEach((opt, index) => {
      const currentValue = getVariantOptionValue(selectedVariant || variants[0], index);
      if (currentValue) {
        currentOptions[`option${index + 1}`] = currentValue;
      }
    });
    
    // עדכון הערך שנבחר
    currentOptions[`option${optionPosition + 1}`] = value;
    
    const newVariant = findVariantByOptions(variants, currentOptions);
    if (newVariant) {
      setSelectedVariant(newVariant);
      onVariantChange(newVariant.id);
    }
  };

  // Helper function to extract value recursively from nested JSON
  const extractValueRecursively = (val: any, depth = 0): string => {
    if (depth > 5) return ''; // Prevent infinite recursion
    if (!val) return '';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') {
      if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === 'object' && parsed.value !== undefined) {
            return extractValueRecursively(parsed.value, depth + 1);
          }
          if (parsed && typeof parsed === 'object') {
            return extractValueRecursively(parsed.value || parsed.label || parsed.name || val, depth + 1);
          }
          return String(parsed);
        } catch {
          return val;
        }
      }
      return val;
    }
    if (val && typeof val === 'object') {
      if (val.value !== undefined) {
        return extractValueRecursively(val.value, depth + 1);
      }
      return extractValueRecursively(val.label || val.name || '', depth + 1);
    }
    return '';
  };

  // יצירת options list לכל option עם availability
  const getOptionsForSelector = (option: ProductOption, position: number) => {
    if (!option.values) return [];
    
    return option.values.map(val => {
      // Extract clean value (handle nested JSON)
      const cleanValue = extractValueRecursively(val.value || val);
      
      // בדיקת זמינות - האם יש variant עם הערך הזה שזמין
      const hasAvailableVariant = variants.some(v => {
        const variantValue = getVariantOptionValue(v, position);
        return variantValue === cleanValue && v.available > 0;
      });
      
      return {
        id: val.id,
        name: cleanValue,
        value: cleanValue,
        available: hasAvailableVariant,
        metadata: val.metadata,
      };
    });
  };

  return (
    <div className="space-y-6">
      {options.map((option, index) => {
        const selectorOptions = getOptionsForSelector(option, index);
        const selectedValue = selectedVariant ? getVariantOptionValue(selectedVariant, index) : null;
        
        if (selectorOptions.length === 0) return null;
        
        // קביעת סוג ה-selector לפי type של ה-option
        // button = כפתורים מלבניים (size style)
        // color = עיגוליות צבע
        // image/pattern = dropdown
        const selectorType = option.type === 'color' ? 'color' : 
                            option.type === 'image' || option.type === 'pattern' ? 'other' : 
                            'size'; // button או default = size (כפתורים מלבניים)
        
        return (
          <VariantSelector
            key={option.id}
            type={selectorType}
            label={option.name}
            options={selectorOptions}
            selectedValue={selectedValue || ''}
            onSelect={(value) => handleOptionSelect(index, value)}
            syncWithURL={false}
            urlParam={option.name.toLowerCase()}
          />
        );
      })}
    </div>
  );
}

function findVariantByOptions(
  variants: Variant[],
  options: Record<string, string>
): Variant | null {
  return variants.find(variant => {
    // Compare option1 (case-insensitive and trim whitespace)
    if (options.option1) {
      const variantValue = variant.option1?.toString().trim().toLowerCase() || '';
      const optionValue = options.option1.toString().trim().toLowerCase();
      if (variantValue !== optionValue) return false;
    }
    
    // Compare option2
    if (options.option2) {
      const variantValue = variant.option2?.toString().trim().toLowerCase() || '';
      const optionValue = options.option2.toString().trim().toLowerCase();
      if (variantValue !== optionValue) return false;
    }
    
    // Compare option3
    if (options.option3) {
      const variantValue = variant.option3?.toString().trim().toLowerCase() || '';
      const optionValue = options.option3.toString().trim().toLowerCase();
      if (variantValue !== optionValue) return false;
    }
    
    return true;
  }) || null;
}
