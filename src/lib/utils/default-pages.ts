/**
 * Default Pages Utility
 * יוצר עמודים ברירת מחדל לכל חנות חדשה
 */

import { query } from '@/lib/db';

interface DefaultPage {
  handle: string;
  title: string;
  body_html: string;
}

const DEFAULT_PAGES: DefaultPage[] = [
  {
    handle: 'about',
    title: 'אודותינו',
    body_html: `
      <h2>הסיפור שלנו</h2>
      <p>החנות שלנו נוסדה מתוך אמונה עמוקה באיכות, שירות לקוחות מעולה וחווית קנייה יוצאת דופן. אנחנו מתמחים במציאת המוצרים הטובים ביותר עבור הלקוחות שלנו ומתחייבים לספק חוויה מעולה משלב הגלישה ועד לקבלת המוצר.</p>
      
      <h2>המשימה שלנו</h2>
      <p>המשימה שלנו היא לספק לכם את החוויה הטובה ביותר בקנייה אונליין. אנחנו מאמינים שכל לקוח ראוי לשירות אישי, מוצרים איכותיים ומחירים הוגנים.</p>
      
      <h2>הערכים שלנו</h2>
      <ul>
        <li>איכות - אנחנו בוחרים בקפידה כל מוצר שאנחנו מציעים</li>
        <li>שירות לקוחות - הלקוח תמיד במרכז</li>
        <li>שקיפות - אנחנו גלויים ומדויקים בכל מה שאנחנו עושים</li>
        <li>אמינות - אפשר לסמוך עלינו בכל שלב</li>
      </ul>
      
      <h2>צרו קשר</h2>
      <p>נשמח לשמוע מכם! אם יש לכם שאלות, הערות או הצעות, אנא צרו איתנו קשר דרך דף יצירת קשר או במייל. הצוות שלנו זמין לעזור לכם בכל עת.</p>
    `,
  },
  {
    handle: 'returns-policy',
    title: 'מדיניות החזרות',
    body_html: `
      <h2>זמן החזרה</h2>
      <p>ניתן להחזיר מוצרים תוך 14 ימים ממועד הרכישה, בתנאי שהמוצר לא נפתח, לא שימש ולא נפגע.</p>
      
      <h2>תנאי החזרה</h2>
      <p>המוצר חייב להיות במצב המקורי שלו, עם כל התוויות והאריזות המקוריות. מוצרים מותאמים אישית או מוצרים שעברו שימוש לא ניתן להחזיר.</p>
      
      <h2>תהליך החזרה</h2>
      <p>כדי להתחיל תהליך החזרה, אנא צרו איתנו קשר דרך דף יצירת קשר או במייל. נספק לכם הוראות משלוח מפורטות.</p>
      
      <h2>החזר כספי</h2>
      <p>לאחר שנקבל את המוצר ונבדוק אותו, נעבד את ההחזר הכספי תוך 5-7 ימי עסקים. ההחזר יועבר לאותו אמצעי תשלום שבו בוצעה הרכישה המקורית.</p>
      
      <h2>עלויות משלוח</h2>
      <p>עלויות המשלוח להחזרה הן באחריות הלקוח, אלא אם המוצר פגום או נשלח בטעות. במקרים אלה, אנו נכסה את עלויות המשלוח.</p>
    `,
  },
  {
    handle: 'privacy',
    title: 'מדיניות פרטיות',
    body_html: `
      <p>אנו מחויבים להגנה על הפרטיות שלך. מדיניות הפרטיות הזו מסבירה איך אנחנו אוספים, משתמשים ומגנים על המידע האישי שלך בעת השימוש באתר שלנו.</p>
      
      <h2>איזה מידע אנחנו אוספים</h2>
      <p>אנחנו אוספים מידע שאתה מספק לנו ישירות בעת הרשמה, רכישה או יצירת קשר. זה כולל שם, כתובת אימייל, כתובת משלוח, פרטי תשלום ומידע אחר שאתה בוחר לשתף.</p>
      
      <h2>איך אנחנו משתמשים במידע</h2>
      <p>המידע שאתה מספק לנו משמש למטרות הבאות:</p>
      <ul>
        <li>עיבוד והשלמת הזמנות</li>
        <li>שיפור השירות והחוויה שלך</li>
        <li>שליחת עדכונים על ההזמנות שלך</li>
        <li>תקשורת עם לקוחות</li>
        <li>שיפור האתר והמוצרים שלנו</li>
      </ul>
      
      <h2>שיתוף מידע</h2>
      <p>אנו לא נמכור או נשתף את המידע האישי שלך עם צדדים שלישיים ללא הסכמתך המפורשת, למעט מקרים בהם זה נדרש על פי חוק או לצורך השלמת ההזמנה שלך (כמו שירותי משלוח).</p>
      
      <h2>אבטחת מידע</h2>
      <p>אנחנו משתמשים באמצעי אבטחה מתקדמים כדי להגן על המידע האישי שלך. עם זאת, אין שיטה של העברה באינטרנט או אחסון אלקטרוני שהיא מאה אחוז מאובטחת.</p>
      
      <h2>זכויותיך</h2>
      <p>יש לך זכות לגשת למידע האישי שלך, לעדכן אותו או למחוק אותו. אם יש לך שאלות או בקשות לגבי המידע האישי שלך, אנא צרו איתנו קשר.</p>
      
      <h2>שינויים במדיניות</h2>
      <p>אנחנו עשויים לעדכן את מדיניות הפרטיות הזו מעת לעת. כל שינוי יפורסם בדף זה עם תאריך העדכון האחרון.</p>
      
      <h2>יצירת קשר</h2>
      <p>אם יש לך שאלות לגבי מדיניות הפרטיות הזו, אנא צרו איתנו קשר דרך דף יצירת קשר או במייל.</p>
    `,
  },
  {
    handle: 'terms',
    title: 'תנאי שימוש',
    body_html: `
      <p>על ידי שימוש באתר זה, אתה מסכים לתנאי השימוש שלנו. אנא קרא את התנאים בעיון לפני שימוש באתר או ביצוע רכישה.</p>
      
      <h2>שימוש באתר</h2>
      <p>אתה מתחייב להשתמש באתר רק למטרות חוקיות ולכבד את כל החוקים והתקנות החלים. אסור להשתמש באתר בדרכים שעלולות לפגוע, להשבית או להפריע לאתר או לשירותים אחרים.</p>
      
      <h2>תנאי רכישה</h2>
      <p>כל הרכישות כפופות לתנאי המכירה שלנו. בעת ביצוע הזמנה, אתה מאשר שאתה מעל גיל 18 ויש לך סמכות חוקית לבצע את הרכישה.</p>
      
      <h2>מחירים ותשלום</h2>
      <p>כל המחירים באתר מצוינים בשקלים חדשים (ILS) וכוללים מע"מ כנדרש על פי החוק. אנחנו שומרים לעצמנו את הזכות לשנות מחירים בכל עת, אך מחירים שכבר שולמו לא ישתנו.</p>
      
      <h2>קניין רוחני</h2>
      <p>כל התוכן באתר, כולל טקסטים, תמונות, לוגו ועיצוב, הוא קניין רוחני שלנו או של בעלי הזכויות. אסור להעתיק, לשכפל או להשתמש בתוכן ללא רשות מפורשת בכתב.</p>
      
      <h2>הגבלת אחריות</h2>
      <p>האתר מסופק "כפי שהוא" ללא כל אחריות, מפורשת או משתמעת. אנחנו לא מתחייבים שהאתר יהיה זמין ללא הפרעות או שגיאות.</p>
      
      <h2>שינויים בתנאים</h2>
      <p>אנחנו שומרים לעצמנו את הזכות לעדכן את תנאי השימוש בכל עת. שינויים יכנסו לתוקף מייד עם פרסומם באתר. המשך השימוש באתר לאחר שינויים מהווה הסכמה לתנאים החדשים.</p>
      
      <h2>דין שולט</h2>
      <p>תנאי השימוש האלה כפופים לחוקי מדינת ישראל. כל סכסוך ייפתר בבתי המשפט המוסמכים בישראל.</p>
      
      <h2>יצירת קשר</h2>
      <p>אם יש לך שאלות לגבי תנאי השימוש, אנא צרו איתנו קשר דרך דף יצירת קשר או במייל.</p>
    `,
  },
  {
    handle: 'accessibility',
    title: 'מדיניות הנגשה',
    body_html: `
      <p>אנו מחויבים להבטיח שהאתר שלנו נגיש ונוח לשימוש עבור כל המשתמשים, כולל אנשים עם מוגבלויות.</p>
      
      <h2>סטנדרטי נגישות</h2>
      <p>האתר שלנו נבנה בהתאם לתקן WCAG 2.1 ברמה AA, המהווה את התקן הבינלאומי לנגישות אתרים.</p>
      
      <h2>תכונות נגישות</h2>
      <ul>
        <li>ניווט מקלדת מלא - ניתן לנווט באתר באמצעות מקלדת בלבד</li>
        <li>תמיכה בקוראי מסך - האתר תואם לקוראי מסך נפוצים</li>
        <li>ניגודיות צבעים - שימוש בצבעים עם ניגודיות מספקת לקריאה</li>
        <li>טקסט חלופי - כל התמונות כוללות טקסט חלופי תיאורי</li>
        <li>גודל טקסט - ניתן להגדיל את הטקסט בדפדפן לפי הצורך</li>
      </ul>
      
      <h2>שיפורים מתמשכים</h2>
      <p>אנו ממשיכים לעבוד על שיפור הנגישות של האתר שלנו. אם נתקלתם בבעיה נגישות או יש לכם הצעות לשיפור, נשמח לשמוע מכם.</p>
      
      <h2>יצירת קשר</h2>
      <p>אם יש לכם שאלות או הערות לגבי נגישות האתר, אנא צרו איתנו קשר דרך דף יצירת קשר או במייל. נשמח לעזור ולשפר את החוויה שלכם באתר.</p>
    `,
  },
];

