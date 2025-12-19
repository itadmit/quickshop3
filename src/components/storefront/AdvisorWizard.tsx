'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart, Check, Sparkles, Brain, Zap, Target, Loader2 } from 'lucide-react';
import { 
  AdvisorQuizWithQuestions, 
  AdvisorQuestionWithAnswers,
  AdvisorAnswer,
  AdvisorResult,
  SessionAnswer,
} from '@/types/advisor';
import { useCart } from '@/hooks/useCart';
import { useCartOpen } from '@/hooks/useCartOpen';

// AI Thinking Steps - שלבים שמוצגים אחד אחד
const AI_LOADING_STEPS = [
  { text: 'קבלתי את התשובות שלך', icon: Check },
  { text: 'מנתח את ההעדפות שלך', icon: Brain },
  { text: 'הבנתי, מחפש התאמות', icon: Target },
  { text: 'מתכונן להצגה', icon: Sparkles },
];

// AI Response Phrases - משפטים שמופיעים ליד התוצאות
const AI_RESPONSE_PHRASES = [
  'על סמך הניתוח שלי',
  'בהתאם להעדפות שלך',
  'לאחר בחינת הנתונים',
  'המלצה אישית עבורך',
];

interface AdvisorWizardProps {
  quiz: AdvisorQuizWithQuestions;
  storeSlug: string;
  onComplete?: (results: AdvisorResult[]) => void;
  onAddToCart?: (productId: number) => void;
}

