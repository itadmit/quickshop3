'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  HiSearch, 
  HiFilter, 
  HiEye, 
  HiPencil, 
  HiBan,
  HiCheckCircle,
  HiClock,
  HiExclamation,
  HiRefresh,
  HiExternalLink
} from 'react-icons/hi';

interface Store {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  owner_email: string;
  owner_name: string;
  created_at: string;
  subscription_status: string | null;
  plan_name: string | null;
  trial_ends_at: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  active: { label: 'פעיל', color: 'bg-green-100 text-green-700', icon: HiCheckCircle },
  trial: { label: 'ניסיון', color: 'bg-yellow-100 text-yellow-700', icon: HiClock },
  blocked: { label: 'חסום', color: 'bg-red-100 text-red-700', icon: HiBan },
  expired: { label: 'פג תוקף', color: 'bg-gray-100 text-gray-700', icon: HiExclamation },
  cancelled: { label: 'בוטל', color: 'bg-gray-100 text-gray-700', icon: HiExclamation },
  no_subscription: { label: 'ללא מנוי', color: 'bg-gray-100 text-gray-500', icon: HiExclamation },
};

export default function AdminStoresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchStores();
  }, [statusFilter, pagination.page]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/admin/stores?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else if (response.status === 403) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchStores();
  };

  const getStatusBadge = (status: string | null) => {
    const config = statusConfig[status || 'no_subscription'] || statusConfig.no_subscription;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול חנויות</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total} חנויות במערכת
          </p>
        </div>
        <button
          onClick={fetchStores}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <HiRefresh className="w-5 h-5" />
          רענן
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש לפי שם, slug, דומיין או אימייל..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <HiSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <HiFilter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="active">פעילים</option>
              <option value="trial">בניסיון</option>
              <option value="blocked">חסומים</option>
              <option value="expired">פג תוקף</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : stores.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            לא נמצאו חנויות
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">חנות</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">בעלים</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">מנוי</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">סטטוס</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">נוצר</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-sm text-gray-500">{store.slug}</p>
                        {store.domain && (
                          <p className="text-xs text-primary">{store.domain}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">{store.owner_name || '-'}</p>
                        <p className="text-xs text-gray-500">{store.owner_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{store.plan_name || '-'}</p>
                      {store.trial_ends_at && store.subscription_status === 'trial' && (
                        <p className="text-xs text-yellow-600">
                          עד {formatDate(store.trial_ends_at)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(store.subscription_status)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{formatDate(store.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/shops/${store.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                          title="צפייה בחנות"
                        >
                          <HiExternalLink className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/admin/stores/${store.id}`}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                          title="פרטי חנות"
                        >
                          <HiEye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              מציג {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} מתוך {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                הקודם
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                הבא
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

