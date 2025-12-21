'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiCreditCard, HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface StoreCredit {
  id: number;
  customer_id: number;
  customer_name: string;
  balance: string;
  total_deposits: string;
  expires_at: Date | null;
  created_at: Date;
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
        <DialogContent>
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
    </>
  );
}

