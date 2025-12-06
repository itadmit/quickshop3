'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { HiCube, HiExclamationCircle, HiPencil, HiPlus } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface InventoryItem {
  id: number;
  product_title: string;
  variant_title: string | null;
  sku: string | null;
  available: number;
  committed: number;
  incoming: number;
}

export default function InventoryPage() {
  const { toast } = useOptimisticToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [searchTerm, showLowStockOnly]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showLowStockOnly) {
        params.append('low_stock', 'true');
      }
      
      const response = await fetch(`/api/inventory?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load inventory');
      const data = await response.json();
      
      const mappedItems = (data.inventory || []).map((item: any) => ({
        id: item.id,
        product_title: item.product_title || 'מוצר לא נמצא',
        variant_title: item.variant_title || null,
        sku: item.sku || null,
        available: item.available || 0,
        committed: item.committed || 0,
        incoming: item.incoming || 0,
      }));
      
      setItems(mappedItems);
      
      // Also load low stock items separately for alerts
      const lowStockResponse = await fetch('/api/inventory?low_stock=true');
      if (lowStockResponse.ok) {
        const lowStockData = await lowStockResponse.json();
        const mappedLowStock = (lowStockData.inventory || []).map((item: any) => ({
          id: item.id,
          product_title: item.product_title || 'מוצר לא נמצא',
          variant_title: item.variant_title || null,
          sku: item.sku || null,
          available: item.available || 0,
          committed: item.committed || 0,
          incoming: item.incoming || 0,
        }));
        setLowStockItems(mappedLowStock);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustInventory = async () => {
    if (!selectedItem || !adjustmentQuantity) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין כמות',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAdjusting(true);
      const newQuantity = selectedItem.available + parseInt(adjustmentQuantity);
      
      const response = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          available: newQuantity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to adjust inventory');
      }

      toast({
        title: 'הצלחה',
        description: 'המלאי עודכן בהצלחה',
      });

      setAdjustmentDialogOpen(false);
      setSelectedItem(null);
      setAdjustmentQuantity('');
      setAdjustmentReason('');
      await loadInventory();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון המלאי',
        variant: 'destructive',
      });
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustmentDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setAdjustmentDialogOpen(true);
  };

  const columns: TableColumn<InventoryItem>[] = [
    {
      key: 'product',
      label: 'מוצר',
      render: (item) => (
        <div>
          <div className="font-medium text-gray-900">{item.product_title}</div>
          {item.variant_title && (
            <div className="text-sm text-gray-500">{item.variant_title}</div>
          )}
          {item.sku && (
            <div className="text-xs text-gray-400">SKU: {item.sku}</div>
          )}
        </div>
      ),
    },
    {
      key: 'available',
      label: 'זמין',
      render: (item) => (
        <div className={`font-semibold ${item.available < 10 ? 'text-orange-600' : 'text-gray-900'}`}>
          {item.available}
          {item.available < 10 && (
            <span className="ml-2 text-xs text-orange-500">(נמוך)</span>
          )}
        </div>
      ),
    },
    {
      key: 'committed',
      label: 'מחויב',
      render: (item) => (
        <div className="text-gray-600">{item.committed}</div>
      ),
    },
    {
      key: 'incoming',
      label: 'בדרך',
      render: (item) => (
        <div className="text-gray-600">{item.incoming}</div>
      ),
    },
    {
      key: 'actions',
      label: 'פעולות',
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openAdjustmentDialog(item)}
        >
          <HiPencil className="w-4 h-4 ml-1" />
          עדכן
        </Button>
      ),
    },
  ];

  const filteredItems = showLowStockOnly 
    ? items.filter(item => item.available < 10)
    : items;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HiExclamationCircle className="w-6 h-6 text-orange-600" />
                <h2 className="text-lg font-semibold text-orange-900">
                  התראות מלאי נמוך ({lowStockItems.length})
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              >
                {showLowStockOnly ? 'הצג הכל' : 'הצג רק מלאי נמוך'}
              </Button>
            </div>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div>
                    <div className="font-medium text-gray-900">{item.product_title}</div>
                    {item.variant_title && (
                      <div className="text-sm text-gray-500">{item.variant_title}</div>
                    )}
                    {item.sku && (
                      <div className="text-xs text-gray-400">SKU: {item.sku}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">{item.available}</div>
                    <div className="text-xs text-gray-500">יחידות זמינות</div>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <div className="text-sm text-orange-700 text-center pt-2">
                  ועוד {lowStockItems.length - 5} פריטים עם מלאי נמוך
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <DataTable
        title="מלאי"
        description="נהל מלאי מוצרים"
        searchPlaceholder="חיפוש במלאי..."
        onSearch={setSearchTerm}
        columns={columns}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyState={
          <div className="text-center py-12">
            <HiCube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {showLowStockOnly ? 'אין פריטים עם מלאי נמוך' : 'אין פריטי מלאי להצגה'}
            </p>
          </div>
        }
      />

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עדכן מלאי</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            {selectedItem && (
              <>
                <div>
                  <Label>מוצר</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    <div className="font-medium">{selectedItem.product_title}</div>
                    {selectedItem.variant_title && (
                      <div className="text-sm text-gray-500">{selectedItem.variant_title}</div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      מלאי נוכחי: <span className="font-semibold">{selectedItem.available}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>שינוי כמות *</Label>
                  <Input
                    type="number"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    placeholder="לדוגמה: +10 או -5"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    הזן מספר חיובי להוספה או שלילי להפחתה
                  </p>
                  {adjustmentQuantity && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      מלאי חדש: <span className="font-semibold">
                        {selectedItem.available + (parseInt(adjustmentQuantity) || 0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <Label>סיבה (אופציונלי)</Label>
                  <Input
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="לדוגמה: החזרה מלקוח, ספירת מלאי"
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setAdjustmentDialogOpen(false);
                setSelectedItem(null);
                setAdjustmentQuantity('');
                setAdjustmentReason('');
              }}
              disabled={adjusting}
            >
              ביטול
            </Button>
            <Button
              onClick={handleAdjustInventory}
              disabled={adjusting || !adjustmentQuantity}
            >
              {adjusting ? 'מעדכן...' : 'עדכן מלאי'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

