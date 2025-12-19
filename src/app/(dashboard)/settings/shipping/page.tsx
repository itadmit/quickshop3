'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { 
  HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle, 
  HiStar, HiLightningBolt, HiCheck 
} from 'react-icons/hi';
import { Truck, Package, MessageCircle, Loader2 } from 'lucide-react';
import { StoreShippingIntegration } from '@/types/payment';

// ============================================
// SHIPPING PROVIDERS CONFIGURATION
// ============================================

interface ShippingProviderField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

interface ShippingProviderConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  logo?: string;
  isRecommended?: boolean;
  isComingSoon?: boolean;
  requiredFields: ShippingProviderField[];
  supportedFeatures: string[];
}

const SHIPPING_PROVIDERS: ShippingProviderConfig[] = [
  {
    id: 'baldar',
    name: 'בלדר / פוקוס משלוחים',
    nameEn: 'Baldar / Focus Delivery',
    description: 'שליחויות ברחבי הארץ עם מעקב בזמן אמת, איסוף מנקודות חלוקה',
    isRecommended: true,
    requiredFields: [
      {
        key: 'customer_number',
        label: 'מספר לקוח',
        type: 'text',
        required: true,
        placeholder: '12345',
        helpText: 'מספר הלקוח שלך בבלדר/פוקוס',
      },
      {
        key: 'api_base_url',
        label: 'כתובת API (אופציונלי)',
        type: 'text',
        required: false,
        placeholder: 'https://focusdelivery.co.il',
        helpText: 'השאר ריק לשימוש בכתובת ברירת מחדל',
      },
      {
        key: 'shipment_type_code',
        label: 'קוד סוג משלוח',
        type: 'text',
        required: false,
        placeholder: '1',
      },
      {
        key: 'cargo_type_code',
        label: 'קוד סוג מטען',
        type: 'text',
        required: false,
        placeholder: '1',
      },
      {
        key: 'reference_prefix',
        label: 'תחילית לאסמכתא',
        type: 'text',
        required: false,
        placeholder: 'QS-',
      },
    ],
    supportedFeatures: ['tracking', 'pickup_points', 'label_printing', 'cancellation'],
  },
  {
    id: 'cargo',
    name: 'קארגו שליחויות',
    nameEn: 'Cargo',
    description: 'שירות שליחויות ארצי מהיר ואמין',
    isComingSoon: true,
    requiredFields: [],
    supportedFeatures: ['tracking', 'label_printing'],
  },
  {
    id: 'lionwheel',
    name: 'ליון וויל',
    nameEn: 'Lionwheel',
    description: 'פתרון משלוחים משולב עם מגוון ספקים',
    isComingSoon: true,
    requiredFields: [],
    supportedFeatures: ['tracking', 'multi_carrier'],
  },
  {
    id: 'chita',
    name: 'צ\'יטה',
    nameEn: 'Chita',
    description: 'משלוחים מהירים ביום העסקים',
    isComingSoon: true,
    requiredFields: [],
    supportedFeatures: ['tracking', 'same_day'],
  },
  {
    id: 'dhl',
    name: 'DHL',
    nameEn: 'DHL',
    description: 'משלוחים בינלאומיים מהמובילים בעולם',
    isComingSoon: true,
    requiredFields: [],
    supportedFeatures: ['tracking', 'international'],
  },
];

const getProviderConfig = (providerId: string): ShippingProviderConfig | undefined => {
  return SHIPPING_PROVIDERS.find(p => p.id === providerId);
};

const getFeatureLabel = (feature: string): string => {
  const labels: Record<string, string> = {
    tracking: 'מעקב משלוחים',
    pickup_points: 'נקודות איסוף',
    label_printing: 'הדפסת מדבקות',
    cancellation: 'ביטול משלוחים',
    same_day: 'משלוח באותו יום',
    multi_carrier: 'ריבוי ספקים',
    international: 'משלוחים בינלאומיים',
  };
  return labels[feature] || feature;
};

