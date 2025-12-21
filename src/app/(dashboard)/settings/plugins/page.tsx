'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import Link from 'next/link';
import { 
  HiSearch, 
  HiCheckCircle, 
  HiCog, 
  HiStar,
  HiCube,
  HiCreditCard,
  HiChartBar,
  HiChat,
  HiCog as HiSettings,
  HiShoppingBag,
  HiSparkles,
  HiExclamationCircle,
  HiClock,
  HiTrash,
  HiRefresh
} from 'react-icons/hi';
import { PluginDefinition, PluginSubscription } from '@/types/plugin';

interface PluginWithStatus extends PluginDefinition {
  is_installed: boolean;
  is_active: boolean;
  config?: any;
  installed_at?: Date | null;
  subscription?: {
    status: string;
    end_date: Date | null;
    next_billing_date: Date | null;
  };
}

const categoryIcons: Record<string, any> = {
  LOYALTY: HiStar,
  MARKETING: HiSparkles,
  PAYMENT: HiCreditCard,
  INVENTORY: HiCube,
  ANALYTICS: HiChartBar,
  COMMUNICATION: HiChat,
  OPERATIONS: HiSettings,
  CUSTOMIZATION: HiShoppingBag,
};

const categoryLabels: Record<string, string> = {
  LOYALTY: 'נאמנות',
  MARKETING: 'שיווק',
  PAYMENT: 'תשלום',
  INVENTORY: 'מלאי',
  ANALYTICS: 'אנליטיקס',
  COMMUNICATION: 'תקשורת',
  OPERATIONS: 'פעולות',
  CUSTOMIZATION: 'התאמה אישית',
};

