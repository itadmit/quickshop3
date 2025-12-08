/**
 * Script לעדכון variant titles מ-option1/option2/option3
 * מעדכן את כל ה-variants שיש להם options אבל ה-title שלהם הוא "Default Title"
 */

import { query } from '../src/lib/db';

async function fixVariantTitles() {
  try {
    console.log('מתחיל עדכון variant titles...');

    // מצא את כל ה-variants שיש להם options אבל title הוא "Default Title"
    const variantsToUpdate = await query<{
      id: number;
      option1: string | null;
      option2: string | null;
      option3: string | null;
      title: string;
    }>(
      `SELECT id, option1, option2, option3, title
       FROM product_variants
       WHERE title = 'Default Title'
       AND (option1 IS NOT NULL OR option2 IS NOT NULL OR option3 IS NOT NULL)`
    );

    console.log(`נמצאו ${variantsToUpdate.length} variants לעדכון`);

    let updated = 0;
    for (const variant of variantsToUpdate) {
      const options = [variant.option1, variant.option2, variant.option3].filter(Boolean) as string[];
      
      if (options.length > 0) {
        const newTitle = options.join(' / ');
        
        await query(
          `UPDATE product_variants 
           SET title = $1, updated_at = now()
           WHERE id = $2`,
          [newTitle, variant.id]
        );
        
        updated++;
        console.log(`עודכן variant ${variant.id}: "${newTitle}"`);
      }
    }

    console.log(`\n✅ הושלם! עודכנו ${updated} variants`);
  } catch (error) {
    console.error('שגיאה בעדכון variant titles:', error);
    process.exit(1);
  }
}

// הרץ את ה-script
fixVariantTitles()
  .then(() => {
    console.log('הסקריפט הושלם בהצלחה');
    process.exit(0);
  })
  .catch((error) => {
    console.error('שגיאה:', error);
    process.exit(1);
  });

