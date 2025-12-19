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
  HiShieldCheck,
  HiChevronLeft,
  HiChat
} from 'react-icons/hi';
import { Landmark, Banknote } from 'lucide-react';
import { StorePaymentIntegration, PaymentProviderConfig } from '@/types/payment';

// ספקים עם Adapters מוכנים
const AVAILABLE_PROVIDERS: PaymentProviderConfig[] = [
  {
    id: 'quickpay',
    name: 'קוויק שופ פיימנטס',
    nameEn: 'QuickShop Payments',
    description: 'הפתרון המובנה שלנו - עמלות משתלמות, התממשקות מיידית ותמיכה בכל סוגי התשלום.',
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
    description: 'סליקה ישראלית מובילה, מתאימה לעסקים בכל הגדלים.',
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
    description: 'סליקה מתקדמת עם תמיכה מלאה ב-Bit וארנקים דיגיטליים.',
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
    description: 'פתרון סליקה פשוט וידידותי לעסקים קטנים ובינוניים.',
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
  recurring: { label: 'הוראות קבע', icon: '🔄' },
};

// הגדרות שיטות תשלום נוספות
interface AlternativePaymentMethods {
  bank_transfer_enabled: boolean;
  bank_transfer_details?: string;
  cash_on_delivery_enabled: boolean;
  cod_fee?: number;
  minimum_order_amount?: number;
}

export default function PaymentIntegrationsPage() {
  const [integrations, setIntegrations] = useState<StorePaymentIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<StorePaymentIntegration | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  
  // שיטות תשלום נוספות
  const [alternativeMethods, setAlternativeMethods] = useState<AlternativePaymentMethods>({
    bank_transfer_enabled: false,
    bank_transfer_details: '',
    cash_on_delivery_enabled: false,
    cod_fee: 0,
    minimum_order_amount: 0,
  });
  const [savingAlternative, setSavingAlternative] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  useEffect(() => {
    loadIntegrations();
    loadAlternativeMethods();
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

  const loadAlternativeMethods = async () => {
    try {
      const response = await fetch('/api/payments/alternative-methods', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAlternativeMethods({
          bank_transfer_enabled: data.bank_transfer_enabled || false,
          bank_transfer_details: data.bank_transfer_details || '',
          cash_on_delivery_enabled: data.cash_on_delivery_enabled || false,
          cod_fee: data.cod_fee || 0,
          minimum_order_amount: data.minimum_order_amount || 0,
        });
      }
    } catch (error) {
      console.error('Error loading alternative methods:', error);
    }
  };

  const saveAlternativeMethods = async () => {
    try {
      setSavingAlternative(true);
      const response = await fetch('/api/payments/alternative-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(alternativeMethods),
      });
      if (!response.ok) throw new Error('Failed to save');
      
      // Show saved indicator
      setShowSavedIndicator(true);
      setTimeout(() => setShowSavedIndicator(false), 2000);
    } catch (error) {
      console.error('Error saving alternative methods:', error);
      alert('שגיאה בשמירת ההגדרות');
    } finally {
      setSavingAlternative(false);
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
    
    if (integration.terminal_number) data.terminal_number = integration.terminal_number;
    if (integration.username) data.username = integration.username;
    
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
      
      const body: Record<string, any> = {
        provider: formData.provider,
        display_name: formData.display_name,
        is_sandbox: formData.is_sandbox,
        is_active: formData.is_active,
        is_default: formData.is_default,
        settings: {},
      };

      selectedProvider.requiredFields?.forEach(field => {
        const value = formData[field.key];
        if (value !== undefined && value !== '') {
          if (['terminal_number', 'username', 'password'].includes(field.key)) {
            body[field.key] = value;
          } else {
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

  const isFormValid = () => {
    if (!selectedProvider) return false;
    const requiredFields = selectedProvider.requiredFields?.filter(f => f.required) || [];
    for (const field of requiredFields) {
      if (editingIntegration && field.type === 'password' && !formData[field.key]) {
        continue;
      }
      if (!formData[field.key]) return false;
    }
    return true;
  };

  const existingProviders = getExistingProviders();
  const recommendedProvider = AVAILABLE_PROVIDERS.find(p => p.id === 'quickpay');
  const otherProviders = AVAILABLE_PROVIDERS.filter(p => p.id !== 'quickpay');

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">הגדרות תשלומים</h1>
        <p className="text-gray-500 text-lg">הגדר את אמצעי התשלום בחנות שלך וקבל תשלומים בצורה מאובטחת.</p>
      </div>

      {loading ? (
        <div className="space-y-10">
          {/* ספקים פעילים skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex gap-3">
                  <div className="h-9 w-16 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-9 w-16 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* מומלץ עבורך skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg animate-pulse" />
                    <div className="h-6 w-28 bg-emerald-100 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-full max-w-xl bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-12 w-40 bg-emerald-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* ספקים נוספים skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden shadow-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                      <div className="flex gap-2 mt-2">
                        <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                        <div className="h-5 w-12 bg-gray-100 rounded animate-pulse" />
                        <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* הגדרות כלליות skeleton */}
          <div className="space-y-4 pt-6 mt-8 border-t border-gray-200">
            <div className="space-y-2">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          {/* שיטות תשלום נוספות skeleton */}
          <div className="space-y-4 pt-6 mt-8 border-t border-gray-200">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
              {[1, 2].map((i) => (
                <div key={i} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 w-11 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* CTAs skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-8 border-t border-gray-100">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-3">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 w-40 bg-gray-100 rounded-lg animate-pulse mt-2" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Active Integrations List (if any) */}
          {integrations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">ספקים פעילים</h2>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {integrations.map((integration, index) => {
                  const provider = AVAILABLE_PROVIDERS.find(p => p.id === integration.provider);
                  return (
                    <div 
                      key={integration.id} 
                      className={`p-6 flex items-center justify-between ${index !== 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100`}>
                           <HiCreditCard className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {integration.display_name || provider?.name || integration.provider}
                            </h3>
                            {integration.is_default && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                                ברירת מחדל
                              </span>
                            )}
                            {integration.is_sandbox && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                                בדיקה
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {integration.is_active ? 'מופעל' : 'כבוי'} • {provider?.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleActive(integration)}
                          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                            integration.is_active 
                              ? 'text-gray-600 hover:bg-gray-100' 
                              : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {integration.is_active ? 'השבת' : 'הפעל'}
                        </button>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(integration)}>
                          ניהול
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Provider */}
          {recommendedProvider && !existingProviders.has(recommendedProvider.id) && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">מומלץ עבורך</h2>
              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-8 relative overflow-hidden group">
                 {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl pointer-events-none" />
                
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <HiCreditCard className="w-6 h-6 text-emerald-600" />
                      </div>
                      <span className="text-sm font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                        עמלות מופחתות
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{recommendedProvider.name}</h3>
                      <p className="text-gray-600 mt-2 max-w-xl text-lg leading-relaxed">
                        {recommendedProvider.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                       {['תשלום בטוח', 'הקמה מיידית', 'דמי הקמה מוזלים'].map((tag) => (
                         <span key={tag} className="text-sm text-gray-600 flex items-center gap-1">
                           <HiCheckCircle className="w-4 h-4 text-emerald-500" /> {tag}
                         </span>
                       ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button 
                      onClick={() => handleAddClick(recommendedProvider)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 px-8 py-3 h-auto text-lg rounded-xl transition-transform hover:-translate-y-0.5"
                    >
                      התחל סליקה עכשיו
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Providers */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">ספקים נוספים</h2>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden shadow-sm">
              {otherProviders.map((provider) => {
                const isConfigured = existingProviders.has(provider.id);
                if (isConfigured) return null; // Already shown in Active Integrations

                return (
                  <div key={provider.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          <HiCreditCard className="w-6 h-6 text-gray-400" />
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <h3 className="font-semibold text-gray-900 text-lg">{provider.name}</h3>
                          </div>
                          <p className="text-gray-500 text-sm">{provider.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {provider.supportedFeatures?.slice(0, 3).map(feature => (
                              <span key={feature} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                {FEATURE_LABELS[feature]?.label || feature}
                              </span>
                            ))}
                            {provider.supportedFeatures && provider.supportedFeatures.length > 3 && (
                               <span className="text-xs text-gray-400 px-1 py-0.5">+{provider.supportedFeatures.length - 3}</span>
                            )}
                          </div>
                       </div>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => handleAddClick(provider)}
                      className="shrink-0"
                    >
                      הגדר <span className="hidden md:inline">&nbsp;{provider.name}</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* General Payment Settings */}
          <div className="space-y-4 pt-6 mt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">הגדרות כלליות</h2>
                <p className="text-gray-500">הגדרות שחלות על כל שיטות התשלום.</p>
              </div>
              {/* Save indicator */}
              <div className="flex items-center gap-2">
                {savingAlternative && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    שומר...
                  </span>
                )}
                {showSavedIndicator && !savingAlternative && (
                  <span className="text-sm text-emerald-600 flex items-center gap-1 transition-opacity duration-300">
                    <HiCheckCircle className="w-4 h-4" />
                    נשמר
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">סכום מינימום להזמנה</div>
                  <div className="text-sm text-gray-500">הגדר סכום מינימלי לביצוע רכישה בחנות</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={alternativeMethods.minimum_order_amount || 0}
                    onChange={(e) => setAlternativeMethods(prev => ({ ...prev, minimum_order_amount: parseFloat(e.target.value) || 0 }))}
                    onBlur={saveAlternativeMethods}
                    placeholder="0"
                    className="w-24 bg-white text-left"
                    min="0"
                    step="1"
                  />
                  <span className="text-gray-500">₪</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">הזן 0 כדי לבטל את המגבלה</p>
            </div>
          </div>

          {/* Alternative Payment Methods */}
          <div className="space-y-4 pt-6 mt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">שיטות תשלום נוספות</h2>
            <p className="text-gray-500">הפעל שיטות תשלום נוספות מעבר לכרטיס אשראי.</p>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
              {/* העברה בנקאית */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 border border-blue-100">
                      <Landmark className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">העברה בנקאית</div>
                      <div className="text-sm text-gray-500">לקוחות יוכלו לשלם בהעברה בנקאית</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() => {
                      setAlternativeMethods(prev => ({ ...prev, bank_transfer_enabled: !prev.bank_transfer_enabled }));
                      setTimeout(saveAlternativeMethods, 100);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${alternativeMethods.bank_transfer_enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alternativeMethods.bank_transfer_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                {alternativeMethods.bank_transfer_enabled && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <Label className="text-gray-700 mb-2 block">פרטי חשבון בנק להעברה</Label>
                    <textarea
                      value={alternativeMethods.bank_transfer_details || ''}
                      onChange={(e) => setAlternativeMethods(prev => ({ ...prev, bank_transfer_details: e.target.value }))}
                      onBlur={saveAlternativeMethods}
                      placeholder="בנק: לאומי&#10;סניף: 123&#10;מספר חשבון: 12345678&#10;שם בעל החשבון: שם העסק"
                      className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      dir="rtl"
                    />
                    <p className="text-xs text-gray-400 mt-2">פרטים אלה יוצגו ללקוח לאחר ביצוע ההזמנה</p>
                  </div>
                )}
              </div>

              {/* מזומן בהזמנה */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-50 border border-green-100">
                      <Banknote className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">מזומן בהזמנה</div>
                      <div className="text-sm text-gray-500">תשלום במזומן בעת קבלת המשלוח</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() => {
                      setAlternativeMethods(prev => ({ ...prev, cash_on_delivery_enabled: !prev.cash_on_delivery_enabled }));
                      setTimeout(saveAlternativeMethods, 100);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${alternativeMethods.cash_on_delivery_enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alternativeMethods.cash_on_delivery_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                {alternativeMethods.cash_on_delivery_enabled && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <Label className="text-gray-700 mb-2 block">עמלת תשלום במזומן (₪)</Label>
                    <Input
                      type="number"
                      value={alternativeMethods.cod_fee || 0}
                      onChange={(e) => setAlternativeMethods(prev => ({ ...prev, cod_fee: parseFloat(e.target.value) || 0 }))}
                      onBlur={saveAlternativeMethods}
                      placeholder="0"
                      className="w-32 bg-white"
                    />
                    <p className="text-xs text-gray-400 mt-2">עמלה נוספת שתתווסף להזמנות ששולמו במזומן (0 = ללא עמלה)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Us CTAs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-8 border-t border-gray-100">
            <div className="bg-gradient-to-br from-emerald-50/50 to-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3">
               <h3 className="text-lg font-bold text-gray-900">חברות סליקה?</h3>
               <p className="text-gray-600">צרו איתנו קשר על מנת להצטרף למשפחת קוויק שופ ולהציע את שירותיכם ללקוחותינו.</p>
               <a 
                 href="https://wa.me/972552554432" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-lg -mr-3 transition-colors mt-auto"
               >
                 <HiChat className="w-5 h-5" />
                 <span>דברו איתנו בוואטסאפ</span>
               </a>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col items-start gap-3">
               <h3 className="text-lg font-bold text-gray-900">סולקים בחברה אחרת?</h3>
               <p className="text-gray-600">צרו איתנו קשר ונשמח לעזור לכם לחבר את ספק הסליקה הקיים שלכם למערכת.</p>
               <a 
                 href="https://wa.me/972552554432" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-2 text-gray-700 font-medium hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg -mr-3 transition-colors mt-auto"
               >
                 <HiChat className="w-5 h-5" />
                 <span>דברו איתנו בוואטסאפ</span>
               </a>
            </div>
          </div>
        </>
      )}

      {/* Configuration Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                 <HiCreditCard className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                {editingIntegration ? 'עריכת הגדרות' : 'הגדרת ספק חדש'}
                <div className="text-sm font-normal text-gray-500 mt-0.5">{selectedProvider?.name}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            {/* Form Fields */}
            <div className="space-y-5">
              <div>
                <Label className="text-gray-700 mb-1.5 block">שם תצוגה בחנות</Label>
                <Input
                  value={formData.display_name || ''}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder={selectedProvider?.name}
                  className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1.5">השם שיוצג ללקוחות בעמוד התשלום</p>
              </div>

              {selectedProvider?.requiredFields?.map((field) => (
                <div key={field.key}>
                  <Label className="text-gray-700 mb-1.5 block">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                  </Label>
                  <Input
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={editingIntegration && field.type === 'password' ? '••••••••' : field.placeholder}
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                  {field.helpText && (
                    <p className="text-xs text-gray-400 mt-1.5">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Settings Toggles */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-5 border border-gray-100">
               <div className="flex items-center justify-between">
                 <div>
                   <div className="font-medium text-gray-900">סביבת בדיקה (Sandbox)</div>
                   <div className="text-sm text-gray-500">בצע עסקאות דמה ללא חיוב אמיתי</div>
                 </div>
                 <button
                    type="button"
                    dir="ltr"
                    onClick={() => setFormData({ ...formData, is_sandbox: !formData.is_sandbox })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${formData.is_sandbox ? 'bg-amber-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_sandbox ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
               </div>
               
               <div className="flex items-center justify-between">
                 <div>
                   <div className="font-medium text-gray-900">הפוך לפעיל</div>
                   <div className="text-sm text-gray-500">הספק יוצג ללקוחות בצ'ק אאוט</div>
                 </div>
                 <button
                    type="button"
                    dir="ltr"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
               </div>

               <div className="flex items-center justify-between">
                 <div>
                   <div className="font-medium text-gray-900">הגדר כברירת מחדל</div>
                   <div className="text-sm text-gray-500">ספק זה יהיה הבחירה הראשונה</div>
                 </div>
                 <button
                    type="button"
                    dir="ltr"
                    onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${formData.is_default ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_default ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
               </div>
            </div>

            <div className="flex items-start gap-3 bg-emerald-50/50 p-4 rounded-xl text-sm text-emerald-800 border border-emerald-100">
               <HiShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
               <p>המידע שלך מאובטח ומוצפן. אנחנו לא שומרים פרטי כרטיס אשראי מלאים בשרתים שלנו.</p>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between w-full">
               {editingIntegration && (
                 <Button 
                    variant="ghost" 
                    onClick={() => {
                       if (confirm('למחוק את הספק? פעולה זו לא ניתנת לביטול.')) {
                          handleDelete(editingIntegration.id);
                          setShowModal(false);
                       }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    מחק ספק
                  </Button>
               )}
               <div className="flex items-center gap-3 mr-auto">
                  <Button variant="ghost" onClick={() => setShowModal(false)}>
                    ביטול
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !isFormValid()}
                    className="bg-gray-900 hover:bg-gray-800 text-white min-w-[120px]"
                  >
                    {saving ? 'שומר...' : editingIntegration ? 'שמור שינויים' : 'התקן ספק'}
                  </Button>
               </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
