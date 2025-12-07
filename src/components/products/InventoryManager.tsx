'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { HiCube } from 'react-icons/hi';
import { ProductVariant } from '@/types/product';

interface InventoryData {
  inventoryEnabled: boolean;
  inventoryQty: string;
  lowStockAlert: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER' | 'BACKORDER' | 'DISCONTINUED';
  availableDate: string;
  sellWhenSoldOut: boolean;
  priceByWeight: boolean;
  showPricePer100ml: boolean;
  pricePer100ml: string;
}

interface InventoryManagerProps {
  data: InventoryData;
  onChange: (data: Partial<InventoryData>) => void;
  variants?: ProductVariant[];
  hidden?: boolean;
}

export function InventoryManager({
  data,
  onChange,
  variants = [],
  hidden = false,
}: InventoryManagerProps) {
  if (hidden) return null;

  const totalInventory = variants.length > 0
    ? variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
    : parseInt(data.inventoryQty) || 0;

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiCube className="w-5 h-5" />
          <span>מלאי</span>
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="inventoryEnabled" className="cursor-pointer">
              נהל מלאי
            </Label>
            <input
              type="checkbox"
              id="inventoryEnabled"
              checked={data.inventoryEnabled}
              onChange={(e) => onChange({ inventoryEnabled: e.target.checked })}
              className="rounded border-gray-300"
            />
          </div>

          {data.inventoryEnabled && (
            <>
              {variants.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="inventoryQty">כמות במלאי</Label>
                    <Input
                      id="inventoryQty"
                      type="number"
                      value={data.inventoryQty}
                      onChange={(e) => onChange({ inventoryQty: e.target.value })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lowStockAlert">התראת מלאי נמוך</Label>
                    <Input
                      id="lowStockAlert"
                      type="number"
                      value={data.lowStockAlert}
                      onChange={(e) => onChange({ lowStockAlert: e.target.value })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">סה"כ מלאי מכל הווריאנטים:</span>
                    <span className={`text-lg font-semibold ${totalInventory < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                      {totalInventory} יחידות
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ניהול המלאי לכל ווריאנט מתבצע בטבלת הווריאנטים למטה
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <Label htmlFor="availability">זמינות</Label>
            <Select
              value={data.availability}
              onValueChange={(value) => onChange({ availability: value as InventoryData['availability'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_STOCK">במלאי</SelectItem>
                <SelectItem value="OUT_OF_STOCK">אזל מהמלאי</SelectItem>
                <SelectItem value="PRE_ORDER">הזמנה מראש</SelectItem>
                <SelectItem value="BACKORDER">הזמנה חוזרת</SelectItem>
                <SelectItem value="DISCONTINUED">הופסק</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(data.availability === 'PRE_ORDER' || data.availability === 'BACKORDER') && (
            <div>
              <Label htmlFor="availableDate">תאריך זמינות</Label>
              <Input
                id="availableDate"
                type="datetime-local"
                value={data.availableDate}
                onChange={(e) => onChange({ availableDate: e.target.value })}
              />
            </div>
          )}

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sellWhenSoldOut" className="cursor-pointer">
                  המשך מכירה כשאין במלאי
                </Label>
                <p className="text-xs text-gray-500">
                  הלקוחות יוכלו להזמין גם כשהמלאי אפס
                </p>
              </div>
              <input
                type="checkbox"
                id="sellWhenSoldOut"
                checked={data.sellWhenSoldOut}
                onChange={(e) => onChange({ sellWhenSoldOut: e.target.checked })}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="priceByWeight" className="cursor-pointer">
                  זהו מוצר נמכר לפי משקל
                </Label>
                <p className="text-xs text-gray-500">
                  המחיר יחושב לפי משקל (ק"ג) במקום כמות יח'
                </p>
              </div>
              <input
                type="checkbox"
                id="priceByWeight"
                checked={data.priceByWeight}
                onChange={(e) => onChange({ priceByWeight: e.target.checked })}
                className="rounded border-gray-300"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label htmlFor="showPricePer100ml" className="cursor-pointer">
                    האם לרשום מחיר ל-100 מ״ל
                  </Label>
                  <p className="text-xs text-gray-500">
                    הלקוחות יראו את המחיר ל-100 מ״ל לצד המחיר הרגיל
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="showPricePer100ml"
                  checked={data.showPricePer100ml}
                  onChange={(e) => onChange({ showPricePer100ml: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>
              {data.showPricePer100ml && (
                <div className="pr-4">
                  <Label htmlFor="pricePer100ml">מחיר ל-100 מ״ל (₪)</Label>
                  <Input
                    id="pricePer100ml"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.pricePer100ml}
                    onChange={(e) => onChange({ pricePer100ml: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

