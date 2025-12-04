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

interface Store {
  id: number;
  name: string;
  domain: string | null;
  currency: string;
  locale: string;
  timezone: string;
  plan: string;
}

type SettingsTab = 'general' | 'payments' | 'shipping' | 'email' | 'integrations' | 'users' | 'api' | 'advanced';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [store, setStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    currency: 'ILS',
    locale: 'he-IL',
    timezone: 'Asia/Jerusalem',
  });

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    loadSettings(signal);

    return () => {
      abortController.abort();
    };
  }, []);

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
      setFormData({
        name: data.store.name || '',
        domain: data.store.domain || '',
        currency: data.store.currency || 'ILS',
        locale: data.store.locale || 'he-IL',
        timezone: data.store.timezone || 'Asia/Jerusalem',
      });
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
      const response = await fetch('/api/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      const data = await response.json();
      setStore(data.store);
      alert('הגדרות נשמרו בהצלחה');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('שגיאה בשמירת הגדרות');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'כללי' },
    { id: 'payments', label: 'תשלומים' },
    { id: 'shipping', label: 'משלוחים' },
    { id: 'email', label: 'מייל' },
    { id: 'integrations', label: 'אינטגרציות' },
    { id: 'users', label: 'משתמשים' },
    { id: 'api', label: 'API' },
    { id: 'advanced', label: 'מתקדם' },
  ];

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
                      </select>
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">משתמשים והרשאות</h2>
                  <p className="text-gray-500">ניהול משתמשים והרשאות - בפיתוח</p>
                </div>
              )}

              {activeTab === 'api' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">מפתחות API</h2>
                  <p className="text-gray-500">ניהול מפתחות API - בפיתוח</p>
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
