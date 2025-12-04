'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HiSave, HiX, HiTrash } from 'react-icons/hi';
import { CustomerLoyaltyTier } from '@/types/loyalty';

export default function LoyaltyTierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tierId = params.id as string;
  const isNew = tierId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tier_level: 1,
    min_points: 0,
    discount_percentage: '0',
    benefits: '',
  });

  useEffect(() => {
    if (!isNew && tierId) {
      loadTier();
    }
  }, [tierId, isNew]);

  const loadTier = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/loyalty/tiers/${tierId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load tier');
      const data = await response.json();
      const tier = data.tier;
      setFormData({
        name: tier.name || '',
        tier_level: tier.tier_level || 1,
        min_points: tier.min_points || 0,
        discount_percentage: tier.discount_percentage || '0',
        benefits: tier.benefits ? JSON.stringify(tier.benefits) : '',
      });
    } catch (error) {
      console.error('Error loading tier:', error);
      alert('שגיאה בטעינת הרמה');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = isNew ? '/api/loyalty/tiers' : `/api/loyalty/tiers/${tierId}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          tier_level: formData.tier_level,
          min_points: formData.min_points,
          discount_percentage: formData.discount_percentage,
          benefits: formData.benefits ? JSON.parse(formData.benefits) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save tier');
      }

      router.push('/loyalty');
    } catch (error: any) {
      console.error('Error saving tier:', error);
      alert(error.message || 'שגיאה בשמירת הרמה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הרמה?')) return;
    
    try {
      const response = await fetch(`/api/loyalty/tiers/${tierId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete tier');
      router.push('/loyalty');
    } catch (error) {
      console.error('Error deleting tier:', error);
      alert('שגיאה במחיקת הרמה');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'רמת נאמנות חדשה' : 'עריכת רמת נאמנות'}
        </h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="ghost" onClick={handleDelete} className="text-red-600">
              <HiTrash className="w-5 h-5 ml-2" />
              מחק
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.back()}>
            <HiX className="w-5 h-5 ml-2" />
            ביטול
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם הרמה *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="לדוגמה: כסף, זהב, פלטינה"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  רמה (מספר) *
                </label>
                <Input
                  type="number"
                  value={formData.tier_level}
                  onChange={(e) => setFormData({ ...formData, tier_level: parseInt(e.target.value) || 1 })}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  נקודות מינימום *
                </label>
                <Input
                  type="number"
                  value={formData.min_points}
                  onChange={(e) => setFormData({ ...formData, min_points: parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אחוז הנחה *
              </label>
              <Input
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                אחוז הנחה שיקבלו לקוחות ברמה זו
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הטבות נוספות (JSON)
              </label>
              <textarea
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder='{"free_shipping": true, "early_access": true}'
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                הטבות נוספות בפורמט JSON (אופציונלי)
              </p>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </form>
    </div>
  );
}

