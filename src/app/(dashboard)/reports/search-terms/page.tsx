'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiArrowLeft, HiDownload, HiSearch } from 'react-icons/hi';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';

interface SearchTerm {
  term: string;
  searches: number;
  results_count: number;
  clicks: number;
  conversion_rate: number;
}

export default function SearchTermsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SearchTerm[]>([]);
  const [noResults, setNoResults] = useState<SearchTerm[]>([]);
  const [stats, setStats] = useState({ total_searches: 0, unique_terms: 0, avg_results: 0 });
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
      const res = await fetch(`/api/reports/search-terms?start_date=${startDate}&end_date=${endDate}`);
      const json = await res.json();
      if (json.terms) {
        setData(json.terms);
        setNoResults(json.no_results || []);
        setStats(json.stats || { total_searches: 0, unique_terms: 0, avg_results: 0 });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['מונח חיפוש', 'חיפושים', 'תוצאות', 'שיעור המרה'];
    const rows = data.map(t => [t.term, t.searches, t.results_count, t.conversion_rate.toFixed(1) + '%']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `search-terms-${startDate}-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg"><HiArrowLeft className="w-5 h-5 text-gray-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">חיפושים באתר</h1>
            <p className="text-gray-500">מה לקוחות מחפשים באתר</p>
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
        <Card><div className="p-4"><div className="flex items-center gap-2 text-sm text-gray-500"><HiSearch className="w-4 h-4" />סה"כ חיפושים</div><div className="text-2xl font-bold">{stats.total_searches.toLocaleString()}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">מונחים ייחודיים</div><div className="text-2xl font-bold">{stats.unique_terms}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-500">ממוצע תוצאות</div><div className="text-2xl font-bold">{stats.avg_results.toFixed(1)}</div></div></Card>
      </div>

      {loading ? (
        <Card><div className="p-8 text-center text-gray-500">טוען...</div></Card>
      ) : (
        <>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">מונחי חיפוש פופולריים</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="term" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="searches" fill="#10b981" name="חיפושים" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">כל מונחי החיפוש</h3>
                <div className="overflow-y-auto max-h-96">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="text-right py-2 px-3 font-medium text-gray-600">מונח</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">חיפושים</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">תוצאות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((t, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3"><span className="font-medium">{t.term}</span></td>
                          <td className="py-2 px-3">{t.searches}</td>
                          <td className="py-2 px-3">{t.results_count}</td>
                        </tr>
                      ))}
                      {data.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-500">אין נתונים</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-red-600">חיפושים ללא תוצאות</h3>
                <p className="text-sm text-gray-500 mb-4">מונחים שלא הניבו תוצאות - הזדמנות להוסיף מוצרים</p>
                <div className="overflow-y-auto max-h-80">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="text-right py-2 px-3 font-medium text-gray-600">מונח</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">חיפושים</th>
                      </tr>
                    </thead>
                    <tbody>
                      {noResults.map((t, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3"><span className="font-medium text-red-600">{t.term}</span></td>
                          <td className="py-2 px-3">{t.searches}</td>
                        </tr>
                      ))}
                      {noResults.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-gray-500">אין חיפושים ללא תוצאות 🎉</td></tr>}
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

