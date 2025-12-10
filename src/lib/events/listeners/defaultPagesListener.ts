/**
 * Default Pages Listener
 * יוצר עמודים ברירת מחדל לכל חנות חדשה
 * 
 * Listens to:
 * - store.created: יוצר עמודים ברירת מחדל כשנוצרת חנות חדשה
 */

import { eventBus } from '../eventBus';
import { createDefaultPages, createDefaultFooterMenu } from '@/lib/utils/default-pages';

// מאזין ל-store.created ויוצר עמודים ברירת מחדל
eventBus.on('store.created', async (event) => {
  try {
    const { store } = event.payload;
    
    if (!store || !store.id) {
      console.warn('[DefaultPagesListener] Store ID missing in store.created event');
      return;
    }

    const storeId = store.id;
    console.log(`[DefaultPagesListener] Creating default pages for store ${storeId}`);

    // יצירת עמודים ברירת מחדל
    await createDefaultPages(storeId);

    // יצירת תפריט footer ברירת מחדל עם העמודים
    await createDefaultFooterMenu(storeId);

    console.log(`[DefaultPagesListener] Successfully created default pages and footer menu for store ${storeId}`);
  } catch (error: any) {
    console.error('[DefaultPagesListener] Error creating default pages:', error);
    // Don't throw - this is a background operation, shouldn't break store creation
  }
});

