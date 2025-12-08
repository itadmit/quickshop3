'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiPlus, HiPencil, HiTrash, HiTruck, HiGlobe, HiLocationMarker } from 'react-icons/hi';
import { ShippingZoneWithRates } from '@/types/payment';

export default function ShippingPage() {
  const router = useRouter();
  const [zones, setZones] = useState<ShippingZoneWithRates[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    loadZones(signal);

    return () => {
      abortController.abort();
    };
  }, []);

  const loadZones = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch('/api/shipping/zones', {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load zones');
      const data = await response.json();
      setZones(data.zones || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading zones:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HiTruck className="w-6 h-6 text-gray-600" />
          משלוחים
        </h1>
        <Button onClick={() => router.push('/shipping/new')} className="flex items-center gap-2">
          <HiPlus className="w-4 h-4" />
          הוסף אזור משלוח
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : zones.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <HiTruck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין אזורי משלוח מוגדרים</p>
            <div className="flex justify-center">
              <Button onClick={() => router.push('/shipping/new')} className="flex items-center gap-2">
                <HiPlus className="w-4 h-4" />
                הוסף אזור משלוח ראשון
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => (
            <Card key={zone.id}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <HiGlobe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <HiLocationMarker className="w-4 h-4" />
                        {zone.countries.join(', ') || 'כל המדינות'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/shipping/${zone.id}`)}
                    >
                      <HiPencil className="w-4 h-4 ml-1" />
                      ערוך
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={async () => {
                        if (confirm('האם אתה בטוח שברצונך למחוק את אזור המשלוח?')) {
                          try {
                            const response = await fetch(`/api/shipping/zones/${zone.id}`, {
                              method: 'DELETE',
                              credentials: 'include',
                            });
                            if (response.ok) {
                              loadZones();
                            }
                          } catch (error) {
                            console.error('Error deleting zone:', error);
                          }
                        }
                      }}
                    >
                      <HiTrash className="w-4 h-4 ml-1" />
                      מחק
                    </Button>
                  </div>
                </div>
                {zone.rates && zone.rates.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <HiTruck className="w-4 h-4" />
                      תעריפי משלוח:
                    </h4>
                    <div className="space-y-2">
                      {zone.rates.map((rate) => (
                        <div key={rate.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-900 flex items-center gap-2">
                            {rate.is_pickup ? (
                              <HiLocationMarker className="w-4 h-4 text-blue-600" />
                            ) : (
                              <HiTruck className="w-4 h-4 text-gray-400" />
                            )}
                            {rate.name}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {rate.is_pickup ? 'איסוף עצמי' : `₪${parseFloat(rate.price).toLocaleString('he-IL')}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

