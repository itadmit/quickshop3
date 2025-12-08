'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PaymentsSettings } from '@/components/settings/PaymentsSettings';
import { ShippingSettings } from '@/components/settings/ShippingSettings';
import { WebhooksSettings } from '@/components/settings/WebhooksSettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { AdvancedSettings } from '@/components/settings/AdvancedSettings';
import { MediaPicker } from '@/components/MediaPicker';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { HiUpload, HiX, HiPlus, HiTrash, HiKey, HiUser, HiShieldCheck } from 'react-icons/hi';

interface Store {
  id: number;
  name: string;
  slug?: string;
  domain: string | null;
  currency: string;
  locale: string;
  timezone: string;
  plan: string;
}

type SettingsTab = 'general' | 'domain' | 'payments' | 'shipping' | 'email' | 'integrations' | 'users' | 'api' | 'advanced' | 'meta-fields' | 'size-charts' | 'product-addons' | 'premium-club' | 'cron-status';

export default function SettingsPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [store, setStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    country: '',
    phone: '',
    logo: '',
    currency: 'ILS',
    locale: 'he-IL',
    timezone: 'Asia/Jerusalem',
    plan: 'free',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    loadSettings(signal);

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadAdminUsers();
    }
    if (activeTab === 'api') {
      loadApiKeys();
    }
  }, [activeTab]);

  const loadSettings = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/store', {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      setStore(data.store);
      const storeData = data.store;
      const settings = storeData.settings || {};
      setFormData({
        name: storeData.name || '',
        domain: storeData.domain || '',
        email: settings.email || '',
        address: settings.address || '',
        city: settings.city || '',
        zip: settings.zip || '',
        country: settings.country || 'ישראל',
        phone: settings.phone || '',
        logo: settings.logo || storeData.logo || '',
        currency: storeData.currency || 'ILS',
        locale: storeData.locale || 'he-IL',
        timezone: storeData.timezone || 'Asia/Jerusalem',
        plan: storeData.plan || 'free',
      });
      
      // Load admin users and API keys if on those tabs
      if (activeTab === 'users') {
        loadAdminUsers();
      }
      if (activeTab === 'api') {
        loadApiKeys();
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading settings:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { logo, email, address, city, zip, country, phone, ...basicSettings } = formData;
      
      const response = await fetch('/api/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...basicSettings,
          themeSettings: {
            logo,
            email,
            address,
            city,
            zip,
            country,
            phone,
          },
        }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      const data = await response.json();
      setStore(data.store);
      toast({
        title: 'הצלחה',
        description: 'הגדרות נשמרו בהצלחה',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשמירת הגדרות',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploadingLogo(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('entityType', 'stores');
      uploadFormData.append('entityId', store?.id?.toString() || '1');
      uploadFormData.append('fileType', 'logo');
      uploadFormData.append('shopId', store?.id?.toString() || '1');

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: uploadFormData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to upload logo');
      const data = await response.json();
      setFormData((prev) => ({ ...prev, logo: data.file.path }));
      
      // Save immediately
      await saveSettings();
      
      toast({
        title: 'הצלחה',
        description: 'הלוגו הועלה בהצלחה',
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בהעלאת הלוגו',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const response = await fetch('/api/settings/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  };

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/settings/api-keys', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.api_keys || []);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const createApiKey = async () => {
    if (!newApiKeyName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין שם למפתח',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newApiKeyName }),
      });

      if (!response.ok) throw new Error('Failed to create API key');
      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: 'מפתח API נוצר בהצלחה. שמור אותו עכשיו - הוא לא יוצג שוב!',
      });
      
      setNewApiKeyName('');
      setShowCreateApiKey(false);
      await loadApiKeys();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה ביצירת מפתח API',
        variant: 'destructive',
      });
    }
  };

  const tabs: { id: SettingsTab; label: string; href?: string }[] = [
    { id: 'general', label: 'כללי' },
    { id: 'domain', label: 'דומיין' },
    { id: 'payments', label: 'תשלומים' },
    { id: 'shipping', label: 'משלוחים' },
    { id: 'email', label: 'מייל' },
    { id: 'integrations', label: 'אינטגרציות' },
    { id: 'users', label: 'משתמשים' },
    { id: 'api', label: 'API' },
    { id: 'advanced', label: 'מתקדם' },
    { id: 'meta-fields', label: 'שדות מטא', href: '/settings/meta-fields' },
    { id: 'size-charts', label: 'טבלאות מידות', href: '/settings/size-charts' },
    { id: 'product-addons', label: 'תוספות למוצרים', href: '/settings/product-addons' },
    { id: 'premium-club', label: 'מועדון פרימיום', href: '/settings/premium-club' },
    { id: 'cron-status', label: 'סטטוס CRON', href: '/settings/cron-status' },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-2">
              <div className="space-y-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                {/* Title */}
                <div className="h-7 bg-gray-200 rounded w-48 animate-pulse"></div>
                
                {/* Form Fields */}
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">הגדרות</h1>
        {(activeTab === 'general' || activeTab === 'domain') && (
          <Button onClick={saveSettings} disabled={saving}>
            שמור שינויים
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <nav className="p-2">
              <ul className="space-y-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    {tab.href ? (
                      <a
                        href={tab.href}
                        className="w-full text-right px-4 py-2 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-50 block"
                      >
                        {tab.label}
                      </a>
                    ) : (
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          w-full text-right px-4 py-2 text-sm rounded-lg transition-colors
                          ${activeTab === tab.id
                            ? 'bg-green-50 text-green-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        {tab.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <Card>
            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">הגדרות כללי</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        שם החנות
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="שם החנות"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        דומיין
                      </label>
                      <Input
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        placeholder="example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        מטבע
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="ILS">₪ שקל (ILS)</option>
                        <option value="USD">$ דולר (USD)</option>
                        <option value="EUR">€ אירו (EUR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        שפה
                      </label>
                      <select
                        value={formData.locale}
                        onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="he-IL">עברית</option>
                        <option value="en-US">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        אזור זמן
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="Asia/Jerusalem">ירושלים (GMT+2)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">ניו יורק (GMT-5)</option>
                        <option value="Europe/London">לונדון (GMT+0)</option>
                        <option value="Asia/Tokyo">טוקיו (GMT+9)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        אימייל החנות
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="info@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        טלפון
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="03-1234567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        כתובת
                      </label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="רחוב ושם רחוב"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          עיר
                        </label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="תל אביב"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          מיקוד
                        </label>
                        <Input
                          value={formData.zip}
                          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                          placeholder="12345"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        מדינה
                      </label>
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="ישראל">ישראל</option>
                        <option value="ארצות הברית">ארצות הברית</option>
                        <option value="בריטניה">בריטניה</option>
                        <option value="קנדה">קנדה</option>
                        <option value="אוסטרליה">אוסטרליה</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        לוגו החנות
                      </label>
                      {formData.logo ? (
                        <div className="relative inline-block">
                          <img
                            src={formData.logo}
                            alt="Store logo"
                            className="w-32 h-32 object-contain border border-gray-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, logo: '' })}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <HiX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoUpload(file);
                            }}
                            className="hidden"
                            id="logo-upload"
                            disabled={uploadingLogo}
                          />
                          <label
                            htmlFor="logo-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <HiUpload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {uploadingLogo ? 'מעלה...' : 'לחץ להעלאת לוגו'}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        תוכנית
                      </label>
                      <select
                        value={formData.plan}
                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="free">חינם</option>
                        <option value="basic">בסיסי</option>
                        <option value="pro">מקצועי</option>
                        <option value="enterprise">ארגוני</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        שינוי תוכנית ייכנס לתוקף לאחר אישור
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'domain' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">דומיין מותאם אישית</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      חבר את הדומיין שלך לחנות כדי ליצור חוויית קנייה מקצועית יותר
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        דומיין מותאם אישית
                      </label>
                      <Input
                        value={formData.domain || ''}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        placeholder="example.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        הזן את הדומיין שלך ללא http:// או https:// (לדוגמה: myshop.com)
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">איך לחבר דומיין מותאם אישית?</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                        <li>היכנס לפאנל הניהול של ספק הדומיין שלך (GoDaddy, Namecheap, Cloudflare וכו')</li>
                        <li>מצא את ההגדרות של DNS Records</li>
                        <li>הוסף A Record חדש עם הערכים הבאים:
                          <ul className="list-disc list-inside mr-4 mt-1 space-y-1">
                            <li><strong>Type:</strong> A</li>
                            <li><strong>Name:</strong> @ (או השאר ריק)</li>
                            <li><strong>Value:</strong> 76.76.21.21 (כתובת IP שלנו)</li>
                            <li><strong>TTL:</strong> 3600 (או ברירת מחדל)</li>
                          </ul>
                        </li>
                        <li>שמור את השינויים</li>
                        <li>הזן את הדומיין למעלה ולחץ על "שמור שינויים"</li>
                      </ol>
                      <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                        <p className="text-xs text-gray-700">
                          <strong>הערה חשובה:</strong> שינויי DNS יכולים לקחת עד 48 שעות להיכנס לתוקף. 
                          לאחר שהדומיין מחובר, החנות שלך תהיה זמינה בכתובת החדשה שלך.
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">כתובת החנות הנוכחית</h3>
                      <p className="text-sm text-gray-700">
                        {formData.domain ? (
                          <>
                            <span className="font-mono">https://{formData.domain}</span>
                            <span className="text-gray-500 mr-2"> (לאחר חיבור הדומיין)</span>
                          </>
                        ) : (
                          <>
                            <span className="font-mono">quickshop3.vercel.app/shops/{store?.slug || 'your-slug'}</span>
                            <span className="text-gray-500 mr-2"> (כתובת ברירת מחדל)</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && <PaymentsSettings />}

              {activeTab === 'shipping' && <ShippingSettings />}

              {activeTab === 'email' && <EmailSettings />}

              {activeTab === 'integrations' && <WebhooksSettings />}

              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">משתמשים והרשאות</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadAdminUsers}
                    >
                      רענן
                    </Button>
                  </div>
                  
                  {adminUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <HiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p>אין משתמשי אדמין נוספים</p>
                      <p className="text-sm mt-2">כרגע רק הבעלים יכול לגשת לחנות</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{user.name || user.email}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.role && (
                              <div className="text-xs text-gray-400 mt-1">תפקיד: {user.role}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <HiTrash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">הוספת משתמש אדמין</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      תכונה זו תזמין משתמש חדש לגשת לחנות שלך. המשתמש יקבל אימייל עם הוראות התחברות.
                    </p>
                    <p className="text-xs text-blue-700">
                      תכונה זו תזמין משתמש חדש לגשת לחנות שלך. המשתמש יקבל אימייל עם הוראות התחברות.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <HiKey className="w-5 h-5" />
                      מפתחות API
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCreateApiKey(true);
                        setNewApiKeyName('');
                      }}
                    >
                      <HiPlus className="w-4 h-4 ml-1" />
                      צור מפתח חדש
                    </Button>
                  </div>

                  {showCreateApiKey && (
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="space-y-3">
                        <Label>שם המפתח</Label>
                        <Input
                          value={newApiKeyName}
                          onChange={(e) => setNewApiKeyName(e.target.value)}
                          placeholder="לדוגמה: Mobile App, Integration"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={createApiKey}
                            disabled={!newApiKeyName.trim()}
                          >
                            צור מפתח
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowCreateApiKey(false);
                              setNewApiKeyName('');
                            }}
                          >
                            ביטול
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {apiKeys.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <HiKey className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p>אין מפתחות API</p>
                      <p className="text-sm mt-2">צור מפתח API כדי לאפשר גישה חיצונית ל-API שלך</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {apiKeys.map((key) => (
                        <div
                          key={key.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{key.name}</div>
                            <div className="text-sm text-gray-500 font-mono mt-1">
                              {key.key_prefix}...
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              נוצר: {new Date(key.created_at).toLocaleDateString('he-IL')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <HiTrash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                      <HiShieldCheck className="w-4 h-4" />
                      אבטחה
                    </h3>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                      <li>שמור את מפתחות ה-API שלך בסוד</li>
                      <li>אל תשתף מפתחות API בקוד ציבורי</li>
                      <li>מחק מפתחות שלא בשימוש</li>
                      <li>השתמש ב-HTTPs בלבד</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <AdvancedSettings />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
