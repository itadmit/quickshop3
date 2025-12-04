'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { HiPuzzle } from 'react-icons/hi';

interface ProductAddonsCardProps {
  productId?: number;
  shopId: number;
  categoryIds?: string[];
  onChange?: (addonIds: string[]) => void;
}

export function ProductAddonsCard({
  productId,
  shopId,
  categoryIds = [],
  onChange,
}: ProductAddonsCardProps) {
  const [loading, setLoading] = useState(true);
  const [availableAddons, setAvailableAddons] = useState<any[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  useEffect(() => {
    loadAddons();
  }, [shopId, productId, categoryIds]);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/product-addons`);
      if (response.ok) {
        const data = await response.json();
        setAvailableAddons(data.addons || []);
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

  if (loading || availableAddons.length === 0) {
    return null; // Don't show if no addons available
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiPuzzle className="w-5 h-5" />
          <span>תוספות למוצר</span>
        </h2>
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
                  checked={selectedAddonIds.includes(addon.id)}
                  onChange={(e) =>
                    handleToggleAddon(addon.id, e.target.checked)
                  }
                  className="mt-1 rounded border-gray-300"
                />
                <Label
                  htmlFor={`addon-${addon.id}`}
                  className="cursor-pointer font-medium flex-1"
                >
                  {addon.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

