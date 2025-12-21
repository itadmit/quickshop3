'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { HiSave, HiArrowLeft, HiRefresh } from 'react-icons/hi';
import { Shield, Cookie, Eye } from 'lucide-react';
import Link from 'next/link';

interface GDPRSettings {
  enabled: boolean;
  useCustomText: boolean;
  customPolicyText: string;
  acceptButtonText: string;
  declineButtonText: string;
  bannerPosition: 'bottom' | 'top';
  bannerStyle: 'full-width' | 'box-right' | 'box-left';
  showDeclineButton: boolean;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
}

const DEFAULT_POLICY_TEXT = `מדיניות העוגיות (Cookies) של האתר

מהן עוגיות?
עוגיות הן קבצי טקסט קטנים שמאוחסנים על המכשיר שלך (מחשב, טלפון נייד או טאבלט) בעת הגלישה באתר. העוגיות מאפשרות לאתר לזכור את העדפותיך ולספק לך חוויית משתמש מותאמת אישית.

איך אנחנו משתמשים בעוגיות?
אנו משתמשים בעוגיות למספר מטרות:

1. עוגיות חיוניות - נדרשות לתפעול האתר והן הכרחיות לפעילותו התקינה
2. עוגיות ביצועים - עוזרות לנו להבין כיצד המבקרים משתמשים באתר
3. עוגיות פרסום - משמשות להתאמת פרסומות רלוונטיות עבורך

שליטה בעוגיות
באפשרותך לשלוט בעוגיות דרך הגדרות הדפדפן שלך. עם זאת, חסימת חלק מהעוגיות עלולה להשפיע על חווית הגלישה שלך באתר.`;

const DEFAULT_SETTINGS: GDPRSettings = {
  enabled: false,
  useCustomText: false,
  customPolicyText: DEFAULT_POLICY_TEXT,
  acceptButtonText: '',
  declineButtonText: '',
  bannerPosition: 'bottom',
  bannerStyle: 'full-width',
  showDeclineButton: true,
  backgroundColor: '#1f2937',
  textColor: '#ffffff',
  buttonColor: '#10b981',
  buttonTextColor: '#ffffff',
};

