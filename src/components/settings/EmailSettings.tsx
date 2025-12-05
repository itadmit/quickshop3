'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiMail, HiColorSwatch, HiDocument } from 'react-icons/hi';
import Link from 'next/link';

export function EmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    senderName: '',
    color1: '#15b981',
    color2: '#10b981',
  });
  const [sendGridConfigured, setSendGridConfigured] = useState(false);

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
      
      // Load store settings (for email colors and sender name)
      const storeResponse = await fetch('/api/settings/store', {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        const store = storeData.store;
        const settings = (store?.settings as any) || {};
        const themeSettings = settings.themeSettings || {};
        
        setFormData({
          senderName: themeSettings.emailSenderName || store?.name || 'Quick Shop',
          color1: themeSettings.emailColor1 || '#15b981',
          color2: themeSettings.emailColor2 || '#10b981',
        });
      }
      
      // Check if SendGrid is configured (from ENV)
      const emailResponse = await fetch('/api/settings/email', {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        setSendGridConfigured(emailData.configured || false);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading email settings:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Save to store settings
      const storeResponse = await fetch('/api/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          themeSettings: {
            emailSenderName: formData.senderName,
            emailColor1: formData.color1,
            emailColor2: formData.color2,
          },
        }),
      });

      if (!storeResponse.ok) {
        const errorData = await storeResponse.json();
        throw new Error(errorData.error || 'Failed to save email settings');
      }

      await loadSettings();
      alert('הגדרות מייל נשמרו בהצלחה');
    } catch (error: any) {
      console.error('Error saving email settings:', error);
      alert(`שגיאה בשמירת הגדרות מייל: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <Card>
          <div className="p-6 space-y-6">
            {/* SendGrid Status */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            {/* Sender Name */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
            {/* Colors */}
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            {/* Templates Link */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            {/* Save Button */}
            <div className="pt-4 border-t">
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">הגדרות מייל</h2>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <HiMail className="w-5 h-5 text-gray-500" />
            <p className="text-sm text-gray-600">
              הגדר את שם השולח והצבעים למיילים. SendGrid API Key ו-From Email מוגדרים ב-Environment Variables.
            </p>
          </div>

          {/* SendGrid Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">סטטוס SendGrid</p>
                <p className="text-xs text-blue-700 mt-1">
                  {sendGridConfigured 
                    ? '✅ SendGrid מוגדר ומוכן לשליחת מיילים'
                    : '⚠️ SendGrid לא מוגדר - הגדר SENDGRID_API_KEY ו-SENDGRID_FROM_EMAIL ב-Environment Variables'}
                </p>
              </div>
            </div>
          </div>

          {/* Sender Name */}
          <div>
            <Label htmlFor="senderName">שם שולח</Label>
            <Input
              id="senderName"
              type="text"
              value={formData.senderName}
              onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
              placeholder="Quick Shop"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              שם השולח שיופיע במיילים. אם לא מוגדר, ישתמש בשם החנות.
            </p>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HiColorSwatch className="w-5 h-5 text-gray-500" />
              <Label>צבעי מייל</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color1" className="text-sm">צבע ראשי</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="color1"
                    type="color"
                    value={formData.color1}
                    onChange={(e) => setFormData({ ...formData, color1: e.target.value })}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.color1}
                    onChange={(e) => setFormData({ ...formData, color1: e.target.value })}
                    placeholder="#15b981"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="color2" className="text-sm">צבע משני</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="color2"
                    type="color"
                    value={formData.color2}
                    onChange={(e) => setFormData({ ...formData, color2: e.target.value })}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.color2}
                    onChange={(e) => setFormData({ ...formData, color2: e.target.value })}
                    placeholder="#10b981"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              הצבעים ישמשו ל-header ולכפתורים במיילים.
            </p>
          </div>

          {/* Email Templates Link */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HiDocument className="w-5 h-5 text-gray-500" />
              <Label>תבניות מייל</Label>
            </div>
            <Link
              href="/email-templates"
              className="block w-full px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              ערוך תבניות מייל (ORDER_CONFIRMATION, WELCOME, וכו')
            </Link>
            <p className="text-xs text-gray-500">
              ערוך את תוכן המיילים והנושאים שנשלחים ללקוחות.
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-2">תצוגה מקדימה:</p>
            <div className="bg-white rounded p-3 border border-gray-200">
              <div 
                className="h-12 rounded-t"
                style={{ background: `linear-gradient(135deg, ${formData.color1} 0%, ${formData.color2} 100%)` }}
              ></div>
              <div className="p-3 text-sm text-gray-600">
                <p className="font-medium">{formData.senderName}</p>
                <p className="text-xs mt-1">תוכן המייל...</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'שומר...' : 'שמור הגדרות'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
