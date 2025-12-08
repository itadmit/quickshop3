/**
 * Preview Updater - Client Component
 * מאזין לעדכונים בזמן אמת ומעדכן את הסקשנים
 */

'use client';

import { useEffect } from 'react';

export function PreviewUpdater() {
  useEffect(() => {
    // האזן לעדכונים מה-parent window
    function handleMessage(event: MessageEvent) {
      if (event.data.type === 'update-section-settings') {
        // עדכן את הסקשן הספציפי
        const { sectionId, settings } = event.data;
        
        // מצא את הסקשן ב-DOM ועדכן אותו
        const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (sectionElement) {
          // עדכן את ה-data attributes או classes לפי הצורך
          // זה יעבוד עם קומפוננטות שמגיבות ל-props changes
          sectionElement.setAttribute('data-settings-updated', Date.now().toString());
          
          // שלח אירוע custom שיפעיל רענון של הקומפוננטה
          window.dispatchEvent(new CustomEvent('section-settings-updated', {
            detail: { sectionId, settings }
          }));
        }
      }
      
      if (event.data.type === 'update-block-settings') {
        // עדכן את הבלוק הספציפי
        const { blockId, sectionId, settings } = event.data;
        
        console.log('PreviewUpdater: Received update-block-settings', { blockId, sectionId, settings });
        
        // מצא את הסקשן והבלוק
        const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (sectionElement) {
          console.log('PreviewUpdater: Found section element, dispatching event');
          // שלח אירוע custom לעדכון הבלוק
          window.dispatchEvent(new CustomEvent('block-settings-updated', {
            detail: { blockId, sectionId, settings }
          }));
          
          // רענון קל של הסקשן
          sectionElement.setAttribute('data-blocks-updated', Date.now().toString());
          
          // Force re-render של הקומפוננטה
          const updateEvent = new Event('blocks-updated');
          sectionElement.dispatchEvent(updateEvent);
        } else {
          console.warn('PreviewUpdater: Section element not found for sectionId:', sectionId);
        }
      }
      
      if (event.data.type === 'preview-ready') {
        // שלח הודעה חזרה שה-preview מוכן
        if (window.parent) {
          window.parent.postMessage({
            type: 'preview-loaded',
            ready: true,
          }, '*');
        }
      }

      if (event.data.type === 'refresh-preview-data') {
        // רענון הנתונים מה-DB - רענון עם timestamp כדי לכפות קריאה חדשה
        console.log('PreviewUpdater: Refreshing page data');
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('_refresh', Date.now().toString());
        window.location.href = currentUrl.toString();
      }
      
      if (event.data.type === 'highlight-section') {
        // הדגש את הסקשן הנבחר
        const { sectionId } = event.data;
        
        // הסר הדגשה קודמת
        document.querySelectorAll('[data-section-id]').forEach(el => {
          el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'border-blue-500');
        });
        
        // הדגש את הסקשן הנוכחי
        if (sectionId) {
          const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
          if (sectionElement) {
            sectionElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
      
      // הסרת MutationObserver - זה כבד מדי, ה-hover effects כבר מוגדרים ב-CSS
      
      if (event.data.type === 'section-click') {
        // שלח הודעה חזרה ל-parent על לחיצה על סקשן
        if (window.parent) {
          window.parent.postMessage({
            type: 'section-click',
            sectionId: event.data.sectionId,
          }, '*');
        }
      }
    }

    window.addEventListener('message', handleMessage);
    
    // שלח הודעה שה-preview מוכן
    if (window.parent) {
      window.parent.postMessage({
        type: 'preview-loaded',
        ready: true,
      }, '*');
    }
    
    // הוסף event listeners ללחיצות על סקשנים וכפתורי בקרה
    function handleSectionClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      
      // בדוק אם לחצו על כפתור בקרה
      const controlButton = target.closest('[data-action]');
      if (controlButton) {
        e.preventDefault();
        e.stopPropagation();
        
        const action = controlButton.getAttribute('data-action');
        const sectionElement = target.closest('[data-section-id]');
        if (sectionElement) {
          const sectionId = sectionElement.getAttribute('data-section-id');
          
          if (sectionId && window.parent) {
            window.parent.postMessage({
              type: 'section-action',
              sectionId,
              action, // 'settings', 'visibility', 'delete', 'drag'
            }, '*');
          }
        }
        return;
      }
      
      // אם לחצו על קישור בתוך סקשן, אל תפתח הגדרות
      if (target.closest('a') || target.closest('button[type="submit"]')) {
        return;
      }
      
      // לחיצה על סקשן פותחת הגדרות
      const sectionElement = target.closest('[data-section-id]');
      if (sectionElement) {
        e.preventDefault();
        e.stopPropagation();
        
        const sectionId = sectionElement.getAttribute('data-section-id');
        if (sectionId && window.parent) {
          window.parent.postMessage({
            type: 'section-click',
            sectionId,
          }, '*');
        }
      }
    }
    
    document.addEventListener('click', handleSectionClick, true); // useCapture = true כדי לתפוס את האירוע לפני שהוא מגיע לקישורים
    
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('click', handleSectionClick);
    };
  }, []);

  return null; // זה קומפוננטה בלתי נראית
}

