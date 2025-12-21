'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiExclamation, HiMail } from 'react-icons/hi';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AtRiskCustomer {
  customer_id: number;
  customer_name: string;
  email: string;
  last_order_date: string;
  days_since_last_order: number;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  risk_level: 'high' | 'medium' | 'low';
}

export default function CustomersAtRiskPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<AtRiskCustomer[]>([]);
  const [stats, setStats] = useState({ high_risk: 0, medium_risk: 0, low_risk: 0, potential_revenue_loss: 0 });
  const [riskDistribution, setRiskDistribution] = useState<{ days: string; count: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/customers-at-risk');
      const json = await res.json();
      if (json.customers) {
        setCustomers(json.customers);
        setStats(json.stats || { high_risk: 0, medium_risk: 0, low_risk: 0, potential_revenue_loss: 0 });
        setRiskDistribution(json.risk_distribution || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">סיכון גבוה</span>;
      case 'medium': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">סיכון בינוני</span>;
      case 'low': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">סיכון נמוך</span>;
      default: return null;
    }
  };

  const exportCSV = () => {
    const headers = ['שם', 'אימייל', 'הזמנה אחרונה', 'ימים ללא פעילות', 'הזמנות', 'סה"כ הוצאות', 'רמת סיכון'];
    const rows = customers.map(c => [c.customer_name, c.email, c.last_order_date, c.days_since_last_order, c.total_orders, c.total_spent.toFixed(2), c.risk_level]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'customers-at-risk-report.csv';
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">לקוחות בסיכון</h1>
            <p className="text-gray-500">לקוחות שלא ביצעו רכישה זמן רב</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCSV}><HiDownload className="w-4 h-4 ml-2" />ייצוא</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 border-r-4 border-red-500">
            <div className="flex items-center gap-2 text-sm text-gray-500"><HiExclamation className="w-4 h-4 text-red-500" />סיכון גבוה</div>
            <div className="text-2xl font-bold text-red-600">{stats.high_risk}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 border-r-4 border-yellow-500">
            <div className="text-sm text-gray-500">סיכון בינוני</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.medium_risk}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 border-r-4 border-blue-500">
            <div className="text-sm text-gray-500">סיכון נמוך</div>
            <div className="text-2xl font-bold text-blue-600">{stats.low_risk}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500">פוטנציאל הפסד</div>
            <div className="text-2xl font-bold text-gray-900">₪{stats.potential_revenue_loss.toLocaleString()}</div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">התפלגות לפי ימים ללא פעילות</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="days" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" name="לקוחות" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">רשימת לקוחות בסיכון</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-gray-600">לקוח</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הזמנה אחרונה</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">ימים ללא פעילות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">הזמנות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">סה"כ הוצאות</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">רמת סיכון</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div><span className="font-medium">{c.customer_name}</span></div>
                          <div className="text-sm text-gray-500">{c.email}</div>
                        </td>
                        <td className="py-3 px-4">{new Date(c.last_order_date).toLocaleDateString('he-IL')}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${c.days_since_last_order > 90 ? 'text-red-600' : c.days_since_last_order > 60 ? 'text-yellow-600' : 'text-blue-600'}`}>
                            {c.days_since_last_order} ימים
                          </span>
                        </td>
                        <td className="py-3 px-4">{c.total_orders}</td>
                        <td className="py-3 px-4 font-medium">₪{c.total_spent.toLocaleString()}</td>
                        <td className="py-3 px-4">{getRiskBadge(c.risk_level)}</td>
                        <td className="py-3 px-4">
                          <a href={`mailto:${c.email}`} className="p-2 hover:bg-gray-100 rounded-lg inline-flex text-blue-600">
                            <HiMail className="w-5 h-5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">אין לקוחות בסיכון 🎉</td></tr>}
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

