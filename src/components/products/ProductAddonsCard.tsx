'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { HiPuzzle, HiExternalLink } from 'react-icons/hi';
import { useRouter } from 'next/navigation';

interface ProductAddonsCardProps {
  productId?: number;
  shopId: number;
  categoryIds?: number[];
  onChange?: (addonIds: string[]) => void;
}

export function ProductAddonsCard({
  productId,
  shopId,
  categoryIds = [],
  onChange,
}: ProductAddonsCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allAddons, setAllAddons] = useState<any[]>([]);
  const [availableAddons, setAvailableAddons] = useState<any[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const lastLoadKeyRef = useRef<string>('');

  useEffect(() => {
    const key = `${shopId}-${productId || 'new'}-${categoryIds.join(',')}`;
    if (lastLoadKeyRef.current === key) return;
    lastLoadKeyRef.current = key;
    loadAddons();
  }, [shopId, productId, categoryIds]);

  // Filter addons based on scope
  useEffect(() => {
    if (allAddons.length === 0) {
      setAvailableAddons([]);
      return;
    }

    const available = allAddons.filter((addon: any) => {
      if (addon.scope === 'GLOBAL') {
        return true;
      }
      if (addon.scope === 'PRODUCT' && productId) {
        return addon.product_ids?.includes(productId);
      }
      if (addon.scope === 'CATEGORY' && categoryIds.length > 0) {
        return addon.category_ids?.some((catId: number) => categoryIds.includes(catId));
      }
      return false;
    });

    setAvailableAddons(available);
  }, [allAddons, productId, categoryIds]);

  const loadAddons = async () => {
    try {
      setLoading(true);
      // רשימת תוספים זמינים לחנות מהדשבורד
      const response = await fetch(`/api/product-addons`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAllAddons(data || []);
      }
      
      // Load selected addons for this product
      if (productId) {
        const productResponse = await fetch(`/api/products/${productId}/addons`);
        if (productResponse.ok) {
          const productData = await productResponse.json();
          const selectedIds = (productData.addons || []).map((a: any) => a.id.toString());
          setSelectedAddonIds(selectedIds);
          if (onChange) {
            onChange(selectedIds);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading addons:', error);
      setLoading(false);
    }
  };

  const handleToggleAddon = async (addonId: string, checked: boolean) => {
    if (!productId) {
      // Just update local state if no product ID yet
      const newSelectedIds = checked
        ? [...selectedAddonIds, addonId]
        : selectedAddonIds.filter((id: any) => id !== addonId);
      setSelectedAddonIds(newSelectedIds);
      onChange?.(newSelectedIds);
      return;
    }

    try {
      setLoading(true);
      const method = checked ? 'POST' : 'DELETE';
      const url = checked
        ? `/api/products/${productId}/addons`
        : `/api/products/${productId}/addons?addon_id=${addonId}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: checked ? JSON.stringify({ addon_id: parseInt(addonId) }) : undefined,
      });

      if (response.ok) {
        const newSelectedIds = checked
          ? [...selectedAddonIds, addonId]
          : selectedAddonIds.filter((id: any) => id !== addonId);
        setSelectedAddonIds(newSelectedIds);
        onChange?.(newSelectedIds);
      } else {
        const error = await response.json();
        console.error('Error toggling addon:', error);
      }
    } catch (error) {
      console.error('Error toggling addon:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiPuzzle className="w-5 h-5" />
            <span>תוספות למוצר</span>
          </h2>
          <Link
            href="/settings/product-addons"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <span>נהל תוספות</span>
            <HiExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {loading && availableAddons.length === 0 ? (
          <div className="text-center text-gray-500 py-4">טוען תוספות...</div>
        ) : availableAddons.length === 0 ? (
          <div className="text-center py-6">
            <HiPuzzle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">אין תוספות מוגדרות</p>
            <p className="text-sm text-gray-400 mb-3">
              צור תוספות בהגדרות כדי שיופיעו כאן
            </p>
            <Link
              href="/settings/product-addons"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              צור תוספת
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              תוספות אלו יוצגו ללקוחות בעת הצפייה במוצר ויאפשרו להם להוסיף שירותים נוספים בתשלום.
            </p>

            <div className="space-y-3">
              {availableAddons.map((addon: any) => (
                <div
                  key={addon.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id={`addon-${addon.id}`}
                    checked={selectedAddonIds.includes(addon.id.toString())}
                    onChange={(e) =>
                      handleToggleAddon(addon.id.toString(), e.target.checked)
                    }
                    disabled={addon.scope === 'GLOBAL'}
                    className="mt-1 rounded border-gray-300"
                  />
                  <Label
                    htmlFor={`addon-${addon.id}`}
                    className="cursor-pointer font-medium flex-1"
                  >
                    {addon.name}
                    {addon.is_required && (
                      <span className="text-red-600 text-xs mr-2">(חובה)</span>
                    )}
                    {addon.scope === 'GLOBAL' && (
                      <span className="text-gray-400 text-xs mr-2">(גלובלי)</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

