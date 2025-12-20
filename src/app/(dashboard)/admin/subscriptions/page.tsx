'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HiCreditCard, 
  HiCheckCircle, 
  HiXCircle, 
  HiClock,
  HiRefresh,
  HiSearch,
  HiFilter,
  HiDownload
} from 'react-icons/hi';

interface Subscription {
  id: number;
  store_id: number;
  store_name: string;
  store_slug: string;
  owner_email: string;
  plan_name: string;
  plan_price: number;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  next_payment_date: string | null;
  last_payment_amount: number | null;
  last_payment_status: string | null;
  created_at: string;
}

interface Transaction {
  id: number;
  store_name: string;
  type: string;
  amount: number;
  total_amount: number;
  status: string;
  description: string;
  created_at: string;
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'transactions'>('subscriptions');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({
    total_active: 0,
    total_trial: 0,
    monthly_revenue: 0,
    total_revenue: 0,
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'subscriptions') {
        const response = await fetch('/api/admin/subscriptions', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data.subscriptions || []);
          setSummary(data.summary || {});
        } else if (response.status === 403) {
          router.push('/dashboard');
        }
      } else {
        const response = await fetch('/api/admin/transactions', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return `₪${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
      active: { label: 'פעיל', color: 'bg-green-100 text-green-700', icon: HiCheckCircle },
      trial: { label: 'ניסיון', color: 'bg-yellow-100 text-yellow-700', icon: HiClock },
      blocked: { label: 'חסום', color: 'bg-red-100 text-red-700', icon: HiXCircle },
      success: { label: 'הצלחה', color: 'bg-green-100 text-green-700', icon: HiCheckCircle },
      pending: { label: 'ממתין', color: 'bg-yellow-100 text-yellow-700', icon: HiClock },
      failed: { label: 'נכשל', color: 'bg-red-100 text-red-700', icon: HiXCircle },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">מנויים וסליקה</h1>
          <p className="text-gray-600 mt-1">ניהול מנויים והיסטוריית תשלומים</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <HiRefresh className="w-5 h-5" />
          רענן
        </button>
      </div>

      {/* Summary Cards */}
      {activeTab === 'subscriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">מנויים פעילים</p>
            <p className="text-2xl font-bold text-green-600">{summary.total_active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">בתקופת ניסיון</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.total_trial}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">הכנסה חודשית</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(summary.monthly_revenue)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">הכנסה כוללת</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_revenue)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'subscriptions'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <HiCreditCard className="w-4 h-4 inline-block ml-2" />
          מנויים
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === 'transactions'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <HiClock className="w-4 h-4 inline-block ml-2" />
          היסטוריית תשלומים
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : activeTab === 'subscriptions' ? (
          /* Subscriptions Table */
          subscriptions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              אין מנויים
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">חנות</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">מנוי</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">סטטוס</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">תשלום הבא</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">תשלום אחרון</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">נוצר</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{sub.store_name}</p>
                          <p className="text-xs text-gray-500">{sub.owner_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-gray-900">{sub.plan_name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(sub.plan_price)}/חודש</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(sub.status)}
                        {sub.status === 'trial' && sub.trial_ends_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            עד {formatDate(sub.trial_ends_at)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">
                          {formatDate(sub.next_payment_date)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {sub.last_payment_amount ? (
                          <div>
                            <p className="text-sm text-gray-900">{formatCurrency(sub.last_payment_amount)}</p>
                            {sub.last_payment_status && getStatusBadge(sub.last_payment_status)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{formatDate(sub.created_at)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Transactions Table */
          transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              אין עסקאות
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">חנות</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">סוג</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">סכום</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">סטטוס</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">תיאור</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">תאריך</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{tx.store_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'subscription' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {tx.type === 'subscription' ? 'מנוי' : 'עמלה'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(tx.total_amount)}</p>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 max-w-xs truncate">{tx.description || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{formatDate(tx.created_at)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

