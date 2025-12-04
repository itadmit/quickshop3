'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiCube, HiGift } from 'react-icons/hi';

interface BasicInfoData {
  name: string;
  description: string;
  isGiftCard?: boolean;
}

interface BasicInfoCardProps {
  data: BasicInfoData;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onIsGiftCardChange?: (isGiftCard: boolean) => void;
}

export function BasicInfoCard({ data, onNameChange, onDescriptionChange, onIsGiftCardChange }: BasicInfoCardProps) {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiCube className="w-5 h-5" />
          <span>מידע בסיסי</span>
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">שם המוצר *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="לדוגמה: חולצת טי שירט"
            />
          </div>

          <div>
            <Label htmlFor="description">תיאור</Label>
            <textarea
              id="description"
              value={data.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="תיאור מפורט של המוצר..."
              rows={8}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green resize-none"
            />
          </div>

          {onIsGiftCardChange && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <input
                type="checkbox"
                id="isGiftCard"
                checked={data.isGiftCard || false}
                onChange={(e) => onIsGiftCardChange(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isGiftCard" className="flex items-center gap-2 cursor-pointer">
                <HiGift className="w-4 h-4" />
                <span>זהו מוצר Gift Card (כרטיס מתנה)</span>
              </Label>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

