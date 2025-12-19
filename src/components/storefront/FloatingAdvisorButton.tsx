/**
 * Floating Advisor Button
 * כפתור צף בדף הבית שמוביל ליועץ החכם
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, X, Sparkles } from 'lucide-react';

interface FloatingAdvisorButtonProps {
  storeSlug: string;
  storeId: number;
}

interface AdvisorQuiz {
  id: number;
  title: string;
  slug: string;
  description?: string;
  primary_color?: string;
  icon?: string;
}

export function FloatingAdvisorButton({ storeSlug, storeId }: FloatingAdvisorButtonProps) {
  const [advisors, setAdvisors] = useState<AdvisorQuiz[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Fetch active advisors with floating button enabled
  useEffect(() => {
    const fetchAdvisors = async () => {
      try {
        const response = await fetch(`/api/storefront/${storeSlug}/advisors?floating=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.advisors && data.advisors.length > 0) {
            setAdvisors(data.advisors);
            // Show button after a small delay for better UX
            setTimeout(() => setIsVisible(true), 1500);
          }
        }
      } catch (error) {
        console.error('Error fetching advisors:', error);
      }
    };

    fetchAdvisors();
  }, [storeSlug]);

  // Don't render if no advisors or dismissed
  if (advisors.length === 0 || dismissed) {
    return null;
  }

  const primaryColor = advisors[0]?.primary_color || '#6366f1';

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => setDismissed(true), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-6 left-6 z-50" dir="rtl">
          {/* Main Button */}
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {advisors.length === 1 ? (
              // Single advisor - direct link
              <Link
                href={`/shops/${storeSlug}/advisor/${advisors[0].slug}`}
                className="group relative flex items-center gap-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: primaryColor }}
              >
                {/* Dismiss button */}
                <button
                  onClick={handleDismiss}
                  className="absolute -top-2 -left-2 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900 z-10"
                  aria-label="סגור"
                >
                  <X className="h-3 w-3" />
                </button>
                
                {/* Button content */}
                <div className="flex items-center gap-3 px-5 py-3">
                  <div className="relative">
                    <Wand2 className="h-6 w-6 text-white" />
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        repeatDelay: 3 
                      }}
                    >
                      <Sparkles className="h-3 w-3 text-yellow-300" />
                    </motion.div>
                  </div>
                  <span className="text-white font-medium text-sm whitespace-nowrap">
                    {advisors[0].title}
                  </span>
                </div>

                {/* Pulsing ring animation */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              </Link>
            ) : (
              // Multiple advisors - show menu on click
              <>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="group relative flex items-center gap-3 px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: primaryColor }}
                >
                  {/* Dismiss button */}
                  <button
                    onClick={handleDismiss}
                    className="absolute -top-2 -left-2 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-900 z-10"
                    aria-label="סגור"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  
                  <div className="relative">
                    <Wand2 className="h-6 w-6 text-white" />
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        repeatDelay: 3 
                      }}
                    >
                      <Sparkles className="h-3 w-3 text-yellow-300" />
                    </motion.div>
                  </div>
                  <span className="text-white font-medium text-sm">
                    יועץ חכם
                  </span>
                </button>

                {/* Advisors Menu */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[200px]"
                    >
                      {advisors.map((advisor, index) => (
                        <Link
                          key={advisor.id}
                          href={`/shops/${storeSlug}/advisor/${advisor.slug}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          style={{ borderTop: index > 0 ? '1px solid #f3f4f6' : 'none' }}
                          onClick={() => setIsOpen(false)}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${advisor.primary_color || primaryColor}20` }}
                          >
                            <Wand2 
                              className="h-4 w-4" 
                              style={{ color: advisor.primary_color || primaryColor }} 
                            />
                          </div>
                          <div>
                            <span className="text-gray-900 font-medium text-sm block">
                              {advisor.title}
                            </span>
                            {advisor.description && (
                              <span className="text-gray-500 text-xs line-clamp-1">
                                {advisor.description}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

