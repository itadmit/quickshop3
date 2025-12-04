'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HiSave, HiX, HiTrash } from 'react-icons/hi';
import { LoyaltyProgramRule } from '@/types/loyalty';

export default function LoyaltyRuleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ruleId = params.id as string;
  const isNew = ruleId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rule_type: 'purchase' as 'purchase' | 'signup' | 'review' | 'referral',
    points_amount: 0,
    is_active: true,
  });

  useEffect(() => {
    if (!isNew && ruleId) {
      loadRule();
    }
  }, [ruleId, isNew]);

  const loadRule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/loyalty/rules/${ruleId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load rule');
      const data = await response.json();
      const rule = data.rule;
      setFormData({
        name: rule.name || '',
        rule_type: rule.rule_type || 'purchase',
        points_amount: rule.points_amount || 0,
        is_active: rule.is_active !== undefined ? rule.is_active : true,
      });
    } catch (error) {
      console.error('Error loading rule:', error);
      alert('שגיאה בטעינת החוק');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = isNew ? '/api/loyalty/rules' : `/api/loyalty/rules/${ruleId}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          rule_type: formData.rule_type,
          points_amount: formData.points_amount,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save rule');
      }

      router.push('/loyalty');
    } catch (error: any) {
      console.error('Error saving rule:', error);
      alert(error.message || 'שגיאה בשמירת החוק');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את החוק?')) return;
    
    try {
      const response = await fetch(`/api/loyalty/rules/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete rule');
      router.push('/loyalty');
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('שגיאה במחיקת החוק');
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
          {isNew ? 'חוק צבירת נקודות חדש' : 'עריכת חוק צבירת נקודות'}
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
                שם החוק *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="לדוגמה: נקודות על רכישה"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג חוק *
              </label>
              <select
                value={formData.rule_type}
                onChange={(e) => setFormData({ ...formData, rule_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="purchase">רכישה</option>
                <option value="signup">הרשמה</option>
                <option value="review">ביקורת</option>
                <option value="referral">המלצה</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כמות נקודות *
              </label>
              <Input
                type="number"
                value={formData.points_amount}
                onChange={(e) => setFormData({ ...formData, points_amount: parseInt(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                חוק פעיל
              </label>
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

