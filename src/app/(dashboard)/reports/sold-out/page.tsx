'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiXCircle } from 'react-icons/hi';
import Link from 'next/link';

interface SoldOutProduct {
  product_id: number;
  variant_id: number;
  product_title: string;
  variant_title: string;
  sku: string;
  sold_out_date: string;
  days_sold_out: number;
  lost_revenue_estimate: number;
}

export default function SoldOutPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<SoldOutProduct[]>([]);
  const [stats, setStats] = useState({ total_sold_out: 0, products_sold_out: 0, estimated_lost_revenue: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/sold-out');
      const json = await res.json();
      if (json.products) {
        setProducts(json.products);
        setStats(json.stats || { total_sold_out: 0, products_sold_out: 0, estimated_lost_revenue: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['מוצר', 'וריאנט', 'מק"ט', 'ימים אזל', 'הפסד משוער'];
    const rows = products.map(p => [p.product_title, p.variant_title || '-', p.sku || '-', p.days_sold_out, p.lost_revenue_estimate.toFixed(2)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sold-out-report.csv';
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">מוצרים אזלו</h1>
            <p className="text-gray-500">מוצרים שנגמרו מהמלאי</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCSV}><HiDownload className="w-4 h-4 ml-2" />ייצוא</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4 border-r-4 border-red-500">
            <div className="flex items-center gap-2 text-sm text-gray-500"><HiXCircle className="w-4 h-4 text-red-500" />וריאנטים אזלו</div>
            <div className="text-2xl font-bold text-red-600">{stats.total_sold_out}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500">מוצרים מושפעים</div>
            <div className="text-2xl font-bold">{stats.products_sold_out}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500">הפסד הכנסות משוער</div>
            <div className="text-2xl font-bold text-red-600">₪{stats.estimated_lost_revenue.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">רשימת מוצרים אזלו</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 font-medium text-gray-600">מוצר</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">וריאנט</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">מק"ט</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">ימים אזל</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">הפסד משוער</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{p.product_title}</td>
                      <td className="py-3 px-4 text-gray-600">{p.variant_title || '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{p.sku || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${p.days_sold_out > 7 ? 'text-red-600' : 'text-orange-600'}`}>
                          {p.days_sold_out} ימים
                        </span>
                      </td>
                      <td className="py-3 px-4 text-red-600">₪{p.lost_revenue_estimate.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Link href={`/products/edit/${p.product_id}`} className="text-blue-600 hover:underline text-sm">הוסף מלאי</Link>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">אין מוצרים אזלו 🎉</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

