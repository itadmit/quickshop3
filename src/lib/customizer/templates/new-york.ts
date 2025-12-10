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
            { label: 'מוצרים', url: '/categories/all' },
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
        currency_selector: {
          enabled: false
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
            heading: 'ברוכים הבאים',
            subheading: 'לחנות החדשה שלנו',
            button_text: 'מעבר לחנות',
            button_url: '/categories/all'
          },
          style: {
            text_align: 'center',
            colors: {
              heading_color: '#000000',
              subheading_color: '#333333',
              button_background: '#000000',
              button_text: '#FFFFFF'
            }
          },
          settings: {}
        }
      ],
      style: {
        background: {
          background_color: '#FFFFFF',
          background_image: '/images/library/New_york_desktop_image.jpg',
          background_image_mobile: '/images/library/New_york_mobile_image.jpeg',
          background_size: 'cover',
          background_position: 'center',
          overlay_opacity: '0.5'
        },
        typography: {
          font_family: '"Noto Sans Hebrew", sans-serif',
          color: '#FFFFFF'
        },
        spacing: {
          padding_top: '0',
          padding_bottom: '0'
        },
        button: {
          style: 'outline',
          background_color: '#FFFFFF',
          text_color: '#FFFFFF',
          hover_background_color: '#FFFFFF',
          hover_text_color: '#000000'
        }
      },
      settings: {
        layout: 'center',
        height: 'medium',
        text_align: 'center',
        content_position_vertical: 'center',
        content_position_horizontal: 'center',
        heading: 'ברוכים הבאים',
        subheading: 'לחנות החדשה שלנו',
        button_text: 'מעבר לחנות',
        button_url: '/collections/all'
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
          background_color: '#FFFFFF'
        },
        typography: {
          font_family: '"Noto Sans Hebrew", sans-serif'
        },
        spacing: {
          padding_top: '60px',
          padding_bottom: '60px'
        }
      },
      settings: {
        title: 'קטגוריות פופולריות',
        collections: [],
        display_type: 'grid',
        items_per_row: 3,
        show_description: true,
        text_align: 'right'
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
          background_color: '#FFFFFF'
        },
        typography: {
          font_family: '"Noto Sans Hebrew", sans-serif'
        },
        spacing: {
          padding_top: '60px',
          padding_bottom: '60px'
        }
      },
      settings: {
        title: 'מוצרים מומלצים',
        products: [],
        display_type: 'grid',
        items_per_row: 4,
        items_per_row_mobile: 2,
        products_count: 8,
        products_count_mobile: 2,
        show_price: true,
        show_rating: true,
        show_badges: true,
        text_align: 'right'
      }
    },

    // Image with Text Section
    {
      id: 'about-section',
      type: 'image_with_text',
      name: 'מדיה עם טקסט',
      visible: true,
      order: 4,
      locked: false,
      blocks: [
        {
          id: 'about-image',
          type: 'image',
          content: {
            image_url: '/images/library/new_york_model_desktop.jpeg',
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
            text_align: 'right'
          },
          settings: {}
        }
      ],
      style: {
        background: {
          background_color: '#FFFFFF'
        },
        typography: {
          font_family: '"Noto Sans Hebrew", sans-serif'
        },
        spacing: {
          padding_top: '60px',
          padding_bottom: '60px'
        },
        button: {
          style: 'solid',
          background_color: '#000000',
          text_color: '#FFFFFF',
          hover_background_color: '#333333',
          hover_text_color: '#FFFFFF'
        }
      },
      settings: {
        layout: 'image_right',
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
          background_color: '#F9FAFB'
        },
        typography: {
          font_family: '"Noto Sans Hebrew", sans-serif'
        },
        spacing: {
          padding_top: '60px',
          padding_bottom: '60px'
        },
        button: {
          style: 'solid',
          background_color: '#000000',
          text_color: '#FFFFFF',
          hover_background_color: '#333333',
          hover_text_color: '#FFFFFF'
        }
      },
      settings: {
        layout: 'center',
        content_width: 'regular',
        height: 'medium'
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
        columns_count: 4,
        columns: [
          {
            type: 'menu',
            title: 'חברה',
            menu_id: null,
            text: '',
            image_url: '',
            newsletter_title: '',
            newsletter_content: '',
            newsletter_button_bg: '#000000',
            newsletter_button_text: '#FFFFFF'
          },
          {
            type: 'menu',
            title: 'מוצרים',
            menu_id: null,
            text: '',
            image_url: '',
            newsletter_title: '',
            newsletter_content: '',
            newsletter_button_bg: '#000000',
            newsletter_button_text: '#FFFFFF'
          },
          {
            type: 'menu',
            title: 'שירות לקוחות',
            menu_id: null,
            text: '',
            image_url: '',
            newsletter_title: '',
            newsletter_content: '',
            newsletter_button_bg: '#000000',
            newsletter_button_text: '#FFFFFF'
          },
          {
            type: 'newsletter',
            title: '',
            menu_id: null,
            text: '',
            image_url: '',
            newsletter_title: 'הישאר מעודכן',
            newsletter_content: 'הירשם לניוזלטר שלנו וקבל עדכונים על מוצרים חדשים והנחות מיוחדות',
            newsletter_button_bg: '#000000',
            newsletter_button_text: '#FFFFFF'
          }
        ],
        social_links: {
          enabled: true,
          links: [
            { platform: 'facebook', url: 'https://facebook.com' },
            { platform: 'instagram', url: 'https://instagram.com' },
            { platform: 'twitter', url: 'https://twitter.com' }
          ]
        },
        currency_selector: {
          enabled: false
        },
        copyright: '© 2024 כל הזכויות שמורות'
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
