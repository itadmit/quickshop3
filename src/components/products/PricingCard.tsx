'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiCurrencyDollar } from 'react-icons/hi';

interface PricingData {
  price: string;
  comparePrice: string;
  cost: string;
  taxEnabled: boolean;
}

interface PricingCardProps {
  data: PricingData;
  onChange: (data: Partial<PricingData>) => void;
  hidden?: boolean;
}

export function PricingCard({ data, onChange, hidden = false }: PricingCardProps) {
  if (hidden) return null;

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiCurrencyDollar className="w-5 h-5" />
          <span>תמחור</span>
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">מחיר *</Label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">₪</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={data.price}
                  onChange={(e) => onChange({ price: e.target.value })}
                  placeholder="0.00"
                  className="pr-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="comparePrice">מחיר מקורי (להשוואה)</Label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">₪</span>
                <Input
                  id="comparePrice"
                  type="number"
                  step="0.01"
                  value={data.comparePrice}
                  onChange={(e) => onChange({ comparePrice: e.target.value })}
                  placeholder="0.00"
                  className="pr-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cost">מחיר עלות</Label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">₪</span>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={data.cost}
                  onChange={(e) => onChange({ cost: e.target.value })}
                  placeholder="0.00"
                  className="pr-10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">לקוחות לא יראו את זה. משמש לחישוב רווחים.</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <Label htmlFor="taxEnabled" className="cursor-pointer">
              כלול מע"מ במחיר
            </Label>
            <input
              type="checkbox"
              id="taxEnabled"
              checked={data.taxEnabled}
              onChange={(e) => onChange({ taxEnabled: e.target.checked })}
              className="rounded border-gray-300"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

