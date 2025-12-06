'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { HiSave, HiX, HiUser } from 'react-icons/hi';
import { CreateCustomerRequest } from '@/types/customer';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    accepts_marketing: false,
    tags: [],
    note: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.email.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אימייל הוא שדה חובה',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'שגיאה',
        description: 'כתובת אימייל לא תקינה',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload: CreateCustomerRequest = {
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined,
        first_name: formData.first_name?.trim() || undefined,
        last_name: formData.last_name?.trim() || undefined,
        accepts_marketing: formData.accepts_marketing || false,
        tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
        note: formData.note?.trim() || undefined,
      };

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה ביצירת לקוח');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `לקוח "${data.customer?.email || formData.email}" נוצר בהצלחה`,
      });

      router.push(`/customers/${data.customer?.id}`);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת לקוח',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לקוח חדש</h1>
          <p className="text-gray-500 mt-1">צור לקוח חדש</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <HiX className="w-4 h-4" />
          ביטול
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiUser className="w-5 h-5" />
            פרטי לקוח
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email">אימייל *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@example.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="050-1234567"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="first_name">שם פרטי</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="יוחנן"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="last_name">שם משפחה</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="כהן"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="note">הערה</Label>
              <textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="הערות על הלקוח..."
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="accepts_marketing"
                  checked={formData.accepts_marketing}
                  onChange={(e) => setFormData({ ...formData, accepts_marketing: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <Label htmlFor="accepts_marketing" className="cursor-pointer">
                  הלקוח מסכים לקבל שיווק
                </Label>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            <HiX className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <HiSave className="w-4 h-4 ml-2" />
            {loading ? 'יוצר...' : 'צור לקוח'}
          </Button>
        </div>
      </form>
    </div>
  );
}

