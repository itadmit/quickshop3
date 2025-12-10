import { query, queryOne } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { Client } from '@upstash/qstash';

/**
 * מנוע הרצת אוטומציות
 * מאזין לאירועים ומריץ אוטומציות רלוונטיות
 */

export interface AutomationTrigger {
  type: string; // Event type to listen to
  filters?: Record<string, any>; // Optional filters
}

export interface AutomationCondition {
  field: string; // Field path in event payload (e.g., "order.total", "customer.tier")
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR'; // For multiple conditions
  thenActions?: AutomationAction[]; // Actions to execute if condition is true
  elseActions?: AutomationAction[]; // Actions to execute if condition is false
}

export interface AutomationAction {
  type: string; // Action type
  config: Record<string, any>; // Action configuration
}

/**
 * בדיקת תנאים
 */
function evaluateCondition(
  condition: AutomationCondition,
  eventPayload: any
): boolean {
  const fieldValue = getNestedValue(eventPayload, condition.field);
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);
    case 'less_than':
      return Number(fieldValue) < Number(condition.value);
    case 'contains':
      return String(fieldValue).includes(String(condition.value));
    case 'not_contains':
      return !String(fieldValue).includes(String(condition.value));
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    default:
      return false;
  }
}

/**
 * בדיקת כל התנאים
 */
function evaluateConditions(
  conditions: AutomationCondition[],
  eventPayload: any
): boolean {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = always true
  }

  let result = evaluateCondition(conditions[0], eventPayload);
  
  for (let i = 1; i < conditions.length; i++) {
    const condition = conditions[i];
    const conditionResult = evaluateCondition(condition, eventPayload);
    
    if (condition.logicalOperator === 'OR') {
      result = result || conditionResult;
    } else {
      // Default to AND
      result = result && conditionResult;
    }
  }
  
  return result;
}

/**
 * קבלת ערך מקונן באובייקט
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * החלפת משתנים בתבנית
 */
function parseTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  
  // החלפת משתנים בפורמט {{variable}}
  const regex = /\{\{([^}]+)\}\}/g;
  result = result.replace(regex, (match, path) => {
    const value = getNestedValue(variables, path.trim());
    return value !== undefined && value !== null ? String(value) : match;
  });
  
  return result;
}

/**
 * הרצת אקשן
 */
