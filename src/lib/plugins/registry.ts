// Plugin Registry - רישום כל התוספים המובנים במערכת

import { PluginDefinition } from '@/types/plugin';

/**
 * רשימת כל התוספים המובנים במערכת
 * כל תוסף חדש צריך להירשם כאן
 */
export const builtInPlugins: PluginDefinition[] = [
  // ============================================
  // LOYALTY PLUGINS
  // ============================================
  {
    slug: 'premium-club',
    name: 'חברי מועדון פרימיום',
    description: 'מערכת רמות מתקדמת עם הנחות, הטבות ופיצ\'רים נוספים לפי רמות (כסף, זהב, פלטינה)',
    type: 'CORE',
    category: 'LOYALTY',
    version: '1.0.0',
    is_built_in: true,
    is_free: false, // בתשלום
    price: 49.90, // מחיר חודשי
    currency: 'ILS',
    icon: '/icons/premium-club.svg',
    author: 'QuickShop',
    defaultConfig: {
      enabled: false,
      tiers: [
        {
          slug: 'silver',
          name: 'כסף',
          color: '#C0C0C0',
          priority: 1,
          minSpent: 500,
          minOrders: 3,
          discount: {
            type: 'PERCENTAGE',
            value: 5,
          },
          benefits: {
            freeShipping: false,
            earlyAccess: false,
            exclusiveProducts: false,
            birthdayGift: true,
            pointsMultiplier: 1.2,
          },
        },
        {
          slug: 'gold',
          name: 'זהב',
          color: '#FFD700',
          priority: 2,
          minSpent: 2000,
          minOrders: 10,
          discount: {
            type: 'PERCENTAGE',
            value: 10,
          },
          benefits: {
            freeShipping: true,
            earlyAccess: true,
            exclusiveProducts: false,
            birthdayGift: true,
            pointsMultiplier: 1.5,
          },
        },
        {
          slug: 'platinum',
          name: 'פלטינה',
          color: '#E5E4E2',
          priority: 3,
          minSpent: 5000,
          minOrders: 25,
          discount: {
            type: 'PERCENTAGE',
            value: 15,
          },
          benefits: {
            freeShipping: true,
            earlyAccess: true,
            exclusiveProducts: true,
            birthdayGift: true,
            pointsMultiplier: 2,
          },
        },
      ],
      benefits: {
        freeShippingThreshold: 200,
        birthdayDiscount: {
          enabled: true,
          value: 20,
          type: 'PERCENTAGE',
        },
        earlyAccessToSales: true,
        exclusiveProductsAccess: true,
        vipSupport: true,
        monthlyGift: true,
      },
      notifications: {
        tierUpgradeEmail: true,
        tierUpgradeSMS: false,
      },
    },
    metadata: {
      menuItem: {
        icon: 'Crown',
        labelKey: 'sidebar.premiumClub',
        href: '/settings/premium-club',
        permission: 'customers',
        section: 'marketing',
      },
      screenshots: [],
      documentation: 'מערכת רמות מתקדמת עם הנחות, הטבות ופיצ\'רים נוספים',
    },
  },

  // ============================================
  // INVENTORY PLUGINS
  // ============================================
  {
    slug: 'bundle-products',
    name: 'מוצר באנדל',
    description: 'מוצר שמורכב מכמה מוצרים - מוריד מהמלאי של כל מוצר',
    type: 'CORE',
    category: 'INVENTORY',
    version: '1.0.0',
    is_built_in: true,
    is_free: true,
    defaultConfig: {},
    metadata: {
      menuItem: {
        icon: 'Boxes',
        labelKey: 'sidebar.bundles',
        href: '/bundles',
        permission: 'products',
        section: 'productItems',
      },
    },
  },

  // ============================================
  // PAYMENT PLUGINS
  // ============================================
  {
    slug: 'cash-on-delivery',
    name: 'תשלום במזומן',
    description: 'הוספת אפשרות תשלום במזומן בצ\'ק אאוט',
    type: 'CORE',
    category: 'PAYMENT',
    version: '1.0.0',
    is_built_in: true,
    is_free: true,
    defaultConfig: {
      enabled: true,
      label: 'תשלום במזומן',
      description: 'תשלום במזומן בעת המשלוח',
    },
  },

  // ============================================
  // OPERATIONS PLUGINS
  // ============================================
  {
    slug: 'saturday-shutdown',
    name: 'האתר מכובה בשבת',
    description: 'כיבוי אוטומטי של האתר בשבת',
    type: 'CORE',
    category: 'OPERATIONS',
    version: '1.0.0',
    is_built_in: true,
    is_free: true,
    defaultConfig: {
      enabled: true,
      message: 'האתר סגור בשבת. נשמח לראותכם מחר!',
    },
  },

  // ============================================
  // MARKETING PLUGINS
  // ============================================
  {
    slug: 'shop-the-look',
    name: 'Shop the Look',
    description: 'סימון פריטים על תמונה וקישור לכל סימון',
    type: 'CORE',
    category: 'MARKETING',
    version: '1.0.0',
    is_built_in: true,
    is_free: false,
    price: 29.90,
    currency: 'ILS',
    defaultConfig: {},
  },

  {
    slug: 'reviews',
    name: 'ביקורות מתקדמות',
    description: 'מערכת ביקורות מתקדמת עם תמיכה בתמונות ווידאו',
    type: 'CORE',
    category: 'MARKETING',
    version: '1.0.0',
    is_built_in: true,
    is_free: true,
    defaultConfig: {
      requireApproval: true,
      allowAnonymous: false,
      allowVideos: true,
      allowImages: true,
      maxImages: 5,
      maxVideos: 1,
      verifyPurchase: true,
      enableReplies: false,
      enableQnA: false,
    },
    metadata: {
      menuItem: {
        icon: 'Star',
        labelKey: 'sidebar.reviews',
        href: '/reviews',
        permission: 'products',
        section: 'marketing',
      },
    },
  },

  // ============================================
  // ANALYTICS PLUGINS
  // ============================================
  {
    slug: 'google-analytics',
    name: 'Google Analytics',
    description: 'מעקב אנליטיקס של גוגל',
    type: 'SCRIPT',
    category: 'ANALYTICS',
    version: '1.0.0',
    is_built_in: true,
    is_free: true,
    inject_location: 'HEAD',
    script_content: `
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
      
      ga('create', '{{TRACKING_ID}}', 'auto');
      ga('send', 'pageview');
    `,
    defaultConfig: {
      trackingId: '',
    },
  },

  // ============================================
  // MARKETING PLUGINS - Smart Advisor
  // ============================================
  {
    slug: 'smart-advisor',
    name: 'יועץ חכם',
    description: 'יועץ אינטראקטיבי שמנחה לקוחות למוצר המתאים להם. הגדר שאלות, תשובות וכללי התאמה - והמערכת תציג את המוצרים הכי רלוונטיים!',
    type: 'CORE',
    category: 'MARKETING',
    version: '1.0.0',
    is_built_in: true,
    is_free: false,
    price: 59,
    currency: 'ILS',
    icon: '/icons/smart-advisor.svg',
    author: 'QuickShop',
    defaultConfig: {
      enabled: false,
      defaultResultsCount: 3,
      showMatchPercentage: true,
      showMatchReasons: true,
      trackSessions: true,
      autoAddToCart: false,
    },
    metadata: {
      menuItem: {
        icon: 'Sparkles',
        labelKey: 'sidebar.smartAdvisor',
        href: '/smart-advisor',
        permission: 'products',
        section: 'marketing',
      },
      screenshots: [
        '/images/plugins/smart-advisor-1.png',
        '/images/plugins/smart-advisor-2.png',
      ],
      documentation: `
## יועץ חכם - מדריך שימוש

### מה זה עושה?
היועץ החכם עוזר ללקוחות למצוא את המוצר המושלם עבורם.
הוא שואל שאלות פשוטות ומציג מוצרים מותאמים אישית.

### איך זה עובד?
1. **צור שאלון** - תן לו שם ותיאור
2. **הוסף שאלות** - מה סוג השיער? מה צבע העור?
3. **הוסף תשובות** - תלתלים, חלק, מסולסל...
4. **קשר מוצרים** - הגדר ניקוד לכל מוצר לפי תשובות
5. **שתף** - הוסף לינק ליועץ באתר

### שיטת הניקוד
כל מוצר מקבל ניקוד לפי התשובות שהלקוח בחר.
המוצרים עם הניקוד הגבוה ביותר מוצגים ראשונים.

### דוגמה:
- שמפו לתלתלים: תלתלים=10, חפיפה יומית=8
- לקוח בחר: תלתלים + יומי = 18 נקודות
- המוצר מוצג ראשון!
      `,
    },
    requirements: {
      minVersion: '1.0.0',
    },
  },

  // ============================================
  // COMMUNICATION PLUGINS
  // ============================================
  {
    slug: 'whatsapp-floating',
    name: 'אייקון וואטסאפ צף',
    description: 'הוספת אייקון וואטסאפ צף לעמוד',
    type: 'SCRIPT',
    category: 'COMMUNICATION',
    version: '1.0.0',
    is_built_in: true,
    is_free: true,
    inject_location: 'BODY_END',
    script_content: `
      (function() {
        const phone = '{{PHONE_NUMBER}}';
        const message = '{{DEFAULT_MESSAGE}}';
        const position = '{{POSITION}}' || 'bottom-right';
        
        const button = document.createElement('a');
        button.href = \`https://wa.me/\${phone}?text=\${encodeURIComponent(message)}\`;
        button.target = '_blank';
        button.className = 'whatsapp-float';
        button.innerHTML = '💬';
        button.style.cssText = \`
          position: fixed;
          \${position.includes('right') ? 'right' : 'left'}: 20px;
          bottom: 20px;
          width: 60px;
          height: 60px;
          background: #25D366;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 9999;
          text-decoration: none;
          transition: transform 0.2s;
        \`;
        
        button.addEventListener('mouseenter', () => {
          button.style.transform = 'scale(1.1)';
        });
        button.addEventListener('mouseleave', () => {
          button.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(button);
      })();
    `,
    defaultConfig: {
      phoneNumber: '',
      defaultMessage: 'שלום, אני מעוניין במוצר',
      position: 'bottom-right',
    },
  },

  // ============================================
  // ENGAGEMENT PLUGINS
  // ============================================
  {
    slug: 'product-stories',
    name: 'סטוריז מוצרים',
    description: 'הצגת מוצרים בפורמט סטוריז אינטראקטיבי כמו באינסטגרם - עם לייקים, תגובות והוספה מהירה לעגלה',
    type: 'CORE',
    category: 'MARKETING',
    version: '1.0.0',
    is_built_in: true,
    is_free: false,
    price: 39.90,
    currency: 'ILS',
    icon: '/icons/stories.svg',
    author: 'QuickShop',
    defaultConfig: {
      enabled: false,
      displayMode: 'home_only', // 'home_only' | 'category' | 'everywhere'
      autoAdvanceSeconds: 5,
      showProductInfo: true,
      allowLikes: true,
      allowComments: true,
      allowQuickAdd: true,
      circleBorderColor: '#e91e63',
      viewedBorderColor: '#9e9e9e',
      selectedProducts: [], // array of product IDs
    },
    metadata: {
      menuItem: {
        icon: 'PlayCircle',
        labelKey: 'sidebar.stories',
        href: '/settings/stories',
        permission: 'products',
        section: 'marketing',
      },
      screenshots: [
        '/images/plugins/stories-1.png',
        '/images/plugins/stories-2.png',
      ],
      documentation: `
## סטוריז מוצרים - מדריך שימוש

### מה זה עושה?
תוסף סטוריז מוצרים מאפשר להציג מוצרים בפורמט אינטראקטיבי 
כמו סטוריז באינסטגרם, בראש האתר מתחת לתפריט.

### איך זה עובד?
1. **בחר מוצרים** - בחר אילו מוצרים יוצגו בסטוריז
2. **הפעל** - הפעל את התוסף ובחר היכן להציג
3. **אינטראקציה** - לקוחות יכולים:
   - 🔄 לגלול בין מוצרים
   - ❤️ לעשות לייק
   - 💬 להוסיף תגובה
   - 🛒 להוסיף לעגלה במהירות

### הגדרות תצוגה
- **הצג רק בדף בית** - ברירת מחדל
- **הצג בקטגוריות** - יופיע גם בעמודי קטגוריה
- **הצג בכל האתר** - יופיע בכל העמודים

### מעקב אחר צפיות
מוצרים שנצפו יקבלו מסגרת אפורה ויועברו לסוף הרשימה,
כך שלקוחות תמיד יראו תוכן חדש.

### סקשן בעמוד מוצר
ניתן להוסיף סקשן "סטוריז" בקסטומייזר לעמוד מוצר,
שיציג את מספר הלייקים והתגובות למוצר.
      `,
    },
    requirements: {
      minVersion: '1.0.0',
    },
  },
];

/**
 * פונקציה לקבלת תוסף לפי slug
 */
export function getPluginBySlug(slug: string): PluginDefinition | undefined {
  return builtInPlugins.find(p => p.slug === slug);
}

/**
 * פונקציה לקבלת כל התוספים
 */
export function getAllPlugins(): PluginDefinition[] {
  return builtInPlugins;
}

/**
 * פונקציה לקבלת תוספים לפי קטגוריה
 */
export function getPluginsByCategory(category: string): PluginDefinition[] {
  return builtInPlugins.filter(p => p.category === category);
}

/**
 * פונקציה לקבלת תוספים לפי סוג
 */
export function getPluginsByType(type: 'CORE' | 'SCRIPT'): PluginDefinition[] {
  return builtInPlugins.filter(p => p.type === type);
}

/**
 * פונקציה לקבלת תוספים חינמיים בלבד
 */
export function getFreePlugins(): PluginDefinition[] {
  return builtInPlugins.filter(p => p.is_free);
}

/**
 * פונקציה לקבלת תוספים בתשלום בלבד
 */
export function getPaidPlugins(): PluginDefinition[] {
  return builtInPlugins.filter(p => !p.is_free);
}



