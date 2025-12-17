'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Product {
  id: number;
  title: string;
  variants: Array<{
    id: number;
    title: string;
    price: number;
    compare_at_price: number | null;
    sku: string | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    available: number;
  }>;
  options?: Array<{
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
  }>;
  images?: Array<{
    id: number;
    src: string;
    alt: string | null;
    position: number;
  }>;
}

interface ProductPageContextType {
  product: Product | null;
  selectedVariantId: number | null;
  setSelectedVariantId: (id: number | null) => void;
  selectedVariant: Product['variants'][0] | null;
  quantity: number;
  setQuantity: (qty: number) => void;
}

const ProductPageContext = createContext<ProductPageContextType | null>(null);

export function ProductPageProvider({ 
  product, 
  children 
}: { 
  product: Product | null; 
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const [selectedVariantId, setSelectedVariantIdState] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Shopify logic: Every product has at least one variant
  const defaultVariant = product?.variants?.[0];
  
  // Initialize selected variant from URL or default
  useEffect(() => {
    if (!product || !defaultVariant) return;
    
    // Try to find variant from URL params
    if (product.options && product.options.length > 0) {
      const urlParams: Record<string, string> = {};
      let foundAnyParam = false;
      
      product.options.forEach((opt, index) => {
        const urlValue = searchParams.get(opt.name.toLowerCase());
        if (urlValue) {
          foundAnyParam = true;
          urlParams[`option${index + 1}`] = urlValue;
        }
      });
      
      if (foundAnyParam) {
        const matchingVariant = product.variants.find(v => {
          let matches = true;
          if (urlParams.option1 && v.option1?.toLowerCase() !== urlParams.option1.toLowerCase()) matches = false;
          if (urlParams.option2 && v.option2?.toLowerCase() !== urlParams.option2.toLowerCase()) matches = false;
          if (urlParams.option3 && v.option3?.toLowerCase() !== urlParams.option3.toLowerCase()) matches = false;
          return matches;
        });
        
        if (matchingVariant) {
          setSelectedVariantIdState(matchingVariant.id);
          return;
        }
      }
    }
    
    // Fall back to default variant
    setSelectedVariantIdState(defaultVariant.id);
  }, [product, searchParams, defaultVariant]);

  const selectedVariant = product?.variants.find(v => v.id === selectedVariantId) || defaultVariant || null;

  const setSelectedVariantId = (id: number | null) => {
    setSelectedVariantIdState(id);
    // Reset quantity when variant changes
    setQuantity(1);
  };

  return (
    <ProductPageContext.Provider
      value={{
        product,
        selectedVariantId,
        setSelectedVariantId,
        selectedVariant,
        quantity,
        setQuantity,
      }}
    >
      {children}
    </ProductPageContext.Provider>
  );
}

export function useProductPage() {
  const context = useContext(ProductPageContext);
  if (!context) {
    throw new Error('useProductPage must be used within ProductPageProvider');
  }
  return context;
}



