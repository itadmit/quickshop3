'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash,
  HiTag,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiRefresh
} from 'react-icons/hi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog';

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  value_type: string;
  max_discount: number | null;
  applicable_plans: string[];
  first_time_only: boolean;
  max_uses: number | null;
  current_uses: number;
  starts_at: string;
  expires_at: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  extra_trial_days: 'ימי ניסיון נוספים',
  free_months: 'חודשים חינם',
  first_payment_discount: 'הנחה מתשלום ראשון',
  recurring_discount: 'הנחה קבועה',
};

const defaultCoupon = {
  code: '',
  type: 'first_payment_discount',
  value: 0,
  value_type: 'fixed',
  max_discount: null as number | null,
  applicable_plans: [] as string[],
  first_time_only: true,
  max_uses: null as number | null,
  starts_at: new Date().toISOString().split('T')[0],
  expires_at: '',
  description: '',
};

export default function AdminCouponsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState(defaultCoupon);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/coupons', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      } else if (response.status === 403) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData(defaultCoupon);
    setShowDialog(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      value_type: coupon.value_type,
      max_discount: coupon.max_discount,
      applicable_plans: coupon.applicable_plans || [],
      first_time_only: coupon.first_time_only,
      max_uses: coupon.max_uses,
      starts_at: coupon.starts_at?.split('T')[0] || '',
      expires_at: coupon.expires_at?.split('T')[0] || '',
      description: coupon.description || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingCoupon 
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons';
      
      const method = editingCoupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          max_discount: formData.max_discount || null,
          max_uses: formData.max_uses || null,
          expires_at: formData.expires_at || null,
        }),
      });

      if (response.ok) {
        setShowDialog(false);
        fetchCoupons();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save coupon');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('שגיאה בשמירת הקופון');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`האם למחוק את הקופון ${coupon.code}?`)) return;

    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchCoupons();
      } else {
        alert('Failed to delete coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });

      if (response.ok) {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const formatValue = (coupon: Coupon) => {
    switch (coupon.type) {
      case 'extra_trial_days':
        return `${coupon.value} ימים`;
      case 'free_months':
        return `${coupon.value} חודשים`;
      case 'first_payment_discount':
      case 'recurring_discount':
        return coupon.value_type === 'percent' 
          ? `${coupon.value}%` 
          : `₪${coupon.value}`;
      default:
        return coupon.value.toString();
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('he-IL');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">קופונים</h1>
          <p className="text-gray-600 mt-1">ניהול קופוני הנחה לפלטפורמה</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCoupons}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <HiRefresh className="w-5 h-5" />
            רענן
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            <HiPlus className="w-5 h-5" />
            קופון חדש
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <HiTag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>אין קופונים עדיין</p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 text-primary hover:underline"
            >
              צור קופון ראשון
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">קוד</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">סוג</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">ערך</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">שימושים</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">תוקף</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">סטטוס</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {coupon.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {typeLabels[coupon.type] || coupon.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatValue(coupon)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {coupon.current_uses} / {coupon.max_uses || '∞'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {coupon.expires_at ? formatDate(coupon.expires_at) : 'ללא הגבלה'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          coupon.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {coupon.is_active ? (
                          <>
                            <HiCheckCircle className="w-3 h-3" />
                            פעיל
                          </>
                        ) : (
                          <>
                            <HiXCircle className="w-3 h-3" />
                            מושבת
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(coupon)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                          title="עריכה"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="מחיקה"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent maxWidth="lg">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'עריכת קופון' : 'יצירת קופון חדש'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  קוד קופון
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  disabled={!!editingCoupon}
                  placeholder="לדוגמה: WELCOME50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סוג קופון
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="extra_trial_days">ימי ניסיון נוספים</option>
                  <option value="free_months">חודשים חינם</option>
                  <option value="first_payment_discount">הנחה מתשלום ראשון</option>
                  <option value="recurring_discount">הנחה קבועה</option>
                </select>
              </div>

              {/* Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ערך
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                {(formData.type === 'first_payment_discount' || formData.type === 'recurring_discount') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      סוג ערך
                    </label>
                    <select
                      value={formData.value_type}
                      onChange={(e) => setFormData({ ...formData, value_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="fixed">סכום קבוע (₪)</option>
                      <option value="percent">אחוזים (%)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Max Discount (for percent) */}
              {formData.value_type === 'percent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    הנחה מקסימלית (₪)
                  </label>
                  <input
                    type="number"
                    value={formData.max_discount || ''}
                    onChange={(e) => setFormData({ ...formData, max_discount: parseFloat(e.target.value) || null })}
                    placeholder="ללא הגבלה"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מגבלת שימושים
                  </label>
                  <input
                    type="number"
                    value={formData.max_uses || ''}
                    onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || null })}
                    placeholder="ללא הגבלה"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.first_time_only}
                      onChange={(e) => setFormData({ ...formData, first_time_only: e.target.checked })}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">רק ללקוחות חדשים</span>
                  </label>
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תאריך התחלה
                  </label>
                  <input
                    type="date"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תאריך סיום
                  </label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור (פנימי)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="תיאור פנימי לקופון..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <button
              onClick={() => setShowDialog(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.code || !formData.value}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
            >
              {saving ? 'שומר...' : editingCoupon ? 'שמור שינויים' : 'צור קופון'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

