'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { HiCube, HiExclamationCircle, HiPencil, HiPlus, HiClock, HiDownload } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { getVariantDisplayName } from '@/lib/utils/variant-display';

interface InventoryItem {
  id: number;
  product_title: string;
  variant_title: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
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
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

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
        option1: item.option1 || null,
        option2: item.option2 || null,
        option3: item.option3 || null,
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
          option1: item.option1 || null,
          option2: item.option2 || null,
          option3: item.option3 || null,
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

  const loadHistory = async (variantId?: number) => {
    try {
      setLoadingHistory(true);
      const params = new URLSearchParams();
      if (variantId) params.append('variant_id', variantId.toString());
      const response = await fetch(`/api/inventory/history?${params.toString()}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const columns: TableColumn<InventoryItem>[] = [
    {
      key: 'product',
      label: 'מוצר',
      render: (item) => {
        const variantDisplay = getVariantDisplayName(
          item.variant_title,
          item.option1,
          item.option2,
          item.option3
        );

        return (
          <div>
            <div className="font-medium text-gray-900">{item.product_title}</div>
            {variantDisplay && (
              <div className="text-sm text-gray-500">{variantDisplay}</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'sku',
      label: 'מקט',
      render: (item) => (
        <div className="text-gray-900">
          {item.sku || '-'}
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
      key: 'actions',
      label: 'פעולות',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedVariantId(item.id);
              setShowHistory(true);
              loadHistory(item.id);
            }}
            title="היסטוריית מלאי"
          >
            <HiClock className="w-4 h-4 ml-1" />
            היסטוריה
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openAdjustmentDialog(item)}
          >
            <HiPencil className="w-4 h-4 ml-1" />
            עדכן
          </Button>
        </div>
      ),
    },
  ];

  const filteredItems = showLowStockOnly 
    ? items.filter(item => item.available < 10)
    : items;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">מלאי</h1>
          <p className="text-sm md:text-base text-gray-600">נהל ועקוב אחר המלאי שלך</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedVariantId(null);
              setShowHistory(!showHistory);
              if (!showHistory) loadHistory();
            }}
          >
            <HiClock className="w-4 h-4 ml-2" />
            היסטוריה כללית
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <div className="p-4 md:p-6">
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
                    {(() => {
                      const variantDisplay = getVariantDisplayName(
                        item.variant_title,
                        item.option1,
                        item.option2,
                        item.option3
                      );
                      return variantDisplay && (
                        <div className="text-sm text-gray-500">{variantDisplay}</div>
                      );
                    })()}
                    {item.sku && (
                      <div className="text-xs text-gray-400">מקט: {item.sku}</div>
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

      {/* DataTable wrapped in Card */}
      <Card className="overflow-hidden">
        <div className="p-4 md:p-6">
          <DataTable
            title=""
            description=""
            searchPlaceholder="חיפוש במלאי..."
            onSearch={setSearchTerm}
            columns={columns}
            data={filteredItems}
            keyExtractor={(item) => item.id}
            loading={loading}
            noPadding={true}
            emptyState={
              <div className="text-center py-12">
                <HiCube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {showLowStockOnly ? 'אין פריטים עם מלאי נמוך' : 'אין פריטי מלאי להצגה'}
                </p>
              </div>
            }
          />
        </div>
      </Card>

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
                    {(() => {
                      const variantDisplay = getVariantDisplayName(
                        selectedItem.variant_title,
                        selectedItem.option1,
                        selectedItem.option2,
                        selectedItem.option3
                      );
                      return variantDisplay && (
                        <div className="text-sm text-gray-500">{variantDisplay}</div>
                      );
                    })()}
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

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={(open) => {
        setShowHistory(open);
        if (!open) {
          setSelectedVariantId(null);
          setHistory([]);
        }
      }}>
        <DialogContent dir="rtl" className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedVariantId 
                ? `היסטוריית מלאי - ${items.find(i => i.id === selectedVariantId)?.product_title || 'מוצר'}`
                : 'היסטוריית מלאי - כל המוצרים'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {loadingHistory ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                אין היסטוריה להצגה
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {history
                  // סינון רשומות ריקות - רק אלה שיש להן מידע על שינוי מלאי
                  .filter((item: any) => {
                    // נסה לפרסר context
                    let ctx: any = {};
                    try {
                      if (typeof item.context === 'string') {
                        const cleaned = item.context.replace(/^[^{]*{/, '{').replace(/}[^}]*$/, '}');
                        ctx = JSON.parse(cleaned);
                      } else if (item.context) {
                        ctx = item.context;
                      }
                    } catch (e) {}
                    
                    // בדוק אם יש מידע על כמויות
                    const hasQuantityData = 
                      item.new_quantity !== null && item.new_quantity !== undefined ||
                      item.old_quantity !== null && item.old_quantity !== undefined ||
                      ctx.quantity !== undefined ||
                      ctx.new_quantity !== undefined ||
                      ctx.old_quantity !== undefined ||
                      ctx.change !== undefined;
                    
                    return hasQuantityData;
                  })
                  .map((item: any, index) => {
                  // נסה לפרסר את ה-context אם זה JSON string
                  let contextData: any = {};
                  try {
                    if (typeof item.context === 'string') {
                      // נסה לפרסר JSON
                      const cleaned = item.context.replace(/^[^{]*{/, '{').replace(/}[^}]*$/, '}');
                      contextData = JSON.parse(cleaned);
                    } else if (item.context) {
                      contextData = item.context;
                    }
                  } catch (e) {
                    // אם זה לא JSON, ננסה למצוא את הנתונים ישירות מה-message
                    contextData = item.context || {};
                  }

                  // נסה למצוא variant_id, quantity, old_quantity מה-context או מה-API response
                  const variantId = item.variant_id || contextData.variant_id || contextData.variantId;
                  // השתמש בנתונים מה-API response ישירות (שנוספו ב-SELECT)
                  const quantity = item.new_quantity !== null && item.new_quantity !== undefined 
                    ? item.new_quantity 
                    : (contextData.quantity || contextData.new_quantity);
                  const oldQuantity = item.old_quantity !== null && item.old_quantity !== undefined
                    ? item.old_quantity
                    : (contextData.old_quantity || contextData.oldQuantity);
                  const change = item.change !== null && item.change !== undefined
                    ? item.change
                    : (contextData.change || (quantity !== undefined && oldQuantity !== undefined ? quantity - oldQuantity : null));
                  const reason = contextData.reason || contextData.reason_text || 'עדכון מלאי';
                  
                  // השתמש בנתונים מה-API response אם יש
                  const productTitle = item.product_title || (variantId ? items.find(i => i.id === variantId)?.product_title : null) || 'מוצר לא ידוע';
                  const variantTitle = item.variant_title || (variantId ? items.find(i => i.id === variantId)?.variant_title : null);
                  const sku = item.sku || (variantId ? items.find(i => i.id === variantId)?.sku : null);
                  // לא להציג "Default Title" - זה לא מועיל למשתמש
                  const cleanVariantTitle = variantTitle && variantTitle !== 'Default Title' ? variantTitle : null;
                  const variantDisplay = cleanVariantTitle || (item.option1 || item.option2 || item.option3 
                    ? getVariantDisplayName(null, item.option1, item.option2, item.option3)
                    : null);
                  
                  const quantityChange = change !== null && change !== undefined
                    ? change
                    : (quantity !== undefined && oldQuantity !== undefined 
                      ? quantity - oldQuantity 
                      : null);
                  
                  return (
                    <div key={item.id || index} className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* כותרת עם שם המוצר */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.level === 'error'
                                ? 'bg-red-100 text-red-800'
                                : item.level === 'warn'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.level === 'error' ? 'שגיאה' : item.level === 'warn' ? 'אזהרה' : 'עדכון'}
                            </span>
                            <span className="text-base font-semibold text-gray-900">
                              {productTitle}
                            </span>
                          </div>
                          
                          {/* פרטי הווריאנט */}
                          {(variantDisplay || sku) && (
                            <div className="mb-3 space-y-1">
                              {variantDisplay && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">ווריאנט:</span> {variantDisplay}
                                </div>
                              )}
                              {sku && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">מקט:</span> {sku}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* פרטי השינוי בכמות - מציגים רק אם יש נתונים */}
                          {(quantity !== undefined || oldQuantity !== undefined) ? (
                            <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-4 flex-wrap">
                                {oldQuantity !== undefined && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">לפני:</span>{' '}
                                    <span className="font-semibold text-gray-700">{oldQuantity}</span>
                                  </div>
                                )}
                                {quantity !== undefined && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">אחרי:</span>{' '}
                                    <span className="font-semibold text-gray-900 text-lg">{quantity}</span>
                                  </div>
                                )}
                                {quantityChange !== null && quantityChange !== 0 && (
                                  <div className={`text-sm font-semibold ${
                                    quantityChange > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {quantityChange > 0 ? '+' : ''}{quantityChange}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                          
                          {/* סיבה */}
                          {reason && reason !== 'עדכון מלאי' && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">סיבה:</span> {reason}
                            </div>
                          )}
                          
                          {/* תאריך */}
                          <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
                            {new Date(item.created_at).toLocaleString('he-IL', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

