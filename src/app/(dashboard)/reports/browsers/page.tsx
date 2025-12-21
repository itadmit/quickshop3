'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload } from 'react-icons/hi';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

interface BrowserData {
  name: string;
  sessions: number;
  percentage: number;
  orders: number;
  conversion_rate: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function BrowsersReportPage() {
  const [loading, setLoading] = useState(true);
  const [browsers, setBrowsers] = useState<BrowserData[]>([]);
  const [os, setOs] = useState<BrowserData[]>([]);
  const [totals, setTotals] = useState({ total_sessions: 0 });
  const [dateRange, setDateRange] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(dateRange));
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, [dateRange]);

  useEffect(() => {
    if (startDate && endDate) fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/browsers?start_date=${startDate}&end_date=${endDate}`);
      const json = await res.json();
      if (json.browsers) {
        setBrowsers(json.browsers);
        setOs(json.operating_systems || []);
        setTotals(json.totals || { total_sessions: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['דפדפן/מערכת', 'סשנים', 'אחוז', 'הזמנות', 'המרה'];
    const rows = [...browsers.map(b => ['דפדפן: ' + b.name, b.sessions, b.percentage.toFixed(1) + '%', b.orders, b.conversion_rate.toFixed(1) + '%']),
                  ...os.map(o => ['מערכת: ' + o.name, o.sessions, o.percentage.toFixed(1) + '%', o.orders, o.conversion_rate.toFixed(1) + '%'])];
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `browsers-os-${startDate}-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דפדפנים ומערכות הפעלה</h1>
            <p className="text-gray-500">Chrome, Safari, iOS, Android ועוד</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ימים</SelectItem>
              <SelectItem value="30">30 ימים</SelectItem>
              <SelectItem value="90">90 ימים</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}><HiDownload className="w-4 h-4 ml-2" />ייצוא</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="p-4"><div className="text-sm text-gray-500">סה"כ סשנים</div><div className="text-2xl font-bold">{totals.total_sessions.toLocaleString()}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">דפדפנים</div><div className="text-2xl font-bold">{browsers.length}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">מערכות הפעלה</div><div className="text-2xl font-bold">{os.length}</div></div></Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">דפדפנים</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={browsers} dataKey="sessions" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {browsers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">מערכות הפעלה</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={os} dataKey="sessions" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {os.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">פירוט דפדפנים</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3 font-medium text-gray-600">דפדפן</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">סשנים</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">%</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">המרה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {browsers.map((b, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{b.name}</td>
                          <td className="py-2 px-3">{b.sessions.toLocaleString()}</td>
                          <td className="py-2 px-3">{b.percentage.toFixed(1)}%</td>
                          <td className="py-2 px-3">{b.conversion_rate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">פירוט מערכות הפעלה</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3 font-medium text-gray-600">מערכת</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">סשנים</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">%</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">המרה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {os.map((o, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{o.name}</td>
                          <td className="py-2 px-3">{o.sessions.toLocaleString()}</td>
                          <td className="py-2 px-3">{o.percentage.toFixed(1)}%</td>
                          <td className="py-2 px-3">{o.conversion_rate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

