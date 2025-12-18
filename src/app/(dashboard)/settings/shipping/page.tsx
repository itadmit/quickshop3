'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle, HiTruck, HiStar, HiLightningBolt } from 'react-icons/hi';
import { StoreShippingIntegration } from '@/types/payment';

const SHIPPING_PROVIDERS = [
  { value: 'baldar', label: 'בלדר / פוקוס דליוורי', description: 'משלוחים עד הבית' },
  { value: 'israelpost', label: 'דואר ישראל', description: 'חבילות רגילות ודחופות' },
  { value: 'cheetah', label: 'צ\'יטה', description: 'משלוחים מהירים' },
  { value: 'mahirli', label: 'מהיר לי', description: 'משלוחים אקספרס' },
];

const SHIPMENT_TYPES = [
  { value: '1', label: 'משלוח רגיל' },
  { value: '2', label: 'משלוח מהיר' },
  { value: '3', label: 'משלוח עד הבית' },
];

const CARGO_TYPES = [
  { value: '1', label: 'חבילה רגילה' },
  { value: '2', label: 'מעטפה' },
  { value: '3', label: 'חבילה גדולה' },
];

export default function ShippingIntegrationsPage() {
  const [integrations, setIntegrations] = useState<StoreShippingIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<StoreShippingIntegration | null>(null);
  const [formData, setFormData] = useState({
    provider: 'baldar',
    display_name: '',
    customer_number: '',
    username: '',
    password: '',
    api_key: '',
    is_sandbox: true,
    is_active: false,
    is_default: false,
    auto_ship_enabled: false,
    auto_ship_on_payment: false,
    default_shipment_type: '1',
    default_cargo_type: '1',
    settings: {} as Record<string, any>,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shipping/integrations', {
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
      provider: 'baldar',
      display_name: '',
      customer_number: '',
      username: '',
      password: '',
      api_key: '',
      is_sandbox: true,
      is_active: false,
      is_default: false,
      auto_ship_enabled: false,
      auto_ship_on_payment: false,
      default_shipment_type: '1',
      default_cargo_type: '1',
      settings: {},
    });
    setShowModal(true);
  };

  const handleEditClick = (integration: StoreShippingIntegration) => {
    setEditingIntegration(integration);
    setFormData({
      provider: integration.provider,
      display_name: integration.display_name || '',
      customer_number: integration.customer_number || '',
      username: integration.username || '',
      password: '',
      api_key: '',
      is_sandbox: integration.is_sandbox,
      is_active: integration.is_active,
      is_default: integration.is_default,
      auto_ship_enabled: integration.auto_ship_enabled || false,
      auto_ship_on_payment: integration.auto_ship_on_payment || false,
      default_shipment_type: String(integration.default_shipment_type || '1'),
      default_cargo_type: String(integration.default_cargo_type || '1'),
      settings: (integration.settings as Record<string, any>) || {},
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = editingIntegration 
        ? `/api/shipping/integrations/${editingIntegration.id}`
        : '/api/shipping/integrations';
      
      const body: Record<string, any> = {
        provider: formData.provider,
        display_name: formData.display_name,
        customer_number: formData.customer_number,
        username: formData.username,
        is_sandbox: formData.is_sandbox,
        is_active: formData.is_active,
        is_default: formData.is_default,
        auto_ship_enabled: formData.auto_ship_enabled,
        auto_ship_on_payment: formData.auto_ship_on_payment,
        default_shipment_type: parseInt(formData.default_shipment_type),
        default_cargo_type: parseInt(formData.default_cargo_type),
        settings: formData.settings,
      };

      if (formData.password) {
        body.password = formData.password;
      }
      if (formData.api_key) {
        body.api_key = formData.api_key;
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
      const response = await fetch(`/api/shipping/integrations/${integrationId}`, {
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

  const toggleActive = async (integration: StoreShippingIntegration) => {
    try {
      const response = await fetch(`/api/shipping/integrations/${integration.id}`, {
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
      const response = await fetch(`/api/shipping/integrations/${integrationId}`, {
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
    return SHIPPING_PROVIDERS.find(p => p.value === providerValue) || { label: providerValue, description: '' };
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הגדרות משלוחים</h1>
          <p className="text-gray-500 mt-1">ניהול אינטגרציות משלוחים לחנות שלך</p>
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
            <HiTruck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">כיצד זה עובד?</h3>
              <p className="text-sm text-blue-700 mt-1">
                הוסף את פרטי חברת המשלוחים שלך (למשל: בלדר/פוקוס דליוורי) ותוכל לשלוח הזמנות ישירות מהדשבורד.
                אפשר גם להפעיל שליחה אוטומטית לאחר תשלום!
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
            <HiTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">אין אינטגרציות משלוחים</h3>
            <p className="text-gray-500 mb-6">הוסף אינטגרציה כדי לשלוח הזמנות ישירות לחברת השליחויות</p>
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
                        <HiTruck className={`w-6 h-6 ${integration.is_active ? 'text-green-600' : 'text-gray-400'}`} />
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
                          {integration.auto_ship_on_payment && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                              <HiLightningBolt className="w-3 h-3" />
                              אוטומטי
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
                          {integration.customer_number && (
                            <span className="text-gray-400">
                              מספר לקוח: {integration.customer_number}
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
              {editingIntegration ? 'ערוך אינטגרציית משלוחים' : 'הוסף אינטגרציית משלוחים חדשה'}
            </DialogTitle>
            <DialogDescription>
              הזן את פרטי חברת השליחויות שלך
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div>
              <Label>ספק משלוחים *</Label>
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
                  {SHIPPING_PROVIDERS.map((provider) => (
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
                placeholder="למשל: משלוח עד הבית"
                className="mt-2"
              />
            </div>

            {(formData.provider === 'baldar') && (
              <>
                <div>
                  <Label>מספר לקוח *</Label>
                  <Input
                    value={formData.customer_number}
                    onChange={(e) => setFormData({ ...formData, customer_number: e.target.value })}
                    placeholder="הזן מספר לקוח"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>סוג משלוח ברירת מחדל</Label>
                    <Select
                      value={formData.default_shipment_type}
                      onValueChange={(value) => setFormData({ ...formData, default_shipment_type: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIPMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>סוג חבילה ברירת מחדל</Label>
                    <Select
                      value={formData.default_cargo_type}
                      onValueChange={(value) => setFormData({ ...formData, default_cargo_type: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CARGO_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_sandbox"
                  checked={formData.is_sandbox}
                  onChange={(e) => setFormData({ ...formData, is_sandbox: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                />
                <Label htmlFor="is_sandbox" className="cursor-pointer text-sm">
                  סביבת בדיקה
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer text-sm">
                  פעיל
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded"
                />
                <Label htmlFor="is_default" className="cursor-pointer text-sm">
                  ברירת מחדל
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_ship_on_payment"
                  checked={formData.auto_ship_on_payment}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    auto_ship_on_payment: e.target.checked,
                    auto_ship_enabled: e.target.checked 
                  })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded"
                />
                <Label htmlFor="auto_ship_on_payment" className="cursor-pointer text-sm">
                  שליחה אוטומטית לאחר תשלום
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
              disabled={saving || !formData.provider || (formData.provider === 'baldar' && !formData.customer_number)}
            >
              {saving ? 'שומר...' : editingIntegration ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

