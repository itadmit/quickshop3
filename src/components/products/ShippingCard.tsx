'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiTruck } from 'react-icons/hi';

interface ShippingData {
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
}

interface ShippingCardProps {
  data: ShippingData;
  onChange: (data: ShippingData) => void;
}

export function ShippingCard({ data, onChange }: ShippingCardProps) {
  const handleWeightChange = (weight: string) => {
    onChange({ ...data, weight });
  };

  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: string) => {
    onChange({
      ...data,
      dimensions: {
        ...data.dimensions,
        [dimension]: value,
      },
    });
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiTruck className="w-5 h-5" />
          <span>משלוח</span>
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="weight">משקל (ק"ג)</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              value={data.weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>מידות (ס"מ)</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="length" className="text-xs text-gray-600">אורך</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.01"
                  value={data.dimensions.length}
                  onChange={(e) => handleDimensionChange('length', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="width" className="text-xs text-gray-600">רוחב</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.01"
                  value={data.dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="height" className="text-xs text-gray-600">גובה</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  value={data.dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

