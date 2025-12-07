/**
 * Customizer Module - TypeScript Types
 * Quickshop3 Theme Customizer Types
 */

// ============================================
// Base Types
// ============================================

export type PageType = 
  | 'home' 
  | 'product' 
  | 'collection' 
  | 'cart' 
  | 'checkout' 
  | 'page' 
  | 'blog';

export type TemplateType = 'product' | 'collection' | 'blog_post' | 'page';

export type SectionType =
  | 'announcement_bar'
  | 'header'
  | 'slideshow'
  | 'hero_banner'
  | 'hero_video'
  | 'collection_list'
  | 'featured_collection'
  | 'featured_product'
  | 'product_grid'
  | 'new_arrivals'
  | 'best_sellers'
  | 'recently_viewed'
  | 'image_with_text'
  | 'image_with_text_overlay'
  | 'rich_text'
  | 'video'
  | 'before_after_slider'
  | 'collapsible_tabs'
  | 'testimonials'
  | 'faq'
  | 'newsletter'
  | 'promo_banner'
  | 'countdown'
  | 'instagram'
  | 'trust_badges'
  | 'popup'
  | 'footer'
  | 'mobile_sticky_bar'
  | 'mega_menu'
  | 'custom_html'
  | 'custom_liquid'
  | 'custom_section'
  | 'embed_code'
  | 'api_section';

export type BlockType =
  | 'text'
  | 'link'
  | 'image_slide'
  | 'video_slide'
  | 'collection'
  | 'tab'
  | 'testimonial'
  | 'question'
  | 'badge'
  | 'menu_item'
  | 'column'
  | 'button';

// ============================================
// Database Types
// ============================================

export interface ThemeTemplate {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  thumbnail_url?: string;
  is_default: boolean;
  is_premium: boolean;
  price: number;
  version: string;
  available_sections: string[];
  default_settings_schema: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface StoreThemeSettings {
  id: number;
  store_id: number;
  template_id?: number;
  published_settings_json: Record<string, any>;
  draft_settings_json: Record<string, any>;
  custom_css: string;
  custom_js: string;
  custom_head_code: string;
  published_at?: Date;
  edge_json_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PageLayout {
  id: number;
  store_id: number;
  template_id?: number;
  page_type: PageType;
  page_handle?: string;
  is_published: boolean;
  published_at?: Date;
  edge_json_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PageSection {
  id: number;
  page_layout_id: number;
  section_type: SectionType;
  section_id: string;
  position: number;
  is_visible: boolean;
  is_locked: boolean;
  settings_json: Record<string, any>;
  custom_css: string;
  custom_classes: string;
  created_at: Date;
  updated_at: Date;
}

export interface SectionBlock {
  id: number;
  section_id: number;
  block_type: BlockType;
  block_id: string;
  position: number;
  is_visible: boolean;
  settings_json: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CustomSection {
  id: number;
  store_id: number;
  name: string;
  display_name: string;
  description?: string;
  settings_schema: SettingDefinition[];
  blocks_schema?: BlockDefinition[];
  template_code: string;
  css_code: string;
  preview_data: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PageTemplate {
  id: number;
  store_id: number;
  template_type: TemplateType;
  name: string;
  is_default: boolean;
  is_published: boolean;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TemplateWidget {
  id: number;
  template_id: number;
  widget_type: string;
  widget_id: string;
  position: number;
  is_visible: boolean;
  is_dynamic: boolean;
  settings_json: Record<string, any>;
  custom_css: string;
  custom_classes: string;
  created_at: Date;
  updated_at: Date;
}

export interface TemplateOverride {
  id: number;
  template_id: number;
  object_type: 'product' | 'collection';
  object_id: number;
  widget_overrides: Record<string, any>;
  custom_widgets?: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface PageLayoutVersion {
  id: number;
  page_layout_id: number;
  version_number: number;
  snapshot_json: Record<string, any>;
  created_by?: number;
  created_at: Date;
  notes?: string;
  is_restorable: boolean;
}

// ============================================
// Configuration Types
// ============================================

export interface PageConfig {
  version: string;
  generated_at: string;
  page_type: PageType;
  global_settings: ThemeGlobalSettings;
  sections: Record<string, SectionConfig>;
  section_order: string[];
  custom_css?: string;
  custom_js?: string;
}

export interface SectionConfig {
  type: SectionType;
  position: number;
  settings: Record<string, any>;
  blocks: BlockConfig[];
  custom_classes?: string;
}

export interface BlockConfig {
  id: string;
  type: BlockType;
  settings: Record<string, any>;
}

export interface ThemeGlobalSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface?: string;
    text: string;
    muted?: string;
    border?: string;
    error?: string;
    success?: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: number;
    lineHeight?: number;
    headingWeight?: number;
    bodyWeight?: number;
  };
  layout: {
    containerMaxWidth: number;
    containerPadding: number;
    sectionSpacing: number;
    gridGap: number;
  };
  buttons?: {
    borderRadius: number;
    padding: string;
    primaryStyle: string;
    secondaryStyle: string;
  };
  cards?: {
    borderRadius: number;
    shadow: string;
    hoverEffect: string;
  };
  animations?: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
}

// ============================================
// Schema Definition Types
// ============================================

export interface SettingDefinition {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'range' | 'select' | 'radio' | 'checkbox' | 'color' | 'image' | 'url' | 'datetime';
  label: string;
  default?: any;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  help?: string;
}

export interface BlockDefinition {
  type: BlockType;
  name: string;
  settings: SettingDefinition[];
}

// ============================================
// Widget Types (for Template Pages)
// ============================================

export interface DynamicWidget {
  name: string;
  variable: string;
  settings: SettingDefinition[];
}

export interface StaticWidget {
  name: string;
  type: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface SavePageDraftRequest {
  page_type: PageType;
  page_handle?: string;
  sections: Omit<PageSection, 'id' | 'page_layout_id' | 'created_at' | 'updated_at'>[];
  section_order: string[];
  custom_css?: string;
}

export interface PublishPageRequest {
  page_type: PageType;
  page_handle?: string;
}

export interface AddSectionRequest {
  page_type: PageType;
  section_type: SectionType;
  position: number;
  settings?: Record<string, any>;
}

export interface UpdateSectionRequest {
  section_id: number;
  settings?: Record<string, any>;
  custom_css?: string;
  custom_classes?: string;
  position?: number;
  is_visible?: boolean;
}

export interface AddBlockRequest {
  section_id: number;
  block_type: BlockType;
  position: number;
  settings?: Record<string, any>;
}

export interface UpdateBlockRequest {
  block_id: number;
  settings?: Record<string, any>;
  position?: number;
  is_visible?: boolean;
}

// ============================================
// Event Types
// ============================================

export interface CustomizerPagePublishedEvent {
  store_id: number;
  page_type: PageType;
  page_handle?: string;
  edge_json_url?: string;
  version?: number;
}

export interface CustomizerSectionAddedEvent {
  store_id: number;
  page_type: PageType;
  section_type: SectionType;
  section_id: string;
}

export interface CustomizerSectionUpdatedEvent {
  store_id: number;
  section_id: number;
  changes: Partial<PageSection>;
}

export interface CustomizerSectionDeletedEvent {
  store_id: number;
  section_id: number;
}

export interface CustomizerTemplateAppliedEvent {
  store_id: number;
  template_id: number;
  template_name: string;
}

export interface CustomizerThemeSettingsUpdatedEvent {
  store_id: number;
  settings: Partial<ThemeGlobalSettings>;
}

export interface CustomizerCustomSectionCreatedEvent {
  store_id: number;
  section_name: string;
}