export default function GDPRSettingsPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<GDPRSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/gdpr', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setFormData({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      }
    } catch (error) {
      console.error('Error loading GDPR settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/settings/gdpr', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('שגיאה בשמירת ההגדרות');
      }

      toast({
        title: 'הצלחה',
        description: 'הגדרות GDPR ועוגיות נשמרו בהצלחה',
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בשמירת ההגדרות',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setFormData((prev) => ({
      ...prev,
      customPolicyText: DEFAULT_POLICY_TEXT,
    }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-gray-500 hover:text-gray-700">
            <HiArrowLeft className="w-5 h-5 rotate-180" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              הגדרות GDPR ומדיניות עוגיות
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              נהל את הגדרות הפרטיות והגנת המידע בחנות שלך
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
          <HiSave className="w-4 h-4 ml-2" />
          {saving ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/settings" className="hover:text-emerald-600">דשבורד</Link>
        <span>{'<'}</span>
        <span className="text-gray-900">הגדרות GDPR ועוגיות</span>
      </div>

      {/* Main Settings Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">תצורת הגדרות GDPR</h2>
            <p className="text-sm text-gray-500">הגדר הודעות הסכמה ומדיניות פרטיות</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable GDPR Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <div>
                <h3 className="font-medium text-gray-900">הפעל הודעת GDPR</h3>
                <p className="text-sm text-gray-500">הצג הודעת הסכמה לעוגיות ומדיניות פרטיות</p>
              </div>
            </div>
          </div>

          {/* Use Custom Text Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useCustomText}
                  onChange={(e) => setFormData({ ...formData, useCustomText: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <div>
                <h3 className="font-medium text-gray-900">השתמש בטקסט מותאם אישית</h3>
                <p className="text-sm text-gray-500">עצב את הודעת ה-GDPR בהתאם לצרכיך</p>
              </div>
            </div>
          </div>

          {/* Custom Policy Text */}
          {formData.useCustomText && (
            <Card className="p-4 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">טקסט מדיניות מותאם אישית</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  className="text-gray-600"
                >
                  <HiRefresh className="w-4 h-4 ml-1" />
                  שחזר טקסט ברירת מחדל
                </Button>
              </div>
              <Textarea
                value={formData.customPolicyText}
                onChange={(e) => setFormData({ ...formData, customPolicyText: e.target.value })}
                rows={12}
                className="w-full font-mono text-sm"
                placeholder="הזן את טקסט מדיניות העוגיות שלך..."
                dir="rtl"
              />
            </Card>
          )}
        </div>
      </Card>

      {/* Banner Position & Style */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">עיצוב ומיקום הבאנר</h2>
            <p className="text-sm text-gray-500">התאם את המראה והמיקום של הודעת העוגיות</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banner Position */}
          <div>
            <Label htmlFor="bannerPosition">מיקום הבאנר</Label>
            <select
              id="bannerPosition"
              value={formData.bannerPosition}
              onChange={(e) => setFormData({ ...formData, bannerPosition: e.target.value as 'bottom' | 'top' })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="bottom">למטה</option>
              <option value="top">למעלה</option>
            </select>
          </div>

          {/* Banner Style */}
          <div>
            <Label htmlFor="bannerStyle">סגנון הבאנר</Label>
            <select
              id="bannerStyle"
              value={formData.bannerStyle}
              onChange={(e) => setFormData({ ...formData, bannerStyle: e.target.value as 'full-width' | 'box-right' | 'box-left' })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="full-width">שורה מלאה (רוחב מסך)</option>
              <option value="box-right">ריבוע מימין</option>
              <option value="box-left">ריבוע משמאל</option>
            </select>
          </div>
        </div>

        {/* Show Decline Button */}
        <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showDeclineButton}
                onChange={(e) => setFormData({ ...formData, showDeclineButton: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
            <div>
              <h3 className="font-medium text-gray-900">הצג כפתור דחייה</h3>
              <p className="text-sm text-gray-500">אפשר למשתמשים לדחות עוגיות לא חיוניות</p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>צבע רקע</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label>צבע טקסט</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label>צבע כפתור</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={formData.buttonColor}
                onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.buttonColor}
                onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label>צבע טקסט כפתור</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={formData.buttonTextColor}
                onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.buttonTextColor}
                onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Button Text Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Cookie className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">הגדרות כפתורים</h2>
            <p className="text-sm text-gray-500">התאם את טקסט הכפתורים</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="acceptButtonText">טקסט כפתור אישור</Label>
            <Input
              id="acceptButtonText"
              value={formData.acceptButtonText}
              onChange={(e) => setFormData({ ...formData, acceptButtonText: e.target.value })}
              placeholder="אני מסכים"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">השאר ריק לשימוש בברירת המחדל</p>
          </div>

          <div>
            <Label htmlFor="declineButtonText">טקסט כפתור דחייה</Label>
            <Input
              id="declineButtonText"
              value={formData.declineButtonText}
              onChange={(e) => setFormData({ ...formData, declineButtonText: e.target.value })}
              placeholder="לא מסכים"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">השאר ריק לשימוש בברירת המחדל</p>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          תצוגה מקדימה
        </h3>
        <div className="bg-gray-100 rounded-lg p-4 min-h-[200px] relative overflow-hidden">
          {/* Simulated page content */}
          <div className="space-y-2 opacity-30">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            <div className="h-20 bg-gray-300 rounded mt-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mt-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>

          {/* Cookie Banner Preview */}
          {formData.enabled && (
            <div
              className={`absolute ${
                formData.bannerPosition === 'bottom' ? 'bottom-0' : 'top-0'
              } ${
                formData.bannerStyle === 'full-width'
                  ? 'left-0 right-0'
                  : formData.bannerStyle === 'box-right'
                  ? 'right-4 max-w-sm'
                  : 'left-4 max-w-sm'
              } ${
                formData.bannerPosition === 'bottom' && formData.bannerStyle !== 'full-width'
                  ? 'bottom-4'
                  : formData.bannerPosition === 'top' && formData.bannerStyle !== 'full-width'
                  ? 'top-4'
                  : ''
              }`}
            >
              <div
                className={`p-4 shadow-lg ${formData.bannerStyle === 'full-width' ? '' : 'rounded-lg'}`}
                style={{
                  backgroundColor: formData.backgroundColor,
                  color: formData.textColor,
                }}
              >
                <div className={`flex ${formData.bannerStyle === 'full-width' ? 'items-center justify-between' : 'flex-col gap-3'}`}>
                  <div className={formData.bannerStyle === 'full-width' ? 'flex-1' : ''}>
                    <div className="flex items-center gap-2 mb-1">
                      <Cookie className="w-4 h-4" />
                      <span className="font-medium text-sm">הודעת עוגיות</span>
                    </div>
                    <p className="text-xs opacity-90">
                      אנו משתמשים בעוגיות לשיפור חווית הגלישה שלך באתר.
                    </p>
                  </div>
                  <div className={`flex gap-2 ${formData.bannerStyle === 'full-width' ? '' : 'w-full'}`}>
                    <button
                      className={`px-4 py-2 rounded text-sm font-medium ${formData.bannerStyle !== 'full-width' ? 'flex-1' : ''}`}
                      style={{
                        backgroundColor: formData.buttonColor,
                        color: formData.buttonTextColor,
                      }}
                    >
                      {formData.acceptButtonText || 'אני מסכים'}
                    </button>
                    {formData.showDeclineButton && (
                      <button
                        className={`px-4 py-2 rounded text-sm font-medium border ${formData.bannerStyle !== 'full-width' ? 'flex-1' : ''}`}
                        style={{
                          borderColor: formData.textColor,
                          color: formData.textColor,
                          backgroundColor: 'transparent',
                        }}
                      >
                        {formData.declineButtonText || 'לא מסכים'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!formData.enabled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 shadow-lg text-center">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">הבאנר מושבת כרגע</p>
                <p className="text-sm text-gray-400">הפעל את הודעת GDPR כדי לראות תצוגה מקדימה</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Link href="/settings">
          <Button variant="outline">
            <HiArrowLeft className="w-4 h-4 mr-2 rotate-180" />
            חזור להגדרות
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
          <HiSave className="w-4 h-4 ml-2" />
          {saving ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>
    </div>
  );
}

