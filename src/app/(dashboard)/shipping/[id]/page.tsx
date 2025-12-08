'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog';
import { Switch } from '@/components/ui/Switch';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { 
  HiSave, 
  HiX, 
  HiTrash, 
  HiPlus,
  HiPencil,
  HiTruck,
  HiGlobe,
  HiLocationMarker,
  HiCurrencyDollar,
  HiClock,
  HiCheckCircle,
} from 'react-icons/hi';
import { ShippingZone, ShippingRate, ShippingRateCity } from '@/types/payment';

export default function ShippingZoneDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const zoneId = params.id as string;
  const isNew = zoneId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    countries: [] as string[],
    provinces: [] as string[],
  });
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [rateForm, setRateForm] = useState({
    name: '',
    price: '',
    min_order_subtotal: '',
    max_order_subtotal: '',
    min_weight: '',
    max_weight: '',
    free_shipping_threshold: '',
    min_shipping_amount: '',
    is_pickup: false,
    delivery_days_min: '',
    delivery_days_max: '',
    cities: [] as Array<{ city_name: string; price: string; free_shipping_threshold: string }>,
  });
  const [newCity, setNewCity] = useState({ city_name: '', price: '', free_shipping_threshold: '' });

  useEffect(() => {
    if (!isNew && zoneId) {
      loadZone();
    }
  }, [zoneId, isNew]);

  const loadZone = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shipping/zones/${zoneId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load zone');
      const data = await response.json();
      const zone = data.zone;
      setFormData({
        name: zone.name || '',
        countries: zone.countries || [],
        provinces: zone.provinces || [],
      });
      setRates(zone.rates || []);
    } catch (error) {
      console.error('Error loading zone:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת אזור המשלוח',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = isNew ? '/api/shipping/zones' : `/api/shipping/zones/${zoneId}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          countries: formData.countries,
          provinces: formData.provinces,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save zone');
      }

      const data = await response.json();
      const savedZoneId = data.zone.id;
      
      toast({
        title: 'הצלחה',
        description: 'אזור המשלוח נשמר בהצלחה',
      });

      router.push(`/shipping/${savedZoneId}`);
    } catch (error: any) {
      console.error('Error saving zone:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשמירת אזור המשלוח',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRate = () => {
    setEditingRate(null);
    setRateForm({
      name: '',
      price: '',
      min_order_subtotal: '',
      max_order_subtotal: '',
      min_weight: '',
      max_weight: '',
      free_shipping_threshold: '',
      min_shipping_amount: '',
      is_pickup: false,
      delivery_days_min: '',
      delivery_days_max: '',
      cities: [],
    });
    setNewCity({ city_name: '', price: '', free_shipping_threshold: '' });
    setShowRateDialog(true);
  };

  const handleEditRate = (rate: ShippingRate) => {
    setEditingRate(rate);
    setRateForm({
      name: rate.name,
      price: rate.price,
      min_order_subtotal: rate.min_order_subtotal || '',
      max_order_subtotal: rate.max_order_subtotal || '',
      min_weight: rate.min_weight || '',
      max_weight: rate.max_weight || '',
      free_shipping_threshold: rate.free_shipping_threshold || '',
      min_shipping_amount: rate.min_shipping_amount || '',
      is_pickup: rate.is_pickup || false,
      delivery_days_min: rate.delivery_days_min?.toString() || '',
      delivery_days_max: rate.delivery_days_max?.toString() || '',
      cities: rate.cities?.map(c => ({
        city_name: c.city_name,
        price: c.price,
        free_shipping_threshold: c.free_shipping_threshold || '',
      })) || [],
    });
    setNewCity({ city_name: '', price: '', free_shipping_threshold: '' });
    setShowRateDialog(true);
  };

  const handleSaveRate = async () => {
    if (!rateForm.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם לתעריף',
        variant: 'destructive',
      });
      return;
    }

    if (!rateForm.price && !rateForm.is_pickup) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין מחיר או לבחור איסוף עצמי',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const url = editingRate
        ? `/api/shipping/zones/${zoneId}/rates/${editingRate.id}`
        : `/api/shipping/zones/${zoneId}/rates`;
      const method = editingRate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: rateForm.name,
          price: rateForm.price || '0',
          min_order_subtotal: rateForm.min_order_subtotal || null,
          max_order_subtotal: rateForm.max_order_subtotal || null,
          min_weight: rateForm.min_weight || null,
          max_weight: rateForm.max_weight || null,
          free_shipping_threshold: rateForm.free_shipping_threshold || null,
          min_shipping_amount: rateForm.min_shipping_amount || null,
          is_pickup: rateForm.is_pickup,
          delivery_days_min: rateForm.delivery_days_min ? parseInt(rateForm.delivery_days_min) : null,
          delivery_days_max: rateForm.delivery_days_max ? parseInt(rateForm.delivery_days_max) : null,
          cities: rateForm.cities.length > 0 ? rateForm.cities : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save rate');
      }

      toast({
        title: 'הצלחה',
        description: editingRate ? 'התעריף עודכן בהצלחה' : 'התעריף נוצר בהצלחה',
      });

      setShowRateDialog(false);
      loadZone();
    } catch (error: any) {
      console.error('Error saving rate:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשמירת התעריף',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRate = async (rateId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התעריף?')) return;

    try {
      const response = await fetch(`/api/shipping/zones/${zoneId}/rates/${rateId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete rate');

      toast({
        title: 'הצלחה',
        description: 'התעריף נמחק בהצלחה',
      });

      loadZone();
    } catch (error: any) {
      console.error('Error deleting rate:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה במחיקת התעריף',
        variant: 'destructive',
      });
    }
  };

  const handleAddCity = () => {
    if (!newCity.city_name.trim() || !newCity.price.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם עיר ומחיר',
        variant: 'destructive',
      });
      return;
    }

    setRateForm({
      ...rateForm,
      cities: [...rateForm.cities, { ...newCity }],
    });
    setNewCity({ city_name: '', price: '', free_shipping_threshold: '' });
  };

  const handleRemoveCity = (index: number) => {
    setRateForm({
      ...rateForm,
      cities: rateForm.cities.filter((_, i) => i !== index),
    });
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את אזור המשלוח?')) return;
    
    try {
      const response = await fetch(`/api/shipping/zones/${zoneId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete');
      
      toast({
        title: 'הצלחה',
        description: 'אזור המשלוח נמחק בהצלחה',
      });
      
      router.push('/shipping');
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה במחיקת אזור המשלוח',
        variant: 'destructive',
      });
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HiTruck className="w-6 h-6 text-gray-600" />
          {isNew ? 'אזור משלוח חדש' : 'עריכת אזור משלוח'}
        </h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="ghost" onClick={handleDelete} className="text-red-600">
              <HiTrash className="w-5 h-5 ml-2" />
              מחק
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.back()}>
            <HiX className="w-5 h-5 ml-2" />
            ביטול
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 space-y-6">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                <HiGlobe className="w-4 h-4 text-gray-500" />
                שם אזור המשלוח *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="לדוגמה: ישראל, אירופה, כל העולם"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="countries" className="flex items-center gap-2">
                <HiLocationMarker className="w-4 h-4 text-gray-500" />
                מדינות (מופרדות בפסיק)
              </Label>
              <Input
                id="countries"
                value={formData.countries.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  countries: e.target.value.split(',').map(c => c.trim()).filter(c => c),
                })}
                placeholder="IL, US, GB"
                dir="ltr"
                className="text-left mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                השאר ריק לכל המדינות. השתמש בקודי מדינה (IL, US, GB וכו')
              </p>
            </div>
          </div>
        </Card>

        {/* Shipping Rates */}
        {!isNew && (
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <HiTruck className="w-5 h-5 text-gray-600" />
                  תעריפי משלוח
                </h2>
                <Button type="button" onClick={handleCreateRate} className="flex items-center gap-2">
                  <HiPlus className="w-4 h-4" />
                  הוסף תעריף
                </Button>
              </div>

              {rates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HiTruck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>אין תעריפי משלוח</p>
                  <p className="text-sm mt-1">הוסף תעריף כדי לאפשר משלוח באזור זה</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rates.map((rate) => (
                    <div key={rate.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{rate.name}</h3>
                            {rate.is_pickup && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                איסוף עצמי
                              </span>
                            )}
                            {!rate.is_pickup && (
                              <span className="text-sm font-medium text-gray-700">
                                ₪{parseFloat(rate.price).toLocaleString('he-IL')}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {rate.free_shipping_threshold && (
                              <p className="flex items-center gap-1">
                                <HiCheckCircle className="w-4 h-4 text-green-500" />
                                משלוח חינם מעל ₪{parseFloat(rate.free_shipping_threshold).toLocaleString('he-IL')}
                              </p>
                            )}
                            {rate.min_shipping_amount && (
                              <p className="flex items-center gap-1">
                                <HiCurrencyDollar className="w-4 h-4 text-gray-500" />
                                מינימום למשלוח: ₪{parseFloat(rate.min_shipping_amount).toLocaleString('he-IL')}
                              </p>
                            )}
                            {rate.delivery_days_min && rate.delivery_days_max && (
                              <p className="flex items-center gap-1">
                                <HiClock className="w-4 h-4 text-gray-500" />
                                זמן אספקה: {rate.delivery_days_min}-{rate.delivery_days_max} ימי עסקים
                              </p>
                            )}
                            {rate.cities && rate.cities.length > 0 && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <HiLocationMarker className="w-3 h-3" />
                                מחירים מותאמים ל-{rate.cities.length} ערים
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRate(rate)}
                          >
                            <HiPencil className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRate(rate.id)}
                            className="text-red-600"
                          >
                            <HiTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            <HiX className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                שומר...
              </>
            ) : (
              <>
                <HiSave className="w-4 h-4" />
                שמור
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Rate Dialog */}
      <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRate ? 'עריכת תעריף' : 'תעריף חדש'}
            </DialogTitle>
            <DialogDescription>
              הגדר את התעריף והתנאים שלו
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            {/* Name */}
            <div>
              <Label htmlFor="rate-name" className="flex items-center gap-2">
                <HiTruck className="w-4 h-4 text-gray-500" />
                שם התעריף *
              </Label>
              <Input
                id="rate-name"
                value={rateForm.name}
                onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })}
                placeholder="למשל: משלוח סטנדרטי"
              />
            </div>

            {/* Pickup Option */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <HiLocationMarker className="w-5 h-5 text-gray-500" />
                <div>
                  <Label htmlFor="is-pickup" className="text-base font-medium">איסוף עצמי</Label>
                  <p className="text-sm text-gray-500 mt-1">הלקוח יאסוף את ההזמנה בעצמו</p>
                </div>
              </div>
              <Switch
                id="is-pickup"
                checked={rateForm.is_pickup}
                onCheckedChange={(checked) => setRateForm({ ...rateForm, is_pickup: checked })}
              />
            </div>

            {/* Price (if not pickup) */}
            {!rateForm.is_pickup && (
              <div>
                <Label htmlFor="rate-price" className="flex items-center gap-2">
                  <HiCurrencyDollar className="w-4 h-4 text-gray-500" />
                  מחיר משלוח (₪) *
                </Label>
                <Input
                  id="rate-price"
                  type="number"
                  value={rateForm.price}
                  onChange={(e) => setRateForm({ ...rateForm, price: e.target.value })}
                  placeholder="0.00"
                  dir="ltr"
                  className="mt-2"
                />
              </div>
            )}

            {/* Free Shipping Threshold */}
            <div>
              <Label htmlFor="free-shipping-threshold" className="flex items-center gap-2">
                <HiCheckCircle className="w-4 h-4 text-green-500" />
                משלוח חינם מעל סכום (₪)
              </Label>
              <Input
                id="free-shipping-threshold"
                type="number"
                value={rateForm.free_shipping_threshold}
                onChange={(e) => setRateForm({ ...rateForm, free_shipping_threshold: e.target.value })}
                placeholder="לדוגמה: 200"
                dir="ltr"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                אם ההזמנה מעל סכום זה, המשלוח יהיה חינם
              </p>
            </div>

            {/* Min Shipping Amount */}
            <div>
              <Label htmlFor="min-shipping-amount" className="flex items-center gap-2">
                <HiCurrencyDollar className="w-4 h-4 text-gray-500" />
                מינימום למשלוח (₪)
              </Label>
              <Input
                id="min-shipping-amount"
                type="number"
                value={rateForm.min_shipping_amount}
                onChange={(e) => setRateForm({ ...rateForm, min_shipping_amount: e.target.value })}
                placeholder="לדוגמה: 50"
                dir="ltr"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                אם ההזמנה קטנה מסכום זה, לא ניתן למשלוח
              </p>
            </div>

            {/* Delivery Days */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery-days-min" className="flex items-center gap-2">
                  <HiClock className="w-4 h-4 text-gray-500" />
                  זמן אספקה מינימלי (ימים)
                </Label>
                <Input
                  id="delivery-days-min"
                  type="number"
                  value={rateForm.delivery_days_min}
                  onChange={(e) => setRateForm({ ...rateForm, delivery_days_min: e.target.value })}
                  placeholder="3"
                  dir="ltr"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="delivery-days-max" className="flex items-center gap-2">
                  <HiClock className="w-4 h-4 text-gray-500" />
                  זמן אספקה מקסימלי (ימים)
                </Label>
                <Input
                  id="delivery-days-max"
                  type="number"
                  value={rateForm.delivery_days_max}
                  onChange={(e) => setRateForm({ ...rateForm, delivery_days_max: e.target.value })}
                  placeholder="7"
                  dir="ltr"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Cities */}
            {!rateForm.is_pickup && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <HiLocationMarker className="w-5 h-5 text-gray-600" />
                    מחירים לפי עיר
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCity}
                    className="flex items-center gap-1"
                  >
                    <HiPlus className="w-4 h-4" />
                    הוסף עיר
                  </Button>
                </div>

                {rateForm.cities.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {rateForm.cities.map((city, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">עיר</p>
                            <p className="font-medium">{city.city_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">מחיר</p>
                            <p className="font-medium">₪{parseFloat(city.price).toLocaleString('he-IL')}</p>
                          </div>
                          {city.free_shipping_threshold && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">חינם מעל</p>
                              <p className="font-medium">₪{parseFloat(city.free_shipping_threshold).toLocaleString('he-IL')}</p>
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCity(index)}
                          className="text-red-600"
                        >
                          <HiTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="new-city-name" className="text-xs">שם העיר</Label>
                      <Input
                        id="new-city-name"
                        value={newCity.city_name}
                        onChange={(e) => setNewCity({ ...newCity, city_name: e.target.value })}
                        placeholder="תל אביב"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-city-price" className="text-xs">מחיר (₪)</Label>
                      <Input
                        id="new-city-price"
                        type="number"
                        value={newCity.price}
                        onChange={(e) => setNewCity({ ...newCity, price: e.target.value })}
                        placeholder="30"
                        dir="ltr"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-city-threshold" className="text-xs">חינם מעל (₪)</Label>
                      <Input
                        id="new-city-threshold"
                        type="number"
                        value={newCity.free_shipping_threshold}
                        onChange={(e) => setNewCity({ ...newCity, free_shipping_threshold: e.target.value })}
                        placeholder="200"
                        dir="ltr"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRateDialog(false)} disabled={saving} className="flex items-center gap-2">
              <HiX className="w-4 h-4" />
              ביטול
            </Button>
            <Button onClick={handleSaveRate} disabled={saving} className="flex items-center gap-2">
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  שומר...
                </>
              ) : (
                <>
                  <HiSave className="w-4 h-4" />
                  שמור
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
