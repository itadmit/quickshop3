/**
 * New York Theme Template
 * תבנית ברירת מחדל עם סקשנים מובנים
 */

import { PageTemplate, SectionSettings } from '../types';

export const NEW_YORK_TEMPLATE: Omit<PageTemplate, 'id' | 'store_id' | 'created_at' | 'updated_at'> = {
  page_type: 'home',
  name: 'default',
  description: 'תבנית ברירת מחדל מודרנית',
  sections: [
    // Header Section
    {
      id: 'header',
      type: 'header',
      name: 'כותרת עליונה',
      visible: true,
      order: 0,
      locked: true, // Header is usually locked
      blocks: [],
      style: {},
      settings: {
        logo: {
          text: 'החנות שלי',
          image_url: null
        },
        navigation: {
          menu_items: [
            { label: 'בית', url: '/' },
            { label: 'מוצרים', url: '/collections/all' },
            { label: 'אודות', url: '/pages/about' },
            { label: 'צור קשר', url: '/pages/contact' }
          ]
        },
        search: {
          enabled: true,
          placeholder: 'חפש מוצרים...'
        },
        cart: {
          enabled: true
        },
        user_account: {
          enabled: true
        }
      }
    },

    // Hero Banner Section
    {
      id: 'hero',
      type: 'hero_banner',
      name: 'באנר ראשי',
      visible: true,
      order: 1,
      locked: false,
      blocks: [
        {
          id: 'hero-text',
          type: 'text',
          content: {
            heading: 'כותרת ראשית מרהיבה',
            subheading: 'תת כותרת שמסבירה על החנות שלך',
            button_text: 'קנה עכשיו',
            button_url: '/collections/all'
          },
          style: {
            text_align: 'center',
            colors: {
              heading_color: '#000000',
              subheading_color: '#666666',
              button_background: '#10B981',
              button_text: '#FFFFFF'
            }
          },
          settings: {}
        }
      ],
      style: {
        background: {
          background_color: '#F3F4F6'
        },
        spacing: {
          padding_top: '80px',
          padding_bottom: '80px'
        }
      },
      settings: {
        layout: 'center',
        height: 'medium'
      }
    },

    // Featured Collections Section
    {
      id: 'featured-collections',
      type: 'featured_collections',
      name: 'קטגוריות מוצגות',
      visible: true,
      order: 2,
      locked: false,
      blocks: [],
      style: {
        background: {
          background_color: '#F3F4F6'
        },
        spacing: {
          padding_top: '60px',
          padding_bottom: '60px'
        }
      },
      settings: {
        title: 'קטגוריות פופולריות',
        collections: [], // Will be populated with store collections
        display_type: 'grid',
        items_per_row: 3,
        show_description: true
      }
    },

    // Featured Products Section
    {
      id: 'featured-products',
      type: 'featured_products',
      name: 'מוצרים מוצגים',
      visible: true,
      order: 3,
      locked: false,
      blocks: [],
      style: {
        background: {
          background_color: '#F3F4F6'
        },
        spacing: {
          padding_top: '60px',
          padding_bottom: '60px'
        }
      },
      settings: {
        title: 'מוצרים מומלצים',
        products: [], // Will be populated with featured products
        display_type: 'grid',
        items_per_row: 4,
        show_price: true,
        show_rating: true,
        show_badges: true
      }
    },

    // Image with Text Section
    {
      id: 'about-section',
      type: 'image_with_text',
      name: 'תמונה עם טקסט',
      visible: true,
      order: 4,
      locked: false,
      blocks: [
        {
          id: 'about-image',
          type: 'image',
          content: {
            image_url: '/images/about.jpg',
            alt_text: 'אודות החנות'
          },
          style: {},
          settings: {}
        },
        {
          id: 'about-text',
          type: 'text',
          content: {
            heading: 'אודות החנות שלנו',
            text: 'אנחנו מציעים מוצרים איכותיים במחירים הוגנים. השירות שלנו מתמקד בלקוח ובהנאה מהקנייה.',
            button_text: 'למד עוד',
            button_url: '/pages/about'
          },
          style: {
            text_align: 'left'
          },
          settings: {}
        }
      ],
      style: {
        background: {
          background_color: '#F3F4F6'
        },
        spacing: {
          padding_top: '60px',
          padding_bottom: '60px'
        }
      },
      settings: {
        layout: 'image_left',
        spacing: 'medium'
      }
    },

    // Newsletter Section
    {
      id: 'newsletter',
      type: 'newsletter',
      name: 'הרשמה לניוזלטר',
      visible: true,
      order: 5,
      locked: false,
      blocks: [
        {
          id: 'newsletter-content',
          type: 'text',
          content: {
            heading: 'הישאר מעודכן',
            subheading: 'הירשם לניוזלטר שלנו וקבל עדכונים על מוצרים חדשים והנחות מיוחדות',
            button_text: 'הירשם עכשיו'
          },
          style: {
            text_align: 'center'
          },
          settings: {}
        }
      ],
      style: {
        background: {
          background_color: '#F3F4F6'
        },
        spacing: {
          padding_top: '60px',
          padding_bottom: '60px'
        }
      },
      settings: {
        form_settings: {
          email_placeholder: 'הכנס את כתובת המייל שלך',
          success_message: 'תודה על ההרשמה!'
        }
      }
    },

    // Footer Section
    {
      id: 'footer',
      type: 'footer',
      name: 'כותרת תחתונה',
      visible: true,
      order: 6,
      locked: true, // Footer is usually locked
      blocks: [],
      style: {},
      settings: {
        columns: [
          {
            title: 'חברה',
            links: [
              { label: 'אודותינו', url: '/pages/about' },
              { label: 'צור קשר', url: '/pages/contact' },
              { label: 'משלוחים', url: '/pages/shipping' },
              { label: 'החזרות', url: '/pages/returns' }
            ]
          },
          {
            title: 'מוצרים',
            links: [
              { label: 'כל המוצרים', url: '/collections/all' },
              { label: 'מוצרים חדשים', url: '/collections/new' },
              { label: 'מבצעים', url: '/collections/sale' }
            ]
          },
          {
            title: 'שירות לקוחות',
            links: [
              { label: 'שאלות נפוצות', url: '/pages/faq' },
              { label: 'מדיניות פרטיות', url: '/pages/privacy' },
              { label: 'תנאי שימוש', url: '/pages/terms' }
            ]
          }
        ],
        social_links: [
          { platform: 'facebook', url: 'https://facebook.com' },
          { platform: 'instagram', url: 'https://instagram.com' },
          { platform: 'twitter', url: 'https://twitter.com' }
        ],
        copyright: '© 2024 כל הזכויות שמורות',
        payment_methods: ['visa', 'mastercard', 'paypal']
      }
    }
  ],
  theme_settings: {
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#10B981',
      background: '#FFFFFF',
      text: '#000000',
      text_light: '#6B7280',
      border: '#E5E7EB'
    },
    typography: {
      font_family_heading: 'Heebo',
      font_family_body: 'Heebo',
      font_size_base: '16px',
      line_height_base: '1.6'
    },
    layout: {
      max_width: '1200px',
      container_padding: '24px',
      border_radius: '4px'
    },
    animations: {
      enabled: true,
      duration: '300ms'
    }
  },
  is_default: true,
  is_active: true,
  version: 1
};

