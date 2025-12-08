/**
 * Reset Customizer - מחיקת כל הסקשנים והבלוקים
 */

import { query } from '../src/lib/db';

async function resetCustomizer() {
  try {
    console.log('Resetting customizer data...');

    // מחיקת בלוקים קודם (foreign key constraint)
    await query('DELETE FROM section_blocks');
    console.log('✓ Deleted all section blocks');

    // מחיקת סקשנים
    await query('DELETE FROM page_sections');
    console.log('✓ Deleted all page sections');

    // מחיקת layouts
    await query('DELETE FROM page_layouts');
    console.log('✓ Deleted all page layouts');

    console.log('✅ Customizer reset completed! Page is now empty.');
  } catch (error) {
    console.error('❌ Error resetting customizer:', error);
    process.exit(1);
  }
}

resetCustomizer();
