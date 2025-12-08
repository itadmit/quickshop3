'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiRefresh, HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi';

interface CronStatus {
  name: string;
  url: string;
  lastRun?: string;
  lastStatus?: 'success' | 'error';
  lastResponse?: any;
  loading: boolean;
}

export default function CronStatusPage() {
  const [cronJobs, setCronJobs] = useState<CronStatus[]>([
    {
      name: 'Sync Visitors',
      url: '/api/cron/sync-visitors',
      loading: false,
    },
    {
      name: 'Archive Products',
      url: '/api/cron/archive-products',
      loading: false,
    },
    {
      name: 'Update Discounts Status',
      url: '/api/cron/update-discounts-status',
      loading: false,
    },
  ]);

  const testCronJob = async (index: number) => {
    const job = cronJobs[index];
    setCronJobs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], loading: true };
      return updated;
    });

    try {
      const response = await fetch(job.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });

      const data = await response.json();
      const success = response.ok;

      setCronJobs(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          loading: false,
          lastRun: new Date().toISOString(),
          lastStatus: success ? 'success' : 'error',
          lastResponse: data,
        };
        return updated;
      });
    } catch (error: any) {
      setCronJobs(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          loading: false,
          lastRun: new Date().toISOString(),
          lastStatus: 'error',
          lastResponse: { error: error.message },
        };
        return updated;
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'לא בוצע';
    const date = new Date(dateString);
    return date.toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">סטטוס CRON Jobs</h1>
            <p className="text-gray-600 mt-1">בדיקה וניטור של CRON jobs</p>
          </div>
          <Button
            onClick={() => {
              cronJobs.forEach((_, index) => testCronJob(index));
            }}
            className="flex items-center gap-2"
          >
            <HiRefresh className="w-5 h-5" />
            בדוק הכל
          </Button>
        </div>

        <div className="grid gap-6">
          {cronJobs.map((job, index) => (
            <Card key={index}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{job.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{job.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.lastStatus === 'success' && (
                      <HiCheckCircle className="w-6 h-6 text-green-500" />
                    )}
                    {job.lastStatus === 'error' && (
                      <HiXCircle className="w-6 h-6 text-red-500" />
                    )}
                    {!job.lastStatus && (
                      <HiClock className="w-6 h-6 text-gray-400" />
                    )}
                    <Button
                      onClick={() => testCronJob(index)}
                      disabled={job.loading}
                      size="sm"
                    >
                      {job.loading ? 'בודק...' : 'בדוק עכשיו'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ריצה אחרונה:</span>
                    <span className="font-medium">{formatDate(job.lastRun)}</span>
                  </div>

                  {job.lastResponse && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-700 mb-2">תגובה:</div>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(job.lastResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
  );
}

