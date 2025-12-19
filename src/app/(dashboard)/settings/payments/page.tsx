'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiCheckCircle, 
  HiXCircle, 
  HiCreditCard, 
  HiStar,
  HiLightningBolt,
  HiCheck,
  HiShieldCheck
} from 'react-icons/hi';
import { StorePaymentIntegration, PaymentProviderConfig } from '@/types/payment';

// ספקים עם Adapters מוכנים
const AVAILABLE_PROVIDERS: PaymentProviderConfig[] = [
  {
    id: 'quickpay',
    name: 'קוויק שופ פיימנטס',
    nameEn: 'QuickShop Payments',
    description: 'הפתרון המובנה שלנו - עמלות משתלמות, התממשקות מיידית',
    logo: '/images/providers/quickpay.svg',
    isRecommended: true,
    requiredFields: [
      {
        key: 'seller_payme_id',
        label: 'מפתח MPL',
        type: 'password',
        required: true,
        placeholder: 'MPL1234-XXXXXXXX-XXXXXXXX-XXXXXXXX',
        helpText: 'מפתח המוכר שקיבלת מקוויק שופ פיימנטס',
      },
    ],
    supportedFeatures: ['credit_card', 'bit', 'apple_pay', 'google_pay', 'installments', 'refunds'],
  },
  {
    id: 'pelecard',
    name: 'פלאקארד',
    nameEn: 'Pelecard',
    description: 'סליקה ישראלית מובילה עם תמיכה בכל כרטיסי האשראי',
    logo: '/images/providers/pelecard.png',
    requiredFields: [
      {
        key: 'terminal_number',
        label: 'מספר טרמינל',
        type: 'text',
        required: true,
        placeholder: '1234567',
        helpText: 'מספר הטרמינל שקיבלת מפלאקארד',
      },
      {
        key: 'username',
        label: 'שם משתמש',
        type: 'text',
        required: true,
        placeholder: 'Username',
      },
      {
        key: 'password',
        label: 'סיסמה',
        type: 'password',
        required: true,
        placeholder: '••••••••',
      },
    ],
    supportedFeatures: ['credit_card', 'installments', 'refunds'],
  },
  {
    id: 'payplus',
    name: 'פייפלוס',
    nameEn: 'PayPlus',
    description: 'סליקה ישראלית עם ממשק נוח ותמיכה ב-Bit',
    logo: '/images/providers/payplus.png',
    requiredFields: [
      {
        key: 'api_key',
        label: 'מפתח API',
        type: 'password',
        required: true,
        placeholder: 'API Key',
      },
      {
        key: 'secret_key',
        label: 'מפתח סודי',
        type: 'password',
        required: true,
        placeholder: 'Secret Key',
      },
      {
        key: 'terminal_uid',
        label: 'מזהה דף תשלום (Payment Page UID)',
        type: 'text',
        required: true,
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'מזהה דף התשלום מהגדרות PayPlus',
      },
    ],
    supportedFeatures: ['credit_card', 'bit', 'apple_pay', 'google_pay', 'installments', 'refunds'],
  },
  {
    id: 'meshulam',
    name: 'Grow (משולם)',
    nameEn: 'Grow / Meshulam',
    description: 'סליקה פשוטה עם ממשק ידידותי',
    logo: '/images/providers/meshulam.png',
    requiredFields: [
      {
        key: 'user_id',
        label: 'מזהה משתמש (User ID)',
        type: 'text',
        required: true,
        placeholder: '4ec1d595ae764243',
        helpText: 'מזהה המשתמש שקיבלת מ-Grow',
      },
      {
        key: 'page_code',
        label: 'קוד דף תשלום (Page Code)',
        type: 'text',
        required: true,
        placeholder: 'b73ca07591f8',
        helpText: 'קוד הדף לסוג התשלום הרצוי',
      },
      {
        key: 'api_key',
        label: 'מפתח API (אופציונלי)',
        type: 'password',
        required: false,
        placeholder: 'API Key',
        helpText: 'נדרש רק לחברות עם מספר עסקים',
      },
    ],
    supportedFeatures: ['credit_card', 'bit', 'apple_pay', 'google_pay', 'installments', 'refunds'],
  },
];

