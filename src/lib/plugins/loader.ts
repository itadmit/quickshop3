// Plugin Loader - טעינה והרצה של תוספים

import { query, queryOne } from '@/lib/db';
import { Plugin, PluginHook } from '@/types/plugin';
import { getPluginBySlug } from './registry';

/**
 * טעינת כל התוספים הפעילים לחנות
 */
export async function loadActivePlugins(storeId: number): Promise<Plugin[]> {
  try {
    const plugins = await query<Plugin>(
      `SELECT * FROM plugins 
       WHERE (store_id = $1 OR store_id IS NULL)
       AND is_installed = true 
       AND is_active = true
       ORDER BY display_order ASC`,
      [storeId]
    );

    return plugins;
  } catch (error) {
    console.error('Error loading active plugins:', error);
    return [];
  }
}

/**
 * טעינת תוסף ספציפי לפי slug
 */
export async function loadPluginBySlug(
  storeId: number,
  slug: string
): Promise<Plugin | null> {
  try {
    const plugin = await queryOne<Plugin>(
      `SELECT * FROM plugins 
       WHERE slug = $1 
       AND (store_id = $1 OR store_id IS NULL)
       AND is_installed = true`,
      [slug, storeId]
    );

    return plugin || null;
  } catch (error) {
    console.error(`Error loading plugin ${slug}:`, error);
    return null;
  }
}

/**
 * הרצת hook של תוסף Core
 */
export async function executePluginHook(
  hookName: keyof PluginHook,
  storeId: number,
  ...args: any[]
): Promise<void> {
  try {
    const plugins = await loadActivePlugins(storeId);
    const corePlugins = plugins.filter(p => p.type === 'CORE');

    for (const plugin of corePlugins) {
      try {
        // טעינת התוסף
        const pluginModule = await loadPluginModule(plugin.slug);
        if (!pluginModule || !pluginModule[hookName]) {
          continue;
        }

        // הרצת ה-hook
        await pluginModule[hookName](...args, storeId);
      } catch (error) {
        console.error(`Error executing hook ${hookName} for plugin ${plugin.slug}:`, error);
        // ממשיכים לתוספים הבאים גם אם אחד נכשל
      }
    }
  } catch (error) {
    console.error(`Error executing plugin hook ${hookName}:`, error);
  }
}

/**
 * טעינת מודול תוסף Core
 */
async function loadPluginModule(slug: string): Promise<PluginHook | null> {
  try {
    // Dynamic import של התוסף
    switch (slug) {
      case 'premium-club':
        const premiumClub = await import('./core/premium-club');
        return premiumClub.PremiumClubPlugin;
      
      case 'bundle-products':
        // TODO: יישום בעתיד
        return null;
      
      case 'cash-on-delivery':
        // TODO: יישום בעתיד
        return null;
      
      case 'saturday-shutdown':
        // TODO: יישום בעתיד
        return null;
      
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error loading plugin module ${slug}:`, error);
    return null;
  }
}

/**
 * בדיקה אם תוסף מותקן ופעיל
 */
export async function isPluginActive(
  storeId: number,
  pluginSlug: string
): Promise<boolean> {
  try {
    const plugin = await queryOne<{ is_active: boolean; is_installed: boolean }>(
      `SELECT is_active, is_installed FROM plugins 
       WHERE slug = $1 
       AND (store_id = $2 OR store_id IS NULL)
       AND is_installed = true`,
      [pluginSlug, storeId]
    );

    return plugin?.is_active === true && plugin?.is_installed === true;
  } catch (error) {
    console.error(`Error checking plugin ${pluginSlug}:`, error);
    return false;
  }
}

/**
 * קבלת הגדרות תוסף
 */
export async function getPluginConfig(
  storeId: number,
  pluginSlug: string
): Promise<any | null> {
  try {
    const plugin = await queryOne<{ config: any }>(
      `SELECT config FROM plugins 
       WHERE slug = $1 
       AND (store_id = $2 OR store_id IS NULL)`,
      [pluginSlug, storeId]
    );

    return plugin?.config || null;
  } catch (error) {
    console.error(`Error getting plugin config ${pluginSlug}:`, error);
    return null;
  }
}

/**
 * עדכון הגדרות תוסף
 */
export async function updatePluginConfig(
  storeId: number,
  pluginSlug: string,
  config: any
): Promise<boolean> {
  try {
    await query(
      `UPDATE plugins 
       SET config = $1::jsonb, updated_at = now()
       WHERE slug = $2 
       AND (store_id = $3 OR store_id IS NULL)`,
      [JSON.stringify(config), pluginSlug, storeId]
    );

    return true;
  } catch (error) {
    console.error(`Error updating plugin config ${pluginSlug}:`, error);
    return false;
  }
}



