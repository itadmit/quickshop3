'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiExclamation } from 'react-icons/hi';
import Link from 'next/link';

interface LowStockProduct {
  product_id: number;
  variant_id: number;
  product_title: string;
  variant_title: string;
  sku: string;
  quantity: number;
  reorder_point: number;
  days_of_stock: number;
  avg_daily_sales: number;
}

export default function LowStockPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [stats, setStats] = useState({ low_stock_count: 0, critical_count: 0, total_value_at_risk: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/low-stock');
      const json = await res.json();
      if (json.products) {
        setProducts(json.products);
        setStats(json.stats || { low_stock_count: 0, critical_count: 0, total_value_at_risk: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (quantity: number, reorderPoint: number) => {
    if (quantity <= 0) return { label: 'אזל', color: 'bg-red-100 text-red-700' };
    if (quantity <= reorderPoint / 2) return { label: 'קריטי', color: 'bg-orange-100 text-orange-700' };
    return { label: 'נמוך', color: 'bg-yellow-100 text-yellow-700' };
  };

  const exportCSV = () => {
    const headers = ['מוצר', 'וריאנט', 'מק"ט', 'מלאי', 'סטטוס'];
    const rows = products.map(p => [p.product_title, p.variant_title || '-', p.sku || '-', p.quantity, getStockStatus(p.quantity, p.reorder_point).label]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'low-stock-report.csv';
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">מוצרים במלאי נמוך</h1>
            <p className="text-gray-500">מוצרים שעומדים להיגמר</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCSV}><HiDownload className="w-4 h-4 ml-2" />ייצוא</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4 border-r-4 border-yellow-500">
            <div className="text-sm text-gray-500">מוצרים במלאי נמוך</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.low_stock_count}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 border-r-4 border-red-500">
            <div className="flex items-center gap-2 text-sm text-gray-500"><HiExclamation className="w-4 h-4 text-red-500" />מלאי קריטי</div>
            <div className="text-2xl font-bold text-red-600">{stats.critical_count}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500">ערך מלאי בסיכון</div>
            <div className="text-2xl font-bold">₪{stats.total_value_at_risk.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">רשימת מוצרים</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 font-medium text-gray-600">מוצר</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">וריאנט</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">מק"ט</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">מלאי</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">סטטוס</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">ימי מלאי</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const status = getStockStatus(p.quantity, p.reorder_point);
                    return (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{p.product_title}</td>
                        <td className="py-3 px-4 text-gray-600">{p.variant_title || '-'}</td>
                        <td className="py-3 px-4 text-gray-500">{p.sku || '-'}</td>
                        <td className="py-3 px-4 font-bold">{p.quantity}</td>
                        <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-sm font-medium ${status.color}`}>{status.label}</span></td>
                        <td className="py-3 px-4">{p.days_of_stock > 0 ? `~${p.days_of_stock} ימים` : '-'}</td>
                        <td className="py-3 px-4">
                          <Link href={`/products/${p.product_id}`} className="text-blue-600 hover:underline text-sm">ערוך מוצר</Link>
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">אין מוצרים במלאי נמוך 🎉</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

