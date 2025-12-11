'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface ProductDetailsData {
  sku: string;
  video: string;
  vendor?: string | null;
}

interface ProductDetailsCardProps {
  data: ProductDetailsData;
  onChange: (data: Partial<ProductDetailsData>) => void;
}

export function ProductDetailsCard({ data, onChange }: ProductDetailsCardProps) {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי מוצר</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="sku">מקט</Label>
            <Input
              id="sku"
              value={data.sku}
              onChange={(e) => onChange({ sku: e.target.value })}
              placeholder="לדוגמה: TSH-001"
            />
          </div>
          <div>
            <Label htmlFor="vendor">ספק</Label>
            <Input
              id="vendor"
              value={data.vendor || ''}
              onChange={(e) => onChange({ vendor: e.target.value })}
              placeholder="שם הספק"
            />
          </div>
          <div>
            <Label htmlFor="video">קישור לסרטון</Label>
            <Input
              id="video"
              value={data.video}
              onChange={(e) => onChange({ video: e.target.value })}
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

