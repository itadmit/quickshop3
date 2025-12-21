'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import {
  HiArrowLeft,
  HiCube,
  HiExclamationCircle,
  HiCheckCircle,
  HiXCircle,
  HiPhotograph,
  HiTrendingUp,
  HiTrendingDown,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface InventoryItem {
  product_id: number;
  product_title: string;
  product_image: string | null;
  sku: string;
  variant_title: string;
  stock_quantity: number;
  low_stock_threshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_sold_at: string | null;
  sales_velocity: number;
  days_until_stockout: number | null;
}

interface InventoryStats {
  total_products: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
  total_inventory_value: number;
  total_inventory_units: number;
}

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export default function InventoryLevelsPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total_products: 0,
    in_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
    total_inventory_value: 0,
    total_inventory_units: 0,
  });
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/reports/inventory-levels?${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setStats(data.stats || stats);
      }
    } catch (error: any) {
      console.error('Error loading inventory:', error);
      toast({ title: 'שגיאה', description: 'לא ניתן לטעון נתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const statusPieData = [
    { name: 'במלאי', value: stats.in_stock },
    { name: 'מלאי נמוך', value: stats.low_stock },
    { name: 'אזל', value: stats.out_of_stock },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <HiCheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'low_stock':
        return <HiExclamationCircle className="w-5 h-5 text-amber-500" />;
      case 'out_of_stock':
        return <HiXCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'במלאי';
      case 'low_stock':
        return 'מלאי נמוך';
      case 'out_of_stock':
        return 'אזל מהמלאי';
      default:
        return status;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-emerald-50 text-emerald-700';
      case 'low_stock':
        return 'bg-amber-50 text-amber-700';
      case 'out_of_stock':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוח מלאי</h1>
            <p className="text-gray-500 mt-1">מצב מלאי ומוצרים בסיכון</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המוצרים</SelectItem>
              <SelectItem value="low_stock">מלאי נמוך</SelectItem>
              <SelectItem value="out_of_stock">אזל מהמלאי</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">סה"כ מוצרים</div>
              <HiCube className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_products}</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">במלאי</div>
              <HiCheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{stats.in_stock}</div>
            <div className="text-sm text-gray-400">
              {stats.total_products > 0 ? ((stats.in_stock / stats.total_products) * 100).toFixed(0) : 0}%
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">מלאי נמוך</div>
              <HiExclamationCircle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{stats.low_stock}</div>
            <div className="text-sm text-gray-400">דורשים תשומת לב</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">אזל מהמלאי</div>
              <HiXCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.out_of_stock}</div>
            <div className="text-sm text-gray-400">לא זמינים למכירה</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">התפלגות מצב מלאי</h2>
            {loading ? (
              <div className="h-80 animate-pulse bg-gray-200 rounded"></div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Inventory Summary */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">סיכום מלאי</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">סה"כ יחידות במלאי</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total_inventory_units.toLocaleString('he-IL')}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">שווי מלאי מוערך</div>
                <div className="text-2xl font-bold text-emerald-600">₪{stats.total_inventory_value.toLocaleString('he-IL')}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {filter === 'low_stock' ? 'מוצרים במלאי נמוך' : filter === 'out_of_stock' ? 'מוצרים שאזלו' : 'כל המוצרים'}
          </h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מוצר</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מק"ט</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">מלאי</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">סטטוס</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">קצב מכירות</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">ימים עד חוסר</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.product_id}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            {item.product_image ? (
                              <img src={item.product_image} alt={item.product_title} className="w-full h-full object-cover" />
                            ) : (
                              <HiPhotograph className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.product_title}</div>
                            {item.variant_title && (
                              <div className="text-sm text-gray-500">{item.variant_title}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-sm">{item.sku || '-'}</td>
                      <td className="py-4 px-4">
                        <span className={`font-bold ${item.stock_quantity <= 0 ? 'text-red-600' : item.stock_quantity <= item.low_stock_threshold ? 'text-amber-600' : 'text-gray-900'}`}>
                          {item.stock_quantity}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBgColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          {item.sales_velocity > 0 ? (
                            <>
                              <HiTrendingUp className="w-4 h-4 text-emerald-500" />
                              <span className="text-gray-900">{item.sales_velocity.toFixed(1)}/יום</span>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {item.days_until_stockout !== null && item.days_until_stockout > 0 ? (
                          <span className={`font-medium ${item.days_until_stockout <= 7 ? 'text-red-600' : item.days_until_stockout <= 14 ? 'text-amber-600' : 'text-gray-900'}`}>
                            {item.days_until_stockout} ימים
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">אין מוצרים להצגה</div>
          )}
        </div>
      </Card>
    </div>
  );
}

