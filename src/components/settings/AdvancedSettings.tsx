'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HiDownload, HiTrash, HiExclamationCircle, HiCheckCircle, HiClock, HiShoppingCart } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog';

export function AdvancedSettings() {
  const { toast } = useOptimisticToast();
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [abandonedCartTimeoutHours, setAbandonedCartTimeoutHours] = useState(4);
  const [savingTimeout, setSavingTimeout] = useState(false);

  useEffect(() => {
    // Load current settings
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/store', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const settings = data.store?.settings || {};
          const themeSettings = settings.themeSettings || {};
          // קודם בודקים ב-themeSettings, אחר כך ב-settings ישירות (תאימות לאחור)
          const timeout = themeSettings.abandonedCartTimeoutHours ?? settings.abandonedCartTimeoutHours;
          if (timeout !== undefined) {
            setAbandonedCartTimeoutHours(timeout);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSaveAbandonedCartTimeout = async () => {
    try {
      setSavingTimeout(true);
      const response = await fetch('/api/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          themeSettings: {
            abandonedCartTimeoutHours,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast({
        title: 'הצלחה',
        description: 'הגדרת עגלות נטושות נשמרה',
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשמירת הגדרות',
        variant: 'destructive',
      });
    } finally {
      setSavingTimeout(false);
    }
  };

  const handleImportDemo = async () => {
    try {
      setImporting(true);
      const response = await fetch('/api/settings/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import demo data');
      }

      const data = await response.json();
      
      // Build comprehensive success message
      const stats = data.stats || {};
      const statsMessage = [
        `✅ ${stats.products || 0} מוצרים`,
        `✅ ${stats.customers || 0} לקוחות`,
        `✅ ${stats.orders || 0} הזמנות`,
        `✅ ${stats.collections || 0} קולקציות`,
        `✅ ${stats.tags || 0} תגיות`,
        `✅ ${stats.discounts || 0} קופונים`,
        `✅ ${stats.shippingZones || 0} אזורי משלוח`,
        `✅ ${stats.blogPosts || 0} פוסטי בלוג`,
        `✅ ${stats.pages || 0} דפים`,
      ].join('\n');
      
      toast({
        title: '🎉 נתוני הדמו נוצרו בהצלחה!',
        description: statsMessage,
      });

      // Reload page after 3 seconds to show new data
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error: any) {
      console.error('Error importing demo data:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בייבא נתוני דמו',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      setImportConfirmOpen(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      const response = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirm: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset store data');
      }

      toast({
        title: 'הצלחה',
        description: 'כל הנתונים נמחקו בהצלחה',
      });

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error resetting store:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה באיפוס הנתונים',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
      setResetDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">הגדרות מתקדמות</h2>
        <p className="text-sm text-gray-500">
          כלים לניהול נתוני החנות - ייבוא נתוני דמו ואיפוס נתונים
        </p>
      </div>

      {/* Abandoned Cart Settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HiShoppingCart className="w-5 h-5 text-amber-600" />
                עגלות נטושות
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                הגדר כמה זמן צריכה הזמנה להמתין לתשלום לפני שהיא נחשבת "נטושה"
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <HiClock className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">זמן המתנה:</span>
            </div>
            <Input
              type="number"
              min={1}
              max={168}
              value={abandonedCartTimeoutHours}
              onChange={(e) => setAbandonedCartTimeoutHours(parseInt(e.target.value) || 4)}
              className="w-24"
            />
            <span className="text-sm text-gray-600">שעות</span>
          </div>
          
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <strong>הזמנות ממתינות לתשלום:</strong> הזמנות שנוצרו בתהליך הצ'קאאוט ולא שולמו תוך הזמן שהוגדר יופיעו ב"עגלות נטושות"
          </p>
          
          <Button
            onClick={handleSaveAbandonedCartTimeout}
            disabled={savingTimeout}
            size="sm"
          >
            {savingTimeout ? 'שומר...' : 'שמור הגדרה'}
          </Button>
        </div>
      </Card>

      {/* Import Demo Data */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HiDownload className="w-5 h-5 text-emerald-600" />
                ייבוא נתוני דמו
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                ייבא נתוני דמו מלאים למערכת. זה כולל:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4 list-disc list-inside">
                <li>מוצרים עם קולקציות, תגיות, וריאציות ותמונות</li>
                <li>לקוחות עם כתובות ותגיות</li>
                <li>הזמנות עם פריטים</li>
                <li>קופונים והנחות</li>
                <li>אזורי משלוח</li>
                <li>פוסטי בלוג ודפים</li>
              </ul>
              <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <strong>שימו לב:</strong> נתוני הדמו נוצרים כאילו הוזנו ידנית מהדשבורד, 
                עם אותם פרופס ואותן אפשרויות. זה לא ישנה את הנתונים הקיימים, רק יוסיף עליהם.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setImportConfirmOpen(true)}
            disabled={importing}
            className="gap-2 border border-gray-300 relative overflow-hidden"
            variant="secondary"
          >
            {importing ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 via-emerald-200 to-emerald-100 animate-pulse" />
                <HiDownload className="w-4 h-4 animate-bounce relative z-10" />
                <span className="relative z-10">מייבא נתונים...</span>
              </>
            ) : (
              <>
                <HiDownload className="w-4 h-4" />
                ייבא נתוני דמו
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Reset Store Data */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HiTrash className="w-5 h-5 text-red-600" />
                איפוס כל הנתונים
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                מחק את כל הנתונים בחנות זו. פעולה זו לא הפיכה!
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4 list-disc list-inside">
                <li>כל המוצרים, לקוחות והזמנות יימחקו</li>
                <li>כל הקולקציות, תגיות והגדרות יימחקו</li>
                <li>כל הנתונים הקשורים לחנות זו יימחקו</li>
              </ul>
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <strong>אזהרה:</strong> פעולה זו לא הפיכה! כל הנתונים יימחקו לצמיתות.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setResetDialogOpen(true)}
            disabled={resetting}
            variant="destructive"
            className="gap-2"
          >
            {resetting ? (
              <>
                <HiTrash className="w-4 h-4 animate-spin" />
                מאפס...
              </>
            ) : (
              <>
                <HiTrash className="w-4 h-4" />
                אפס כל הנתונים
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Import Confirmation Dialog */}
      <Dialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ייבוא נתוני דמו</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך לייבא נתוני דמו? זה יוסיף מוצרים, לקוחות והזמנות לדוגמה למערכת.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setImportConfirmOpen(false)}
                className="flex-1 border border-gray-300"
                disabled={importing}
              >
                ביטול
              </Button>
              <Button
                type="button"
                onClick={handleImportDemo}
                className="flex-1 gap-2 !bg-emerald-600 hover:!bg-emerald-700 text-white border-0"
                disabled={importing}
              >
                {importing ? (
                  <>
                    <HiDownload className="w-4 h-4" />
                    מייבא...
                  </>
                ) : (
                  <>
                    <HiCheckCircle className="w-4 h-4" />
                    ייבא נתונים
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2 text-red-600">
                <HiExclamationCircle className="w-5 h-5" />
                איפוס כל הנתונים
              </span>
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-2">
                <div className="font-semibold text-red-600">
                  אזהרה: פעולה זו לא הפיכה!
                </div>
                <div>
                  כל הנתונים בחנות זו יימחקו לצמיתות, כולל:
                </div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>כל המוצרים והמוצרים הקשורים</li>
                  <li>כל הלקוחות והכתובות</li>
                  <li>כל ההזמנות והתשלומים</li>
                  <li>כל הקולקציות, תגיות והגדרות</li>
                </ul>
                <div className="font-semibold mt-3">
                  האם אתה בטוח שברצונך להמשיך?
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setResetDialogOpen(false)}
                className="flex-1"
                disabled={resetting}
              >
                ביטול
              </Button>
              <Button
                type="button"
                onClick={handleReset}
                variant="destructive"
                className="flex-1 gap-2 !bg-red-600 hover:!bg-red-700 text-white border border-red-700"
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <HiTrash className="w-4 h-4" />
                    מאפס...
                  </>
                ) : (
                  <>
                    <HiExclamationCircle className="w-4 h-4" />
                    אפס הכל
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