/**
 * יוצר עמודים ברירת מחדל עבור חנות
 */
export async function createDefaultPages(storeId: number): Promise<void> {
  try {
    for (const pageData of DEFAULT_PAGES) {
      // בדיקה אם העמוד כבר קיים
      const existing = await query(
        'SELECT id FROM pages WHERE store_id = $1 AND handle = $2',
        [storeId, pageData.handle]
      );

      // אם העמוד לא קיים, יוצר אותו
      if (existing.length === 0) {
        await query(
          `INSERT INTO pages (
            store_id, 
            title, 
            handle, 
            body_html, 
            is_published, 
            published_at, 
            created_at, 
            updated_at
          ) VALUES ($1, $2, $3, $4, true, now(), now(), now())`,
          [
            storeId,
            pageData.title,
            pageData.handle,
            pageData.body_html.trim(),
          ]
        );
      }
    }
  } catch (error) {
    console.error('Error creating default pages:', error);
    // לא נזרוק שגיאה כדי לא לעצור את תהליך ההרשמה
    // אבל נרשום ללוג
  }
}

/**
 * יוצר תפריט ברירת מחדל עבור הפוטר עם העמודים החדשים
 */
export async function createDefaultFooterMenu(storeId: number): Promise<void> {
  try {
    // בדיקה אם תפריט footer כבר קיים
    const existingMenu = await query(
      'SELECT id FROM navigation_menus WHERE store_id = $1 AND position = $2',
      [storeId, 'footer']
    );

    if (existingMenu.length > 0) {
      // תפריט כבר קיים, לא יוצרים חדש
      return;
    }

    // יצירת תפריט footer
    const menu = await query(
      `INSERT INTO navigation_menus (store_id, name, handle, position, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       RETURNING id`,
      [storeId, 'תפריט תחתון', 'footer-menu', 'footer']
    );

    if (menu.length === 0) {
      return;
    }

    const menuId = menu[0].id;

    // יצירת פריטי תפריט - עמודים ברירת מחדל
    const menuItems = [
      { label: 'אודותינו', url: '/about', position: 0 },
      { label: 'מדיניות החזרות', url: '/returns-policy', position: 1 },
      { label: 'מדיניות פרטיות', url: '/privacy', position: 2 },
      { label: 'תנאי שימוש', url: '/terms', position: 3 },
      { label: 'מדיניות הנגשה', url: '/accessibility', position: 4 },
    ];

    for (const item of menuItems) {
      await query(
        `INSERT INTO navigation_menu_items (menu_id, label, url, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())`,
        [menuId, item.label, item.url, item.position]
      );
    }
  } catch (error) {
    console.error('Error creating default footer menu:', error);
    // לא נזרוק שגיאה כדי לא לעצור את תהליך ההרשמה
  }
}

