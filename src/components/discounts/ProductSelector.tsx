'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { HiSearch, HiX } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';

interface Product {
  id: number;
  title: string;
  handle: string;
}

interface ProductSelectorProps {
  selectedProductIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function ProductSelector({ selectedProductIds, onSelectionChange }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadProducts();
  }, [debouncedSearchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      params.append('limit', '100');

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

  const toggleProduct = (productId: number) => {
    if (selectedProductIds.includes(productId)) {
      onSelectionChange(selectedProductIds.filter(id => id !== productId));
    } else {
      onSelectionChange([...selectedProductIds, productId]);
    }
  };

  return (
    <Card className="p-4 mt-2">
      <div className="space-y-4">
        <div className="relative">
          <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="חיפוש מוצרים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {selectedProductIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {products
              .filter(p => selectedProductIds.includes(p.id))
              .map(product => (
                <span
                  key={product.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                >
                  {product.title}
                  <button
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className="hover:text-emerald-900"
                  >
                    <HiX className="w-4 h-4" />
                  </button>
                </span>
              ))}
          </div>
        )}

        <div className="max-h-60 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-4 text-gray-500">טוען מוצרים...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-4 text-gray-500">לא נמצאו מוצרים</div>
          ) : (
            products.map(product => (
              <div
                key={product.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => toggleProduct(product.id)}
              >
                <Checkbox
                  checked={selectedProductIds.includes(product.id)}
                  onCheckedChange={() => toggleProduct(product.id)}
                />
                <Label className="cursor-pointer flex-1">{product.title}</Label>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

