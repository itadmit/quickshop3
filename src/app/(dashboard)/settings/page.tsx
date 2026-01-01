'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShippingSettings } from '@/components/settings/ShippingSettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { AdvancedSettings } from '@/components/settings/AdvancedSettings';
import { GiftCardSettings } from '@/components/settings/GiftCardSettings';
import { MediaPicker } from '@/components/MediaPicker';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { HiUpload, HiX, HiPlus, HiTrash, HiKey, HiUser, HiShieldCheck, HiMail, HiClock } from 'react-icons/hi';

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

type SettingsTab = 'general' | 'shipping' | 'email' | 'users' | 'api' | 'advanced' | 'premium-club' | 'cron-status' | 'subscription' | 'gift-cards';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tab = searchParams.get('tab') as SettingsTab | null;
    return tab && ['general', 'shipping', 'email', 'gift-cards', 'users', 'api', 'advanced', 'premium-club', 'cron-status', 'subscription'].includes(tab) 
      ? tab 
      : 'general';
  });
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
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [showCreateApiKey, setShowCreateApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [activePlugins, setActivePlugins] = useState<any[]>([]);
  const [totalPluginsPrice, setTotalPluginsPrice] = useState(0);
  const [loadingPlugins, setLoadingPlugins] = useState(false);
  // Invite user state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'staff',
  });
  const [sendingInvite, setSendingInvite] = useState(false);

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
    if (activeTab === 'subscription') {
      loadActivePlugins();
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
        setPendingInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  };

  const sendInvitation = async () => {
    if (!inviteForm.email.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין כתובת אימייל',
        variant: 'destructive',
      });
      return;
    }

    setSendingInvite(true);
    try {
      const response = await fetch('/api/settings/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשליחת ההזמנה');
      }

      toast({
        title: 'הצלחה',
        description: 'ההזמנה נשלחה בהצלחה!',
      });

      setShowInviteForm(false);
      setInviteForm({ email: '', firstName: '', lastName: '', role: 'staff' });
      loadAdminUsers();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשליחת ההזמנה',
        variant: 'destructive',
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const cancelInvitation = async (invitationId: number) => {
    try {
      const response = await fetch(`/api/settings/users/invite?id=${invitationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('שגיאה בביטול ההזמנה');
      }

      toast({
        title: 'הצלחה',
        description: 'ההזמנה בוטלה',
      });

      loadAdminUsers();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const removeUser = async (userId: number) => {
    if (!confirm('האם אתה בטוח שברצונך להסיר משתמש זה?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/users?id=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('שגיאה בהסרת המשתמש');
      }

      toast({
        title: 'הצלחה',
        description: 'המשתמש הוסר בהצלחה',
      });

      loadAdminUsers();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      owner: 'בעלים',
      admin: 'מנהל',
      staff: 'צוות',
      limited_staff: 'צוות מוגבל',
    };
    return roles[role] || role;
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

  const loadActivePlugins = async () => {
    try {
      setLoadingPlugins(true);
      const response = await fetch('/api/plugins/active', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setActivePlugins(data.plugins || []);
        
        // חישוב סכום כולל
        const total = (data.plugins || []).reduce((sum: number, p: any) => {
          return sum + (p.monthly_price || 0);
        }, 0);
        setTotalPluginsPrice(total);
      }
    } catch (error) {
      console.error('Error loading active plugins:', error);
    } finally {
      setLoadingPlugins(false);
    }
  };

  const handleCancelPlugin = async (pluginSlug: string) => {
    if (!confirm('האם אתה בטוח שברצונך לבטל את המנוי? התוסף יישאר פעיל עד סוף החודש.')) {
      return;
    }

    try {
      const response = await fetch(`/api/plugins/${pluginSlug}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'המנוי בוטל בהצלחה',
        });
        loadActivePlugins();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'לא ניתן לבטל את המנוי',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error cancelling plugin:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לבטל את המנוי',
        variant: 'destructive',
      });
    }
  };

  const tabs: { id: SettingsTab; label: string; href?: string }[] = [
    { id: 'general', label: 'כללי' },
    { id: 'subscription', label: 'מנוי' },
    { id: 'shipping', label: 'משלוחים' },
    { id: 'email', label: 'התראות ומיילים' },
    { id: 'gift-cards', label: 'גיפט קארד' },
    { id: 'users', label: 'משתמשים' },
    { id: 'api', label: 'API' },
    { id: 'advanced', label: 'מתקדם' },
    { id: 'premium-club', label: 'מועדון פרימיום', href: '/settings/premium-club' },
    { id: 'gdpr', label: 'GDPR ועוגיות', href: '/settings/gdpr' },
    { id: 'cron-status', label: 'סטטוס CRON', href: '/settings/cron-status' },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-28 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Skeleton - 17 tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-2">
              <div className="space-y-1">
                {/* First tab active */}
                <div className="h-9 bg-green-100 rounded-lg animate-pulse"></div>
                {/* Other tabs */}
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Skeleton - matches General settings form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                {/* Title */}
                <div className="h-6 bg-gray-200 rounded w-28 animate-pulse"></div>
                
                {/* Form Fields */}
                <div className="space-y-5">
                  {/* שם החנות */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* דומיין */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-14 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* מטבע */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* שפה */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* אזור זמן */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* אימייל החנות */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* טלפון */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* כתובת */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-14 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* עיר + מיקוד */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                      <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                      <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* מדינה */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-14 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  </div>
                  
                  {/* לוגו החנות */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-24 bg-gray-100 rounded-lg animate-pulse border-2 border-dashed border-gray-200"></div>
                  </div>
                  
                  {/* תוכנית */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-14 animate-pulse"></div>
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-48 animate-pulse"></div>
                  </div>
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
        {activeTab === 'general' && (
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

              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">מנוי ותוספים</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      ניהול המנוי הבסיסי והתוספים הפעילים שלך
                    </p>
                  </div>

                  {/* תוכנית בסיסית */}
                  <Card>
                    <div className="p-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-4">תוכנית בסיסית</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {formData.plan === 'free' && 'תוכנית חינמית'}
                            {formData.plan === 'basic' && 'תוכנית בסיסית'}
                            {formData.plan === 'pro' && 'תוכנית מקצועית'}
                            {formData.plan === 'enterprise' && 'תוכנית ארגונית'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formData.plan === 'free' && 'גישה בסיסית לכל התכונות'}
                            {formData.plan === 'basic' && 'תכונות מתקדמות לחנויות קטנות'}
                            {formData.plan === 'pro' && 'תכונות מקצועיות לחנויות גדולות'}
                            {formData.plan === 'enterprise' && 'תכונות מתקדמות ותמיכה 24/7'}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-gray-900">
                            {formData.plan === 'free' && '₪0'}
                            {formData.plan === 'basic' && '₪99'}
                            {formData.plan === 'pro' && '₪299'}
                            {formData.plan === 'enterprise' && '₪999'}
                          </p>
                          <p className="text-sm text-gray-600">/חודש</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* תוספים פעילים */}
                  <Card>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-md font-semibold text-gray-900">תוספים פעילים</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = '/settings/plugins'}
                        >
                          הוסף תוספים
                        </Button>
                      </div>

                      {loadingPlugins ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">טוען תוספים...</p>
                        </div>
                      ) : activePlugins.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">אין תוספים פעילים</p>
                          <Button
                            variant="outline"
                            onClick={() => window.location.href = '/settings/plugins'}
                          >
                            גש למרקטפלייס
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activePlugins.map((plugin: any) => (
                            <div
                              key={plugin.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{plugin.plugin_name || 'תוסף'}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {plugin.status === 'ACTIVE' ? 'פעיל' : 'לא פעיל'}
                                  {plugin.next_billing_date && (
                                    <> • חיוב הבא: {new Date(plugin.next_billing_date).toLocaleDateString('he-IL')}</>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-left">
                                  <p className="font-semibold text-gray-900">₪{plugin.monthly_price}</p>
                                  <p className="text-xs text-gray-500">/חודש</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelPlugin(plugin.plugin_slug || '')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  בטל מנוי
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activePlugins.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">סכום כולל תוספים:</span>
                            <span className="text-2xl font-bold text-gray-900">₪{totalPluginsPrice.toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 text-left">
                            סכום זה מתווסף למנוי הבסיסי שלך
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'shipping' && <ShippingSettings />}

              {activeTab === 'email' && <EmailSettings />}

              {activeTab === 'gift-cards' && <GiftCardSettings />}

              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">משתמשים והרשאות</h2>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadAdminUsers}
                      >
                        רענן
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowInviteForm(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <HiPlus className="w-4 h-4 ml-1" />
                        הזמן משתמש
                      </Button>
                    </div>
                  </div>

                  {/* Invite Form */}
                  {showInviteForm && (
                    <Card className="p-4 bg-green-50 border-green-200">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-green-900 flex items-center gap-2">
                          <HiMail className="w-5 h-5" />
                          הזמנת משתמש חדש
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>שם פרטי</Label>
                            <Input
                              value={inviteForm.firstName}
                              onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                              placeholder="שם פרטי"
                            />
                          </div>
                          <div>
                            <Label>שם משפחה</Label>
                            <Input
                              value={inviteForm.lastName}
                              onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                              placeholder="שם משפחה"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>אימייל *</Label>
                          <Input
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                            placeholder="email@example.com"
                            required
                          />
                        </div>
                        <div>
                          <Label>תפקיד</Label>
                          <select
                            value={inviteForm.role}
                            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="admin">מנהל - גישה מלאה</option>
                            <option value="staff">צוות - גישה סטנדרטית</option>
                            <option value="limited_staff">צוות מוגבל - גישה מוגבלת</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={sendInvitation}
                            disabled={sendingInvite}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {sendingInvite ? 'שולח...' : 'שלח הזמנה'}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setShowInviteForm(false);
                              setInviteForm({ email: '', firstName: '', lastName: '', role: 'staff' });
                            }}
                          >
                            ביטול
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Pending Invitations */}
                  {pendingInvitations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <HiClock className="w-4 h-4" />
                        הזמנות ממתינות ({pendingInvitations.length})
                      </h3>
                      {pendingInvitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className={`flex items-center justify-between p-4 border rounded-lg ${
                            invitation.isExpired 
                              ? 'border-red-200 bg-red-50' 
                              : 'border-yellow-200 bg-yellow-50'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {invitation.firstName && invitation.lastName 
                                ? `${invitation.firstName} ${invitation.lastName}` 
                                : invitation.email}
                            </div>
                            <div className="text-sm text-gray-500">{invitation.email}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              תפקיד: {getRoleLabel(invitation.role)} • 
                              {invitation.isExpired ? (
                                <span className="text-red-600"> פג תוקף</span>
                              ) : (
                                <span> תוקף עד: {new Date(invitation.expiresAt).toLocaleDateString('he-IL')}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <HiX className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active Users */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700">משתמשים פעילים</h3>
                    {adminUsers.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <HiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p>אין משתמשי אדמין נוספים</p>
                        <p className="text-sm mt-2">לחץ על "הזמן משתמש" כדי להוסיף צוות</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {adminUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-gray-900 flex items-center gap-2">
                                {user.name || user.email}
                                {user.isOwner && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                    בעלים
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                תפקיד: {getRoleLabel(user.role)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!user.isOwner && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeUser(user.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <HiTrash className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">איך זה עובד?</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>הזמן משתמש על ידי הזנת האימייל שלו</li>
                      <li>המשתמש יקבל אימייל עם לינק להצטרפות</li>
                      <li>אם יש לו כבר חשבון בקוויק שופ - הוא יקבל גישה לחנות שלך</li>
                      <li>אם אין לו חשבון - הוא יצור חשבון חדש</li>
                    </ul>
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
