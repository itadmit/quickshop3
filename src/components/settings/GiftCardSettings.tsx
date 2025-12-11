'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { MediaPicker } from '@/components/MediaPicker';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { useStoreId } from '@/hooks/useStoreId';
import { HiSave, HiPhotograph, HiColorSwatch } from 'react-icons/hi';
import { Gift } from 'lucide-react';

export function GiftCardSettings() {
  const { toast } = useOptimisticToast();
  const storeId = useStoreId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    backgroundType: 'gradient', // 'gradient' | 'image' | 'solid'
    gradientColor1: '#ff9a9e',
    gradientColor2: '#fecfef',
    backgroundImage: '',
    backgroundPosition: 'center', // 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    textPosition: 'right', // 'left' | 'center' | 'right'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/store', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const store = data.store;
        const settings = (store?.settings as any) || {};
        const giftCardSettings = settings.giftCardSettings || {};

        setFormData({
          backgroundType: giftCardSettings.backgroundType || 'gradient',
          gradientColor1: giftCardSettings.gradientColor1 || '#ff9a9e',
          gradientColor2: giftCardSettings.gradientColor2 || '#fecfef',
          backgroundImage: giftCardSettings.backgroundImage || '',
          backgroundPosition: giftCardSettings.backgroundPosition || 'center',
          textPosition: giftCardSettings.textPosition || 'right',
        });
      }
    } catch (error) {
      console.error('Error loading gift card settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // קבלת הגדרות קיימות
      const storeResponse = await fetch('/api/settings/store', {
        credentials: 'include',
      });

      let existingSettings = {};
      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        existingSettings = (storeData.store?.settings as any) || {};
      }

      // עדכון הגדרות גיפט קארד
      const updatedSettings = {
        ...existingSettings,
        giftCardSettings: {
          backgroundType: formData.backgroundType,
          gradientColor1: formData.gradientColor1,
          gradientColor2: formData.gradientColor2,
          backgroundImage: formData.backgroundImage,
          backgroundPosition: formData.backgroundPosition,
          textPosition: formData.textPosition,
        },
      };

      const response = await fetch('/api/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          giftCardSettings: updatedSettings.giftCardSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('שגיאה בשמירת ההגדרות');
      }

      toast({
        title: 'הצלחה',
        description: 'הגדרות גיפט קארד נשמרו בהצלחה',
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5" />
            הגדרות גיפט קארד
          </h2>
          <p className="text-gray-500 mt-1 text-sm">עצב את עיצוב הגיפט קארד במייל</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
          <HiSave className="w-4 h-4 ml-2" />
          {saving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>

      <Card className="p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiColorSwatch className="w-4 h-4" />
          עיצוב רקע הגיפט קארד
        </h3>

        <div className="space-y-6">
          <div>
            <Label htmlFor="backgroundType">סוג רקע</Label>
            <Select
              value={formData.backgroundType}
              onValueChange={(value: string) =>
                setFormData({ ...formData, backgroundType: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="בחר סוג רקע" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gradient">גרדיאנט (צבעים)</SelectItem>
                <SelectItem value="image">תמונה</SelectItem>
                <SelectItem value="solid">צבע אחיד</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.backgroundType === 'gradient' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gradientColor1">צבע ראשון</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="gradientColor1"
                    type="color"
                    value={formData.gradientColor1}
                    onChange={(e) =>
                      setFormData({ ...formData, gradientColor1: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.gradientColor1}
                    onChange={(e) =>
                      setFormData({ ...formData, gradientColor1: e.target.value })
                    }
                    placeholder="#ff9a9e"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gradientColor2">צבע שני</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="gradientColor2"
                    type="color"
                    value={formData.gradientColor2}
                    onChange={(e) =>
                      setFormData({ ...formData, gradientColor2: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.gradientColor2}
                    onChange={(e) =>
                      setFormData({ ...formData, gradientColor2: e.target.value })
                    }
                    placeholder="#fecfef"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.backgroundType === 'solid' && (
            <div>
              <Label htmlFor="gradientColor1">צבע רקע</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="gradientColor1"
                  type="color"
                  value={formData.gradientColor1}
                  onChange={(e) =>
                    setFormData({ ...formData, gradientColor1: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.gradientColor1}
                  onChange={(e) =>
                    setFormData({ ...formData, gradientColor1: e.target.value })
                  }
                  placeholder="#ff9a9e"
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {formData.backgroundType === 'image' && (
            <div>
              <Label>תמונת רקע</Label>
              <div className="mt-2">
                {formData.backgroundImage ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.backgroundImage}
                      alt="Background preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="mt-2"
                    >
                      <HiPhotograph className="w-4 h-4 ml-2" />
                      {formData.backgroundImage ? 'החלף תמונה' : 'בחר תמונה'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, backgroundImage: '' })}
                      className="mt-2 mr-2"
                    >
                      מחק תמונה
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="w-full py-8 border-2 border-dashed"
                  >
                    <HiPhotograph className="w-5 h-5 ml-2" />
                    בחר תמונת רקע
                  </Button>
                )}
              </div>

              <div className="mt-4">
                <Label htmlFor="backgroundPosition">מיקום תמונה</Label>
                <Select
                  value={formData.backgroundPosition}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, backgroundPosition: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר מיקום" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">מרכז</SelectItem>
                    <SelectItem value="top-left">שמאל עליון</SelectItem>
                    <SelectItem value="top-right">ימין עליון</SelectItem>
                    <SelectItem value="bottom-left">שמאל תחתון</SelectItem>
                    <SelectItem value="bottom-right">ימין תחתון</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Label htmlFor="textPosition">מיקום כיתוב על הגיפט קארד</Label>
            <Select
              value={formData.textPosition}
              onValueChange={(value: string) =>
                setFormData({ ...formData, textPosition: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="בחר מיקום" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="right">ימין</SelectItem>
                <SelectItem value="center">מרכז</SelectItem>
                <SelectItem value="left">שמאל</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              מיקום הקוד והפרטים על הגיפט קארד במייל
            </p>
          </div>
        </div>
      </Card>

      {/* תצוגה מקדימה */}
      <Card className="p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">תצוגה מקדימה</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="max-w-md mx-auto">
            <div
              className="h-64 rounded-lg shadow-lg relative overflow-hidden"
              style={{
                backgroundColor: formData.backgroundType === 'solid' ? formData.gradientColor1 : 'transparent',
                backgroundImage:
                  formData.backgroundType === 'gradient'
                    ? `linear-gradient(135deg, ${formData.gradientColor1} 0%, ${formData.gradientColor2} 100%)`
                    : formData.backgroundType === 'image' && formData.backgroundImage
                    ? `url('${formData.backgroundImage}')`
                    : 'none',
                backgroundSize: 'cover',
                backgroundPosition: formData.backgroundPosition,
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center p-6"
                style={{
                  justifyContent:
                    formData.textPosition === 'right'
                      ? 'flex-start'
                      : formData.textPosition === 'left'
                      ? 'flex-end'
                      : 'center',
                }}
              >
                <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-lg max-w-[200px]">
                  <div className="text-right font-bold text-gray-900 mb-2">גיפט קארד</div>
                  <div className="bg-gray-100 px-3 py-2 rounded text-center font-mono text-sm mb-2 border border-dashed border-gray-300">
                    GIFT12345678
                  </div>
                  <div className="text-xs text-gray-600 text-right">
                    יתרה נוכחית: ₪100.00
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Media Picker Dialog */}
      {storeId && (
        <MediaPicker
          open={isMediaPickerOpen}
          onOpenChange={setIsMediaPickerOpen}
          onSelect={(files) => {
            if (files.length > 0) {
              setFormData({ ...formData, backgroundImage: files[0] });
            }
            setIsMediaPickerOpen(false);
          }}
          selectedFiles={formData.backgroundImage ? [formData.backgroundImage] : []}
          shopId={String(storeId)}
          multiple={false}
          accept="image"
          title="בחר תמונת רקע"
        />
      )}
    </div>
  );
}

