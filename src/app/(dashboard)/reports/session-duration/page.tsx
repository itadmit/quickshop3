'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiClock } from 'react-icons/hi';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

interface SessionData {
  duration_range: string;
  sessions: number;
  percentage: number;
}

interface DailyDuration {
  date: string;
  avg_duration: number;
  sessions: number;
}

export default function SessionDurationPage() {
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState<SessionData[]>([]);
  const [dailyData, setDailyData] = useState<DailyDuration[]>([]);
  const [stats, setStats] = useState({ avg_duration: 0, total_sessions: 0, median_duration: 0 });
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
      const res = await fetch(`/api/reports/session-duration?start_date=${startDate}&end_date=${endDate}`);
      const json = await res.json();
      if (json.distribution) {
        setDistribution(json.distribution);
        setDailyData(json.daily_data || []);
        setStats(json.stats || { avg_duration: 0, total_sessions: 0, median_duration: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}שנ`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} דק`;
  };

  const exportCSV = () => {
    const headers = ['טווח זמן', 'סשנים', 'אחוז'];
    const rows = distribution.map(d => [d.duration_range, d.sessions, d.percentage.toFixed(1) + '%']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `session-duration-${startDate}-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">זמן שהייה באתר</h1>
            <p className="text-gray-500">כמה זמן גולשים באתר</p>
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
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500"><HiClock className="w-4 h-4" />ממוצע זמן שהייה</div>
            <div className="text-2xl font-bold text-emerald-600">{formatDuration(Math.round(stats.avg_duration))}</div>
          </div>
        </Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">חציון זמן שהייה</div><div className="text-2xl font-bold">{formatDuration(Math.round(stats.median_duration))}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">סה"כ סשנים</div><div className="text-2xl font-bold">{stats.total_sessions.toLocaleString()}</div></div></Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">התפלגות זמן שהייה</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="duration_range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sessions" fill="#10b981" name="סשנים" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">ממוצע זמן שהייה לאורך זמן</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(v) => formatDuration(v)} />
                      <Tooltip formatter={(v: number) => formatDuration(Math.round(v))} />
                      <Line type="monotone" dataKey="avg_duration" stroke="#10b981" strokeWidth={2} name="ממוצע" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">פירוט לפי טווח זמן</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-gray-600">טווח זמן</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">סשנים</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">אחוז</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">התפלגות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distribution.map((d, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{d.duration_range}</td>
                        <td className="py-3 px-4">{d.sessions.toLocaleString()}</td>
                        <td className="py-3 px-4">{d.percentage.toFixed(1)}%</td>
                        <td className="py-3 px-4">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.percentage}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {distribution.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-500">אין נתונים</td></tr>}
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

