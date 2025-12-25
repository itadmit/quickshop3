'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiPlus, HiPencil, HiTrash, HiUsers, HiCheckCircle, HiXCircle, HiKey, HiLink } from 'react-icons/hi';
import { InfluencerWithStats } from '@/types/influencer';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface DiscountCode {
  id: number;
  code: string;
  discount_type: string;
  value: number | null;
}

export default function InfluencersPage() {
  const { toast } = useOptimisticToast();
  const [influencers, setInfluencers] = useState<InfluencerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<InfluencerWithStats | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<DiscountCode[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    instagram_handle: '',
    tiktok_handle: '',
    coupon_ids: [] as number[],
  });
  const [resetPasswordData, setResetPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const copyLoginLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const loginUrl = `${baseUrl}/influencer/login`;
    
    navigator.clipboard.writeText(loginUrl).then(() => {
      toast({
        title: 'הועתק',
        description: 'קישור ההתחברות הועתק ללוח',
        variant: 'success',
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = loginUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          title: 'הועתק',
          description: 'קישור ההתחברות הועתק ללוח',
          variant: 'success',
        });
      } catch (err) {
        toast({
          title: 'שגיאה',
          description: 'לא ניתן להעתיק את הקישור',
          variant: 'error',
        });
      }
      document.body.removeChild(textArea);
    });
  };

  useEffect(() => {
    loadInfluencers();
  }, [searchTerm]);

  useEffect(() => {
    loadAvailableCoupons();
  }, [influencers]);

  const loadInfluencers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '50');

      const response = await fetch(`/api/influencers?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load influencers');
      const data = await response.json();
      setInfluencers(data.influencers || []);
    } catch (error) {
      console.error('Error loading influencers:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת המשפיענים',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCoupons = async () => {
    try {
      const response = await fetch('/api/discounts?is_active=true', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out coupons that are already assigned to OTHER influencers (not the current one being edited)
        const assignedCouponIds = new Set(
          influencers.flatMap(inf => {
            // If editing, exclude coupons of the current influencer being edited
            // This allows them to appear in the list so they can be checked/unchecked
            if (editingInfluencer && inf.id === editingInfluencer.id) {
              return [];
            }
            return inf.coupons.map(c => c.id);
          })
        );
        // Include all coupons that are either:
        // 1. Not assigned to any influencer, OR
        // 2. Already assigned to the current influencer being edited
        setAvailableCoupons(
          (data.discounts || []).filter((c: any) => {
            // If coupon is assigned to current influencer, include it
            if (editingInfluencer && editingInfluencer.coupons.some(cp => cp.id === c.id)) {
              return true;
            }
            // Otherwise, only include if not assigned to any other influencer
            return !assignedCouponIds.has(c.id);
          })
        );
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
    }
  };

  const handleCreate = async () => {
    console.log('handleCreate called', formData);
    
    if (!formData.name || !formData.email || !formData.password) {
      console.log('Validation failed: missing fields');
      toast({
        title: 'שגיאה',
        description: 'שם, אימייל וסיסמה נדרשים',
        variant: 'error',
      });
      return;
    }

    if (formData.password.length < 8) {
      console.log('Validation failed: password too short');
      toast({
        title: 'שגיאה',
        description: 'סיסמה חייבת להכיל לפחות 8 תווים',
        variant: 'error',
      });
      return;
    }

    console.log('Starting to create influencer...');
    setCreating(true);
    try {
      const response = await fetch('/api/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create influencer');
      }

      toast({
        title: 'הצלחה',
        description: 'משפיען נוצר בהצלחה',
        variant: 'success',
      });

      setCreateDialogOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        instagram_handle: '',
        tiktok_handle: '',
        coupon_ids: [],
      });
      await loadInfluencers();
      await loadAvailableCoupons();
    } catch (error: any) {
      console.error('Error creating influencer:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת המשפיען',
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (influencer: InfluencerWithStats) => {
    setEditingInfluencer(influencer);
    setFormData({
      name: influencer.name,
      email: influencer.email,
      password: '', // Don't show password
      phone: influencer.phone || '',
      instagram_handle: influencer.instagram_handle || '',
      tiktok_handle: influencer.tiktok_handle || '',
      coupon_ids: influencer.coupons.map(c => c.id),
    });
    setEditDialogOpen(true);
    // ✅ טעינת קופונים זמינים לאחר הגדרת המשפיען לעריכה
    await loadAvailableCoupons();
  };

  const handleUpdate = async () => {
    if (!editingInfluencer) return;

    if (!formData.name || !formData.email) {
      toast({
        title: 'שגיאה',
        description: 'שם ואימייל נדרשים',
        variant: 'error',
      });
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/influencers/${editingInfluencer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          instagram_handle: formData.instagram_handle,
          tiktok_handle: formData.tiktok_handle,
          coupon_ids: formData.coupon_ids,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update influencer');
      }

      toast({
        title: 'הצלחה',
        description: 'משפיען עודכן בהצלחה',
        variant: 'success',
      });

      setEditDialogOpen(false);
      setEditingInfluencer(null);
      await loadInfluencers();
      await loadAvailableCoupons();
    } catch (error: any) {
      console.error('Error updating influencer:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון המשפיען',
        variant: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשפיען הזה?')) return;

    try {
      const response = await fetch(`/api/influencers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete influencer');

      toast({
        title: 'הצלחה',
        description: 'משפיען נמחק בהצלחה',
        variant: 'success',
      });

      loadInfluencers();
      loadAvailableCoupons();
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת המשפיען',
        variant: 'error',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!editingInfluencer) return;

    if (!resetPasswordData.new_password || !resetPasswordData.confirm_password) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את כל השדות',
        variant: 'error',
      });
      return;
    }

    if (resetPasswordData.new_password !== resetPasswordData.confirm_password) {
      toast({
        title: 'שגיאה',
        description: 'הסיסמאות לא תואמות',
        variant: 'error',
      });
      return;
    }

    if (resetPasswordData.new_password.length < 8) {
      toast({
        title: 'שגיאה',
        description: 'סיסמה חייבת להכיל לפחות 8 תווים',
        variant: 'error',
      });
      return;
    }

    setResettingPassword(true);
    try {
      const response = await fetch(`/api/influencers/${editingInfluencer.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          new_password: resetPasswordData.new_password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast({
        title: 'הצלחה',
        description: 'סיסמה עודכנה בהצלחה',
        variant: 'success',
      });

      setResetPasswordDialogOpen(false);
      setResetPasswordData({
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה באיפוס הסיסמה',
        variant: 'error',
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const columns: TableColumn<InfluencerWithStats>[] = [
    {
      key: 'name',
      label: 'שם',
      render: (influencer) => (
        <div className="font-medium text-gray-900">{influencer.name}</div>
      ),
    },
    {
      key: 'email',
      label: 'אימייל',
      render: (influencer) => (
        <div className="text-gray-600">{influencer.email}</div>
      ),
    },
    {
      key: 'coupons',
      label: 'קופונים',
      render: (influencer) => (
        <div className="flex flex-wrap gap-1">
          {influencer.coupons.length > 0 ? (
            influencer.coupons.map((coupon) => (
              <span
                key={coupon.id}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                {coupon.code}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-sm">אין קופונים</span>
          )}
        </div>
      ),
    },
    {
      key: 'total_sales',
      label: 'סה"כ מכירות',
      render: (influencer) => (
        <div className="font-medium text-gray-900">
          ₪{influencer.total_sales.toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'total_orders',
      label: 'הזמנות',
      render: (influencer) => (
        <div className="text-gray-600">{influencer.total_orders}</div>
      ),
    },
    {
      key: 'is_active',
      label: 'סטטוס',
      render: (influencer) => (
        <div className="flex items-center gap-2">
          {influencer.is_active ? (
            <>
              <HiCheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-600">פעיל</span>
            </>
          ) : (
            <>
              <HiXCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-600">לא פעיל</span>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="משפיענים"
        description="נהל משפיענים ושייך להם קופונים"
        primaryAction={{
          label: 'משפיען חדש',
          onClick: () => setCreateDialogOpen(true),
          icon: <HiPlus className="w-4 h-4" />,
        }}
        secondaryActions={[
          {
            label: 'העתק קישור התחברות',
            onClick: copyLoginLink,
          },
        ]}
        searchPlaceholder="חיפוש משפיענים..."
        onSearch={setSearchTerm}
        columns={columns}
        data={influencers}
        keyExtractor={(inf) => inf.id}
        loading={loading}
        rowActions={(influencer) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(influencer);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="ערוך"
            >
              <HiPencil className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingInfluencer(influencer);
                setResetPasswordDialogOpen(true);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="איפוס סיסמה"
            >
              <HiKey className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(influencer.id);
              }}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="מחק"
            >
              <HiTrash className="w-5 h-5 text-red-600" />
            </button>
          </div>
        )}
        emptyState={
          <div className="text-center py-12">
            <HiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין משפיענים</p>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              צור משפיען ראשון
            </button>
          </div>
        }
      />

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>משפיען חדש</DialogTitle>
            <DialogDescription>הוסף משפיען חדש ושייך לו קופונים</DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="px-6 py-4 space-y-4">
            <div>
              <Label>שם מלא *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="שם המשפיען"
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label>אימייל *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label>סיסמה *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="לפחות 8 תווים"
                className="mt-2"
                required
                minLength={8}
              />
            </div>

            <div>
              <Label>טלפון</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="050-1234567"
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Instagram Handle</Label>
                <Input
                  value={formData.instagram_handle}
                  onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                  placeholder="@username"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>TikTok Handle</Label>
                <Input
                  value={formData.tiktok_handle}
                  onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
                  placeholder="@username"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>קופונים לשיוך</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {availableCoupons.length === 0 ? (
                  <p className="text-sm text-gray-500">אין קופונים זמינים</p>
                ) : (
                  availableCoupons.map((coupon) => (
                    <label key={coupon.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.coupon_ids.includes(coupon.id)}
                        onChange={(e) => {
                          // ✅ שימוש ב-functional update כדי למנוע בעיות closure
                          setFormData((prev) => {
                            if (e.target.checked) {
                              return {
                                ...prev,
                                coupon_ids: [...prev.coupon_ids, coupon.id],
                              };
                            } else {
                              return {
                                ...prev,
                                coupon_ids: prev.coupon_ids.filter((id) => id !== coupon.id),
                              };
                            }
                          });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {coupon.code} ({coupon.discount_type === 'percentage' ? `${coupon.value}%` : coupon.value ? `₪${coupon.value}` : 'null'})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    instagram_handle: '',
                    tiktok_handle: '',
                    coupon_ids: [],
                  });
                }}
                disabled={creating}
              >
                ביטול
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'יוצר...' : 'צור משפיען'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ערוך משפיען</DialogTitle>
            <DialogDescription>עדכן את פרטי המשפיען</DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            <div>
              <Label>שם מלא *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="שם המשפיען"
                className="mt-2"
              />
            </div>

            <div>
              <Label>אימייל *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="mt-2"
              />
            </div>

            <div>
              <Label>טלפון</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="050-1234567"
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Instagram Handle</Label>
                <Input
                  value={formData.instagram_handle}
                  onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                  placeholder="@username"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>TikTok Handle</Label>
                <Input
                  value={formData.tiktok_handle}
                  onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
                  placeholder="@username"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>קופונים משוייכים</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {availableCoupons.length === 0 ? (
                  <p className="text-sm text-gray-500">אין קופונים זמינים</p>
                ) : (
                  // ✅ הצגת כל הקופונים הזמינים ברשימה אחת
                  availableCoupons.map((coupon) => (
                    <label key={coupon.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.coupon_ids.includes(coupon.id)}
                        onChange={(e) => {
                          // ✅ שימוש ב-functional update כדי למנוע בעיות closure
                          setFormData((prev) => {
                            if (e.target.checked) {
                              return {
                                ...prev,
                                coupon_ids: [...prev.coupon_ids, coupon.id],
                              };
                            } else {
                              return {
                                ...prev,
                                coupon_ids: prev.coupon_ids.filter((id) => id !== coupon.id),
                              };
                            }
                          });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {coupon.code} ({coupon.discount_type === 'percentage' ? `${coupon.value}%` : coupon.value ? `₪${coupon.value}` : 'null'})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setEditDialogOpen(false)} disabled={updating}>
                ביטול
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>איפוס סיסמה</DialogTitle>
            <DialogDescription>
              הגדר סיסמה חדשה עבור {editingInfluencer?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            <div>
              <Label>סיסמה חדשה *</Label>
              <Input
                type="password"
                value={resetPasswordData.new_password}
                onChange={(e) =>
                  setResetPasswordData({ ...resetPasswordData, new_password: e.target.value })
                }
                placeholder="לפחות 8 תווים"
                className="mt-2"
              />
            </div>

            <div>
              <Label>אימות סיסמה *</Label>
              <Input
                type="password"
                value={resetPasswordData.confirm_password}
                onChange={(e) =>
                  setResetPasswordData({ ...resetPasswordData, confirm_password: e.target.value })
                }
                placeholder="הזן שוב את הסיסמה"
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setResetPasswordDialogOpen(false);
                  setResetPasswordData({
                    new_password: '',
                    confirm_password: '',
                  });
                }}
                disabled={resettingPassword}
              >
                ביטול
              </Button>
              <Button onClick={handleResetPassword} disabled={resettingPassword}>
                {resettingPassword ? 'מאפס...' : 'איפוס סיסמה'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

