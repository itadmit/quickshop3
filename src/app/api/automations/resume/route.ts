import { NextRequest, NextResponse } from 'next/server';
import { runAutomationsForEvent } from '@/lib/automations/automations';
import { queryOne } from '@/lib/db';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

/**
 * API endpoint להמשך אוטומציה אחרי delay
 * נקרא מ-QStash אחרי שהזמן עבר
 */
async function handler(request: NextRequest) {
  try {
    // QStash שולח את ה-request עם signature
    // אנחנו לא צריכים authentication רגיל כי זה מ-QStash
    const body = await request.json();
    const { automationId, storeId, eventType, eventPayload, resumeFromIndex } = body;

    if (!automationId || !storeId || !eventType || !eventPayload) {
      return NextResponse.json(
        { error: 'Missing required fields: automationId, storeId, eventType, eventPayload' },
        { status: 400 }
      );
    }

    // בדיקה שהאוטומציה עדיין קיימת ופעילה
    const automation = await queryOne<{
      id: number;
      is_active: boolean;
    }>(
      `SELECT id, is_active FROM automations WHERE id = $1 AND store_id = $2`,
      [automationId, storeId]
    );

    if (!automation) {
      console.warn(`[Automation Resume] Automation ${automationId} not found for store ${storeId}`);
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    if (!automation.is_active) {
      console.warn(`[Automation Resume] Automation ${automationId} is not active, skipping resume`);
      return NextResponse.json(
        { error: 'Automation is not active' },
        { status: 400 }
      );
    }
    
    console.log(`[Automation Resume] Resuming automation ${automationId} from index ${resumeFromIndex || 0}`);

    // הוספת ה-index להמשך
    const payloadWithResume = {
      ...eventPayload,
      _resumeFromIndex: resumeFromIndex || 0,
    };

    // המשך הרצת האוטומציה
    await runAutomationsForEvent(storeId, eventType, payloadWithResume);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resuming automation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resume automation' },
      { status: 500 }
    );
  }
}

// QStash signature verification (אם יש QSTASH_TOKEN ו-QSTASH_CURRENT_SIGNING_KEY)
// אם אין, מאפשר גישה ישירה (למקרה של בדיקות מקומיות)
const hasQStashConfig = process.env.QSTASH_TOKEN && process.env.QSTASH_CURRENT_SIGNING_KEY;

export const POST = hasQStashConfig
  ? verifySignatureAppRouter(handler)
  : handler;

