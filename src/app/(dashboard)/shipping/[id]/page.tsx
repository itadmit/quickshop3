'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HiSave, HiX, HiTrash, HiPlus } from 'react-icons/hi';
import { ShippingZone, ShippingRate } from '@/types/payment';

export default function ShippingZoneDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params.id as string;
  const isNew = zoneId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    countries: [] as string[],
    provinces: [] as string[],
  });
  const [rates, setRates] = useState<Omit<ShippingRate, 'id'>[]>([]);
  const [newRate, setNewRate] = useState({ name: '', price: '' });

  useEffect(() => {
    if (!isNew && zoneId) {
      loadZone();
    }
  }, [zoneId, isNew]);

  const loadZone = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shipping/zones/${zoneId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load zone');
      const data = await response.json();
      const zone = data.zone;
      setFormData({
        name: zone.name || '',
        countries: zone.countries || [],
        provinces: zone.provinces || [],
      });
      setRates(zone.rates || []);
    } catch (error) {
      console.error('Error loading zone:', error);
      alert('שגיאה בטעינת אזור המשלוח');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = isNew ? '/api/shipping/zones' : `/api/shipping/zones/${zoneId}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          countries: formData.countries,
          provinces: formData.provinces,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save zone');
      }

      const data = await response.json();
      const savedZoneId = data.zone.id;
      
      // Save rates if zone was created
      if (rates.length > 0 && savedZoneId) {
        for (const rate of rates) {
          await fetch(`/api/shipping/zones/${savedZoneId}/rates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              name: rate.name,
              price: rate.price,
            }),
          });
        }
      }

      router.push('/shipping');
    } catch (error: any) {
      console.error('Error saving zone:', error);
      alert(error.message || 'שגיאה בשמירת אזור המשלוח');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRate = () => {
    if (!newRate.name || !newRate.price) return;
    setRates([...rates, {
      shipping_zone_id: parseInt(zoneId) || 0,
      name: newRate.name,
      price: newRate.price,
      min_order_subtotal: null,
      max_order_subtotal: null,
      min_weight: null,
      max_weight: null,
      free_shipping_threshold: null,
      delivery_days_min: null,
      delivery_days_max: null,
      carrier_service_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    }]);
    setNewRate({ name: '', price: '' });
  };

  const handleRemoveRate = (index: number) => {
    setRates(rates.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את אזור המשלוח?')) return;
    
    try {
      const response = await fetch(`/api/shipping/zones/${zoneId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete zone');
      router.push('/shipping');
    } catch (error) {
      console.error('Error deleting zone:', error);
      alert('שגיאה במחיקת אזור המשלוח');
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
          {isNew ? 'אזור משלוח חדש' : 'עריכת אזור משלוח'}
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
                שם אזור המשלוח *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="לדוגמה: ישראל, אירופה, כל העולם"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מדינות (מופרדות בפסיק)
              </label>
              <Input
                value={formData.countries.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  countries: e.target.value.split(',').map(c => c.trim()).filter(c => c),
                })}
                placeholder="IL, US, GB"
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-gray-500 mt-1">
                השאר ריק לכל המדינות. השתמש בקודי מדינה (IL, US, GB וכו')
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תעריפי משלוח
              </label>
              <div className="space-y-3">
                {rates.map((rate, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{rate.name}</div>
                      <div className="text-sm text-gray-600">₪{parseFloat(rate.price).toLocaleString('he-IL')}</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRate(index)}
                      className="text-red-600"
                    >
                      <HiTrash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newRate.name}
                    onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
                    placeholder="שם תעריף"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={newRate.price}
                    onChange={(e) => setNewRate({ ...newRate, price: e.target.value })}
                    placeholder="מחיר"
                    className="w-32"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    onClick={handleAddRate}
                    disabled={!newRate.name || !newRate.price}
                  >
                    <HiPlus className="w-4 h-4 ml-1" />
                    הוסף
                  </Button>
                </div>
              </div>
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

