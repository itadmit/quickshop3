/**
 * Demo Data Seed
 * יוצר נתוני דמו מלאים למערכת
 * כל הנתונים נוצרים כאילו הוזנו ידנית מהדשבורד
 */

export const demoData = {
  // Products Collections
  collections: [
    {
      title: 'בגדים',
      handle: 'clothing',
      description: 'אוסף בגדים אופנתיים',
      published_scope: 'web',
      sort_order: 'manual',
    },
    {
      title: 'נעליים',
      handle: 'shoes',
      description: 'נעליים לכל העונות',
      published_scope: 'web',
      sort_order: 'manual',
    },
    {
      title: 'אקססוריז',
      handle: 'accessories',
      description: 'תכשיטים ואקססוריז',
      published_scope: 'web',
      sort_order: 'manual',
    },
  ],

  // Product Tags
  tags: [
    'חדש',
    'פופולרי',
    'מבצע',
    'VIP',
    'חורף',
    'קיץ',
    'אופנה',
    'קלאסי',
  ],

  // Products
  products: [
    {
      title: 'חולצת טי שירט כותנה',
      handle: 'cotton-t-shirt',
      body_html: '<p>חולצת טי שירט נוחה מבד כותנה איכותי. מתאימה לכל יום.</p>',
      vendor: 'אופנה ישראל',
      product_type: 'בגדים',
      status: 'active',
      published_scope: 'web',
      price: 89.90,
      compare_at_price: 129.90,
      cost_per_item: 45.00,
      taxable: true,
      track_inventory: true,
      inventory_quantity: 50,
      low_stock_alert: 10,
      weight: 0.2,
      length: 30,
      width: 25,
      height: 5,
      sku: 'TSHIRT-001',
      seo_title: 'חולצת טי שירט כותנה - אופנה ישראל',
      seo_description: 'חולצת טי שירט נוחה מבד כותנה איכותי. זמין בגדלים שונים.',
      tags: ['חדש', 'פופולרי', 'קיץ'],
      collections: ['clothing'],
      images: [
        {
          src: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          alt: 'חולצת טי שירט',
          position: 1,
        },
      ],
      options: [
        {
          name: 'מידה',
          position: 1,
          values: [
            { value: 'S', position: 1 },
            { value: 'M', position: 2 },
            { value: 'L', position: 3 },
            { value: 'XL', position: 4 },
          ],
        },
        {
          name: 'צבע',
          position: 2,
          values: [
            { value: 'לבן', position: 1 },
            { value: 'שחור', position: 2 },
            { value: 'כחול', position: 3 },
          ],
        },
      ],
      variants: [
        { option1: 'S', option2: 'לבן', price: 89.90, inventory_quantity: 15, sku: 'TSHIRT-001-S-WHITE' },
        { option1: 'M', option2: 'לבן', price: 89.90, inventory_quantity: 20, sku: 'TSHIRT-001-M-WHITE' },
        { option1: 'L', option2: 'לבן', price: 89.90, inventory_quantity: 10, sku: 'TSHIRT-001-L-WHITE' },
        { option1: 'S', option2: 'שחור', price: 89.90, inventory_quantity: 12, sku: 'TSHIRT-001-S-BLACK' },
        { option1: 'M', option2: 'שחור', price: 89.90, inventory_quantity: 18, sku: 'TSHIRT-001-M-BLACK' },
      ],
    },
    {
      title: 'נעלי ספורט נוחות',
      handle: 'sports-shoes',
      body_html: '<p>נעלי ספורט איכותיות לפעילות גופנית יומיומית.</p>',
      vendor: 'ספורט בע"מ',
      product_type: 'נעליים',
      status: 'active',
      published_scope: 'web',
      price: 299.90,
      compare_at_price: 399.90,
      cost_per_item: 150.00,
      taxable: true,
      track_inventory: true,
      inventory_quantity: 30,
      low_stock_alert: 5,
      weight: 0.8,
      length: 32,
      width: 12,
      height: 12,
      sku: 'SHOES-001',
      seo_title: 'נעלי ספורט נוחות - ספורט בע"מ',
      seo_description: 'נעלי ספורט איכותיות לפעילות גופנית. זמין בגדלים 38-45.',
      tags: ['פופולרי', 'חורף'],
      collections: ['shoes'],
      images: [
        {
          src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
          alt: 'נעלי ספורט',
          position: 1,
        },
      ],
      options: [
        {
          name: 'מידה',
          position: 1,
          values: [
            { value: '38', position: 1 },
            { value: '40', position: 2 },
            { value: '42', position: 3 },
            { value: '44', position: 4 },
            { value: '45', position: 5 },
          ],
        },
      ],
      variants: [
        { option1: '38', price: 299.90, inventory_quantity: 5, sku: 'SHOES-001-38' },
        { option1: '40', price: 299.90, inventory_quantity: 8, sku: 'SHOES-001-40' },
        { option1: '42', price: 299.90, inventory_quantity: 10, sku: 'SHOES-001-42' },
        { option1: '44', price: 299.90, inventory_quantity: 5, sku: 'SHOES-001-44' },
        { option1: '45', price: 299.90, inventory_quantity: 2, sku: 'SHOES-001-45' },
      ],
    },
    {
      title: 'תיק גב איכותי',
      handle: 'backpack-quality',
      body_html: '<p>תיק גב מרווח ואיכותי לטיולים ולעבודה.</p>',
      vendor: 'אקססוריז פלוס',
      product_type: 'אקססוריז',
      status: 'active',
      published_scope: 'web',
      price: 199.90,
      compare_at_price: 249.90,
      cost_per_item: 100.00,
      taxable: true,
      track_inventory: true,
      inventory_quantity: 25,
      low_stock_alert: 5,
      weight: 0.5,
      length: 40,
      width: 30,
      height: 15,
      sku: 'BAG-001',
      seo_title: 'תיק גב איכותי - אקססוריז פלוס',
      seo_description: 'תיק גב מרווח ואיכותי. מתאים לטיולים ולעבודה.',
      tags: ['חדש', 'אופנה'],
      collections: ['accessories'],
      images: [
        {
          src: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
          alt: 'תיק גב',
          position: 1,
        },
      ],
    },
  ],

  // Customers
  customers: [
    {
      email: 'david.cohen@example.com',
      first_name: 'דוד',
      last_name: 'כהן',
      phone: '050-1234567',
      accepts_marketing: true,
      state: 'enabled',
      verified_email: true,
      tags: ['VIP', 'חדש'],
      addresses: [
        {
          first_name: 'דוד',
          last_name: 'כהן',
          address1: 'רחוב הרצל 15',
          city: 'תל אביב',
          zip: '61000',
          country: 'ישראל',
          country_code: 'IL',
          phone: '050-1234567',
          default_address: true,
        },
      ],
    },
    {
      email: 'sarah.levi@example.com',
      first_name: 'שרה',
      last_name: 'לוי',
      phone: '052-9876543',
      accepts_marketing: true,
      state: 'enabled',
      verified_email: true,
      tags: ['פופולרי'],
      addresses: [
        {
          first_name: 'שרה',
          last_name: 'לוי',
          address1: 'שדרות רוטשילד 20',
          city: 'תל אביב',
          zip: '61001',
          country: 'ישראל',
          country_code: 'IL',
          phone: '052-9876543',
          default_address: true,
        },
      ],
    },
    {
      email: 'moshe.david@example.com',
      first_name: 'משה',
      last_name: 'דוד',
      phone: '054-5555555',
      accepts_marketing: false,
      state: 'enabled',
      verified_email: false,
      tags: [],
      addresses: [
        {
          first_name: 'משה',
          last_name: 'דוד',
          address1: 'רחוב יפו 100',
          city: 'ירושלים',
          zip: '91000',
          country: 'ישראל',
          country_code: 'IL',
          phone: '054-5555555',
          default_address: true,
        },
      ],
    },
  ],

  // Orders
  orders: [
    {
      order_name: '#1001',
      order_number: 1001,
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      total_price: 389.80,
      subtotal_price: 329.80,
      total_tax: 60.00,
      currency: 'ILS',
      customer_email: 'david.cohen@example.com',
      line_items: [
        {
          title: 'חולצת טי שירט כותנה',
          quantity: 2,
          price: 89.90,
          sku: 'TSHIRT-001-M-WHITE',
        },
        {
          title: 'נעלי ספורט נוחות',
          quantity: 1,
          price: 299.90,
          sku: 'SHOES-001-42',
        },
      ],
      shipping_address: {
        first_name: 'דוד',
        last_name: 'כהן',
        address1: 'רחוב הרצל 15',
        city: 'תל אביב',
        zip: '61000',
        country: 'ישראל',
      },
      billing_address: {
        first_name: 'דוד',
        last_name: 'כהן',
        address1: 'רחוב הרצל 15',
        city: 'תל אביב',
        zip: '61000',
        country: 'ישראל',
      },
    },
    {
      order_name: '#1002',
      order_number: 1002,
      financial_status: 'paid',
      fulfillment_status: 'pending',
      total_price: 199.90,
      subtotal_price: 199.90,
      total_tax: 0,
      currency: 'ILS',
      customer_email: 'sarah.levi@example.com',
      line_items: [
        {
          title: 'תיק גב איכותי',
          quantity: 1,
          price: 199.90,
          sku: 'BAG-001',
        },
      ],
      shipping_address: {
        first_name: 'שרה',
        last_name: 'לוי',
        address1: 'שדרות רוטשילד 20',
        city: 'תל אביב',
        zip: '61001',
        country: 'ישראל',
      },
      billing_address: {
        first_name: 'שרה',
        last_name: 'לוי',
        address1: 'שדרות רוטשילד 20',
        city: 'תל אביב',
        zip: '61001',
        country: 'ישראל',
      },
    },
  ],

  // Discounts
  discounts: [
    {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      min_purchase_amount: 100,
      max_discount_amount: 50,
      usage_limit: 100,
      usage_count: 0,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
    },
    {
      code: 'SUMMER20',
      type: 'percentage',
      value: 20,
      min_purchase_amount: 200,
      max_discount_amount: 100,
      usage_limit: 50,
      usage_count: 0,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
    },
  ],

  // Shipping Zones
  shippingZones: [
    {
      name: 'ישראל - משלוח רגיל',
      countries: ['IL'],
      rates: [
        {
          name: 'משלוח רגיל',
          price: 25.00,
          min_order_price: 0,
          max_order_price: null,
          estimated_days: 3,
        },
        {
          name: 'משלוח מהיר',
          price: 45.00,
          min_order_price: 0,
          max_order_price: null,
          estimated_days: 1,
        },
      ],
    },
  ],

  // Blog Posts
  blogPosts: [
    {
      title: 'איך לבחור נעלי ספורט',
      handle: 'how-to-choose-sports-shoes',
      body_html: '<p>מדריך מקיף לבחירת נעלי ספורט המתאימות לך.</p>',
      published_at: new Date().toISOString(),
      status: 'published',
      seo_title: 'איך לבחור נעלי ספורט - מדריך מקיף',
      seo_description: 'מדריך מקיף לבחירת נעלי ספורט המתאימות לך.',
    },
    {
      title: 'טרנדים אופנתיים לקיץ 2025',
      handle: 'summer-fashion-trends-2025',
      body_html: '<p>הטרנדים החמים ביותר לקיץ הקרוב.</p>',
      published_at: new Date().toISOString(),
      status: 'published',
      seo_title: 'טרנדים אופנתיים לקיץ 2025',
      seo_description: 'הטרנדים החמים ביותר לקיץ הקרוב.',
    },
  ],

  // Pages - Default pages for all stores
  pages: [
    {
      title: 'אודותינו',
      handle: 'about',
      body_html: `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8;">
          <h2>ברוכים הבאים לחנות שלנו</h2>
          <p>אנחנו שמחים לארח אתכם בחנות המקוונת שלנו. החנות שלנו מתמחה במתן שירות איכותי ומוצרים מעולים ללקוחותינו.</p>
          
          <h3>החזון שלנו</h3>
          <p>החזון שלנו הוא לספק ללקוחותינו חוויית קנייה מהנה ונוחה, יחד עם מוצרים איכותיים ושירות לקוחות מעולה.</p>
          
          <h3>הצוות שלנו</h3>
          <p>אנחנו צוות מקצועי ומסור שפועל ללא הרף כדי להבטיח שתקבלו את השירות הטוב ביותר ואת המוצרים האיכותיים ביותר.</p>
          
          <h3>צרו קשר</h3>
          <p>אנחנו כאן בשבילכם! אם יש לכם שאלות, בקשות או הערות, אנא אל תהססו ליצור איתנו קשר. נשמח לעזור לכם בכל נושא.</p>
        </div>
      `,
      published_at: new Date().toISOString(),
      status: 'published',
      is_published: true,
      seo_title: 'אודותינו - החנות שלנו',
      seo_description: 'למדו עוד על החנות שלנו, החזון שלנו והצוות המקצועי שלנו.',
    },
    {
      title: 'מדיניות החזרות',
      handle: 'return-policy',
      body_html: `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8;">
          <h2>מדיניות החזרות והחלפות</h2>
          
          <h3>זכות החזרה</h3>
          <p>לפי חוק הגנת הצרכן, יש לכם זכות להחזיר מוצר תוך 14 ימים ממועד הרכישה, בתנאי שהמוצר לא נפתח, לא שימש ולא ניזוק.</p>
          
          <h3>תנאי החזרה</h3>
          <ul>
            <li>המוצר חייב להיות במצב המקורי שלו, עם כל התוויות והאריזות</li>
            <li>יש להחזיר את המוצר עם קבלה או אישור רכישה</li>
            <li>החזרה תתבצע תוך 14 ימים ממועד הרכישה</li>
          </ul>
          
          <h3>תהליך החזרה</h3>
          <p>כדי להחזיר מוצר, אנא צרו איתנו קשר דרך טופס יצירת קשר או בטלפון. נספק לכם הוראות משלוח מפורטות.</p>
          
          <h3>החזר כספי</h3>
          <p>לאחר שהמוצר יתקבל אצלנו ונבדק, נבצע החזר כספי תוך 7-14 ימי עסקים. ההחזר יבוצע באותה אמצעי תשלום שבו בוצעה הרכישה.</p>
          
          <h3>עלויות משלוח</h3>
          <p>עלויות המשלוח להחזרת המוצר יחולו על הלקוח, אלא אם כן המוצר פגום או לא תואם להזמנה.</p>
        </div>
      `,
      published_at: new Date().toISOString(),
      status: 'published',
      is_published: true,
      seo_title: 'מדיניות החזרות והחלפות',
      seo_description: 'מדיניות החזרות והחלפות שלנו - תנאים, תהליך והחזר כספי.',
    },
    {
      title: 'מדיניות פרטיות',
      handle: 'privacy-policy',
      body_html: `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8;">
          <h2>מדיניות פרטיות</h2>
          
          <h3>הגנה על פרטיותכם</h3>
          <p>אנחנו מחויבים להגן על פרטיותכם ולשמור על המידע האישי שאתם מספקים לנו. מדיניות זו מסבירה איך אנחנו אוספים, משתמשים ומגנים על המידע שלכם.</p>
          
          <h3>איזה מידע אנחנו אוספים</h3>
          <ul>
            <li>מידע אישי: שם, כתובת אימייל, מספר טלפון, כתובת משלוח</li>
            <li>מידע על רכישות: היסטוריית הזמנות, מוצרים שנרכשו</li>
            <li>מידע טכני: כתובת IP, סוג דפדפן, מערכת הפעלה</li>
          </ul>
          
          <h3>איך אנחנו משתמשים במידע</h3>
          <p>אנחנו משתמשים במידע שאתם מספקים לנו כדי:</p>
          <ul>
            <li>לעבד ולהשלים את ההזמנות שלכם</li>
            <li>לספק שירות לקוחות</li>
            <li>לשלוח עדכונים על הזמנות ומבצעים (רק אם הסכמתם)</li>
            <li>לשפר את השירות והמוצרים שלנו</li>
          </ul>
          
          <h3>הגנה על המידע</h3>
          <p>אנחנו משתמשים בטכנולוגיות אבטחה מתקדמות כדי להגן על המידע האישי שלכם. המידע נשמר במסד נתונים מאובטח ומוצפן.</p>
          
          <h3>שיתוף מידע</h3>
          <p>אנחנו לא מוכרים, משכירים או משתפים את המידע האישי שלכם עם צדדים שלישיים, למעט ספקי שירותים נחוצים (כמו חברות משלוחים) שפועלים בשמנו.</p>
          
          <h3>זכויותיכם</h3>
          <p>לפי חוק הגנת הפרטיות, יש לכם זכות לעיין במידע האישי שלכם, לעדכן אותו או למחוק אותו. כדי לממש זכויות אלו, אנא צרו איתנו קשר.</p>
          
          <h3>עדכונים למדיניות</h3>
          <p>אנחנו עשויים לעדכן את מדיניות הפרטיות מעת לעת. כל שינוי יפורסם בעמוד זה.</p>
        </div>
      `,
      published_at: new Date().toISOString(),
      status: 'published',
      is_published: true,
      seo_title: 'מדיניות פרטיות',
      seo_description: 'מדיניות הפרטיות שלנו - איך אנחנו אוספים, משתמשים ומגנים על המידע האישי שלכם.',
    },
    {
      title: 'תקנון',
      handle: 'terms',
      body_html: `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8;">
          <h2>תקנון שימוש</h2>
          
          <h3>הסכמה לתנאים</h3>
          <p>בשימוש באתר שלנו, אתם מסכימים לתנאי השימוש המפורטים להלן. אם אינכם מסכימים לתנאים אלו, אנא אל תשתמשו באתר.</p>
          
          <h3>שימוש באתר</h3>
          <ul>
            <li>השימוש באתר מותר רק למטרות חוקיות</li>
            <li>אסור להשתמש באתר כדי להפר זכויות יוצרים או זכויות אחרות</li>
            <li>אסור להעלות תוכן מזיק, ויראלי או פוגעני</li>
            <li>אסור לנסות לפרוץ או לפגוע באבטחת האתר</li>
          </ul>
          
          <h3>רכישות</h3>
          <p>כשאתם מבצעים רכישה באתר, אתם מסכימים לשלם את המחיר המלא של המוצר כולל מיסים ומשלוח. המחירים באתר יכולים להשתנות ללא הודעה מוקדמת.</p>
          
          <h3>זכויות יוצרים</h3>
          <p>כל התוכן באתר, כולל טקסטים, תמונות, לוגואים ועיצוב, מוגן בזכויות יוצרים ושייך לנו או לספקי התוכן שלנו. אסור להעתיק, לשכפל או להשתמש בתוכן ללא רשות.</p>
          
          <h3>הגבלת אחריות</h3>
          <p>אנחנו עושים כמיטב יכולתנו להבטיח שהמידע באתר מדויק ועדכני, אך איננו יכולים להבטיח שהמידע תמיד מדויק או שלם. אנחנו לא נהיה אחראים לנזקים שנגרמו כתוצאה משימוש במידע באתר.</p>
          
          <h3>שינויים בתנאים</h3>
          <p>אנחנו שומרים לעצמנו את הזכות לעדכן את תנאי השימוש מעת לעת. שינויים יכנסו לתוקף מייד עם פרסומם באתר.</p>
          
          <h3>סמכות שיפוט</h3>
          <p>כל מחלוקת הנוגעת לשימוש באתר תיפתר בבתי המשפט המוסמכים בישראל, בהתאם לחוקי מדינת ישראל.</p>
        </div>
      `,
      published_at: new Date().toISOString(),
      status: 'published',
      is_published: true,
      seo_title: 'תקנון שימוש',
      seo_description: 'תקנון השימוש באתר שלנו - תנאים, זכויות וחובות.',
    },
    {
      title: 'מדיניות הנגשה',
      handle: 'accessibility-policy',
      body_html: `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8;">
          <h2>מדיניות הנגשה</h2>
          
          <h3>מחויבות להנגשה</h3>
          <p>אנחנו מחויבים להבטיח שהאתר שלנו נגיש לכל המשתמשים, כולל אנשים עם מוגבלויות. אנחנו פועלים בהתאם לתקן הישראלי להנגשת אתרים (תקן 5568) ולחוק שוויון זכויות לאנשים עם מוגבלות.</p>
          
          <h3>רמת הנגשה</h3>
          <p>האתר שלנו עומד ברמת הנגשה AA לפי תקן WCAG 2.1. אנחנו ממשיכים לעבוד על שיפור הנגישות ולהעלות את הרמה ל-AAA.</p>
          
          <h3>תכונות נגישות</h3>
          <ul>
            <li>ניווט מקלדת - ניתן לנווט באתר באמצעות מקלדת בלבד</li>
            <li>תמיכה בקוראי מסך - האתר תואם לקוראי מסך</li>
            <li>ניגודיות צבעים - ניגודיות מספקת בין טקסט לרקע</li>
            <li>גודל טקסט - ניתן להגדיל את הטקסט בדפדפן</li>
            <li>תיאורי תמונות - כל התמונות כוללות טקסט חלופי</li>
          </ul>
          
          <h3>דיווח על בעיות נגישות</h3>
          <p>אם נתקלתם בבעיית נגישות באתר, אנא צרו איתנו קשר. נשמח לשמוע מכם ונעבוד על פתרון הבעיה בהקדם האפשרי.</p>
          
          <h3>שיפורים עתידיים</h3>
          <p>אנחנו ממשיכים לעבוד על שיפור הנגישות של האתר. אם יש לכם הצעות לשיפורים, נשמח לשמוע מכם.</p>
          
          <h3>יצירת קשר</h3>
          <p>לשאלות, הערות או בקשות הקשורות להנגשה, אנא צרו איתנו קשר דרך טופס יצירת קשר או בטלפון.</p>
        </div>
      `,
      published_at: new Date().toISOString(),
      status: 'published',
      is_published: true,
      seo_title: 'מדיניות הנגשה',
      seo_description: 'מדיניות הנגשה לאנשים עם מוגבלויות - תכונות נגישות ותמיכה.',
    },
  ],

  // Popups
  popups: [
    {
      name: 'ברוכים הבאים - הנחה 10%',
      title: 'ברוכים הבאים!',
      content_html: '<p class="text-lg mb-6">קבלו 10% הנחה על כל הקנייה הראשונה שלכם!</p><p class="text-gray-600 mb-4">הצטרפו לרשימת הדיוור שלנו וקבלו:</p><ul class="list-disc list-inside text-gray-600 space-y-2 mb-6"><li>עדכונים על מבצעים בלעדיים</li><li>טיפים וטרנדים אופנתיים</li><li>הזדמנויות מיוחדות לפני כולם</li></ul>',
      trigger_type: 'time' as const,
      trigger_value: 5, // 5 שניות
      is_active: true,
      starts_at: new Date().toISOString(),
      ends_at: null,
      display_rules: {
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      },
    },
    {
      name: 'מבצע קיץ - גלילה',
      title: 'מבצע קיץ!',
      content_html: '<p class="text-lg mb-6">עד 20% הנחה על כל המוצרים בקיץ!</p><p class="text-gray-600 mb-4">הירשמו עכשיו וקבלו עדכונים על המבצעים החמים ביותר</p>',
      trigger_type: 'scroll' as const,
      trigger_value: 50, // 50% גלילה
      is_active: true,
      starts_at: new Date().toISOString(),
      ends_at: null,
      display_rules: {
        image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      },
    },
    {
      name: 'יציאה - הצעה מיוחדת',
      title: 'רגע לפני שאתה עוזב...',
      content_html: '<p class="text-lg mb-6">קבלו 15% הנחה מיוחדת!</p><p class="text-gray-600 mb-4">הצטרפו לרשימת הדיוור שלנו וקבלו קוד הנחה בלעדי</p>',
      trigger_type: 'exit_intent' as const,
      trigger_value: null,
      is_active: true,
      starts_at: new Date().toISOString(),
      ends_at: null,
      display_rules: {
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
      },
    },
  ],

  // Automatic Discounts
  automaticDiscounts: [
    {
      name: 'הנחה 10% על כל המוצרים',
      description: 'הנחה אוטומטית של 10% על כל המוצרים',
      discount_type: 'percentage' as const,
      value: 10,
      minimum_order_amount: 100,
      priority: 1,
      is_active: true,
      can_combine_with_codes: true,
      can_combine_with_other_automatic: false,
      max_combined_discounts: 1,
      starts_at: new Date().toISOString(),
      ends_at: null,
    },
    {
      name: 'משלוח חינם מעל 200₪',
      description: 'משלוח חינם על הזמנות מעל 200₪',
      discount_type: 'free_shipping' as const,
      value: null,
      minimum_order_amount: 200,
      priority: 2,
      is_active: true,
      can_combine_with_codes: true,
      can_combine_with_other_automatic: true,
      max_combined_discounts: 2,
      starts_at: new Date().toISOString(),
      ends_at: null,
    },
    {
      name: 'קנה 2 קבל 1 חינם',
      description: 'קנה 2 מוצרים קבל אחד חינם',
      discount_type: 'bogo' as const,
      buy_quantity: 2,
      get_quantity: 1,
      get_discount_type: 'free' as const,
      applies_to_same_product: true,
      priority: 3,
      is_active: true,
      can_combine_with_codes: false,
      can_combine_with_other_automatic: false,
      max_combined_discounts: 1,
      starts_at: new Date().toISOString(),
      ends_at: null,
    },
    {
      name: 'מתנה על הזמנה מעל 300₪',
      description: 'מתנה אוטומטית על הזמנות מעל 300₪',
      discount_type: 'percentage' as const,
      value: 5, // 5% הנחה
      minimum_order_amount: 300,
      priority: 4,
      is_active: true,
      can_combine_with_codes: true,
      can_combine_with_other_automatic: true,
      max_combined_discounts: 2,
      gift_product_id: null, // יוגדר ב-seedAutomaticDiscounts לפי productIds
      starts_at: new Date().toISOString(),
      ends_at: null,
    },
  ],

  // Gift Cards
  giftCards: [
    {
      code: 'GIFT100',
      initial_value: 100,
      currency: 'ILS',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // שנה מהיום
      is_active: true,
      note: 'גיפט קארד לדמו',
    },
    {
      code: 'GIFT50',
      initial_value: 50,
      currency: 'ILS',
      expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 חודשים
      is_active: true,
      note: 'גיפט קארד לדמו',
    },
  ],

  // Blog Categories
  blogCategories: [
    {
      name: 'אופנה',
      handle: 'fashion',
      description: 'כל מה שקשור לאופנה וטרנדים',
    },
    {
      name: 'ספורט',
      handle: 'sports',
      description: 'טיפים ומידע על ספורט',
    },
    {
      name: 'טיפים',
      handle: 'tips',
      description: 'טיפים שימושיים',
    },
  ],

  // Abandoned Carts
  abandonedCarts: [
    {
      email: 'david.cohen@example.com',
      cart_data: {
        items: [
          { product_title: 'חולצת טי שירט כותנה', variant_title: 'M - לבן', quantity: 1, price: 89.90 },
        ],
      },
      total_price: 89.90,
      abandoned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // לפני יומיים
    },
    {
      email: 'sarah.levi@example.com',
      cart_data: {
        items: [
          { product_title: 'נעלי ספורט נוחות', variant_title: '42', quantity: 1, price: 299.90 },
          { product_title: 'תיק גב איכותי', variant_title: 'Default', quantity: 1, price: 199.90 },
        ],
      },
      total_price: 499.80,
      abandoned_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // לפני 5 ימים
    },
  ],

  // Wishlists
  wishlists: [
    {
      customer_email: 'david.cohen@example.com',
      name: 'רשימת המתנה שלי',
      is_public: false,
      items: [
        { product_title: 'נעלי ספורט נוחות', variant_title: '42' },
        { product_title: 'תיק גב איכותי', variant_title: 'Default' },
      ],
    },
    {
      customer_email: 'sarah.levi@example.com',
      name: 'מועדפים',
      is_public: true,
      items: [
        { product_title: 'חולצת טי שירט כותנה', variant_title: 'M - לבן' },
      ],
    },
  ],

  // Navigation Menus
  navigationMenus: [
    {
      name: 'תפריט ראשי',
      handle: 'main-menu',
      position: 'header',
      items: [
        { title: 'בית', url: '/', type: 'link', position: 1 },
        { title: 'בגדים', type: 'collection', resource_handle: 'clothing', position: 2 },
        { title: 'נעליים', type: 'collection', resource_handle: 'shoes', position: 3 },
        { title: 'אקססוריז', type: 'collection', resource_handle: 'accessories', position: 4 },
        { title: 'בלוג', url: '/blog', type: 'link', position: 5 },
        { title: 'אודותינו', type: 'page', resource_handle: 'about-us', position: 6 },
      ],
    },
    {
      name: 'תפריט תחתון',
      handle: 'footer-menu',
      position: 'footer',
      items: [
        { title: 'אודותינו', type: 'page', resource_handle: 'about-us', position: 1 },
        { title: 'מדיניות החזרות', type: 'page', resource_handle: 'return-policy', position: 2 },
        { title: 'יצירת קשר', url: '/contact', type: 'link', position: 3 },
      ],
    },
    {
      name: 'תפריט צ\'ק אאוט',
      handle: 'checkout-footer',
      position: 'checkout',
      items: [
        { title: 'תקנון', type: 'page', resource_handle: 'terms', position: 1 },
        { title: 'מדיניות פרטיות', type: 'page', resource_handle: 'privacy', position: 2 },
        { title: 'החזרות והחלפות', type: 'page', resource_handle: 'returns-policy', position: 3 },
        { title: 'הצהרת נגישות', type: 'page', resource_handle: 'accessibility', position: 4 },
      ],
    },
  ],

  // Product Reviews
  productReviews: [
    {
      product_title: 'חולצת טי שירט כותנה',
      customer_email: 'david.cohen@example.com',
      rating: 5,
      title: 'מוצר מעולה!',
      review_text: 'חולצה איכותית מאוד, נוחה ונראית טוב. ממליץ בחום!',
      reviewer_name: 'דוד כהן',
      is_verified_purchase: true,
      is_approved: true,
      is_published: true,
    },
    {
      product_title: 'נעלי ספורט נוחות',
      customer_email: 'sarah.levi@example.com',
      rating: 4,
      title: 'נעליים טובות',
      review_text: 'נעליים נוחות מאוד לפעילות גופנית. איכות טובה.',
      reviewer_name: 'שרה לוי',
      is_verified_purchase: true,
      is_approved: true,
      is_published: true,
    },
    {
      product_title: 'תיק גב איכותי',
      customer_email: 'moshe.david@example.com',
      rating: 5,
      title: 'תיק מעולה',
      review_text: 'תיק מרווח ואיכותי, מתאים לטיולים ולעבודה.',
      reviewer_name: 'משה דוד',
      is_verified_purchase: false,
      is_approved: true,
      is_published: true,
    },
  ],

  // Store Credits
  storeCredits: [
    {
      customer_email: 'david.cohen@example.com',
      balance: 50.00,
      expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 חודשים
    },
    {
      customer_email: 'sarah.levi@example.com',
      balance: 25.00,
      expires_at: null,
    },
  ],

  // Loyalty Tiers
  loyaltyTiers: [
    {
      name: 'כסף',
      handle: 'silver',
      tier_level: 1,
      min_points: 0,
      discount_percentage: 5,
      benefits: { free_shipping: false, early_access: false },
    },
    {
      name: 'זהב',
      handle: 'gold',
      tier_level: 2,
      min_points: 500,
      discount_percentage: 10,
      benefits: { free_shipping: true, early_access: false },
    },
    {
      name: 'פלטינום',
      handle: 'platinum',
      tier_level: 3,
      min_points: 1000,
      discount_percentage: 15,
      benefits: { free_shipping: true, early_access: true },
    },
  ],

  // Loyalty Program Rules
  loyaltyRules: [
    {
      name: 'צבירת נקודות על קנייה',
      rule_type: 'purchase',
      points_amount: 10,
      conditions: { min_amount: 100, points_per_ils: 1 },
      is_active: true,
    },
    {
      name: 'נקודות על הרשמה',
      rule_type: 'signup',
      points_amount: 50,
      conditions: {},
      is_active: true,
    },
    {
      name: 'נקודות על ביקורת',
      rule_type: 'review',
      points_amount: 20,
      conditions: { min_rating: 4 },
      is_active: true,
    },
  ],

  // Contacts
  contacts: [
    {
      email: 'contact1@example.com',
      first_name: 'יוסי',
      last_name: 'כהן',
      phone: '050-1111111',
      company: 'חברה בע"מ',
      source: 'contact_form',
      tags: ['יצירת קשר'],
      email_marketing_consent: true,
    },
    {
      email: 'contact2@example.com',
      first_name: 'רחל',
      last_name: 'לוי',
      phone: '052-2222222',
      source: 'manual',
      tags: ['דיוור'],
      email_marketing_consent: true,
    },
  ],

  // Returns
  returns: [
    {
      order_number: 1001,
      customer_email: 'david.cohen@example.com',
      reason: 'מוצר לא מתאים',
      items: [{ order_item_title: 'חולצת טי שירט כותנה', quantity: 1 }],
      status: 'PENDING',
      refund_method: 'STORE_CREDIT',
    },
  ],
};

