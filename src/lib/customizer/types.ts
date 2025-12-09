/**
 * Customizer Types
 * הגדרות טייפס למערכת הקסטומיזר
 */

// סוגי תבניות
export type TemplateType = 'home' | 'product' | 'collection' | 'cart' | 'checkout';

// סוגי סקשנים
export type SectionType =
  | 'hero'
  | 'hero_banner'
  | 'featured_products'
  | 'featured_collections'
  | 'image_with_text'
  | 'rich_text'
  | 'slideshow'
  | 'announcement_bar'
  | 'newsletter'
  | 'gallery'
  | 'video'
  | 'testimonials'
  | 'contact_form'
  | 'faq'
  | 'logo_list'
  | 'map'
  | 'footer'
  | 'header'
  | 'product_header'
  | 'product_gallery'
  | 'product_info'
  | 'related_products'
  | 'collection_header'
  | 'collection_filters'
  | 'collection_products';

// סוגי בלוקים בתוך סקשן
export type BlockType = 'text' | 'image' | 'button' | 'product' | 'collection' | 'video';

// הגדרות צבעים
export interface ColorSettings {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
  accent?: string;
  heading_color?: string;
  subheading_color?: string;
  button_background?: string;
  button_text?: string;
}

// הגדרות טיפוגרפיה
export interface TypographySettings {
  font_family?: string;
  font_size?: string;
  font_weight?: string;
  line_height?: string;
  text_align?: 'left' | 'center' | 'right';
  color?: string;
}

// הגדרות רווחים
export interface SpacingSettings {
  padding_top?: string;
  padding_bottom?: string;
  padding_left?: string;
  padding_right?: string;
  margin_top?: string;
  margin_bottom?: string;
}

// הגדרות גבולות
export interface BorderSettings {
  border_width?: string;
  border_color?: string;
  border_radius?: string;
  border_style?: string;
}

// הגדרות צללים
export interface ShadowSettings {
  shadow_color?: string;
  shadow_offset_x?: string;
  shadow_offset_y?: string;
  shadow_blur?: string;
  shadow_spread?: string;
}

// הגדרות כפתור
export interface ButtonSettings {
  style?: 'solid' | 'outline' | 'white' | 'black' | 'underline';
  background_color?: string;
  text_color?: string;
  hover_background_color?: string;
  hover_text_color?: string;
  border_radius?: string;
}

// הגדרות כלליות לעיצוב
export interface StyleSettings {
  colors?: ColorSettings;
  typography?: TypographySettings;
  spacing?: SpacingSettings;
  border?: BorderSettings;
  shadow?: ShadowSettings;
  button?: ButtonSettings;
  text_align?: 'left' | 'center' | 'right';
  background_image?: string;
  background_image_mobile?: string; // תמונת רקע למובייל
  background_color?: string;
  background_position?: string;
  background_size?: string;
  background_repeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y';
  background?: {
    background_color?: string;
    background_image?: string;
    background_image_mobile?: string;
    background_video?: string;
    background_size?: string;
    background_position?: string;
    background_repeat?: string;
    overlay_opacity?: string;
    video_autoplay?: boolean;
    video_muted?: boolean;
    video_loop?: boolean;
    video_object_fit?: string;
  };
}

// תוכן בלוק
export interface BlockContent {
  text?: string;
  image_url?: string;
  image_url_mobile?: string; // תמונה למובייל
  image_alt?: string;
  alt_text?: string; // חלופה ל-image_alt
  button_text?: string;
  button_url?: string;
  product_ids?: number[];
  collection_ids?: number[];
  video_url?: string;
  heading?: string;
  subheading?: string;
  description?: string;
  link_text?: string;
  link_url?: string;
}

// הגדרות בלוק
export interface BlockSettings {
  id: string;
  type: BlockType;
  content: BlockContent;
  style: StyleSettings;
  settings: Record<string, any>; // הגדרות ספציפיות לבלוק
}

// הגדרות סקשן
export interface SectionSettings {
  id: string;
  type: SectionType;
  name: string;
  visible: boolean;
  order: number;
  locked?: boolean; // סקשן קבוע שלא ניתן למחוק (כמו Header/Footer)
  blocks: BlockSettings[];
  style: StyleSettings;
  settings: Record<string, any>; // הגדרות ספציפיות לסקשן
  responsive?: {
    desktop: Partial<SectionSettings>;
    tablet: Partial<SectionSettings>;
    mobile: Partial<SectionSettings>;
  };
}

// תבנית עמוד
export interface PageTemplate {
  id: string;
  store_id: number;
  page_type: TemplateType;
  name: string;
  description?: string;
  sections: SectionSettings[];
  theme_settings: ThemeSettings;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  version: number;
}

// הגדרות תבנית כלליות
export interface ThemeSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    text_light: string;
    border: string;
  };
  typography: {
    font_family_heading: string;
    font_family_body: string;
    font_size_base: string;
    line_height_base: string;
  };
  layout: {
    max_width: string;
    container_padding: string;
    border_radius: string;
  };
  animations: {
    enabled: boolean;
    duration: string;
  };
}

// ווידג'ט לתבנית
export interface TemplateWidget {
  id: string;
  name: string;
  description?: string;
  category: string;
  section_types: SectionType[];
  default_settings: SectionSettings;
  preview_image?: string;
  is_premium: boolean;
}

// מצב עריכה
export interface EditorState {
  selectedSectionId?: string;
  selectedBlockId?: string;
  device: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
  showGrid: boolean;
  showOutlines: boolean;
}

// פעולת עריכה
export interface EditorAction {
  type: 'add_section' | 'remove_section' | 'update_section' | 'move_section' |
        'add_block' | 'remove_block' | 'update_block' | 'move_block' |
        'update_theme' | 'save_template' | 'load_template';
  payload: any;
  timestamp: Date;
}

// גרסת תבנית
export interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  data: PageTemplate;
  created_at: Date;
  created_by: number;
  comment?: string;
}

// תגובה מ-API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