export default function ShippingSettingsPage() {
  const [integrations, setIntegrations] = useState<StoreShippingIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<StoreShippingIntegration | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ShippingProviderConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
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

  const handleSelectProvider = (provider: ShippingProviderConfig) => {
    if (provider.isComingSoon) return;
    
    setSelectedProvider(provider);
    setEditingIntegration(null);
    setFormData({
      provider: provider.id,
      display_name: '',
      is_sandbox: false,
      is_active: true,
      is_default: integrations.length === 0,
      auto_create_shipment: false,
    });
    setShowModal(true);
  };

  const handleEditClick = (integration: StoreShippingIntegration) => {
    const provider = getProviderConfig(integration.provider);
    if (!provider) return;
    
    setSelectedProvider(provider);
    setEditingIntegration(integration);
    
    const settings = (integration.settings || {}) as Record<string, any>;
    setFormData({
      provider: integration.provider,
      display_name: integration.display_name || '',
      customer_number: integration.customer_number || settings.customer_number || '',
      api_base_url: integration.api_base_url || settings.api_base_url || '',
      shipment_type_code: settings.shipment_type_code || '',
      cargo_type_code: settings.cargo_type_code || '',
      reference_prefix: settings.reference_prefix || '',
      is_sandbox: integration.is_sandbox || false,
      is_active: integration.is_active,
      is_default: integration.is_default,
      auto_create_shipment: integration.auto_create_shipment || false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedProvider) return;
    
    try {
      setSaving(true);
      const url = editingIntegration 
        ? `/api/shipping/integrations/${editingIntegration.id}`
        : '/api/shipping/integrations';
      
      const body: Record<string, any> = {
        provider: formData.provider,
        display_name: formData.display_name || null,
        customer_number: formData.customer_number || null,
        api_base_url: formData.api_base_url || null,
        is_sandbox: formData.is_sandbox,
        is_active: formData.is_active,
        is_default: formData.is_default,
        auto_create_shipment: formData.auto_create_shipment,
        settings: {
          customer_number: formData.customer_number || '',
          api_base_url: formData.api_base_url || '',
          shipment_type_code: formData.shipment_type_code || '',
          cargo_type_code: formData.cargo_type_code || '',
          reference_prefix: formData.reference_prefix || '',
        },
      };

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

  // Separate recommended and other providers
  const recommendedProvider = SHIPPING_PROVIDERS.find(p => p.isRecommended);
  const otherProviders = SHIPPING_PROVIDERS.filter(p => !p.isRecommended);

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">הגדרות משלוחים</h1>
        <p className="text-gray-500 mt-1">ניהול ספקי משלוחים והגדרות שליחויות</p>
      </div>

      {/* Active Integrations */}
      {integrations.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ספקי משלוחים מחוברים</h2>
          <div className="space-y-3">
            {integrations.map((integration) => {
              const providerConfig = getProviderConfig(integration.provider);
              return (
                <div
                  key={integration.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg ${integration.is_active ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                        <Truck className={`w-5 h-5 ${integration.is_active ? 'text-emerald-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {integration.display_name || providerConfig?.name || integration.provider}
                          </span>
                          {integration.is_default && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                              <HiStar className="w-3 h-3" />
                              ברירת מחדל
                            </span>
                          )}
                          {integration.auto_create_shipment && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                              <HiLightningBolt className="w-3 h-3" />
                              אוטומטי
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          {integration.customer_number && (
                            <span>מספר לקוח: {integration.customer_number}</span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            integration.is_sandbox 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {integration.is_sandbox ? 'בדיקה' : 'ייצור'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Toggle */}
                      <button
                        onClick={() => toggleActive(integration)}
                        dir="ltr"
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          integration.is_active ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            integration.is_active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleEditClick(integration)}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="ערוך"
                      >
                        <HiPencil className="w-4 h-4" />
                      </button>
                      {!integration.is_default && (
                        <button
                          onClick={() => setAsDefault(integration.id)}
                          className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="הגדר כברירת מחדל"
                        >
                          <HiStar className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(integration.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="מחק"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recommended Provider */}
      {recommendedProvider && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ספק מומלץ</h2>
          <div
            onClick={() => handleSelectProvider(recommendedProvider)}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 cursor-pointer hover:border-emerald-400 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Truck className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{recommendedProvider.name}</h3>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded-full">
                    מומלץ
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{recommendedProvider.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {recommendedProvider.supportedFeatures.map(feature => (
                    <span
                      key={feature}
                      className="px-2 py-1 text-xs bg-white/70 text-emerald-700 rounded-full border border-emerald-200"
                    >
                      {getFeatureLabel(feature)}
                    </span>
                  ))}
                </div>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <HiPlus className="w-4 h-4 ml-1" />
                הוסף
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Other Providers */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ספקים נוספים</h2>
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {otherProviders.map((provider) => (
            <div
              key={provider.id}
              onClick={() => !provider.isComingSoon && handleSelectProvider(provider)}
              className={`flex items-center justify-between p-4 transition-colors ${
                provider.isComingSoon 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Truck className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{provider.name}</span>
                    {provider.isComingSoon && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                        בקרוב
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{provider.description}</p>
                </div>
              </div>
              {!provider.isComingSoon && (
                <HiPlus className="w-5 h-5 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="grid md:grid-cols-2 gap-4">
        <a
          href="https://wa.me/972552554432?text=שלום, אני מעוניין להצטרף כחברת שליחויות לקוויק שופ"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">חברות שליחויות?</h3>
              <p className="text-sm text-emerald-700 mt-1">
                צרו איתנו קשר על מנת להצטרף למשפחת קוויק שופ
              </p>
            </div>
          </div>
        </a>

        <a
          href="https://wa.me/972552554432?text=שלום, אני צריך עזרה בחיבור ספק משלוחים קיים"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:border-blue-400 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">שולחים עם חברה אחרת?</h3>
              <p className="text-sm text-blue-700 mt-1">
                צרו איתנו קשר ונשמח לעזור לכם לחבר את ספק המשלוחים הקיים שלכם
              </p>
            </div>
          </div>
        </a>
      </section>

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? 'ערוך ספק משלוחים' : `הוסף ${selectedProvider?.name || 'ספק משלוחים'}`}
            </DialogTitle>
            <DialogDescription>
              הזן את פרטי ההתחברות לספק המשלוחים
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            {selectedProvider?.requiredFields.map((field) => (
              <div key={field.key}>
                <Label>
                  {field.label} {field.required && '*'}
                </Label>
                <Input
                  type={field.type === 'password' ? 'password' : 'text'}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="mt-2"
                />
                {field.helpText && (
                  <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                )}
              </div>
            ))}

            <div>
              <Label>שם תצוגה (אופציונלי)</Label>
              <Input
                value={formData.display_name || ''}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="למשל: משלוח מהיר"
                className="mt-2"
              />
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">סביבת ייצור</Label>
                  <p className="text-xs text-gray-500">השבת עבור סביבת בדיקה (Sandbox)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_sandbox: !formData.is_sandbox })}
                  dir="ltr"
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    !formData.is_sandbox ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      !formData.is_sandbox ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">הפעל ספק</Label>
                  <p className="text-xs text-gray-500">הספק יהיה זמין לשליחת הזמנות</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  dir="ltr"
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.is_active ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">שליחה אוטומטית</Label>
                  <p className="text-xs text-gray-500">שלח הזמנות אוטומטית אחרי תשלום מוצלח</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, auto_create_shipment: !formData.auto_create_shipment })}
                  dir="ltr"
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.auto_create_shipment ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.auto_create_shipment ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : editingIntegration ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