const FEATURE_LABELS: Record<string, { label: string; icon: string }> = {
  credit_card: { label: 'כרטיס אשראי', icon: '💳' },
  bit: { label: 'Bit', icon: '📱' },
  apple_pay: { label: 'Apple Pay', icon: '🍎' },
  google_pay: { label: 'Google Pay', icon: '🔵' },
  installments: { label: 'תשלומים', icon: '📅' },
  refunds: { label: 'זיכויים', icon: '↩️' },
  tokenization: { label: 'שמירת כרטיס', icon: '🔐' },
  recurring: { label: 'תשלומים חוזרים', icon: '🔄' },
};

export default function PaymentIntegrationsPage() {
  const [integrations, setIntegrations] = useState<StorePaymentIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<StorePaymentIntegration | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
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

  const getExistingProviders = () => {
    return new Set(integrations.map(i => i.provider));
  };

  const handleAddClick = (provider: PaymentProviderConfig) => {
    setEditingIntegration(null);
    setSelectedProvider(provider);
    setFormData({
      provider: provider.id,
      display_name: '',
      is_sandbox: true,
      is_active: false,
      is_default: integrations.length === 0,
    });
    setShowModal(true);
  };

  const handleEditClick = (integration: StorePaymentIntegration) => {
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === integration.provider);
    setEditingIntegration(integration);
    setSelectedProvider(provider || null);
    
    const data: Record<string, any> = {
      provider: integration.provider,
      display_name: integration.display_name || '',
      is_sandbox: integration.is_sandbox,
      is_active: integration.is_active,
      is_default: integration.is_default,
    };
    
    // Map existing data to form fields
    if (integration.terminal_number) data.terminal_number = integration.terminal_number;
    if (integration.username) data.username = integration.username;
    // Password is not returned from API for security
    
    // Map settings
    const settings = (integration.settings || {}) as Record<string, any>;
    Object.keys(settings).forEach(key => {
      data[key] = settings[key];
    });
    
    setFormData(data);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedProvider) return;
    
    try {
      setSaving(true);
      const url = editingIntegration 
        ? `/api/payments/integrations/${editingIntegration.id}`
        : '/api/payments/integrations';
      
      // Build request body
      const body: Record<string, any> = {
        provider: formData.provider,
        display_name: formData.display_name,
        is_sandbox: formData.is_sandbox,
        is_active: formData.is_active,
        is_default: formData.is_default,
        settings: {},
      };

      // Map form fields to appropriate locations
      selectedProvider.requiredFields?.forEach(field => {
        const value = formData[field.key];
        if (value !== undefined && value !== '') {
          // Standard fields go to their own columns
          if (['terminal_number', 'username', 'password'].includes(field.key)) {
            body[field.key] = value;
          } else {
            // Other fields go to settings
            body.settings[field.key] = value;
          }
        }
      });

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

  const getProviderConfig = (providerId: string) => {
    return AVAILABLE_PROVIDERS.find(p => p.id === providerId);
  };

  const isFormValid = () => {
    if (!selectedProvider) return false;
    
    const requiredFields = selectedProvider.requiredFields?.filter(f => f.required) || [];
    for (const field of requiredFields) {
      // Skip password check when editing (password not returned from API)
      if (editingIntegration && field.type === 'password' && !formData[field.key]) {
        continue;
      }
      if (!formData[field.key]) return false;
    }
    return true;
  };

  const existingProviders = getExistingProviders();

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הגדרות סליקה</h1>
          <p className="text-gray-500 mt-1">ניהול ספקי תשלום לחנות שלך</p>
        </div>
      </div>

      {/* Existing Integrations */}
      {!loading && integrations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">ספקים מוגדרים</h2>
          {integrations.map((integration) => {
            const provider = getProviderConfig(integration.provider);
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
                            {integration.display_name || provider?.name || integration.provider}
                          </h3>
                          {integration.is_default && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                              <HiStar className="w-3 h-3" />
                              ברירת מחדל
                            </span>
                          )}
                          {provider?.isRecommended && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                              מומלץ
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{provider?.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className={`px-2 py-0.5 rounded ${integration.is_sandbox ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {integration.is_sandbox ? 'סביבת בדיקה' : 'סביבת ייצור'}
                          </span>
                          <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${integration.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {integration.is_active ? <HiCheck className="w-3 h-3" /> : <HiXCircle className="w-3 h-3" />}
                            {integration.is_active ? 'פעיל' : 'לא פעיל'}
                          </span>
                        </div>
                        {/* Features */}
                        {provider?.supportedFeatures && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {provider.supportedFeatures.slice(0, 5).map(feature => (
                              <span key={feature} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {FEATURE_LABELS[feature]?.icon} {FEATURE_LABELS[feature]?.label || feature}
                              </span>
                            ))}
                          </div>
                        )}
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

      {/* Available Providers */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {integrations.length > 0 ? 'הוסף ספק נוסף' : 'בחר ספק תשלום'}
        </h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_PROVIDERS.map((provider) => {
              const isConfigured = existingProviders.has(provider.id);
              
              return (
                <Card 
                  key={provider.id} 
                  className={`relative overflow-hidden transition-all ${
                    isConfigured 
                      ? 'opacity-60 bg-gray-50' 
                      : 'hover:shadow-lg hover:border-blue-200 cursor-pointer'
                  }`}
                >
                  {provider.isRecommended && !isConfigured && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs py-1 px-3 text-center font-medium">
                      <HiLightningBolt className="inline w-3 h-3 ml-1" />
                      מומלץ
                    </div>
                  )}
                  
                  {isConfigured && (
                    <div className="absolute top-0 left-0 right-0 bg-green-600 text-white text-xs py-1 px-3 text-center font-medium">
                      <HiCheck className="inline w-3 h-3 ml-1" />
                      מוגדר
                    </div>
                  )}
                  
                  <div className={`p-6 ${provider.isRecommended || isConfigured ? 'pt-10' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-gray-100">
                        <HiCreditCard className="w-8 h-8 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{provider.description}</p>
                        
                        {/* Features */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {provider.supportedFeatures?.slice(0, 4).map(feature => (
                            <span key={feature} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                              {FEATURE_LABELS[feature]?.label || feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {isConfigured ? (
                        <Button variant="ghost" size="sm" disabled className="w-full">
                          <HiCheck className="w-4 h-4 ml-1" />
                          כבר מוגדר
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleAddClick(provider)} 
                          className="w-full"
                          variant={provider.isRecommended ? 'primary' : 'ghost'}
                        >
                          <HiPlus className="w-4 h-4 ml-1" />
                          הגדר ספק זה
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProvider?.isRecommended && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">מומלץ</span>
              )}
              {editingIntegration ? 'ערוך' : 'הגדר'} {selectedProvider?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedProvider?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
            {/* Display Name */}
            <div>
              <Label>שם תצוגה (אופציונלי)</Label>
              <Input
                value={formData.display_name || ''}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder={`למשל: ${selectedProvider?.name}`}
                className="mt-2"
              />
            </div>

            {/* Dynamic Fields from Provider Config */}
            {selectedProvider?.requiredFields?.map((field) => (
              <div key={field.key}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500 mr-1">*</span>}
                </Label>
                <Input
                  type={field.type === 'password' ? 'password' : 'text'}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  placeholder={editingIntegration && field.type === 'password' 
                    ? 'השאר ריק אם אין שינוי' 
                    : field.placeholder}
                  className="mt-2"
                />
                {field.helpText && (
                  <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                )}
              </div>
            ))}

            {/* Environment & Status */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">סביבת בדיקה (Sandbox)</Label>
                  <p className="text-xs text-gray-500">לבדיקות בלבד - עסקאות לא יחויבו</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_sandbox}
                    onChange={(e) => setFormData({ ...formData, is_sandbox: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">הפעל ספק</Label>
                  <p className="text-xs text-gray-500">ספק פעיל יופיע בצ'ק אאוט</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">ברירת מחדל</Label>
                  <p className="text-xs text-gray-500">ספק ברירת המחדל לתשלומים</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <HiShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 font-medium">אבטחת מידע</p>
                <p className="text-xs text-blue-700 mt-1">
                  כל המידע הרגיש מוצפן ומאוחסן בצורה מאובטחת. אנחנו לא שומרים פרטי כרטיס אשראי של לקוחות.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !isFormValid()}
            >
              {saving ? 'שומר...' : editingIntegration ? 'עדכן' : 'שמור והפעל'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
