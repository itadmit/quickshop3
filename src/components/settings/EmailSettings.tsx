'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiMail } from 'react-icons/hi';

export function EmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [formData, setFormData] = useState({
    apiKey: '',
    fromEmail: '',
    fromName: '',
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
      const response = await fetch('/api/settings/email', {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load email settings');
      const data = await response.json();
      setConfigured(data.configured || false);
      if (data.settings) {
        setFormData({
          apiKey: data.settings.apiKey === '***' ? '' : (data.settings.apiKey || ''),
          fromEmail: data.settings.fromEmail || '',
          fromName: data.settings.fromName || '',
        });
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
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
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

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הגדרות המייל?')) return;

    try {
      const response = await fetch('/api/settings/email', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete email settings');

      setFormData({
        apiKey: '',
        fromEmail: '',
        fromName: '',
      });
      setConfigured(false);
      alert('הגדרות מייל נמחקו בהצלחה');
    } catch (error: any) {
      console.error('Error deleting email settings:', error);
      alert('שגיאה במחיקת הגדרות מייל');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">הגדרות מייל (SendGrid)</h2>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <HiMail className="w-5 h-5 text-gray-500" />
            <p className="text-sm text-gray-600">
              הגדר את פרטי SendGrid לשליחת מיילים. שם השולח ייקבע אוטומטית לפי שם החנות.
            </p>
          </div>

          <div>
            <Label htmlFor="apiKey">מפתח API של SendGrid</Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="SG.xxxxxxxxxxxxxxxxxxxxx"
              className="mt-2"
            />
            {configured && formData.apiKey === '' && (
              <p className="text-xs text-gray-500 mt-1">מפתח API מוגדר (לא מוצג מטעמי אבטחה)</p>
            )}
          </div>

          <div>
            <Label htmlFor="fromEmail">כתובת מייל שולח</Label>
            <Input
              id="fromEmail"
              type="email"
              value={formData.fromEmail}
              onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
              placeholder="no-reply@my-quickshop.com"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              הכתובת חייבת להיות מאומתת ב-SendGrid
            </p>
          </div>

          <div>
            <Label htmlFor="fromName">שם שולח (ברירת מחדל)</Label>
            <Input
              id="fromName"
              type="text"
              value={formData.fromName}
              onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
              placeholder="Quick Shop"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              שם השולח בפועל ייקבע לפי שם החנות, אבל זה ישמש כגיבוי
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t mt-6">
            <Button onClick={handleSave} disabled={saving || !formData.apiKey || !formData.fromEmail}>
              {saving ? 'שומר...' : 'שמור הגדרות'}
            </Button>
            {configured && (
              <Button variant="ghost" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                מחק הגדרות
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

