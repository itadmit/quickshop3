'use client';

import { useState, useEffect } from 'react';
import { HiX, HiCheckCircle, HiInformationCircle, HiExclamationCircle } from 'react-icons/hi';

interface Notification {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'success',
      title: 'הזמנה חדשה',
      message: 'התקבלה הזמנה חדשה #1001 בסך ₪450',
      time: 'לפני 5 דקות',
      read: false,
    },
    {
      id: 2,
      type: 'info',
      title: 'עדכון מערכת',
      message: 'עדכון חדש זמין למערכת - עדכן עכשיו',
      time: 'לפני שעה',
      read: false,
    },
    {
      id: 3,
      type: 'warning',
      title: 'מלאי נמוך',
      message: 'מוצר "חולצה כחולה" נותר עם 3 יחידות בלבד',
      time: 'לפני 3 שעות',
      read: true,
    },
  ]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <HiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <HiInformationCircle className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <HiExclamationCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <HiExclamationCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">עדכונים</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <HiInformationCircle className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg">אין עדכונים חדשים</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    // Mark as read
                    setNotifications(prev =>
                      prev.map(n =>
                        n.id === notification.id ? { ...n, read: true } : n
                      )
                    );
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-400">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              }}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900 py-2"
            >
              סמן הכל כנקרא
            </button>
          </div>
        )}
      </div>
    </>
  );
}

