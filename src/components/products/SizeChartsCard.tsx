'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiTable, HiPlus, HiX } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface SizeChart {
  id: number;
  name: string;
  chart_type: string;
  chart_data: any;
  image_url?: string;
}

interface SizeChartsCardProps {
  productId?: number;
  shopId: number;
  categoryIds?: number[];
  selectedChartId?: number | null;
  onChange?: (chartId: number | null) => void;
}

export function SizeChartsCard({
  productId,
  shopId,
  categoryIds = [],
  selectedChartId,
  onChange,
}: SizeChartsCardProps) {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
  const [allCharts, setAllCharts] = useState<SizeChart[]>([]);
  const [availableCharts, setAvailableCharts] = useState<SizeChart[]>([]);

  useEffect(() => {
    loadSizeCharts();
    if (productId) {
      loadProductSizeChart();
    }
  }, [productId, shopId, categoryIds]);

  // Filter charts based on scope and categories
  useEffect(() => {
    if (allCharts.length === 0) {
      setAvailableCharts([]);
      return;
    }

    const available = allCharts.filter((chart: any) => {
      if (chart.scope === 'GLOBAL') {
        return true;
      }
      if (chart.scope === 'CATEGORY' && categoryIds.length > 0) {
        return chart.category_ids?.some((catId: number) => categoryIds.includes(catId));
      }
      return false;
    });

    setAvailableCharts(available);
  }, [allCharts, categoryIds]);

  const loadSizeCharts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/size-charts`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAllCharts(data || []);
      }
    } catch (error) {
      console.error('Error loading size charts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductSizeChart = async () => {
    if (!productId) return;

    try {
      const response = await fetch(`/api/products/${productId}/size-charts`);
      if (response.ok) {
        const data = await response.json();
        if (data.size_charts && data.size_charts.length > 0) {
          const chartId = data.size_charts[0].id;
          if (onChange) {
            onChange(chartId);
          }
        }
      }
    } catch (error) {
      console.error('Error loading product size chart:', error);
    }
  };

  const handleSelectChart = async (chartId: number) => {
    if (!productId) {
      if (onChange) {
        onChange(chartId);
      }
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}/size-charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size_chart_id: chartId }),
      });

      if (response.ok) {
        if (onChange) {
          onChange(chartId);
        }
        toast({
          title: 'הצלחה',
          description: 'טבלת המידות חוברה למוצר',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה בחיבור טבלת המידות',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error linking size chart:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בחיבור טבלת המידות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveChart = async () => {
    if (!productId || !selectedChartId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/products/${productId}/size-charts?size_chart_id=${selectedChartId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        if (onChange) {
          onChange(null);
        }
        toast({
          title: 'הצלחה',
          description: 'טבלת המידות הוסרה מהמוצר',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה בהסרת טבלת המידות',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error unlinking size chart:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהסרת טבלת המידות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiTable className="w-5 h-5" />
            <span>טבלת מידות</span>
          </h2>
          <Link
            href="/settings/size-charts"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <span>נהל טבלאות</span>
            <HiPlus className="w-4 h-4" />
          </Link>
        </div>

        {loading && availableCharts.length === 0 ? (
          <div className="text-center text-gray-500 py-4">טוען טבלאות מידות...</div>
        ) : availableCharts.length === 0 ? (
          <div className="text-center py-6">
            <HiTable className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">אין טבלאות מידות מוגדרות</p>
            <p className="text-sm text-gray-400 mb-3">
              צור טבלאות מידות בהגדרות כדי שיופיעו כאן
            </p>
            <Link
              href="/settings/size-charts"
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              צור טבלת מידות
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {availableCharts.map((chart) => (
              <div
                key={chart.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  selectedChartId === chart.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{chart.name}</div>
                  <div className="text-sm text-gray-500">
                    {chart.chart_type === 'clothing' && 'בגדים'}
                    {chart.chart_type === 'shoes' && 'נעליים'}
                    {chart.chart_type === 'accessories' && 'אביזרים'}
                    {chart.chart_type === 'other' && 'אחר'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedChartId === chart.id ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveChart}
                      className="text-red-500 hover:text-red-700"
                      disabled={loading}
                    >
                      <HiX className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSelectChart(chart.id)}
                      disabled={loading}
                    >
                      בחר
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

