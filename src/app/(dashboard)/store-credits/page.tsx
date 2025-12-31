'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiCreditCard, HiPlus, HiPencil, HiTrash, HiClipboardList, HiArrowUp, HiArrowDown, HiClock, HiShoppingCart, HiRefresh, HiCog } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface StoreCreditTransaction {
  id: number;
  store_credit_id: number;
  amount: string;
  transaction_type: string;
  description: string | null;
  order_id: number | null;
  created_at: string;
}

interface StoreCredit {
  id: number;
  customer_id: number;
  customer_name: string;
  balance: string;
  total_deposits: string;
  expires_at: Date | null;
  created_at: Date;
  transactions?: StoreCreditTransaction[];
}

export default function StoreCreditsPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [credits, setCredits] = useState<StoreCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingCredit, setEditingCredit] = useState<StoreCredit | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyCredit, setHistoryCredit] = useState<StoreCredit | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<StoreCreditTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadCredits();
  }, [searchTerm]);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/store-credits');
      if (!response.ok) throw new Error('Failed to load store credits');
      const data = await response.json();
      
      // Fetch customer names and transactions for each credit
      const creditsWithDetails = await Promise.all(
        (data.store_credits || []).map(async (credit: any) => {
          let customer_name = `לקוח #${credit.customer_id || 'אורח'}`;
          let total_deposits = '0';
          
          // Fetch customer name
          if (credit.customer_id) {
            try {
              const customerRes = await fetch(`/api/customers/${credit.customer_id}`);
              if (customerRes.ok) {
                const customerData = await customerRes.json();
                customer_name = `${customerData.customer?.first_name || ''} ${customerData.customer?.last_name || ''}`.trim() || `לקוח #${credit.customer_id}`;
              }
            } catch (e) {
              // Ignore errors
            }
          }
          
          // Fetch transactions to calculate total deposits
          try {
            const transRes = await fetch(`/api/store-credits/${credit.id}`);
            if (transRes.ok) {
              const transData = await transRes.json();
              const transactions = transData.store_credit?.transactions || [];
              const deposits = transactions
                .filter((t: any) => parseFloat(t.amount) > 0)
                .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
              total_deposits = deposits.toString();
            }
          } catch (e) {
            // Ignore errors
          }
          
          return {
            ...credit,
            customer_name,
            total_deposits,
          };
        })
      );
      
      setCredits(creditsWithDetails);
    } catch (error) {
      console.error('Error loading store credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקרדיט? פעולה זו לא ניתנת לביטול.')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/store-credits/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete store credit');
      
      setCredits(credits.filter(c => c.id !== id));
      toast({
        title: 'הצלחה',
        description: 'הקרדיט נמחק בהצלחה',
      });
    } catch (error) {
      console.error('Error deleting store credit:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה במחיקת קרדיט',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (credit: StoreCredit) => {
    setEditingCredit(credit);
    setEditBalance(credit.balance);
    setEditDescription('');
  };

  const handleSaveEdit = async () => {
    if (!editingCredit) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/store-credits/${editingCredit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: parseFloat(editBalance),
          description: editDescription || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update store credit');

      toast({
        title: 'הצלחה',
        description: 'הקרדיט עודכן בהצלחה',
      });

      setEditingCredit(null);
      loadCredits();
    } catch (error) {
      console.error('Error updating store credit:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון קרדיט',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleViewHistory = async (credit: StoreCredit) => {
    setHistoryCredit(credit);
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/store-credits/${credit.id}`);
      if (response.ok) {
        const data = await response.json();
        setHistoryTransactions(data.store_credit?.transactions || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'deposit': 'הפקדה',
      'withdrawal': 'משיכה',
      'purchase': 'רכישה',
      'refund': 'החזר',
      'manual_adjustment': 'עריכה ידנית',
      'bonus': 'בונוס',
      'expiration': 'פקיעת תוקף',
    };
    return labels[type] || type;
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) return HiArrowUp;
    if (type === 'purchase') return HiShoppingCart;
    if (type === 'refund') return HiRefresh;
    if (type === 'manual_adjustment') return HiCog;
    return HiArrowDown;
  };

  const columns: TableColumn<StoreCredit>[] = [
    {
      key: 'customer',
      label: 'לקוח',
      render: (credit) => (
        <div className="font-medium text-gray-900">{credit.customer_name}</div>
      ),
    },
    {
      key: 'total_deposits',
      label: 'סך הפקדות',
      render: (credit) => (
        <div className="font-semibold text-gray-900">
          ₪{parseFloat(credit.total_deposits || '0').toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'balance',
      label: 'יתרה',
      render: (credit) => {
        const balance = parseFloat(credit.balance);
        const deposits = parseFloat(credit.total_deposits || '0');
        const percentage = deposits > 0 ? (balance / deposits) * 100 : 100;
        return (
          <div>
            <div className={`font-semibold ${balance === 0 ? 'text-red-600' : balance < deposits ? 'text-orange-600' : 'text-green-600'}`}>
              ₪{balance.toLocaleString('he-IL')}
            </div>
            {balance !== deposits && deposits > 0 && (
              <div className="text-xs text-gray-500">
                {percentage.toFixed(0)}% נותר
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'expires_at',
      label: 'תוקף',
      render: (credit) => (
        <div className="text-sm text-gray-600">
          {credit.expires_at
            ? new Date(credit.expires_at).toLocaleDateString('he-IL')
            : 'ללא הגבלה'}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="קרדיט בחנות"
        description="נהל קרדיטים של לקוחות"
        primaryAction={{
          label: 'הוסף קרדיט',
          onClick: () => router.push('/store-credits/new'),
          icon: <HiPlus className="w-4 h-4" />,
        }}
        searchPlaceholder="חיפוש קרדיטים..."
        onSearch={setSearchTerm}
        columns={columns}
        data={credits}
        keyExtractor={(credit) => credit.id}
        rowActions={(credit) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewHistory(credit);
              }}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
              title="היסטוריה"
            >
              <HiClipboardList className="w-5 h-5 text-blue-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(credit);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="ערוך"
            >
              <HiPencil className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(credit.id);
              }}
              disabled={deletingId === credit.id}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="מחק"
            >
              <HiTrash className={`w-5 h-5 ${deletingId === credit.id ? 'text-gray-400' : 'text-red-600'}`} />
            </button>
          </div>
        )}
        loading={loading}
        emptyState={
          <div className="text-center py-12">
            <HiCreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">אין קרדיטים</p>
          </div>
        }
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingCredit} onOpenChange={(open) => !open && setEditingCredit(null)}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>עריכת קרדיט - {editingCredit?.customer_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-balance">יתרה חדשה (₪)</Label>
              <Input
                id="edit-balance"
                type="number"
                step="0.01"
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">סיבת השינוי</Label>
              <Input
                id="edit-description"
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="למשל: תיקון טעות, בונוס מיוחד..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingCredit(null)}
                disabled={saving}
              >
                ביטול
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {saving ? 'שומר...' : 'שמור'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyCredit} onOpenChange={(open) => !open && setHistoryCredit(null)}>
        <DialogContent className="p-0 max-w-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <HiClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div>היסטוריית קרדיט</div>
                <div className="text-sm font-normal text-gray-500 mt-0.5">
                  {historyCredit?.customer_name}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Summary Card */}
          {historyCredit && (
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">יתרה נוכחית</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    ₪{parseFloat(historyCredit.balance).toLocaleString('he-IL')}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500 mb-1">סה״כ הפקדות</div>
                  <div className="text-lg font-semibold text-gray-700">
                    ₪{parseFloat(historyCredit.total_deposits || '0').toLocaleString('he-IL')}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500 mb-1">נוצל</div>
                  <div className="text-lg font-semibold text-gray-700">
                    ₪{(parseFloat(historyCredit.total_deposits || '0') - parseFloat(historyCredit.balance)).toLocaleString('he-IL')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions List */}
          <div className="p-6 max-h-[400px] overflow-y-auto">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : historyTransactions.length > 0 ? (
              <div className="space-y-3">
                {historyTransactions.map((transaction) => {
                  const amount = parseFloat(transaction.amount);
                  const isPositive = amount > 0;
                  const Icon = getTransactionIcon(transaction.transaction_type, amount);
                  return (
                    <div 
                      key={transaction.id} 
                      className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                    >
                      <div className={`p-2.5 rounded-xl ${isPositive ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        <Icon className={`w-5 h-5 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-gray-900">
                            {getTransactionTypeLabel(transaction.transaction_type)}
                          </div>
                          <div className={`font-bold text-lg ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}₪{Math.abs(amount).toLocaleString('he-IL')}
                          </div>
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-gray-600 mb-1.5 line-clamp-2">
                            {transaction.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <HiClock className="w-3.5 h-3.5" />
                          {new Date(transaction.created_at).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {transaction.order_id && (
                            <span className="mr-2 px-2 py-0.5 bg-gray-100 rounded text-gray-500">
                              הזמנה #{transaction.order_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <HiClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">אין היסטוריית תנועות</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setHistoryCredit(null)}
            >
              סגור
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