// Helper function to get default sections for any page type
export function getDefaultSectionsForPage(pageType: string): SectionSettings[] {
  switch (pageType) {
    case 'home':
      return NEW_YORK_TEMPLATE.sections;
    case 'product':
      return [
        {
          id: 'product-header',
          type: 'product_header',
          name: 'כותרת מוצר',
          visible: true,
          order: 0,
          locked: true,
          blocks: [],
          style: {},
          settings: {}
        },
        {
          id: 'product-gallery',
          type: 'product_gallery',
          name: 'גלריה',
          visible: true,
          order: 1,
          locked: true,
          blocks: [],
          style: {},
          settings: {}
        },
        {
          id: 'product-info',
          type: 'product_info',
          name: 'מידע מוצר',
          visible: true,
          order: 2,
          locked: true,
          blocks: [],
          style: {},
          settings: {}
        },
        {
          id: 'related-products',
          type: 'related_products',
          name: 'מוצרים קשורים',
          visible: true,
          order: 3,
          locked: false,
          blocks: [],
          style: {},
          settings: {}
        }
      ];
    case 'collection':
      return [
        {
          id: 'collection-header',
          type: 'collection_header',
          name: 'כותרת קטגוריה',
          visible: true,
          order: 0,
          locked: true,
          blocks: [],
          style: {},
          settings: {}
        },
        {
          id: 'collection-filters',
          type: 'collection_filters',
          name: 'מסננים',
          visible: true,
          order: 1,
          locked: false,
          blocks: [],
          style: {},
          settings: {}
        },
        {
          id: 'collection-products',
          type: 'collection_products',
          name: 'רשימת מוצרים',
          visible: true,
          order: 2,
          locked: true,
          blocks: [],
          style: {},
          settings: {}
        }
      ];
    default:
      return [];
  }
}
