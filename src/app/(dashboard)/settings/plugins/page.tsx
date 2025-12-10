'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { 
  HiSearch, 
  HiCheckCircle, 
  HiXCircle, 
  HiCog, 
  HiStar,
  HiCube,
  HiCreditCard,
  HiChartBar,
  HiChat,
  HiCog as HiSettings,
  HiShoppingBag,
  HiSparkles,
  HiShieldCheck
} from 'react-icons/hi';
import { PluginDefinition } from '@/types/plugin';

interface PluginWithStatus extends PluginDefinition {
  is_installed: boolean;
  is_active: boolean;
  config?: any;
  installed_at?: Date | null;
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginWithStatus | null>(null);
  const [cardToken, setCardToken] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cancellingSlug, setCancellingSlug] = useState<string | null>(null);

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

  const handleInstall = async (pluginSlug: string) => {
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

  const handleSubscribe = async (pluginSlug: string) => {
    const plugin = plugins.find(p => p.slug === pluginSlug);
    if (!plugin) return;
    
    setSelectedPlugin(plugin);
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPlugin || !cardToken.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן token כרטיס אשראי',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingPayment(true);
      const response = await fetch(`/api/plugins/${selectedPlugin.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          cardToken: cardToken.trim(),
          paymentProviderSlug: 'quickshop_payments'
        }),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'התוסף נרכש בהצלחה והמנוי הופעל',
        });
        setShowPaymentDialog(false);
        setCardToken('');
        setSelectedPlugin(null);
        loadPlugins();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'לא ניתן לרכוש את התוסף',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error subscribing to plugin:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לרכוש את התוסף',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancel = async (pluginSlug: string) => {
    if (!confirm('האם אתה בטוח שברצונך לבטל את המנוי? התוסף יישאר פעיל עד סוף החודש.')) {
      return;
    }

    try {
      setCancellingSlug(pluginSlug);
      const response = await fetch(`/api/plugins/${pluginSlug}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'המנוי בוטל בהצלחה. התוסף יישאר פעיל עד סוף החודש.',
        });
        loadPlugins();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'לא ניתן לבטל את המנוי',
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
    }
  };

  const handleSettings = (pluginSlug: string) => {
    // TODO: ניתוב לדף הגדרות התוסף
    if (pluginSlug === 'premium-club') {
      window.location.href = '/settings/premium-club';
    }
  };

  const categories = Array.from(new Set(plugins.map((p) => p.category)));

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
              הכל
            </button>
            {categories.map((category) => {
              const Icon = categoryIcons[category];
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
                  {categoryLabels[category] || category}
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
            return (
              <Card key={plugin.slug} className="hover:shadow-lg transition-shadow">
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
                    {plugin.is_installed && plugin.is_active && (
                      <HiCheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">{plugin.description}</p>

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
                        {!plugin.is_free && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(plugin.slug)}
                            disabled={cancellingSlug === plugin.slug}
                            className="text-red-600 hover:text-red-700"
                          >
                            {cancellingSlug === plugin.slug ? 'מבטל...' : 'בטל מנוי'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        onClick={() =>
                          plugin.is_free
                            ? handleInstall(plugin.slug)
                            : handleSubscribe(plugin.slug)
                        }
                        disabled={installingSlug === plugin.slug}
                        className="flex-1"
                        size="sm"
                      >
                        {installingSlug === plugin.slug
                          ? 'מתקין...'
                          : plugin.is_free
                          ? 'התקן'
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

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>רכישת תוסף בתשלום</DialogTitle>
            <DialogDescription>
              {selectedPlugin && (
                <>
                  רכישת התוסף <strong>{selectedPlugin.name}</strong> במחיר של{' '}
                  <strong>₪{selectedPlugin.price}/חודש</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HiShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">תשלום מאובטח</p>
                  <p>התשלום מתבצע דרך QuickShop Payments. המנוי יחודש אוטומטית כל חודש.</p>
                </div>
              </div>
            </div>

            <div>
              <Label>Card Token</Label>
              <Input
                type="text"
                placeholder="הזן token כרטיס אשראי"
                value={cardToken}
                onChange={(e) => setCardToken(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Token זה מתקבל מ-QuickShop Payments לאחר הזנת פרטי הכרטיס
              </p>
            </div>

            {selectedPlugin && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">מחיר חודשי:</span>
                  <span className="font-semibold text-gray-900">₪{selectedPlugin.price}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">תשלום ראשון:</span>
                  <span className="font-semibold text-gray-900">₪{selectedPlugin.price}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                setCardToken('');
                setSelectedPlugin(null);
              }}
            >
              ביטול
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={processingPayment || !cardToken.trim()}
            >
              {processingPayment ? 'מעבד...' : 'רכוש עכשיו'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

