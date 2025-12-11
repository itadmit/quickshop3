'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiSearch, HiX, HiGift } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';

interface Product {
  id: number;
  title: string;
  handle: string;
  price?: string;
  image?: string;
}

interface GiftProductSelectorProps {
  selectedProductId: number | null;
  onProductChange: (productId: number | null) => void;
}

export function GiftProductSelector({ selectedProductId, onProductChange }: GiftProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (selectedProductId) {
      loadSelectedProduct();
    } else {
      setSelectedProduct(null);
    }
  }, [selectedProductId]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      loadProducts();
    } else {
      setProducts([]);
    }
  }, [debouncedSearchTerm]);

  const loadSelectedProduct = async () => {
    if (!selectedProductId) return;
    
    try {
      const response = await fetch(`/api/products/${selectedProductId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedProduct(data.product);
      }
    } catch (error) {
      console.error('Error loading selected product:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      params.append('limit', '20');

      const response = await fetch(`/api/products?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    onProductChange(product.id);
    setSearchTerm('');
    setProducts([]);
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    onProductChange(null);
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      {selectedProduct ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedProduct.image && (
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div>
                <p className="font-medium text-emerald-900">{selectedProduct.title}</p>
                {selectedProduct.price && (
                  <p className="text-sm text-emerald-700">₪{selectedProduct.price}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 hover:bg-emerald-100 rounded transition-colors"
              title="הסר מוצר מתנה"
            >
              <HiX className="w-5 h-5 text-emerald-700" />
            </button>
          </div>
        </div>
      ) : (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="חפש מוצר מתנה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {loading && (
              <div className="text-center py-4 text-gray-500">טוען מוצרים...</div>
            )}

            {!loading && searchTerm && products.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2 border-t border-gray-200 pt-4">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-200"
                    onClick={() => selectProduct(product)}
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.title}</p>
                      {product.price && (
                        <p className="text-sm text-gray-500">₪{product.price}</p>
                      )}
                    </div>
                    <HiGift className="w-5 h-5 text-emerald-600" />
                  </div>
                ))}
              </div>
            )}

            {!loading && searchTerm && products.length === 0 && (
              <div className="text-center py-4 text-gray-500">לא נמצאו מוצרים</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}



