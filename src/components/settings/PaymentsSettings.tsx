'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { PaymentProvider } from '@/types/payment';
import { MenuIcons } from '@/components/icons/MenuIcons';

export function PaymentsSettings() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);
  const [formData, setFormData] = useState({
    provider_name: '',
    environment: 'test' as 'test' | 'production',
    api_public_key: '',
    api_secret_key: '',
    webhook_secret: '',
    is_active: false,
    settings: {} as Record<string, any>,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    loadProviders(signal);

    return () => {
      abortController.abort();
    };
  }, []);

  const loadProviders = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/providers', {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load providers');
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading providers:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const toggleProvider = async (providerId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/payments/providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!response.ok) throw new Error('Failed to update provider');
      await loadProviders();
    } catch (error) {
      console.error('Error updating provider:', error);
      alert('שגיאה בעדכון ספק התשלום');
    }
  };

  const handleEditClick = (provider: PaymentProvider) => {
    setEditingProvider(provider);
    setFormData({
      provider_name: provider.provider_name,
      environment: provider.environment as 'test' | 'production',
      api_public_key: provider.api_public_key || '',
      api_secret_key: provider.api_secret_key || '',
      webhook_secret: provider.webhook_secret || '',
      is_active: provider.is_active,
      settings: (provider.settings as Record<string, any>) || {},
    });
    setShowAddModal(true);
  };

  const handleAddClick = () => {
    setEditingProvider(null);
    setFormData({
      provider_name: '',
      environment: 'test',
      api_public_key: '',
      api_secret_key: '',
      webhook_secret: '',
      is_active: false,
      settings: {},
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = editingProvider 
        ? `/api/payments/providers/${editingProvider.id}`
        : '/api/payments/providers';
      
      const response = await fetch(url, {
        method: editingProvider ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider_name: formData.provider_name,
          environment: formData.environment,
          api_public_key: formData.api_public_key,
          api_secret_key: formData.api_secret_key,
          webhook_secret: formData.webhook_secret,
          is_active: formData.is_active,
          settings: formData.settings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save provider');
      }

      setShowAddModal(false);
      await loadProviders();
    } catch (error: any) {
      console.error('Error saving provider:', error);
      alert(`שגיאה בשמירת ספק התשלום: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (providerId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ספק התשלום הזה?')) return;

    try {
      const response = await fetch(`/api/payments/providers/${providerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete provider');
      await loadProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      alert('שגיאה במחיקת ספק התשלום');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">הגדרות תשלומים</h2>
        <Button onClick={handleAddClick} className="flex items-center gap-2">
          הוסף ספק תשלום
          <HiPlus className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <MenuIcons.payments className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין ספקי תשלום מוגדרים</p>
            <Button onClick={handleAddClick} className="flex items-center gap-2">
              הוסף ספק תשלום ראשון
              <HiPlus className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{provider.provider_name}</h3>
                    <p className="text-sm text-gray-500">
                      סביבה: {provider.environment === 'production' ? 'ייצור' : 'בדיקה'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleProvider(provider.id, provider.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      provider.is_active
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {provider.is_active ? (
                      <HiCheckCircle className="w-6 h-6" />
                    ) : (
                      <HiXCircle className="w-6 h-6" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(provider)}
                  >
                    <HiPencil className="w-4 h-4 ml-1" />
                    ערוך
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <HiTrash className="w-4 h-4 ml-1" />
                    מחק
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Provider Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'ערוך ספק תשלום' : 'הוסף ספק תשלום חדש'}
            </DialogTitle>
            <DialogDescription>
              {editingProvider ? 'עדכן את פרטי ספק התשלום' : 'הזן את פרטי ספק התשלום החדש'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div>
              <Label>שם ספק התשלום</Label>
              <Input
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                placeholder="לדוגמה: כרטיס אשראי, PayPal, Bit"
                className="mt-2"
              />
            </div>

            <div>
              <Label>סביבה</Label>
              <Select
                value={formData.environment}
                onValueChange={(value) => setFormData({ ...formData, environment: value as 'test' | 'production' })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue>
                    {formData.environment === 'production' ? 'ייצור' : 'בדיקה'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">בדיקה</SelectItem>
                  <SelectItem value="production">ייצור</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>מפתח ציבורי (API Public Key)</Label>
              <Input
                type="text"
                value={formData.api_public_key}
                onChange={(e) => setFormData({ ...formData, api_public_key: e.target.value })}
                placeholder="הזן מפתח ציבורי"
                className="mt-2"
              />
            </div>

            <div>
              <Label>מפתח סודי (API Secret Key)</Label>
              <Input
                type="password"
                value={formData.api_secret_key}
                onChange={(e) => setFormData({ ...formData, api_secret_key: e.target.value })}
                placeholder="הזן מפתח סודי"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Webhook Secret (אופציונלי)</Label>
              <Input
                type="password"
                value={formData.webhook_secret}
                onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                placeholder="הזן Webhook Secret"
                className="mt-2"
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
              <Label htmlFor="is_active" className="cursor-pointer">
                ספק פעיל
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.provider_name}>
              {saving ? 'שומר...' : editingProvider ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

