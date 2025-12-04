'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { HiBell, HiCheckCircle, HiExclamationCircle, HiStar } from 'react-icons/hi';

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint /api/notifications
      // For now, show sample data
      setNotifications([
        {
          id: 1,
          type: 'success',
          title: 'הזמנה חדשה',
          message: 'התקבלה הזמנה חדשה #1234',
          is_read: false,
          created_at: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <HiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <HiExclamationCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <HiExclamationCircle className="w-5 h-5 text-red-500" />;
      default:
        return <HiStar className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200';
      case 'warning':
        return 'border-yellow-200';
      case 'error':
        return 'border-red-200';
      default:
        return 'border-blue-200';
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">התראות</h1>
        <p className="text-gray-500 mt-1">כל ההתראות והעדכונים</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <HiBell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">אין התראות</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border ${getBorderColor(notification.type)} ${
                !notification.is_read ? 'bg-gray-50' : ''
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleString('he-IL')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

