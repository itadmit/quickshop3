'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle, HiCreditCard, HiStar, HiExclamation } from 'react-icons/hi';
import { StorePaymentIntegration, PaymentProviderType } from '@/types/payment';

interface ProviderInfo {
  id: PaymentProviderType;
  label: string;
  logo: string;
}

interface IntegrationWithMeta extends StorePaymentIntegration {
  provider_label: string;
  provider_logo: string;
}

// Provider-specific field configurations
const PROVIDER_FIELDS: Record<PaymentProviderType, Array<{ key: string; label: string; type: string; required?: boolean; placeholder?: string }>> = {
  pelecard: [
    { key: 'terminal_number', label: 'מספר טרמינל', type: 'text', required: true, placeholder: '1234567' },
    { key: 'username', label: 'שם משתמש', type: 'text', required: true, placeholder: 'Username' },
    { key: 'password', label: 'סיסמה', type: 'password', required: true, placeholder: '••••••••' },
  ],
  meshulam: [
    { key: 'api_key', label: 'מפתח API', type: 'text', required: true },
    { key: 'username', label: 'מזהה משתמש', type: 'text', required: true },
  ],
  cardcom: [
    { key: 'terminal_number', label: 'מספר טרמינל', type: 'text', required: true },
    { key: 'username', label: 'שם משתמש', type: 'text', required: true },
    { key: 'api_key', label: 'מפתח API', type: 'password', required: true },
  ],
  stripe: [
    { key: 'api_key', label: 'Secret Key', type: 'password', required: true, placeholder: 'sk_...' },
  ],
  payplus: [
    { key: 'api_key', label: 'מפתח API', type: 'password', required: true },
    { key: 'terminal_number', label: 'מזהה מסוף', type: 'text', required: true },
  ],
};

