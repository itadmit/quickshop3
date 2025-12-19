// Smart Advisor Types - יועץ חכם
// Plugin for personalized product recommendations based on quiz answers

// ============================================
// Database Models
// ============================================

/**
 * יועץ/שאלון - כל יועץ הוא שאלון עצמאי
 * למשל: "יועץ טיפוח שיער", "יועץ סוג עור"
 */
export interface AdvisorQuiz {
  id: number;
  store_id: number;
  
  // Basic Info
  title: string;
  slug: string;
  description: string | null;
  subtitle: string | null;
  
  // Media
  image_url: string | null;
  icon: string | null;
  
  // Settings
  is_active: boolean;
  show_progress_bar: boolean;
  show_question_numbers: boolean;
  allow_back_navigation: boolean;
  results_count: number;
  
  // Styling
  primary_color: string;
  background_color: string;
  button_style: 'rounded' | 'square' | 'pill';
  
  // CTA
  start_button_text: string;
  results_title: string;
  results_subtitle: string;
  
  // Tracking
  total_starts: number;
  total_completions: number;
  
  position: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * שאלה בשאלון
 */
export interface AdvisorQuestion {
  id: number;
  quiz_id: number;
  
  // Content
  question_text: string;
  question_subtitle: string | null;
  
  // Media
  image_url: string | null;
  
  // Type
  question_type: 'single' | 'multiple';
  
  // Layout
  answers_layout: 'grid' | 'list' | 'cards';
  columns: number;
  
  // Validation
  is_required: boolean;
  min_selections: number;
  max_selections: number | null;
  
  position: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * תשובה אפשרית לשאלה
 */
export interface AdvisorAnswer {
  id: number;
  question_id: number;
  
  // Content
  answer_text: string;
  answer_subtitle: string | null;
  
  // Media (one of)
  image_url: string | null;
  icon: string | null;
  emoji: string | null;
  color: string | null;
  
  // Internal Value
  value: string | null;
  
  position: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * משקל תשובה לחישוב ניקוד
 */
export interface AnswerWeight {
  answer_id: number;
  weight: number; // 1-100
}

/**
 * כלל בונוס - ניקוד נוסף אם כל התשובות נבחרו
 */
export interface BonusRule {
  all_answers: number[]; // array of answer_ids
  bonus: number; // ניקוד בונוס
}

/**
 * כלל התאמת מוצר לשאלון
 */
export interface AdvisorProductRule {
  id: number;
  quiz_id: number;
  product_id: number;
  
  // Weights
  answer_weights: AnswerWeight[];
  base_score: number;
  
  // Bonus
  bonus_rules: BonusRule | null;
  
  // Exclusions
  exclude_if_answers: number[];
  
  // Priority
  priority_boost: number;
  
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * תשובה שניתנה בסשן
 */
export interface SessionAnswer {
  question_id: number;
  answer_ids: number[];
}

/**
 * מוצר מומלץ עם ציון
 */
export interface RecommendedProduct {
  product_id: number;
  score: number;
  match_percentage?: number;
}

/**
 * סשן של הפעלת יועץ (לאנליטיקס)
 */
export interface AdvisorSession {
  id: number;
  quiz_id: number;
  
  session_id: string;
  customer_id: number | null;
  
  answers: SessionAnswer[];
  recommended_products: RecommendedProduct[] | null;
  
  started_at: Date;
  completed_at: Date | null;
  is_completed: boolean;
  
  user_agent: string | null;
  ip_address: string | null;
  
  converted_to_cart: boolean;
  converted_to_order: boolean;
  order_id: number | null;
  
