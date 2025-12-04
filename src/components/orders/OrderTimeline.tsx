'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HiCheckCircle, HiXCircle, HiClock, HiRefresh, HiBan, HiPlus, HiMail, HiChat } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface TimelineEvent {
  id: number;
  event_type: string;
  message: string;
  created_at: Date;
  user_id?: number | null;
}

interface OrderTimelineProps {
  orderId: number;
}

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const { toast } = useOptimisticToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    loadTimeline();
  }, [orderId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint /api/orders/:id/timeline
      // For now, load from system_logs
      const response = await fetch(`/api/orders/${orderId}/timeline`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      setAddingNote(true);
      const response = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: newNote }),
      });

      if (response.ok) {
        const data = await response.json();
        setEvents([data.note, ...events]);
        setNewNote('');
        toast({
          title: 'הצלחה',
          description: 'ההערה נוספה בהצלחה',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה בהוספת ההערה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהוספת ההערה',
        variant: 'destructive',
      });
    } finally {
      setAddingNote(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'order.created':
        return <HiPlus className="w-5 h-5 text-green-500" />;
      case 'order.paid':
        return <HiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'order.fulfilled':
        return <HiCheckCircle className="w-5 h-5 text-blue-500" />;
      case 'order.refunded':
        return <HiRefresh className="w-5 h-5 text-yellow-500" />;
      case 'order.cancelled':
        return <HiBan className="w-5 h-5 text-red-500" />;
      case 'order_note':
        return <HiChat className="w-5 h-5 text-purple-500" />;
      case 'order.receipt.sent':
        return <HiMail className="w-5 h-5 text-blue-500" />;
      default:
        return <HiClock className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">היסטוריית הזמנה</h2>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">היסטוריית הזמנה</h2>
        
        {/* Add Note Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-2">
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="הוסף הערה..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addNote();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={addNote}
              disabled={addingNote || !newNote.trim()}
              size="sm"
            >
              {addingNote ? 'מוסיף...' : 'הוסף'}
            </Button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            אין אירועים להצגה
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id || index} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.event_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{event.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.created_at).toLocaleString('he-IL')}
                    {event.user_id && ' • על ידי משתמש'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

