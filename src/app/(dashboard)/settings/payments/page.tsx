'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle, HiCreditCard, HiStar } from 'react-icons/hi';
import { StorePaymentIntegration } from '@/types/payment';

const PAYMENT_PROVIDERS = [
  { value: 'pelecard', label: 'פלאקארד (Pelecard)', description: 'סליקת כרטיסי אשראי' },
  { value: 'tranzila', label: 'טרנזילה (Tranzila)', description: 'סליקה ישראלית' },
  { value: 'payplus', label: 'פיי פלוס (PayPlus)', description: 'סליקה וסליקה בתשלומים' },
  { value: 'cardcom', label: 'קארדקום (CardCom)', description: 'סליקת כרטיסי אשראי' },
  { value: 'stripe', label: 'סטרייפ (Stripe)', description: 'סליקה בינלאומית' },
];

export default function PaymentIntegrationsPage() {
  const [integrations, setIntegrations] = useState<StorePaymentIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<StorePaymentIntegration | null>(null);
  const [formData, setFormData] = useState({
    provider: 'pelecard',
    display_name: '',
    terminal_number: '',
    username: '',
    password: '',
    is_sandbox: true,
    is_active: false,
    is_default: false,
    settings: {} as Record<string, any>,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/integrations', {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to load integrations');
      const data = await response.json();
      setIntegrations(data.integrations || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingIntegration(null);
    setFormData({
      provider: 'pelecard',
      display_name: '',
      terminal_number: '',
      username: '',
      password: '',
      is_sandbox: true,
      is_active: false,
      is_default: false,
      settings: {},
    });
    setShowModal(true);
  };

  const handleEditClick = (integration: StorePaymentIntegration) => {
    setEditingIntegration(integration);
    setFormData({
      provider: integration.provider,
      display_name: integration.display_name || '',
      terminal_number: integration.terminal_number || '',
      username: integration.username || '',
      password: '', // Don't show existing password
      is_sandbox: integration.is_sandbox,
      is_active: integration.is_active,
      is_default: integration.is_default,
      settings: (integration.settings as Record<string, any>) || {},
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = editingIntegration 
        ? `/api/payments/integrations/${editingIntegration.id}`
        : '/api/payments/integrations';
      
      const body: Record<string, any> = {
        provider: formData.provider,
        display_name: formData.display_name,
        terminal_number: formData.terminal_number,
        username: formData.username,
        is_sandbox: formData.is_sandbox,
        is_active: formData.is_active,
        is_default: formData.is_default,
        settings: formData.settings,
      };

      // Only include password if it was changed
      if (formData.password) {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method: editingIntegration ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save integration');
      }

      setShowModal(false);
      await loadIntegrations();
    } catch (error: any) {
      console.error('Error saving integration:', error);
      alert(`שגיאה בשמירה: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (integrationId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את האינטגרציה הזו?')) return;

    try {
      const response = await fetch(`/api/payments/integrations/${integrationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete integration');
      await loadIntegrations();
    } catch (error) {
      console.error('Error deleting integration:', error);
      alert('שגיאה במחיקת האינטגרציה');
    }
  };

  const toggleActive = async (integration: StorePaymentIntegration) => {
    try {
      const response = await fetch(`/api/payments/integrations/${integration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !integration.is_active }),
      });
      if (!response.ok) throw new Error('Failed to update');
      await loadIntegrations();
    } catch (error) {
      console.error('Error updating:', error);
      alert('שגיאה בעדכון');
    }
  };

  const setAsDefault = async (integrationId: number) => {
    try {
      const response = await fetch(`/api/payments/integrations/${integrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_default: true }),
      });
      if (!response.ok) throw new Error('Failed to update');
      await loadIntegrations();
    } catch (error) {
      console.error('Error updating:', error);
      alert('שגיאה בעדכון');
    }
  };

  const getProviderInfo = (providerValue: string) => {
    return PAYMENT_PROVIDERS.find(p => p.value === providerValue) || { label: providerValue, description: '' };
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הגדרות סליקה</h1>
          <p className="text-gray-500 mt-1">ניהול אינטגרציות תשלום לחנות שלך</p>
        </div>
        <Button onClick={handleAddClick} className="flex items-center gap-2">
          הוסף אינטגרציה
          <HiPlus className="w-4 h-4" />
        </Button>
      </div>

      {/* Information Card */}
      <Card>
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-3">
            <HiCreditCard className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">כיצד זה עובד?</h3>
              <p className="text-sm text-blue-700 mt-1">
                הוסף את פרטי הסליקה שלך (למשל: פלאקארד) ואנחנו נטפל בכל השאר. 
                לקוחות יופנו אוטומטית לדף תשלום מאובטח לאחר השלמת הצ'ק אאוט.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      ) : integrations.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <HiCreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">אין אינטגרציות סליקה</h3>
            <p className="text-gray-500 mb-6">הוסף אינטגרציה כדי להתחיל לקבל תשלומים מהלקוחות שלך</p>
            <Button onClick={handleAddClick} className="flex items-center gap-2 mx-auto">
              הוסף אינטגרציה ראשונה
              <HiPlus className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => {
            const providerInfo = getProviderInfo(integration.provider);
            return (
              <Card key={integration.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${integration.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <HiCreditCard className={`w-6 h-6 ${integration.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {integration.display_name || providerInfo.label}
                          </h3>
                          {integration.is_default && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                              <HiStar className="w-3 h-3" />
                              ברירת מחדל
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{providerInfo.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className={`px-2 py-0.5 rounded ${integration.is_sandbox ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {integration.is_sandbox ? 'סביבת בדיקה' : 'סביבת ייצור'}
                          </span>
                          <span className={`px-2 py-0.5 rounded ${integration.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {integration.is_active ? 'פעיל' : 'לא פעיל'}
                          </span>
                          {integration.terminal_number && (
                            <span className="text-gray-400">
                              מסוף: {integration.terminal_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(integration)}
                      className={`p-2 rounded-lg transition-colors ${
                        integration.is_active
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {integration.is_active ? (
                        <HiCheckCircle className="w-6 h-6" />
                      ) : (
                        <HiXCircle className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(integration)}
                    >
                      <HiPencil className="w-4 h-4 ml-1" />
                      ערוך
                    </Button>
                    {!integration.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAsDefault(integration.id)}
                      >
                        <HiStar className="w-4 h-4 ml-1" />
                        הגדר כברירת מחדל
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(integration.id)}
                    >
                      <HiTrash className="w-4 h-4 ml-1" />
                      מחק
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? 'ערוך אינטגרציית סליקה' : 'הוסף אינטגרציית סליקה חדשה'}
            </DialogTitle>
            <DialogDescription>
              הזן את פרטי חשבון הסליקה שלך
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div>
              <Label>ספק סליקה *</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
                disabled={!!editingIntegration}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue>
                    {getProviderInfo(formData.provider).label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <div>
                        <div className="font-medium">{provider.label}</div>
                        <div className="text-xs text-gray-500">{provider.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>שם תצוגה (אופציונלי)</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="למשל: כרטיס אשראי"
                className="mt-2"
              />
            </div>

            {formData.provider === 'pelecard' && (
              <>
                <div>
                  <Label>מספר מסוף (Terminal Number) *</Label>
                  <Input
                    value={formData.terminal_number}
                    onChange={(e) => setFormData({ ...formData, terminal_number: e.target.value })}
                    placeholder="הזן מספר מסוף"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>שם משתמש (User) *</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="הזן שם משתמש"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>סיסמה (Password) *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingIntegration ? "השאר ריק אם אין שינוי" : "הזן סיסמה"}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_sandbox"
                  checked={formData.is_sandbox}
                  onChange={(e) => setFormData({ ...formData, is_sandbox: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <Label htmlFor="is_sandbox" className="cursor-pointer">
                  סביבת בדיקה (Sandbox)
                </Label>
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
                  פעיל
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  ברירת מחדל
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.provider || (formData.provider === 'pelecard' && (!formData.terminal_number || !formData.username))}
            >
              {saving ? 'שומר...' : editingIntegration ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

