'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { HiStar } from 'react-icons/hi';

interface PremiumClubCardProps {
  exclusiveToTier?: string[];
  onExclusiveToTierChange?: (tiers: string[]) => void;
  shopId: number;
}

export function PremiumClubCard({
  exclusiveToTier = [],
  onExclusiveToTierChange,
  shopId,
}: PremiumClubCardProps) {
  const [availableTiers, setAvailableTiers] = useState<Array<{ slug: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTiers();
  }, [shopId]);

  const fetchTiers = async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/premium-club/config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config?.tiers) {
          setAvailableTiers(data.config.tiers.map((tier: any) => ({
            slug: tier.slug,
            name: tier.name,
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTierToggle = (tierSlug: string, checked: boolean) => {
    if (!onExclusiveToTierChange) return;

    if (checked) {
      onExclusiveToTierChange([...exclusiveToTier, tierSlug]);
    } else {
      onExclusiveToTierChange(exclusiveToTier.filter((t: any) => t !== tierSlug));
    }
  };

  if (loading || availableTiers.length === 0) {
    return null; // Don't show if no tiers available
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiStar className="w-5 h-5" />
          <span>מועדון פרימיום</span>
        </h2>
        <div className="space-y-4">
          <div>
            <Label>מוצר בלעדי לרמות</Label>
            <p className="text-xs text-gray-500 mb-3">
              בחר את הרמות שיש להן גישה למוצר זה. אם לא תבחר כלום, המוצר זמין לכולם.
            </p>
            <div className="space-y-2">
              {availableTiers.map((tier: any) => (
                <div key={tier.slug} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`tier-${tier.slug}`}
                    checked={exclusiveToTier.includes(tier.slug)}
                    onChange={(e) =>
                      handleTierToggle(tier.slug, e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <Label
                    htmlFor={`tier-${tier.slug}`}
                    className="cursor-pointer text-sm"
                  >
                    {tier.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

