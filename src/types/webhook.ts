// Webhook Types based on schema.sql

export interface WebhookSubscription {
  id: number;
  store_id: number;
  topic: string; // orders/create, products/update, etc.
  address: string; // Callback URL
  format: 'json' | 'xml';
  fields: string[] | null;
  metafield_namespaces: string[] | null;
  api_version: string;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookEvent {
  id: number;
  store_id: number;
  subscription_id: number;
  topic: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookDeliveryAttempt {
  id: number;
  webhook_event_id: number;
  attempt_number: number;
  status: 'success' | 'failed';
  http_status: number | null;
  response_time_ms: number | null;
  response_body: string | null;
  error_message: string | null;
  created_at: Date;
}

// API Request/Response types
export interface CreateWebhookSubscriptionRequest {
  topic: string;
  address: string;
  format?: 'json' | 'xml';
  fields?: string[];
  metafield_namespaces?: string[];
  api_version?: string;
}

