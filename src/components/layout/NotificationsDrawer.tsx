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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notifications from API
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=50', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const notificationsData = data.notifications || [];
        
        // Map API data to component format
        const mappedNotifications: Notification[] = notificationsData.map((n: any) => ({
          id: n.id,
          type: n.notification_type?.includes('error') ? 'error' :
                n.notification_type?.includes('warning') ? 'warning' :
                n.notification_type?.includes('success') ? 'success' : 'info',
          title: n.title,
          message: n.message,
          time: formatTimeAgo(n.created_at),
          read: n.is_read || false,
        }));
        
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'עכשיו';
    if (diffInSeconds < 3600) return `לפני ${Math.floor(diffInSeconds / 60)} דקות`;
    if (diffInSeconds < 86400) return `לפני ${Math.floor(diffInSeconds / 3600)} שעות`;
    return `לפני ${Math.floor(diffInSeconds / 86400)} ימים`;
  };

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
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="animate-pulse">טוען...</div>
            </div>
          ) : notifications.length === 0 ? (
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
                  onClick={async () => {
                    // Mark as read via API
                    if (!notification.read) {
                      try {
                        await fetch(`/api/notifications/${notification.id}`, {
                          method: 'PUT',
                          credentials: 'include',
                        });
                        // Update local state
                        setNotifications(prev =>
                          prev.map(n =>
                            n.id === notification.id ? { ...n, read: true } : n
                          )
                        );
                        // Emit event to update sidebar count
                        window.dispatchEvent(new Event('notificationMarkedAsRead'));
                      } catch (error) {
                        console.error('Error marking notification as read:', error);
                      }
                    }
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
              onClick={async () => {
                try {
                  await fetch('/api/notifications/read-all', {
                    method: 'PUT',
                    credentials: 'include',
                  });
                  // Update local state
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  // Emit event to update sidebar count
                  window.dispatchEvent(new Event('notificationMarkedAsRead'));
                } catch (error) {
                  console.error('Error marking all notifications as read:', error);
                }
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

