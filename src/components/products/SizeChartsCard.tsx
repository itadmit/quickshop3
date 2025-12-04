'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { HiTable, HiPlus, HiX, HiTrash } from 'react-icons/hi';
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
  selectedChartId?: number | null;
  onChange?: (chartId: number | null) => void;
}

export function SizeChartsCard({
  productId,
  shopId,
  selectedChartId,
  onChange,
}: SizeChartsCardProps) {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChart, setNewChart] = useState({
    name: '',
    chart_type: 'clothing',
    chart_data: { rows: [], columns: [] },
  });

  useEffect(() => {
    loadSizeCharts();
    if (productId) {
      loadProductSizeChart();
    }
  }, [productId, shopId]);

  const loadSizeCharts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/size-charts`);
      if (response.ok) {
        const data = await response.json();
        setSizeCharts(data.size_charts || []);
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

  const handleCreateChart = async () => {
    if (!newChart.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם לטבלת המידות',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/products/size-charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChart),
      });

      if (response.ok) {
        const data = await response.json();
        setSizeCharts([...sizeCharts, data.size_chart]);
        
        // Auto-select the new chart
        if (productId) {
          await handleSelectChart(data.size_chart.id);
        } else if (onChange) {
          onChange(data.size_chart.id);
        }

        toast({
          title: 'הצלחה',
          description: 'טבלת המידות נוצרה בהצלחה',
        });

        setNewChart({ name: '', chart_type: 'clothing', chart_data: { rows: [], columns: [] } });
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה ביצירת טבלת המידות',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating size chart:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה ביצירת טבלת המידות',
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="gap-1"
          >
            <HiPlus className="w-4 h-4" />
            <span className="text-sm">חדש</span>
          </Button>
        </div>

        {showCreateForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div>
              <Label htmlFor="chart-name">שם טבלת המידות</Label>
              <Input
                id="chart-name"
                value={newChart.name}
                onChange={(e) => setNewChart({ ...newChart, name: e.target.value })}
                placeholder="לדוגמה: מידות בגדים, מידות נעליים"
              />
            </div>
            <div>
              <Label htmlFor="chart-type">סוג טבלה</Label>
              <select
                id="chart-type"
                value={newChart.chart_type}
                onChange={(e) => setNewChart({ ...newChart, chart_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="clothing">בגדים</option>
                <option value="shoes">נעליים</option>
                <option value="accessories">אביזרים</option>
                <option value="other">אחר</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleCreateChart}
                size="sm"
                disabled={loading || !newChart.name.trim()}
              >
                צור טבלה
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewChart({ name: '', chart_type: 'clothing', chart_data: { rows: [], columns: [] } });
                }}
              >
                ביטול
              </Button>
            </div>
          </div>
        )}

        {loading && sizeCharts.length === 0 ? (
          <div className="text-center text-gray-500 py-4">טוען טבלאות מידות...</div>
        ) : sizeCharts.length === 0 ? (
          <div className="text-center py-6">
            <HiTable className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">אין טבלאות מידות עדיין</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="gap-2"
            >
              <HiPlus className="w-4 h-4" />
              צור טבלה ראשונה
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sizeCharts.map((chart) => (
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

