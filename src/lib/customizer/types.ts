/**
 * Customizer Types
 * הגדרות טייפס למערכת הקסטומיזר
 */

// סוגי תבניות
export type TemplateType = 'home' | 'product' | 'collection' | 'cart' | 'checkout';

// סוגי סקשנים
export type SectionType =
  | 'hero'
  | 'featured_products'
  | 'featured_collections'
  | 'image_with_text'
  | 'rich_text'
  | 'slideshow'
  | 'announcement_bar'
  | 'newsletter'
  | 'footer'
  | 'header';

// סוגי בלוקים בתוך סקשן
export type BlockType = 'text' | 'image' | 'button' | 'product' | 'collection' | 'video';

// הגדרות צבעים
export interface ColorSettings {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
  accent?: string;
}

// הגדרות טיפוגרפיה
export interface TypographySettings {
  font_family?: string;
  font_size?: string;
  font_weight?: string;
  line_height?: string;
  text_align?: 'left' | 'center' | 'right';
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

// הגדרות כלליות לעיצוב
export interface StyleSettings {
  colors?: ColorSettings;
  typography?: TypographySettings;
  spacing?: SpacingSettings;
  border?: BorderSettings;
  shadow?: ShadowSettings;
  background_image?: string;
  background_color?: string;
  background_position?: string;
  background_size?: string;
  background_repeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y';
}

// תוכן בלוק
export interface BlockContent {
  text?: string;
  image_url?: string;
  image_alt?: string;
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