export default function PluginsPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [plugins, setPlugins] = useState<PluginWithStatus[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<PluginWithStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [cancellingSlug, setCancellingSlug] = useState<string | null>(null);
  const [removingSlug, setRemovingSlug] = useState<string | null>(null);
  
  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'subscribe' | 'cancel' | 'remove' | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginWithStatus | null>(null);
  
  // Error dialog for payment issues
  const [showPaymentErrorDialog, setShowPaymentErrorDialog] = useState(false);
  const [paymentErrorCode, setPaymentErrorCode] = useState<string | null>(null);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>('');

  useEffect(() => {
    loadPlugins();
  }, []);

  useEffect(() => {
    filterPlugins();
  }, [plugins, searchQuery, selectedCategory]);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/plugins', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPlugins(data.plugins || []);
      }
    } catch (error) {
      console.error('Error loading plugins:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את התוספים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPlugins = () => {
    let filtered = [...plugins];

    // חיפוש
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // סינון לפי קטגוריה
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    setFilteredPlugins(filtered);
  };

  // התקנת תוסף חינמי
  const handleInstallFree = async (pluginSlug: string) => {
    try {
      setInstallingSlug(pluginSlug);
      const response = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pluginSlug }),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'התוסף הותקן בהצלחה',
        });
        loadPlugins();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'לא ניתן להתקין את התוסף',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error installing plugin:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להתקין את התוסף',
        variant: 'destructive',
      });
    } finally {
      setInstallingSlug(null);
    }
  };

  // רכישת תוסף בתשלום - משתמש בטוקן הקיים
  const handleSubscribe = async () => {
    if (!selectedPlugin) return;
    
    try {
      setInstallingSlug(selectedPlugin.slug);
      setShowConfirmDialog(false);
      
      const response = await fetch(`/api/plugins/${selectedPlugin.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}), // לא צריך cardToken - משתמשים בטוקן הקיים
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'הצלחה! 🎉',
          description: 'התוסף הותקן והחיוב בוצע בהצלחה',
        });
        loadPlugins();
      } else {
        // טיפול בקודי שגיאה ספציפיים
        if (data.errorCode === 'NO_TOKEN' || data.errorCode === 'NOT_PAYING') {
          setPaymentErrorCode(data.errorCode);
          setPaymentErrorMessage(data.error);
          setShowPaymentErrorDialog(true);
        } else if (data.errorCode === 'CHARGE_FAILED') {
          setPaymentErrorCode('CHARGE_FAILED');
          setPaymentErrorMessage(data.error);
          setShowPaymentErrorDialog(true);
        } else {
          toast({
            title: 'שגיאה',
            description: data.error || 'לא ניתן לרכוש את התוסף',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error subscribing to plugin:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לרכוש את התוסף',
        variant: 'destructive',
      });
    } finally {
      setInstallingSlug(null);
      setSelectedPlugin(null);
    }
  };

  // ביטול מנוי לתוסף
  const handleCancel = async () => {
    if (!selectedPlugin) return;
    
    try {
      setCancellingSlug(selectedPlugin.slug);
      setShowConfirmDialog(false);
      
      const response = await fetch(`/api/plugins/${selectedPlugin.slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'המנוי בוטל',
          description: data.endDate 
            ? `התוסף יישאר פעיל עד ${new Date(data.endDate).toLocaleDateString('he-IL')}`
            : 'התוסף הוסר בהצלחה',
        });
        loadPlugins();
      } else {
        toast({
          title: 'שגיאה',
          description: data.error || 'לא ניתן לבטל את המנוי',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לבטל את המנוי',
        variant: 'destructive',
      });
    } finally {
      setCancellingSlug(null);
      setSelectedPlugin(null);
    }
  };

  // הסרת תוסף (לתוספים חינמיים)
  const handleRemove = async () => {
    if (!selectedPlugin) return;
    
    try {
      setRemovingSlug(selectedPlugin.slug);
      setShowConfirmDialog(false);
      
      const response = await fetch(`/api/plugins/${selectedPlugin.slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'התוסף הוסר בהצלחה',
        });
        loadPlugins();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'לא ניתן להסיר את התוסף',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing plugin:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להסיר את התוסף',
        variant: 'destructive',
      });
    } finally {
      setRemovingSlug(null);
      setSelectedPlugin(null);
    }
  };

  // פתיחת דיאלוג אישור
  const openConfirmDialog = (plugin: PluginWithStatus, action: 'subscribe' | 'cancel' | 'remove') => {
    setSelectedPlugin(plugin);
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const handleSettings = (pluginSlug: string) => {
    const settingsRoutes: Record<string, string> = {
      'premium-club': '/settings/premium-club',
      'smart-advisor': '/smart-advisor',
      'reviews': '/reviews',
    };
    
    const route = settingsRoutes[pluginSlug];
    if (route) {
      window.location.href = route;
    }
  };

  const categories = Array.from(new Set(plugins.map((p) => p.category)));

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">מרקטפלייס תוספים</h1>
          <p className="text-gray-600 mt-1">
            הוסף תכונות חדשות לחנות שלך עם תוספים מותאמים אישית
          </p>
        </div>
        <Button variant="outline" onClick={loadPlugins}>
          <HiRefresh className="w-4 h-4 ml-2" />
          רענן
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="חפש תוספים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              הכל ({plugins.length})
            </button>
            {categories.map((category) => {
              const Icon = categoryIcons[category];
              const count = plugins.filter(p => p.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {categoryLabels[category] || category} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Plugins Grid */}
      {filteredPlugins.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <HiCube className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">לא נמצאו תוספים</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlugins.map((plugin) => {
            const CategoryIcon = categoryIcons[plugin.category];
            const isProcessing = installingSlug === plugin.slug || cancellingSlug === plugin.slug || removingSlug === plugin.slug;
            const isCancelled = plugin.subscription?.status === 'CANCELLED';
            
            return (
              <Card key={plugin.slug} className={`hover:shadow-lg transition-shadow ${isCancelled ? 'border-yellow-300 bg-yellow-50/30' : ''}`}>
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {plugin.icon ? (
                        <img
                          src={plugin.icon}
                          alt={plugin.name}
                          className="w-12 h-12 rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                          {CategoryIcon && <CategoryIcon className="w-6 h-6 text-white" />}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{plugin.name}</h3>
                        <p className="text-xs text-gray-500">{categoryLabels[plugin.category]}</p>
                      </div>
                    </div>
                    {plugin.is_installed && plugin.is_active && !isCancelled && (
                      <HiCheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {isCancelled && (
                      <HiClock className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">{plugin.description}</p>

                  {/* Subscription Status */}
                  {isCancelled && plugin.subscription?.end_date && (
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <HiClock className="w-4 h-4" />
                        <span>מבוטל - פעיל עד {formatDate(plugin.subscription.end_date)}</span>
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {plugin.is_built_in && (
                      <Badge variant="outline" className="text-xs">
                        מובנה
                      </Badge>
                    )}
                    {plugin.is_free ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">חינמי</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        ₪{plugin.price}/חודש
                      </Badge>
                    )}
                    {plugin.type === 'CORE' && (
                      <Badge variant="outline" className="text-xs">
                        Core
                      </Badge>
                    )}
                    {plugin.type === 'SCRIPT' && (
                      <Badge variant="outline" className="text-xs">
                        Script
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {plugin.is_installed ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSettings(plugin.slug)}
                          className="flex-1"
                        >
                          <HiCog className="w-4 h-4 ml-1" />
                          הגדרות
                        </Button>
                        {plugin.is_free ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openConfirmDialog(plugin, 'remove')}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <HiTrash className="w-4 h-4" />
                          </Button>
                        ) : !isCancelled ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openConfirmDialog(plugin, 'cancel')}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {isProcessing ? 'מעבד...' : 'בטל'}
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          plugin.is_free
                            ? handleInstallFree(plugin.slug)
                            : openConfirmDialog(plugin, 'subscribe')
                        }
                        disabled={isProcessing}
                        className="flex-1"
                        size="sm"
                      >
                        {isProcessing
                          ? 'מעבד...'
                          : plugin.is_free
                          ? 'התקן חינם'
                          : `התקן - ₪${plugin.price}/חודש`}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'subscribe' && 'רכישת תוסף'}
              {confirmAction === 'cancel' && 'ביטול מנוי'}
              {confirmAction === 'remove' && 'הסרת תוסף'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'subscribe' && selectedPlugin && (
                <div className="space-y-3 mt-2">
                  <p>
                    האם ברצונך לרכוש את התוסף <strong>{selectedPlugin.name}</strong>?
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>מחיר חודשי:</span>
                      <span className="font-semibold">₪{selectedPlugin.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>מע"מ (17%):</span>
                      <span className="font-semibold">₪{((selectedPlugin.price || 0) * 0.17).toFixed(2)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span className="font-medium">סה"כ לחיוב:</span>
                      <span className="font-bold text-green-600">
                        ₪{((selectedPlugin.price || 0) * 1.17).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    התשלום יתבצע מהכרטיס השמור בחשבונך. המנוי יחודש אוטומטית כל חודש.
                  </p>
                </div>
              )}
              {confirmAction === 'cancel' && selectedPlugin && (
                <div className="space-y-3 mt-2">
                  <p>
                    האם אתה בטוח שברצונך לבטל את המנוי ל<strong>{selectedPlugin.name}</strong>?
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                    <strong>שים לב:</strong> התוסף ימשיך לעבוד עד סוף התקופה ששילמת עליה.
                    לא יתבצע חיוב נוסף.
                  </div>
                </div>
              )}
              {confirmAction === 'remove' && selectedPlugin && (
                <p className="mt-2">
                  האם אתה בטוח שברצונך להסיר את התוסף <strong>{selectedPlugin.name}</strong>?
                </p>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setSelectedPlugin(null);
                setConfirmAction(null);
              }}
            >
              ביטול
            </Button>
            <Button
              onClick={() => {
                if (confirmAction === 'subscribe') handleSubscribe();
                else if (confirmAction === 'cancel') handleCancel();
                else if (confirmAction === 'remove') handleRemove();
              }}
              variant={confirmAction === 'subscribe' ? 'default' : 'destructive'}
            >
              {confirmAction === 'subscribe' && 'רכוש עכשיו'}
              {confirmAction === 'cancel' && 'בטל מנוי'}
              {confirmAction === 'remove' && 'הסר תוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Error Dialog */}
      <Dialog open={showPaymentErrorDialog} onOpenChange={setShowPaymentErrorDialog}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <HiExclamationCircle className="w-6 h-6" />
              שגיאה בתשלום
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 px-2">
            <p className="text-gray-700 mb-4">{paymentErrorMessage}</p>
            
            {paymentErrorCode === 'NO_TOKEN' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">לא נמצא אמצעי תשלום</p>
                <p>יש להוסיף כרטיס אשראי בהגדרות הבילינג כדי לרכוש תוספים.</p>
              </div>
            )}
            
            {paymentErrorCode === 'NOT_PAYING' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <p className="font-medium mb-2">נדרש מנוי פעיל</p>
                <p>יש להפעיל מנוי בתשלום (Lite או Pro) לפני רכישת תוספים.</p>
              </div>
            )}
            
            {paymentErrorCode === 'CHARGE_FAILED' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                <p className="font-medium mb-2">החיוב נכשל</p>
                <p>יש לעדכן את פרטי הכרטיס בהגדרות הבילינג ולנסות שוב.</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentErrorDialog(false);
                setPaymentErrorCode(null);
                setPaymentErrorMessage('');
              }}
            >
              סגור
            </Button>
            {(paymentErrorCode === 'NO_TOKEN' || paymentErrorCode === 'CHARGE_FAILED') && (
              <Link href="/billing">
                <Button>
                  לדף הבילינג
                </Button>
              </Link>
            )}
            {paymentErrorCode === 'NOT_PAYING' && (
              <Link href="/pricing">
                <Button>
                  לעמוד התוכניות
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