export default function PaymentsPage() {
  const [integrations, setIntegrations] = useState<IntegrationWithMeta[]>([]);
  const [supportedProviders, setSupportedProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectProviderModal, setShowSelectProviderModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<IntegrationWithMeta | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    loadIntegrations(abortController.signal);
    return () => abortController.abort();
  }, []);

  const loadIntegrations = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/integrations', {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load integrations');
      const data = await response.json();
      setIntegrations(data.integrations || []);
      setSupportedProviders(data.supported_providers || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading integrations:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleAddClick = () => {
    // Check which providers are not yet configured
    const configuredProviders = integrations.map(i => i.provider);
    const availableProviders = supportedProviders.filter(p => !configuredProviders.includes(p.id));
    
    if (availableProviders.length === 0) {
      alert('כל ספקי התשלום כבר מוגדרים');
      return;
    }
    
    setShowSelectProviderModal(true);
  };

  const handleSelectProvider = (provider: PaymentProviderType) => {
    setSelectedProvider(provider);
    setEditingIntegration(null);
    setFormData({
      provider,
      display_name: '',
      is_sandbox: true,
      is_active: false,
    });
    setShowSelectProviderModal(false);
    setShowAddModal(true);
  };

  const handleEditClick = (integration: IntegrationWithMeta) => {
    setEditingIntegration(integration);
    setSelectedProvider(integration.provider as PaymentProviderType);
    setFormData({
      provider: integration.provider,
      display_name: integration.display_name || '',
      terminal_number: integration.terminal_number || '',
      username: integration.username || '',
      password: '', // Don't pre-fill password
      api_key: '', // Don't pre-fill api_key
      is_sandbox: integration.is_sandbox,
      is_active: integration.is_active,
      is_default: integration.is_default,
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = editingIntegration 
        ? `/api/payments/integrations/${editingIntegration.id}`
        : '/api/payments/integrations';
      
      // Build payload - only include password/api_key if they were changed
      const payload: Record<string, any> = {
        provider: formData.provider,
        display_name: formData.display_name || null,
        terminal_number: formData.terminal_number || null,
        username: formData.username || null,
        is_sandbox: formData.is_sandbox,
        is_active: formData.is_active,
      };

      if (formData.password) {
        payload.password = formData.password;
      }
      if (formData.api_key) {
        payload.api_key = formData.api_key;
      }
      if (editingIntegration && formData.is_default !== undefined) {
        payload.is_default = formData.is_default;
      }

      const response = await fetch(url, {
        method: editingIntegration ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save integration');
      }

      setShowAddModal(false);
      await loadIntegrations();
    } catch (error: any) {
      console.error('Error saving integration:', error);
      alert(`שגיאה בשמירה: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (integrationId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ספק התשלום הזה?')) return;

    try {
      const response = await fetch(`/api/payments/integrations/${integrationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete integration');
      await loadIntegrations();
    } catch (error) {
      console.error('Error deleting integration:', error);
      alert('שגיאה במחיקת ספק התשלום');
    }
  };

  const handleToggleActive = async (integration: IntegrationWithMeta) => {
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
      console.error('Error toggling active:', error);
      alert('שגיאה בעדכון');
    }
  };

  const handleSetDefault = async (integration: IntegrationWithMeta) => {
    try {
      const response = await fetch(`/api/payments/integrations/${integration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_default: true }),
      });
      if (!response.ok) throw new Error('Failed to update');
      await loadIntegrations();
    } catch (error) {
      console.error('Error setting default:', error);
      alert('שגיאה בעדכון');
    }
  };

  const getProviderFields = () => {
    if (!selectedProvider) return [];
    return PROVIDER_FIELDS[selectedProvider] || [];
  };

  const configuredProviders = integrations.map(i => i.provider);
  const availableProviders = supportedProviders.filter(p => !configuredProviders.includes(p.id));

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ספקי תשלום</h1>
          <p className="text-sm text-gray-500 mt-1">הגדר ספקי סליקה לקבלת תשלומים בחנות</p>
        </div>
        <Button onClick={handleAddClick} className="flex items-center gap-2" disabled={availableProviders.length === 0}>
          הוסף ספק תשלום
          <HiPlus className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      ) : integrations.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <HiCreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין ספקי תשלום מוגדרים</h3>
            <p className="text-gray-500 mb-6">הוסף ספק סליקה כדי להתחיל לקבל תשלומים</p>
            <Button onClick={handleAddClick} className="flex items-center gap-2 mx-auto">
              הוסף ספק תשלום ראשון
              <HiPlus className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <Card key={integration.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Provider Logo/Icon */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <HiCreditCard className="w-6 h-6 text-gray-500" />
                    </div>
                    
                    {/* Provider Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {integration.display_name || integration.provider_label}
                        </h3>
                        {integration.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <HiStar className="w-3 h-3" />
                            ברירת מחדל
                          </span>
                        )}
                        {integration.is_sandbox && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            סביבת בדיקה
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {integration.provider_label}
                        {integration.terminal_number && ` • טרמינל: ${integration.terminal_number}`}
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <button
                    onClick={() => handleToggleActive(integration)}
                    className={`p-2 rounded-lg transition-colors ${
                      integration.is_active
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={integration.is_active ? 'לחץ לכיבוי' : 'לחץ להפעלה'}
                  >
                    {integration.is_active ? (
                      <HiCheckCircle className="w-6 h-6" />
                    ) : (
                      <HiXCircle className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
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
                      onClick={() => handleSetDefault(integration)}
                    >
                      <HiStar className="w-4 h-4 ml-1" />
                      הגדר כברירת מחדל
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(integration.id)}
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

      {/* Select Provider Modal */}
      <Dialog open={showSelectProviderModal} onOpenChange={setShowSelectProviderModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>בחר ספק תשלום</DialogTitle>
            <DialogDescription>בחר את ספק הסליקה שברצונך להוסיף</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-2">
            {availableProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleSelectProvider(provider.id)}
                className="w-full flex items-center gap-4 p-4 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors text-right"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiCreditCard className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{provider.label}</div>
                  <div className="text-sm text-gray-500">
                    {provider.id === 'pelecard' && 'סליקה ישראלית מובילה'}
                    {provider.id === 'meshulam' && 'סליקה פשוטה ומהירה'}
                    {provider.id === 'cardcom' && 'סליקת אשראי מתקדמת'}
                    {provider.id === 'stripe' && 'סליקה בינלאומית'}
                    {provider.id === 'payplus' && 'סליקה ישראלית'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Integration Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? 'עריכת ספק תשלום' : 'הוספת ספק תשלום'}
            </DialogTitle>
            <DialogDescription>
              {selectedProvider && supportedProviders.find(p => p.id === selectedProvider)?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Display Name */}
            <div>
              <Label>שם להצגה (אופציונלי)</Label>
              <Input
                value={formData.display_name || ''}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="לדוגמה: כרטיס אשראי"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">יוצג ללקוחות בעת התשלום</p>
            </div>

            {/* Provider-specific fields */}
            {getProviderFields().map((field) => (
              <div key={field.key}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500 mr-1">*</span>}
                </Label>
                <Input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  placeholder={field.placeholder || ''}
                  className="mt-2"
                />
                {editingIntegration && (field.key === 'password' || field.key === 'api_key') && (
                  <p className="text-xs text-gray-500 mt-1">השאר ריק כדי לשמור את הערך הקיים</p>
                )}
              </div>
            ))}

            {/* Environment Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">סביבת בדיקה (Sandbox)</Label>
                <p className="text-xs text-gray-500 mt-0.5">בסביבת בדיקה לא יבוצעו חיובים אמיתיים</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_sandbox: !formData.is_sandbox })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_sandbox ? 'bg-orange-500' : 'bg-green-500'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_sandbox ? 'translate-x-1' : 'translate-x-6'
                  }`}
                />
              </button>
            </div>

            {!formData.is_sandbox && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <HiExclamation className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  שים לב: במצב ייצור יבוצעו חיובים אמיתיים. וודא שהפרטים נכונים.
                </p>
              </div>
            )}

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active || false}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                ספק פעיל ומוכן לקבלת תשלומים
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'שומר...' : editingIntegration ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
