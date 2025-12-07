/**
 * Customizer Module - Generate JSON Configuration
 * יצירת קובץ JSON להעלאה ל-Edge
 */

import { PageConfig } from './types';

/**
 * יצירת JSON configuration לקובץ Edge
 */
export function generateConfigJSON(config: PageConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * ולידציה של config לפני פרסום
 */
export function validateConfig(config: PageConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // בדיקות בסיסיות
  if (!config.page_type) {
    errors.push('Page type is required');
  }

  if (!config.sections || Object.keys(config.sections).length === 0) {
    errors.push('At least one section is required');
  }

  if (!config.section_order || config.section_order.length === 0) {
    errors.push('Section order is required');
  }

  // בדיקה שכל section ב-section_order קיים ב-sections
  for (const sectionId of config.section_order) {
    if (!config.sections[sectionId]) {
      errors.push(`Section ${sectionId} is in order but not found in sections`);
    }
  }

  // בדיקה שכל section ב-sections נמצא ב-section_order
  for (const sectionId of Object.keys(config.sections)) {
    if (!config.section_order.includes(sectionId)) {
      errors.push(`Section ${sectionId} exists but not in section order`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