// AI Loading Animation Component - 4 Steps displayed sequentially
function AIThinkingLoader({ primaryColor }: { primaryColor: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  // Progress through steps - 1.5 seconds per step
  useEffect(() => {
    if (currentStep < AI_LOADING_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Animate dots for current step
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(dotsInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Brain icon container */}
      <div className="relative mb-10 w-32 h-32 flex items-center justify-center">
        {/* Animated background circles - centered */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: primaryColor, opacity: 0.08 }}
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{ backgroundColor: primaryColor, opacity: 0.12 }}
          animate={{
            scale: [1.05, 0.95, 1.05],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
        />

        {/* Main brain icon with pulse */}
        <motion.div
          className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
          animate={{
            boxShadow: [
              `0 0 0 0 ${primaryColor}30`,
              `0 0 0 15px ${primaryColor}00`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        >
          <Brain className="h-10 w-10" style={{ color: primaryColor }} />
        </motion.div>

        {/* Floating sparkle */}
        <motion.div
          className="absolute top-0 right-2 z-20"
          animate={{
            y: [0, -6, 0],
            opacity: [1, 0.6, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="h-5 w-5" style={{ color: primaryColor }} />
        </motion.div>
      </div>

      {/* Current step - one at a time */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-3 min-h-[60px]"
          dir="rtl"
        >
          {/* Step indicator */}
          <motion.div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {React.createElement(AI_LOADING_STEPS[currentStep].icon, {
              className: "h-5 w-5",
              style: { color: primaryColor }
            })}
          </motion.div>

          {/* Step text */}
          <span className="font-semibold text-xl text-gray-800">
            {AI_LOADING_STEPS[currentStep].text}
            <span className="inline-block w-8 text-right">{dots}</span>
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Step indicators (dots) */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {AI_LOADING_STEPS.map((_, index) => (
          <motion.div
            key={index}
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: index <= currentStep ? primaryColor : '#e5e7eb'
            }}
            animate={index === currentStep ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-64 mt-8">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: primaryColor }}
            initial={{ width: '0%' }}
            animate={{ 
              width: `${((currentStep + 1) / AI_LOADING_STEPS.length) * 100}%` 
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

// Typewriter effect hook
function useTypewriter(text: string, speed: number = 50) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isComplete };
}

export function AdvisorWizard({ 
  quiz, 
  storeSlug,
  onComplete,
  onAddToCart,
}: AdvisorWizardProps) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AdvisorResult[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

  // Cart hooks - use existing cart system
  const { addToCart } = useCart();
  const { openCart } = useCartOpen();

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // AI response phrase (random)
  const [aiPhrase] = useState(() => 
    AI_RESPONSE_PHRASES[Math.floor(Math.random() * AI_RESPONSE_PHRASES.length)]
  );

  // Handle add to cart - uses existing cart system and opens side cart
  const handleAddToCart = async (result: AdvisorResult) => {
    if (addingProductId) return; // Prevent double-click
    
    setAddingProductId(result.product_id);
    
    try {
      const success = await addToCart({
        variant_id: result.variant_id || result.product_id, // Use variant if available
        product_id: result.product_id,
        product_title: result.title,
        variant_title: '',
        price: result.compare_at_price && result.compare_at_price > result.price 
          ? result.price 
          : result.price,
        quantity: 1,
        image: result.image || undefined,
      });

      if (success) {
        // Open cart immediately
        openCart();
        // Also call the optional callback
        onAddToCart?.(result.product_id);
      }
    } catch (error) {
      console.error('[AdvisorWizard] Error adding to cart:', error);
    } finally {
      setAddingProductId(null);
    }
  };

  const isAnswerSelected = (answerId: number) => {
    const selected = answers.get(currentQuestion?.id);
    return selected?.includes(answerId) || false;
  };

  const handleAnswerSelect = (answer: AdvisorAnswer) => {
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    const currentAnswers = answers.get(questionId) || [];

    let newAnswers: number[];
    
    if (currentQuestion.question_type === 'single') {
      newAnswers = [answer.id];
    } else {
      if (currentAnswers.includes(answer.id)) {
        newAnswers = currentAnswers.filter(id => id !== answer.id);
      } else {
        newAnswers = [...currentAnswers, answer.id];
      }
    }

    setAnswers(new Map(answers.set(questionId, newAnswers)));

    // Auto-advance for single selection
    if (currentQuestion.question_type === 'single') {
      setTimeout(() => {
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          handleSubmit();
        }
      }, 300);
    }
  };

  const handleNext = () => {
    const currentAnswers = answers.get(currentQuestion?.id);
    
    if (currentQuestion?.is_required && (!currentAnswers || currentAnswers.length === 0)) {
      return;
    }

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const sessionAnswers: SessionAnswer[] = [];
      for (const [questionId, answerIds] of answers) {
        sessionAnswers.push({
          question_id: questionId,
          answer_ids: answerIds,
        });
      }

      // Add artificial delay for AI effect (minimum 2.5 seconds)
      const startTime = Date.now();
      
      const res = await fetch('/api/advisor/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quiz.id,
          answers: sessionAnswers,
        }),
      });

      const data = await res.json();

      // Ensure minimum loading time for AI effect - 4 steps x 1.5 seconds each
      const elapsed = Date.now() - startTime;
      const minLoadingTime = 6500; // 6.5 seconds to show all 4 steps
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed));
      }

      if (res.ok) {
        setResults(data.results);
        setSessionId(data.session_id);
        
        // Delay showing results for dramatic effect
        setTimeout(() => {
          setShowResults(true);
        }, 500);
        
        onComplete?.(data.results);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error calculating results:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    const currentAnswers = answers.get(currentQuestion.id);
    if (currentQuestion.is_required) {
      return currentAnswers && currentAnswers.length >= (currentQuestion.min_selections || 1);
    }
    return true;
  };

  const resetQuiz = () => {
    setStarted(false);
    setCurrentIndex(0);
    setAnswers(new Map());
    setResults(null);
    setShowResults(false);
  };

  // Start screen with AI branding
  if (!started) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: quiz.background_color }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full text-center space-y-6"
        >
          {/* AI Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: `${quiz.primary_color}15`,
              color: quiz.primary_color,
            }}
          >
            <Brain className="h-4 w-4" />
            מופעל על ידי AI
            <Sparkles className="h-4 w-4" />
          </motion.div>

          {quiz.image_url && (
            <motion.div 
              className="mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <img 
                src={quiz.image_url} 
                alt={quiz.title}
                className="w-32 h-32 mx-auto rounded-full object-cover shadow-lg"
              />
            </motion.div>
          )}
          
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-3xl font-bold" style={{ color: quiz.primary_color }}>
              {quiz.title}
            </h1>
            {quiz.subtitle && (
              <p className="text-lg text-gray-600">{quiz.subtitle}</p>
            )}
            {quiz.description && (
              <p className="text-gray-500">{quiz.description}</p>
            )}
          </motion.div>

          <motion.div 
            className="flex items-center justify-center gap-4 text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {totalQuestions} שאלות
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              פחות מדקה
            </span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStarted(true)}
            className={`
              px-8 py-4 text-lg font-semibold text-white transition-all shadow-lg hover:shadow-xl
              ${quiz.button_style === 'rounded' ? 'rounded-lg' : 
                quiz.button_style === 'pill' ? 'rounded-full' : 'rounded-none'}
            `}
            style={{ backgroundColor: quiz.primary_color }}
          >
            <span className="flex items-center gap-2">
              {quiz.start_button_text}
              <ChevronLeft className="h-5 w-5" />
            </span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // AI Loading screen
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: quiz.background_color }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <AIThinkingLoader primaryColor={quiz.primary_color} />
        </motion.div>
      </div>
    );
  }

  // Results screen with AI feel
  if (results && showResults) {
    return (
      <div 
        className="min-h-screen p-6"
        style={{ backgroundColor: quiz.background_color }}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          {/* AI Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            {/* Success animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${quiz.primary_color}15` }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Check 
                  className="h-8 w-8"
                  style={{ color: quiz.primary_color }}
                />
              </motion.div>
            </motion.div>

            {/* AI Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: `${quiz.primary_color}10`,
                color: quiz.primary_color,
              }}
            >
              <Brain className="h-3 w-3" />
              {aiPhrase}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl font-bold">{quiz.results_title}</h1>
              <p className="text-gray-600 mt-2">{quiz.results_subtitle}</p>
            </motion.div>
          </motion.div>

          {results.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-500 text-lg">
                לא מצאנו מוצרים מתאימים. נסה לענות על השאלות שוב.
              </p>
              <button
                onClick={resetQuiz}
                className={`
                  mt-6 px-6 py-3 font-semibold text-white
                  ${quiz.button_style === 'rounded' ? 'rounded-lg' : 
                    quiz.button_style === 'pill' ? 'rounded-full' : 'rounded-none'}
                `}
                style={{ backgroundColor: quiz.primary_color }}
              >
                נסה שוב
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => (
                <motion.div
                  key={result.product_id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.15 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  {result.image_url && (
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={result.image_url}
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Match percentage with AI styling */}
                      <div className="absolute top-3 right-3">
                        <motion.div
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.7 + index * 0.15, type: 'spring' }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-lg"
                          style={{ backgroundColor: quiz.primary_color }}
                        >
                          <Target className="h-3 w-3" />
                          {result.match_percentage}%
                        </motion.div>
                      </div>
                      
                      {/* AI Recommended badge for top result */}
                      {index === 0 && (
                        <div className="absolute top-3 left-3">
                          <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900"
                          >
                            <Sparkles className="h-3 w-3" />
                            המלצת AI
                          </motion.div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-lg line-clamp-2">{result.title}</h3>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold" style={{ color: quiz.primary_color }}>
                        ₪{result.price}
                      </span>
                      {result.compare_at_price && parseFloat(result.compare_at_price) > parseFloat(result.price) && (
                        <span className="text-sm text-gray-400 line-through">
                          ₪{result.compare_at_price}
                        </span>
                      )}
                    </div>

                    {result.match_reasons && result.match_reasons.length > 0 && (
                      <div className="space-y-1">
                        {result.match_reasons.map((reason, i) => (
                          <div key={i} className="flex items-center gap-1 text-sm text-gray-600">
                            <Check className="h-3 w-3 text-green-500" />
                            {reason}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/shops/${storeSlug}/products/${result.handle}`}
                        className={`
                          flex-1 py-2.5 text-center font-semibold border-2 transition-colors hover:bg-gray-50
                          ${quiz.button_style === 'rounded' ? 'rounded-lg' : 
                            quiz.button_style === 'pill' ? 'rounded-full' : 'rounded-none'}
                        `}
                        style={{ 
                          borderColor: quiz.primary_color,
                          color: quiz.primary_color,
                        }}
                      >
                        צפייה
                      </Link>
                      <button
                        onClick={() => handleAddToCart(result)}
                        disabled={addingProductId === result.product_id}
                        className={`
                          flex-1 py-2.5 flex items-center justify-center gap-2 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70
                          ${quiz.button_style === 'rounded' ? 'rounded-lg' : 
                            quiz.button_style === 'pill' ? 'rounded-full' : 'rounded-none'}
                        `}
                        style={{ backgroundColor: quiz.primary_color }}
                      >
                        {addingProductId === result.product_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                        {addingProductId === result.product_id ? 'מוסיף...' : 'הוסף'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Restart button */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center pt-6"
          >
            <button
              onClick={resetQuiz}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              התחל מחדש
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show loading placeholder while transitioning to results
  if (results && !showResults) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: quiz.background_color }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5 }}
          >
            <Check 
              className="h-16 w-16 mx-auto"
              style={{ color: quiz.primary_color }}
            />
          </motion.div>
          <p className="mt-4 text-gray-600 font-medium">מוכן!</p>
        </motion.div>
      </div>
    );
  }

  // Question screen
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: quiz.background_color }}
    >
      {/* Progress bar */}
      {quiz.show_progress_bar && (
        <div className="h-1.5 bg-gray-200">
          <motion.div
            className="h-full"
            style={{ backgroundColor: quiz.primary_color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="p-4 flex items-center justify-between">
        {quiz.allow_back_navigation && currentIndex > 0 ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
            חזרה
          </button>
        ) : (
          <div />
        )}
        
        {quiz.show_question_numbers && (
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              שאלה {currentIndex + 1} מתוך {totalQuestions}
            </span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl w-full space-y-8"
          >
            {/* Question text */}
            <div className="text-center space-y-2">
              {currentQuestion.image_url && (
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={currentQuestion.image_url}
                  alt=""
                  className="w-24 h-24 mx-auto rounded-full object-cover mb-4 shadow-lg"
                />
              )}
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-3xl font-bold"
              >
                {currentQuestion.question_text}
              </motion.h2>
              {currentQuestion.question_subtitle && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-500"
                >
                  {currentQuestion.question_subtitle}
                </motion.p>
              )}
              {currentQuestion.question_type === 'multiple' && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-gray-400"
                >
                  ניתן לבחור מספר תשובות
                </motion.p>
              )}
            </div>

            {/* Answers */}
            <div 
              className="grid gap-3"
              style={{
                gridTemplateColumns: currentQuestion.answers_layout === 'grid'
                  ? `repeat(${Math.min(currentQuestion.columns || 2, 4)}, minmax(0, 1fr))`
                  : '1fr',
              }}
            >
              {currentQuestion.answers.map((answer, answerIndex) => {
                const selected = isAnswerSelected(answer.id);
                
                return (
                  <motion.button
                    key={answer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + answerIndex * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswerSelect(answer)}
                    className={`
                      relative p-4 text-right border-2 transition-all shadow-sm hover:shadow-md
                      ${currentQuestion.answers_layout === 'cards' ? 'aspect-square flex flex-col items-center justify-center text-center' : ''}
                      ${quiz.button_style === 'rounded' ? 'rounded-xl' : 
                        quiz.button_style === 'pill' ? 'rounded-3xl' : 'rounded-none'}
                    `}
                    style={{
                      borderColor: selected ? quiz.primary_color : '#e5e7eb',
                      backgroundColor: selected ? `${quiz.primary_color}10` : 'white',
                    }}
                  >
                    <div className={`flex items-center gap-3 ${
                      currentQuestion.answers_layout === 'cards' ? 'flex-col' : ''
                    }`}>
                      {/* Media */}
                      {answer.image_url ? (
                        <img
                          src={answer.image_url}
                          alt=""
                          className={`rounded-lg object-cover ${
                            currentQuestion.answers_layout === 'cards'
                              ? 'w-16 h-16'
                              : 'w-12 h-12'
                          }`}
                        />
                      ) : answer.emoji ? (
                        <span className={
                          currentQuestion.answers_layout === 'cards' ? 'text-4xl' : 'text-2xl'
                        }>
                          {answer.emoji}
                        </span>
                      ) : answer.color ? (
                        <div 
                          className={`rounded-full border-2 ${
                            currentQuestion.answers_layout === 'cards' ? 'w-12 h-12' : 'w-8 h-8'
                          }`}
                          style={{ 
                            backgroundColor: answer.color,
                            borderColor: selected ? quiz.primary_color : 'transparent',
                          }}
                        />
                      ) : null}

                      {/* Text */}
                      <div className={currentQuestion.answers_layout === 'cards' ? 'text-center' : 'flex-1'}>
                        <p className="font-semibold">{answer.answer_text}</p>
                        {answer.answer_subtitle && (
                          <p className="text-sm text-gray-500">
                            {answer.answer_subtitle}
                          </p>
                        )}
                      </div>

                      {/* Selection indicator */}
                      {currentQuestion.question_type === 'multiple' && (
                        <div 
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            currentQuestion.answers_layout === 'cards' ? 'absolute top-3 left-3' : ''
                          }`}
                          style={{
                            borderColor: selected ? quiz.primary_color : '#d1d5db',
                            backgroundColor: selected ? quiz.primary_color : 'transparent',
                          }}
                        >
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      )}

                      {/* Single selection check */}
                      {currentQuestion.question_type === 'single' && selected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: quiz.primary_color }}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Next button for multiple selection */}
            {currentQuestion.question_type === 'multiple' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`
                    px-8 py-3 font-semibold text-white transition-all shadow-lg
                    ${quiz.button_style === 'rounded' ? 'rounded-lg' : 
                      quiz.button_style === 'pill' ? 'rounded-full' : 'rounded-none'}
                    ${!canProceed() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-xl'}
                  `}
                  style={{ backgroundColor: quiz.primary_color }}
                >
                  <span className="flex items-center gap-2">
                    {currentIndex === totalQuestions - 1 ? 'קבל המלצות' : 'המשך'}
                    <ChevronLeft className="h-5 w-5" />
                  </span>
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