  created_at: Date;
}

// ============================================
// Extended Types (with relations)
// ============================================

export interface AdvisorQuestionWithAnswers extends AdvisorQuestion {
  answers: AdvisorAnswer[];
}

export interface AdvisorQuizWithQuestions extends AdvisorQuiz {
  questions: AdvisorQuestionWithAnswers[];
}

export interface AdvisorProductRuleWithProduct extends AdvisorProductRule {
  product: {
    id: number;
    title: string;
    handle: string;
    image_url: string | null;
    price: string;
    compare_at_price: string | null;
  };
}

// ============================================
// API Request Types
// ============================================

export interface CreateAdvisorQuizRequest {
  title: string;
  slug?: string;
  description?: string;
  subtitle?: string;
  image_url?: string;
  icon?: string;
  is_active?: boolean;
  show_progress_bar?: boolean;
  show_question_numbers?: boolean;
  allow_back_navigation?: boolean;
  results_count?: number;
  primary_color?: string;
  background_color?: string;
  button_style?: 'rounded' | 'square' | 'pill';
  start_button_text?: string;
  results_title?: string;
  results_subtitle?: string;
  show_floating_button?: boolean;
}

export interface UpdateAdvisorQuizRequest extends Partial<CreateAdvisorQuizRequest> {}

export interface CreateAdvisorQuestionRequest {
  quiz_id: number;
  question_text: string;
  question_subtitle?: string;
  image_url?: string;
  question_type?: 'single' | 'multiple';
  answers_layout?: 'grid' | 'list' | 'cards';
  columns?: number;
  is_required?: boolean;
  min_selections?: number;
  max_selections?: number;
  position?: number;
}

export interface UpdateAdvisorQuestionRequest extends Partial<Omit<CreateAdvisorQuestionRequest, 'quiz_id'>> {}

export interface CreateAdvisorAnswerRequest {
  question_id: number;
  answer_text: string;
  answer_subtitle?: string;
  image_url?: string;
  icon?: string;
  emoji?: string;
  color?: string;
  value?: string;
  position?: number;
}

export interface UpdateAdvisorAnswerRequest extends Partial<Omit<CreateAdvisorAnswerRequest, 'question_id'>> {}

export interface CreateAdvisorProductRuleRequest {
  quiz_id: number;
  product_id: number;
  answer_weights: AnswerWeight[];
  base_score?: number;
  bonus_rules?: BonusRule;
  exclude_if_answers?: number[];
  priority_boost?: number;
}

export interface UpdateAdvisorProductRuleRequest extends Partial<Omit<CreateAdvisorProductRuleRequest, 'quiz_id' | 'product_id'>> {}

// ============================================
// Storefront Types (לחזית)
// ============================================

/**
 * מצב הויזארד בחזית
 */
export interface AdvisorWizardState {
  quiz: AdvisorQuizWithQuestions;
  currentQuestionIndex: number;
  answers: Map<number, number[]>; // question_id -> answer_ids
  isLoading: boolean;
  isCompleted: boolean;
  results: AdvisorResult[] | null;
}

/**
 * תוצאת יועץ - מוצר מומלץ עם פרטים מלאים
 */
export interface AdvisorResult {
  product_id: number;
  title: string;
  handle: string;
  image_url: string | null;
  price: string;
  compare_at_price: string | null;
  score: number;
  match_percentage: number; // 0-100
  match_reasons?: string[]; // "מתאים לשיער תלתלי", "מושלם לחפיפה יומית"
}

/**
 * בקשה לחישוב תוצאות
 */
export interface CalculateResultsRequest {
  quiz_id: number;
  answers: SessionAnswer[];
  session_id?: string;
}

/**
 * תגובת חישוב תוצאות
 */
export interface CalculateResultsResponse {
  results: AdvisorResult[];
  session_id: string;
  total_products_matched: number;
}

// ============================================
// Analytics Types
// ============================================

export interface AdvisorAnalytics {
  quiz_id: number;
  quiz_title: string;
  
  // Funnel
  total_starts: number;
  total_completions: number;
  completion_rate: number; // percentage
  
  // Conversion
  added_to_cart: number;
  converted_to_order: number;
  conversion_rate: number;
  
  // Revenue
  total_revenue: number;
  average_order_value: number;
  
  // Popular Answers
  popular_answers: {
    question_id: number;
    question_text: string;
    answers: {
      answer_id: number;
      answer_text: string;
      count: number;
      percentage: number;
    }[];
  }[];
  
  // Top Recommended Products
  top_products: {
    product_id: number;
    product_title: string;
    times_recommended: number;
    times_purchased: number;
  }[];
  
  // Time Period
  period_start: Date;
  period_end: Date;
}

export interface AdvisorDropoffAnalytics {
  quiz_id: number;
  
  // Where users drop off
  dropoff_by_question: {
    question_id: number;
    question_text: string;
    position: number;
    started: number;
    completed: number;
    dropoff_rate: number;
  }[];
}