/**
 * יוצר תפריט ברירת מחדל עבור פוטר הצ'ק אאוט
 */
export async function createDefaultCheckoutFooterMenu(storeId: number): Promise<void> {
  try {
    // בדיקה אם תפריט checkout-footer כבר קיים
    const existingMenu = await query(
      'SELECT id FROM navigation_menus WHERE store_id = $1 AND handle = $2',
      [storeId, 'checkout-footer']
    );

    if (existingMenu.length > 0) {
      // תפריט כבר קיים, לא יוצרים חדש
      return;
    }

    // יצירת תפריט checkout-footer
    const menu = await query(
      `INSERT INTO navigation_menus (store_id, name, handle, position, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       RETURNING id`,
      [storeId, 'תפריט צ\'ק אאוט', 'checkout-footer', 'checkout']
    );

    if (menu.length === 0) {
      return;
    }

    const menuId = menu[0].id;

    // יצירת פריטי תפריט - קישורים לעמודי מדיניות
    const menuItems = [
      { title: 'תקנון', type: 'page', resource_handle: 'terms', position: 1 },
      { title: 'מדיניות פרטיות', type: 'page', resource_handle: 'privacy', position: 2 },
      { title: 'החזרות והחלפות', type: 'page', resource_handle: 'returns-policy', position: 3 },
      { title: 'הצהרת נגישות', type: 'page', resource_handle: 'accessibility', position: 4 },
    ];

    for (const item of menuItems) {
      await query(
        `INSERT INTO navigation_menu_items (menu_id, title, type, resource_handle, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, now(), now())`,
        [menuId, item.title, item.type, item.resource_handle, item.position]
      );
    }
  } catch (error) {
    console.error('Error creating default checkout footer menu:', error);
    // לא נזרוק שגיאה כדי לא לעצור את תהליך ההרשמה
  }
}