async function executeAction(
  action: AutomationAction,
  eventPayload: any,
  storeId: number
): Promise<any> {
  const startTime = Date.now();
  
  try {
    switch (action.type) {
      case 'send_email':
        return await executeSendEmail(action, eventPayload, storeId);
      
      case 'add_order_note':
        return await executeAddOrderNote(action, eventPayload, storeId);
      
      case 'add_customer_note':
        return await executeAddCustomerNote(action, eventPayload, storeId);
      
      case 'add_product_tag':
        return await executeAddProductTag(action, eventPayload, storeId);
      
      case 'update_order_status':
        return await executeUpdateOrderStatus(action, eventPayload, storeId);
      
      case 'create_coupon':
        return await executeCreateCoupon(action, eventPayload, storeId);
      
      case 'webhook':
        return await executeWebhook(action, eventPayload, storeId);
      
      case 'delay':
        // Delay מחזיר signal מיוחד לתזמון
        return await executeDelay(action, eventPayload, storeId);
      
      case 'end':
        // סיום אוטומציה
        return { success: true, end: true };
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  } catch (error: any) {
    console.error(`Error executing action ${action.type}:`, error);
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    console.log(`Action ${action.type} executed in ${duration}ms`);
  }
}

/**
 * שליחת אימייל
 */
async function executeSendEmail(
  action: AutomationAction,
  eventPayload: any,
  storeId: number
): Promise<any> {
  const { to, subject, template, toType } = action.config;
  
  // קבלת כתובת אימייל מהאירוע
  let recipientEmail = to;
  
  // טיפול ב-toType
  if (toType === 'customer') {
    recipientEmail = getNestedValue(eventPayload, 'customer.email') || 
                     getNestedValue(eventPayload, 'order.email') ||
                     getNestedValue(eventPayload, 'email') ||
                     to;
  } else if (toType === 'admin') {
    const store = await queryOne<{ email: string }>(
      'SELECT email FROM stores WHERE id = $1',
      [storeId]
    );
    recipientEmail = store?.email || to;
  } else if (to?.startsWith('{{')) {
    const fieldPath = to.replace(/[{}]/g, '');
    recipientEmail = getNestedValue(eventPayload, fieldPath) || to;
  }
  
  if (!recipientEmail) {
    throw new Error('No recipient email address found');
  }
  
  // החלפת משתנים בתבנית
  const mergedVariables = {
    ...eventPayload,
    customer: eventPayload.customer || {},
    order: eventPayload.order || {},
    cart: eventPayload.cart || {},
    shop: eventPayload.shop || {},
    coupon: eventPayload.coupon || {},
  };
  
  const parsedBody = parseTemplate(template || '', mergedVariables);
  const parsedSubject = parseTemplate(subject || '', mergedVariables);
  
  await sendEmail({
    to: recipientEmail,
    subject: parsedSubject,
    html: parsedBody,
    storeId,
  });
  
  return { success: true, sentTo: recipientEmail };
}

/**
 * הוספת הערה להזמנה
 */
async function executeAddOrderNote(
  action: AutomationAction,
  eventPayload: any,
  storeId: number
): Promise<any> {
  const { note } = action.config;
  const orderId = getNestedValue(eventPayload, 'order.id') || 
                  getNestedValue(eventPayload, 'orderId');
  
  if (!orderId) {
    throw new Error('Order ID not found in event payload');
  }
  
  // החלפת משתנים בהערה
  const parsedNote = parseTemplate(note || '', eventPayload);
  
  // עדכון הערה בהזמנה
  await query(
    `UPDATE orders 
     SET note = COALESCE(note || E'\\n', '') || $1,
         updated_at = now()
     WHERE id = $2 AND store_id = $3`,
    [`[אוטומציה] ${parsedNote}`, orderId, storeId]
  );
  
  return { success: true, orderId, note: parsedNote };
}

/**
 * הוספת הערה ללקוח
 */
async function executeAddCustomerNote(
  action: AutomationAction,
  eventPayload: any,
  storeId: number
): Promise<any> {
  const { note } = action.config;
  const customerId = getNestedValue(eventPayload, 'customer.id') || 
                    getNestedValue(eventPayload, 'order.customer_id') ||
                    getNestedValue(eventPayload, 'customerId');
  
  if (!customerId) {
    throw new Error('Customer ID not found in event payload');
  }
  
  // החלפת משתנים בהערה
  const parsedNote = parseTemplate(note || '', eventPayload);
  
  // עדכון הערה בלקוח (אם יש שדה notes)
  // אם אין, נוסיף ל-note_attributes
  await query(
    `UPDATE customers 
     SET note_attributes = COALESCE(note_attributes, '{}'::jsonb) || 
         jsonb_build_object('automation_note_' || extract(epoch from now())::text, $1),
         updated_at = now()
     WHERE id = $2 AND store_id = $3`,
    [parsedNote, customerId, storeId]
  );
  
  return { success: true, customerId, note: parsedNote };
}

/**
 * הוספת תג למוצר
 */
async function executeAddProductTag(
  action: AutomationAction,
  eventPayload: any,
  storeId: number
): Promise<any> {
  const { tags } = action.config;
  const productId = getNestedValue(eventPayload, 'product.id') || 
                    getNestedValue(eventPayload, 'productId');
  
  if (!productId) {
    throw new Error('Product ID not found in event payload');
  }
  
  const tagsArray = Array.isArray(tags) ? tags : [tags];
  
  // עדכון תגים למוצר
  await query(
    `UPDATE products 
     SET tags = COALESCE(tags, ARRAY[]::text[]) || $1::text[],
         updated_at = now()
     WHERE id = $2 AND store_id = $3`,
    [tagsArray, productId, storeId]
  );
  
  return { success: true, productId, tags: tagsArray };
}

/**
 * עדכון סטטוס הזמנה
 */
async function executeUpdateOrderStatus(
  action: AutomationAction,
  eventPayload: any,
  storeId: number
): Promise<any> {
  const { status, statusType = 'fulfillment_status' } = action.config;
  const orderId = getNestedValue(eventPayload, 'order.id') || 
                  getNestedValue(eventPayload, 'orderId');
  
  if (!orderId) {
    throw new Error('Order ID not found in event payload');
  }
  
  // עדכון סטטוס
  if (statusType === 'financial_status') {
    await query(
      `UPDATE orders 
       SET financial_status = $1, updated_at = now()
       WHERE id = $2 AND store_id = $3`,
      [status, orderId, storeId]
    );
  } else {
    await query(
      `UPDATE orders 
       SET fulfillment_status = $1, updated_at = now()
       WHERE id = $2 AND store_id = $3`,
      [status, orderId, storeId]
    );
  }
  
  return { success: true, orderId, status, statusType };
}

/**
 * יצירת קופון
 */
async function executeCreateCoupon(
  action: AutomationAction,
  eventPayload: any,
  storeId: number
): Promise<any> {
  const {
    code,
    type = 'PERCENTAGE',
    value,
    minOrder,
    maxUses,
    usesPerCustomer = 1,
    startDate,
    endDate,
    uniquePerCustomer = false,
  } = action.config;
  
  // קבלת customerId מהאירוע
  const customerId = getNestedValue(eventPayload, 'customer.id') || 
                     getNestedValue(eventPayload, 'order.customer_id') ||
                     eventPayload.customerId;
  
  // יצירת קוד אוטומטי אם לא סופק
  let couponCode = code;
  if (!couponCode) {
    if (uniquePerCustomer && customerId) {
      couponCode = `AUTO-${customerId.toString().substring(0, 8)}-${Date.now().toString(36).toUpperCase()}`;
    } else {
      couponCode = `AUTO-${Date.now().toString(36).toUpperCase()}`;
    }
  }
  
  // המרת type לפורמט הנכון
  let discountType = 'percentage';
  if (type === 'PERCENTAGE' || type === 'percentage') {
    discountType = 'percentage';
  } else if (type === 'FIXED' || type === 'fixed_amount') {
    discountType = 'fixed_amount';
  } else if (type === 'FREE_SHIPPING' || type === 'free_shipping') {
    discountType = 'free_shipping';
  }
  
  // בדיקה אם קוד כבר קיים
  const existing = await queryOne<{ id: number }>(
    'SELECT id FROM discount_codes WHERE code = $1 AND store_id = $2',
    [couponCode, storeId]
  );
  
  if (existing) {
    couponCode = `${couponCode}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }
  
  // אם לא הוגדר maxUses, וזה קופון ייחודי, נגדיר אותו ל-1
  let finalMaxUses = maxUses;
  if (uniquePerCustomer) {
    finalMaxUses = 1;
  }
  
  // יצירת הקופון
  const coupon = await queryOne<{
    id: number;
    code: string;
    discount_type: string;
    value: number | null;
  }>(
    `INSERT INTO discount_codes (
      store_id, code, discount_type, value, 
      minimum_order_amount, usage_limit,
      starts_at, ends_at, is_active, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, now(), now())
    RETURNING id, code, discount_type, value`,
    [
      storeId,
      couponCode,
      discountType,
      discountType !== 'free_shipping' ? (value || 10) : null,
      minOrder || null,
      finalMaxUses || null,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
    ]
  );
  
  if (!coupon) {
    throw new Error('Failed to create coupon');
  }
  
  // הוספת הקופון ל-payload להמשך השימוש
  return {
    success: true,
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.discount_type,
    value: coupon.value,
  };
}

/**
 * שליחת Webhook
 */
async function executeWebhook(
  action: AutomationAction,
  eventPayload: any,
  storeId: number
): Promise<any> {
  const { url, method = 'POST', headers = {} } = action.config;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(eventPayload),
  });
  
  return {
    success: response.ok,
    statusCode: response.status,
    response: await response.text(),
  };
}

/**
 * המתנה (Delay) - Signal להפסיק ולתזמן המשך
 */
async function executeDelay(
  action: AutomationAction,
  eventPayload: any,
  storeId: number
): Promise<any> {
  const { amount, unit } = action.config;
  
  // Validation
  if (!amount || amount <= 0) {
    throw new Error('Delay amount must be greater than 0');
  }
  
  if (!unit) {
    throw new Error('Delay unit is required (seconds, minutes, hours, days, weeks)');
  }
  
  // המרת זמן למילישניות
  let delayMs = 0;
  switch (unit) {
    case 'seconds':
      delayMs = amount * 1000;
      break;
    case 'minutes':
      delayMs = amount * 60 * 1000;
      break;
    case 'hours':
      delayMs = amount * 60 * 60 * 1000;
      break;
    case 'days':
      delayMs = amount * 24 * 60 * 60 * 1000;
      break;
    case 'weeks':
      delayMs = amount * 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      throw new Error(`Invalid delay unit: ${unit}. Must be: seconds, minutes, hours, days, or weeks`);
  }
  
  console.log(`⏳ Scheduling delay: ${amount} ${unit} (${delayMs}ms)`);
  
  // מחזיר signal מיוחד שמפסיק את הביצוע הנוכחי
  return {
    success: true,
    shouldSchedule: true,
    delayMs,
    delayedFor: `${amount} ${unit}`,
  };
}

/**
 * הרצת אוטומציה לאירוע
 */
export async function runAutomationsForEvent(
  storeId: number,
  eventType: string,
  eventPayload: any
): Promise<void> {
  try {
    // מציאת כל האוטומציות הפעילות שמאזינות לאירוע הזה
    const automations = await query<{
      id: number;
      name: string;
      trigger_type: string;
      trigger_conditions: any;
      actions: any;
    }>(
      `SELECT id, name, trigger_type, trigger_conditions, actions
       FROM automations 
       WHERE store_id = $1 AND is_active = true AND trigger_type = $2`,
      [storeId, eventType]
    );
    
    // הרצת כל אוטומציה תואמת
    for (const automation of automations) {
      try {
        const startTime = Date.now();
        
        // פונקציה מקומית להרצת רשימת אקשנים
        const executeActions = async (
          actions: AutomationAction[], 
          payload: any,
          startFromIndex: number = 0
        ): Promise<{ results: any[]; shouldSchedule?: boolean; delayMs?: number; nextIndex?: number }> => {
          const actionResults = [];
          let accumulatedPayload = { ...payload };
          
          for (let i = startFromIndex; i < actions.length; i++) {
            const action = actions[i];
            
            try {
              const result = await executeAction(action, accumulatedPayload, storeId);
              actionResults.push({ action: action.type, success: true, result });
              
              // אם זו פעולת delay - עצור והחזר signal לתזמון
              if (action.type === 'delay' && result?.shouldSchedule) {
                console.log(`🛑 Stopping at delay. Will resume at action ${i + 1}`);
                return {
                  results: actionResults,
                  shouldSchedule: true,
                  delayMs: result.delayMs,
                  nextIndex: i + 1,
                };
              }
              
              // העברת תוצאות הפעולה לפעולות הבאות
              if (result) {
                // אם נוצר קופון, הוסף אותו ל-payload
                if (result.couponId && result.code) {
                  accumulatedPayload.coupon = {
                    id: result.couponId,
                    code: result.code,
                    type: result.type,
                    value: result.value,
                  };
                }
                // העברת כל התוצאות האחרות
                accumulatedPayload = {
                  ...accumulatedPayload,
                  ...result,
                };
              }
              
              // אם זו פעולת end, הפסק את ההרצה
              if (result?.end === true) {
                break;
              }
            } catch (error: any) {
              actionResults.push({
                action: action.type,
                success: false,
                error: error.message,
              });
              // גם במקרה של שגיאה, אם זו פעולת end, הפסק
              if (action.type === 'end') {
                break;
              }
            }
          }
          
          return { results: actionResults };
        };
        
        // בדיקת תנאים והרצת ענפים
        const conditions = automation.trigger_conditions as AutomationCondition[] | null;
        const actions = automation.actions as AutomationAction[];
        let actionResults: any[] = [];
        let accumulatedPayload = { ...eventPayload };
        
        // הרץ את ה-actions הראשיים (לפני התנאים)
        if (actions && actions.length > 0) {
          const startIndex = (eventPayload._resumeFromIndex as number) || 0;
          const executionResult = await executeActions(actions, accumulatedPayload, startIndex);
          actionResults.push(...executionResult.results);
          
          // אם צריך לתזמן המשך (נתקלנו ב-delay)
          if (executionResult.shouldSchedule && executionResult.delayMs && executionResult.nextIndex !== undefined) {
            console.log(`📅 Scheduling continuation in ${executionResult.delayMs}ms`);
            
            try {
              // שימוש ב-QStash לתזמון המשך האוטומציה
              const qstashToken = process.env.QSTASH_TOKEN;
              const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3099';
              
              if (qstashToken) {
                const qstash = new Client({
                  token: qstashToken,
                });

                // המרת delayMs לשניות (QStash משתמש בשניות)
                const delaySeconds = Math.ceil(executionResult.delayMs / 1000);
                
                // יצירת payload להמשך
                const resumePayload = {
                  automationId: automation.id,
                  storeId,
                  eventType,
                  eventPayload: {
                    ...accumulatedPayload,
                    _resumeFromIndex: executionResult.nextIndex,
                  },
                  resumeFromIndex: executionResult.nextIndex,
                };

                // שליחה ל-QStash עם delay
                await qstash.publishJSON({
                  url: `${appUrl}/api/automations/resume`,
                  body: resumePayload,
                  delay: delaySeconds, // QStash delay בשניות
                });

                console.log(`✅ Scheduled automation ${automation.id} to resume in ${delaySeconds} seconds`);
                
                // שמור log חלקי
                await query(
                  `INSERT INTO automation_runs (
                    automation_id, status, result, error_message, started_at
                  ) VALUES ($1, $2, $3, $4, now())`,
                  [
                    automation.id,
                    'scheduled',
                    JSON.stringify({
                      eventType,
                      eventPayload: {
                        ...eventPayload,
                        _note: `Paused at action ${executionResult.nextIndex - 1}, will resume in ${executionResult.delayMs}ms (${delaySeconds}s)`,
                      },
                      actionResults: executionResult.results,
                      scheduledResume: true,
                    }),
                    null,
                  ]
                );
              } else {
                // אם אין QStash, נשמור log חלקי בלבד
                console.warn('⚠️ QSTASH_TOKEN not found, cannot schedule automation delay');
                await query(
                  `INSERT INTO automation_runs (
                    automation_id, status, result, error_message, started_at
                  ) VALUES ($1, $2, $3, $4, now())`,
                  [
                    automation.id,
                    'scheduled',
                    JSON.stringify({
                      eventType,
                      eventPayload: {
                        ...eventPayload,
                        _note: `Paused at action ${executionResult.nextIndex - 1}, will resume in ${executionResult.delayMs}ms (QStash not configured)`,
                      },
                      actionResults: executionResult.results,
                      scheduledResume: false,
                      error: 'QSTASH_TOKEN not configured',
                    }),
                    'QSTASH_TOKEN not configured',
                  ]
                );
              }
            } catch (error: any) {
              console.error('Error scheduling automation delay:', error);
              // שמור log עם שגיאה
              await query(
                `INSERT INTO automation_runs (
                  automation_id, status, result, error_message, started_at
                ) VALUES ($1, $2, $3, $4, now())`,
                [
                  automation.id,
                  'failed',
                  JSON.stringify({
                    eventType,
                    eventPayload,
                    actionResults: executionResult.results,
                  }),
                  `Failed to schedule delay: ${error.message}`,
                ]
              );
            }
            
            // סיים את הביצוע הנוכחי
            continue;
          }
          
          // עדכן את ה-payload עם תוצאות ה-actions
          for (const result of executionResult.results) {
            if (result.result) {
              if (result.result.couponId && result.result.code) {
                accumulatedPayload.coupon = {
                  id: result.result.couponId,
                  code: result.result.code,
                  type: result.result.type,
                  value: result.result.value,
                };
              }
              accumulatedPayload = {
                ...accumulatedPayload,
                ...result.result,
              };
            }
          }
        }
        
        // אם יש תנאים עם ענפים
        if (conditions && conditions.length > 0) {
          const condition = conditions[0]; // נתמוך בתנאי אחד כרגע
          
          if (condition.thenActions || condition.elseActions) {
            // מבנה חדש עם ענפים
            const conditionMet = evaluateCondition(condition, accumulatedPayload);
            
            if (conditionMet && condition.thenActions) {
              // תנאי מתקיים - הרץ ענף "אז"
              const branchResults = await executeActions(condition.thenActions, accumulatedPayload);
              actionResults.push(...branchResults.results);
            } else if (!conditionMet && condition.elseActions) {
              // תנאי לא מתקיים - הרץ ענף "אחרת"
              const branchResults = await executeActions(condition.elseActions, accumulatedPayload);
              actionResults.push(...branchResults.results);
            } else {
              // אין אקשנים מתאימים - דילוג
              await query(
                `INSERT INTO automation_runs (
                  automation_id, status, result, started_at
                ) VALUES ($1, $2, $3, now())`,
                [
                  automation.id,
                  'skipped',
                  JSON.stringify({ eventType, eventPayload }),
                ]
              );
              continue;
            }
          } else {
            // מבנה ישן - תנאים ללא ענפים
            if (!evaluateConditions(conditions, accumulatedPayload)) {
              // תנאים לא מתקיימים - דילוג על האוטומציה
              await query(
                `INSERT INTO automation_runs (
                  automation_id, status, result, started_at
                ) VALUES ($1, $2, $3, now())`,
                [
                  automation.id,
                  'skipped',
                  JSON.stringify({ eventType, eventPayload }),
                ]
              );
              continue;
            }
          }
        }
        
        // עדכון סטטיסטיקות האוטומציה
        await query(
          `UPDATE automations 
           SET run_count = run_count + 1, 
               last_run_at = now(),
               updated_at = now()
           WHERE id = $1`,
          [automation.id]
        );
        
        // שמירת לוג
        await query(
          `INSERT INTO automation_runs (
            automation_id, status, result, error_message, started_at, completed_at
          ) VALUES ($1, $2, $3, $4, now(), now())`,
          [
            automation.id,
            actionResults.every((r: any) => r.success) ? 'completed' : 'failed',
            JSON.stringify({
              eventType,
              eventPayload,
              actionResults,
              durationMs: Date.now() - startTime,
            }),
            actionResults.some((r: any) => !r.success) 
              ? actionResults.find((r: any) => !r.success)?.error 
              : null,
          ]
        );
      } catch (error: any) {
        // שגיאה בהרצת אוטומציה
        await query(
          `INSERT INTO automation_runs (
            automation_id, status, result, error_message, started_at
          ) VALUES ($1, $2, $3, $4, now())`,
          [
            automation.id,
            'failed',
            JSON.stringify({ eventType, eventPayload }),
            error.message,
          ]
        );
        
        console.error(`Error running automation ${automation.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error running automations for event:', error);
  }
}

