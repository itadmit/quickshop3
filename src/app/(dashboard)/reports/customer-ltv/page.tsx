'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiCurrencyDollar, HiTrendingUp } from 'react-icons/hi';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface CustomerLTVData {
  customer_id: number;
  customer_name: string;
  email: string;
  first_order_date: string;
  last_order_date: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  days_as_customer: number;
  predicted_ltv: number;
}

interface LTVStats {
  avg_ltv: number;
  median_ltv: number;
  total_customers: number;
  customers_with_orders: number;
  avg_orders_per_customer: number;
  avg_customer_lifespan_days: number;
}

export default function CustomerLTVPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerLTVData[]>([]);
  const [stats, setStats] = useState<LTVStats | null>(null);
  const [ltvDistribution, setLtvDistribution] = useState<{ range: string; count: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/customer-ltv');
      const json = await res.json();
      if (json.customers) {
        setCustomers(json.customers);
        setStats(json.stats);
        setLtvDistribution(json.ltv_distribution || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['שם', 'אימייל', 'הזמנות', 'סה"כ הוצאות', 'ממוצע הזמנה', 'LTV צפוי'];
    const rows = customers.map(c => [c.customer_name, c.email, c.total_orders, c.total_spent.toFixed(2), c.avg_order_value.toFixed(2), c.predicted_ltv.toFixed(2)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'customer-ltv-report.csv';
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ערך חיי לקוח (CLV)</h1>
            <p className="text-gray-500">ניתוח ערך לקוח לאורך זמן</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCSV}><HiDownload className="w-4 h-4 ml-2" />ייצוא</Button>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500"><HiCurrencyDollar className="w-4 h-4" />ממוצע LTV</div>
                <div className="text-2xl font-bold text-emerald-600">₪{(stats?.avg_ltv || 0).toLocaleString()}</div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-500">חציון LTV</div>
                <div className="text-2xl font-bold">₪{(stats?.median_ltv || 0).toLocaleString()}</div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-500">ממוצע הזמנות ללקוח</div>
                <div className="text-2xl font-bold">{(stats?.avg_orders_per_customer || 0).toFixed(1)}</div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-500">ממוצע ימים כלקוח</div>
                <div className="text-2xl font-bold">{Math.round(stats?.avg_customer_lifespan_days || 0)}</div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">התפלגות LTV</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ltvDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" name="לקוחות" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">לקוחות מובילים לפי LTV</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-gray-600">לקוח</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הזמנות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">סה"כ הוצאות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">ממוצע הזמנה</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">ימים כלקוח</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">LTV צפוי</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.slice(0, 50).map((c, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div><span className="font-medium">{c.customer_name}</span></div>
                          <div className="text-sm text-gray-500">{c.email}</div>
                        </td>
                        <td className="py-3 px-4">{c.total_orders}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">₪{c.total_spent.toLocaleString()}</td>
                        <td className="py-3 px-4">₪{c.avg_order_value.toLocaleString()}</td>
                        <td className="py-3 px-4">{c.days_as_customer}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <HiTrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className="font-medium">₪{c.predicted_ltv.toLocaleString()}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">אין נתונים</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

