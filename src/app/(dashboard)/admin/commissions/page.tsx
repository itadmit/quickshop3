'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HiCurrencyDollar, 
  HiCheckCircle, 
  HiClock,
  HiRefresh,
  HiDownload,
  HiFilter
} from 'react-icons/hi';

interface CommissionCharge {
  id: number;
  store_name: string;
  store_slug: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  commission_rate: number;
  commission_amount: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  charged_at: string | null;
  created_at: string;
}

interface CommissionSummary {
  pending_count: number;
  pending_amount: number;
  collected_this_month: number;
  collected_total: number;
}

export default function AdminCommissionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<CommissionCharge[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchCommissions();
  }, [statusFilter]);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/admin/commissions?${params}`, { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const data = await response.json();
        setCommissions(data.commissions || []);
        setSummary(data.summary || null);
      } else if (response.status === 403) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('he-IL');
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return `₪${amount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      pending: { label: 'ממתין לגבייה', color: 'bg-yellow-100 text-yellow-700' },
      processing: { label: 'בתהליך', color: 'bg-blue-100 text-blue-700' },
      success: { label: 'נגבה', color: 'bg-green-100 text-green-700' },
      failed: { label: 'נכשל', color: 'bg-red-100 text-red-700' },
    };
    const config = configs[status] || configs.pending;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">דוח עמלות</h1>
          <p className="text-gray-600 mt-1">מעקב אחרי עמלות מעסקאות חנויות Pro</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCommissions}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <HiRefresh className="w-5 h-5" />
            רענן
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <HiClock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">עמלות בהמתנה</p>
                <p className="text-xl font-bold text-yellow-600">{summary.pending_count}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <HiCurrencyDollar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סכום בהמתנה</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(summary.pending_amount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <HiCheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">נגבה החודש</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(summary.collected_this_month)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <HiCurrencyDollar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סה"כ עמלות נגבו</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(summary.collected_total)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <HiFilter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="pending">ממתין לגבייה</option>
            <option value="success">נגבה</option>
            <option value="failed">נכשל</option>
          </select>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : commissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <HiCurrencyDollar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>אין עמלות עדיין</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">חנות</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">תקופה</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">מכירות</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">עמלה</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">מע"מ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">סה"כ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">סטטוס</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">תאריך גבייה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{commission.store_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">
                        {formatDate(commission.period_start)} - {formatDate(commission.period_end)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{formatCurrency(commission.total_sales)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">
                        {formatCurrency(commission.commission_amount)}
                        <span className="text-xs text-gray-400 mr-1">
                          ({(commission.commission_rate * 100).toFixed(1)}%)
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{formatCurrency(commission.vat_amount)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(commission.total_amount)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(commission.status)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{formatDate(commission.charged_at)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

