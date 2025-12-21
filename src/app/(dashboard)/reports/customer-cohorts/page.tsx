'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload } from 'react-icons/hi';
import Link from 'next/link';

interface CohortData {
  cohort_month: string;
  customers_count: number;
  months: { month: number; retention_rate: number; revenue: number; customers: number }[];
}

export default function CustomerCohortsPage() {
  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [totals, setTotals] = useState({ total_customers: 0, avg_retention: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/customer-cohorts');
      const json = await res.json();
      if (json.cohorts) {
        setCohorts(json.cohorts);
        setTotals(json.totals || { total_customers: 0, avg_retention: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRetentionColor = (rate: number) => {
    if (rate >= 50) return 'bg-emerald-500 text-white';
    if (rate >= 30) return 'bg-emerald-400 text-white';
    if (rate >= 20) return 'bg-emerald-300 text-gray-800';
    if (rate >= 10) return 'bg-emerald-200 text-gray-800';
    if (rate > 0) return 'bg-emerald-100 text-gray-800';
    return 'bg-gray-100 text-gray-400';
  };

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'short' });
  };

  const exportCSV = () => {
    const headers = ['קוהורט', 'לקוחות', ...Array.from({ length: 12 }, (_, i) => `חודש ${i}`)];
    const rows = cohorts.map(c => [
      formatMonth(c.cohort_month),
      c.customers_count,
      ...c.months.map(m => m.retention_rate.toFixed(1) + '%')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'customer-cohorts-report.csv';
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ניתוח קוהורטות</h1>
            <p className="text-gray-500">שימור לקוחות לפי חודש הצטרפות</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCSV}><HiDownload className="w-4 h-4 ml-2" />ייצוא</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="p-4"><div className="text-sm text-gray-500">סה"כ לקוחות</div><div className="text-2xl font-bold">{totals.total_customers.toLocaleString()}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">שיעור שימור ממוצע</div><div className="text-2xl font-bold text-emerald-600">{totals.avg_retention.toFixed(1)}%</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">קוהורטות</div><div className="text-2xl font-bold">{cohorts.length}</div></div></Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">מטריצת שימור לקוחות</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3 font-medium text-gray-600 sticky right-0 bg-white">קוהורט</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">לקוחות</th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th key={i} className="text-center py-2 px-2 font-medium text-gray-600">ח{i}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((cohort, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-3 font-medium sticky right-0 bg-white">{formatMonth(cohort.cohort_month)}</td>
                      <td className="py-2 px-3 text-gray-600">{cohort.customers_count}</td>
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthData = cohort.months.find(m => m.month === i);
                        const rate = monthData?.retention_rate || 0;
                        return (
                          <td key={i} className="py-1 px-1 text-center">
                            {monthData ? (
                              <div className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(rate)}`}>
                                {rate.toFixed(0)}%
                              </div>
                            ) : (
                              <div className="px-2 py-1 text-gray-300">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {cohorts.length === 0 && (
                    <tr><td colSpan={14} className="py-8 text-center text-gray-500">אין נתונים</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span>מקרא:</span>
              <div className="flex items-center gap-1"><div className="w-4 h-4 bg-emerald-500 rounded" /> 50%+</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 bg-emerald-400 rounded" /> 30-50%</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 bg-emerald-300 rounded" /> 20-30%</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 bg-emerald-200 rounded" /> 10-20%</div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 bg-emerald-100 rounded" /> 0-10%</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

