import { EventEmitter } from 'events';
import { query } from '@/lib/db';

export interface EventOptions {
  store_id: number;
  source?: string;
  user_id?: number;
}

export interface Event {
  topic: string;
  store_id: number;
  payload: any;
  source: string;
  user_id?: number;
  timestamp: Date;
}

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  async emitEvent(topic: string, payload: any, options?: EventOptions): Promise<void> {
    const event: Event = {
      topic,
      store_id: options?.store_id || 0,
      payload,
      source: options?.source || 'system',
      user_id: options?.user_id,
      timestamp: new Date(),
    };

    // שמירה ב-analytics_events (תמיד)
    try {
      await query(
        `INSERT INTO analytics_events (store_id, event_type, metadata)
         VALUES ($1, $2, $3)`,
        [event.store_id || null, topic, JSON.stringify(payload)]
      );
    } catch (error) {
      console.error('Error saving analytics event:', error);
      // Don't fail the event emission if DB save fails
    }

    // שמירה ב-system_logs
    try {
      await query(
        `INSERT INTO system_logs (store_id, level, source, message, context)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          event.store_id || null,
          'info',
          event.source,
          `Event emitted: ${topic}`,
          JSON.stringify({ topic, payload, user_id: event.user_id })
        ]
      );
    } catch (error) {
      console.error('Error saving system log:', error);
      // Don't fail the event emission if DB save fails
    }

    // שליחה לכל ה-listeners
    super.emit(topic, event);
    super.emit('*', event); // Wildcard listener
  }

  on(topic: string | '*', listener: (event: Event) => void): this {
    return super.on(topic, listener);
  }

  off(topic: string | '*', listener: (event: Event) => void): this {
    return super.off(topic, listener);
  }
}

export const eventBus = EventBus.getInstance();

