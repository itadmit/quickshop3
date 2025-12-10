'use client';

import { useEffect } from 'react';

/**
 * ScriptInjector Component
 * מזריק את כל התוספים מסוג SCRIPT ל-storefront
 * 
 * שימוש: להוסיף ל-storefront layout
 * <ScriptInjector />
 */
export function ScriptInjector() {
  useEffect(() => {
    // טעינת תוספים פעילים (storeId נקבע ב-API לפי המשתמש המחובר)
    fetch('/api/plugins/active', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const plugins = data.plugins || [];
        const scriptPlugins = plugins.filter((p: any) => p.type === 'SCRIPT' && p.is_active);

        scriptPlugins.forEach((plugin: any) => {
          injectScript(plugin);
        });
      })
      .catch((error) => {
        console.error('Error loading plugins:', error);
      });
  }, []);

  return null;
}

/**
 * הזרקת סקריפט תוסף
 */
function injectScript(plugin: any) {
  // בדיקה אם הסקריפט כבר הוזרק
  const existingScript = document.querySelector(`[data-plugin-id="${plugin.slug}"]`);
  if (existingScript) {
    return;
  }

  if (plugin.script_url) {
    // טעינת סקריפט חיצוני
    const script = document.createElement('script');
    script.src = plugin.script_url;
    script.async = true;
    script.setAttribute('data-plugin-id', plugin.slug);

    // הוספה למיקום הנכון
    const location = plugin.inject_location || 'BODY_END';
    if (location === 'HEAD') {
      document.head.appendChild(script);
    } else if (location === 'BODY_START') {
      document.body.insertBefore(script, document.body.firstChild);
    } else {
      document.body.appendChild(script);
    }
  } else if (plugin.script_content) {
    // הרצת סקריפט ישיר עם החלפת placeholders
    let scriptContent = plugin.script_content;
    
    // החלפת placeholders בהגדרות התוסף
    if (plugin.config) {
      Object.keys(plugin.config).forEach((key) => {
        const value = plugin.config[key];
        scriptContent = scriptContent.replace(
          new RegExp(`{{${key.toUpperCase()}}}`, 'g'),
          value || ''
        );
      });
    }

    // יצירת script element והרצה
    const script = document.createElement('script');
    script.textContent = scriptContent;
    script.setAttribute('data-plugin-id', plugin.slug);

    const location = plugin.inject_location || 'BODY_END';
    if (location === 'HEAD') {
      document.head.appendChild(script);
    } else if (location === 'BODY_START') {
      document.body.insertBefore(script, document.body.firstChild);
    } else {
      document.body.appendChild(script);
    }
  }
}

