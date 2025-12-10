'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { Popup } from '@/types/content';

interface PopupManagerProps {
  storeId: number;
}

export function PopupManager({ storeId }: PopupManagerProps) {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [activePopup, setActivePopup] = useState<Popup | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState<Set<number>>(new Set());
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const exitIntentDetectedRef = useRef(false);

  // טעינת פופאפים פעילים
  useEffect(() => {
    if (!storeId) return;

    const loadPopups = async () => {
      try {
        const response = await fetch(`/api/storefront/popups?storeId=${storeId}`);
        if (!response.ok) return;
        const data = await response.json();
        setPopups(data.popups || []);
      } catch (error) {
        console.error('Error loading popups:', error);
      }
    };

    loadPopups();
  }, [storeId]);

  // בדיקה אם פופאפ כבר הוצג (localStorage)
  const hasPopupBeenShown = useCallback((popupId: number): boolean => {
    if (typeof window === 'undefined') return false;
    const key = `popup_shown_${popupId}`;
    return localStorage.getItem(key) === 'true';
  }, []);

  // שמירה שפופאפ הוצג
  const markPopupAsShown = useCallback((popupId: number) => {
    if (typeof window === 'undefined') return;
    const key = `popup_shown_${popupId}`;
    localStorage.setItem(key, 'true');
    setHasTriggered(prev => new Set(prev).add(popupId));
  }, []);

  // סגירת פופאפ
  const closePopup = useCallback(() => {
    setIsVisible(false);
    if (activePopup) {
      markPopupAsShown(activePopup.id);
    }
    setTimeout(() => {
      setActivePopup(null);
    }, 300);
  }, [activePopup, markPopupAsShown]);

  // הצגת פופאפ
  const showPopup = useCallback((popup: Popup) => {
    // בדיקה אם כבר הוצג
    if (hasPopupBeenShown(popup.id) || hasTriggered.has(popup.id)) {
      return;
    }

    setActivePopup(popup);
    setIsVisible(true);
  }, [hasPopupBeenShown, hasTriggered]);

  // טריגר: page_load - הצגה מיד בטעינת הדף
  useEffect(() => {
    if (popups.length === 0) return;

    const pageLoadPopup = popups.find(
      p => p.trigger_type === 'page_load' && !hasPopupBeenShown(p.id)
    );

    if (pageLoadPopup) {
      // עיכוב קצר כדי שהדף יטען
      setTimeout(() => {
        showPopup(pageLoadPopup);
      }, 500);
    }
  }, [popups, hasPopupBeenShown, showPopup]);

  // טריגר: time - הצגה אחרי X שניות
  useEffect(() => {
    if (popups.length === 0) return;

    const timePopup = popups.find(
      p => p.trigger_type === 'time' && 
           p.trigger_value && 
           !hasPopupBeenShown(p.id)
    );

    if (!timePopup || !timePopup.trigger_value) return;

    // התחלת טיימר
    timeIntervalRef.current = setInterval(() => {
      setTimeOnPage(prev => prev + 1);
    }, 1000);

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [popups, hasPopupBeenShown]);

  // בדיקת זמן
  useEffect(() => {
    if (timeOnPage === 0) return;

    const timePopup = popups.find(
      p => p.trigger_type === 'time' && 
           p.trigger_value && 
           p.trigger_value <= timeOnPage &&
           !hasPopupBeenShown(p.id) &&
           !hasTriggered.has(p.id)
    );

    if (timePopup) {
      showPopup(timePopup);
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    }
  }, [timeOnPage, popups, hasPopupBeenShown, hasTriggered, showPopup]);

  // טריגר: scroll - הצגה אחרי X% גלילה
  useEffect(() => {
    if (popups.length === 0) return;

    let lastScrollCheck = 0;
    const scrollCheckDelay = 100; // בדיקה כל 100ms

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollCheck < scrollCheckDelay) return;
      lastScrollCheck = now;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      
      setScrollPercentage(percentage);

      // בדיקה אם יש פופאפ עם טריגר scroll
      const scrollPopup = popups.find(
        p => p.trigger_type === 'scroll' && 
             p.trigger_value && 
             percentage >= p.trigger_value &&
             !hasPopupBeenShown(p.id) &&
             !hasTriggered.has(p.id)
      );

      if (scrollPopup) {
        showPopup(scrollPopup);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [popups, hasPopupBeenShown, hasTriggered, showPopup]);

  // טריגר: exit_intent - זיהוי כוונת יציאה
  useEffect(() => {
    if (popups.length === 0) return;

    const exitIntentPopup = popups.find(
      p => p.trigger_type === 'exit_intent' && !hasPopupBeenShown(p.id)
    );

    if (!exitIntentPopup) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // אם העכבר עוזב את החלון מלמעלה
      if (e.clientY <= 0 && !exitIntentDetectedRef.current) {
        exitIntentDetectedRef.current = true;
        showPopup(exitIntentPopup);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [popups, hasPopupBeenShown, showPopup]);

  // ניקוי על unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  if (!activePopup || !isVisible) return null;

  // Extract image URL from display_rules or use default
  const imageUrl = activePopup.display_rules?.image_url || 
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800';

  return (
    <PopupContent
      popup={activePopup}
      storeId={storeId}
      imageUrl={imageUrl}
      isVisible={isVisible}
      onClose={closePopup}
    />
  );
}

// Newsletter Form Component
function NewsletterForm({ storeId, onSuccess }: { storeId: number; onSuccess?: () => void }) {
  const [email, setEmail] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return;
    }

    if (!privacyConsent) {
      alert('יש לאשר את מדיניות הפרטיות');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          email,
          email_marketing_consent: true,
          source: 'popup_newsletter',
          category_types: ['NEWSLETTER'],
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setEmail('');
        setPrivacyConsent(false);
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting newsletter:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">תודה שנרשמת!</h3>
        <p className="text-gray-600">נשלח אליך מייל עם פרטים נוספים</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="הכנס את כתובת המייל שלך"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
          style={{ textAlign: 'right' }}
          required
          dir="ltr"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'נרשם...' : 'הירשם עכשיו'}
        </button>
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => setPrivacyConsent(e.target.checked)}
          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black mt-1"
          required
        />
        <span className="text-sm text-gray-600 text-right">
          אני מאשר/ת את{' '}
          <a href="/privacy-policy" target="_blank" className="text-black hover:underline">
            מדיניות הפרטיות
          </a>
        </span>
      </label>

      {submitStatus === 'error' && (
        <p className="text-red-500 text-sm text-right">אירעה שגיאה. אנא נסו שוב.</p>
      )}
    </form>
  );
}

// Popup Content Component
function PopupContent({
  popup,
  storeId,
  imageUrl,
  isVisible,
  onClose,
}: {
  popup: Popup;
  storeId: number;
  imageUrl: string;
  isVisible: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Popup */}
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        dir="rtl"
      >
        <div
          className="bg-white rounded-none shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10 bg-white/80 backdrop-blur-sm"
            aria-label="סגור"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Content - Split Layout */}
          <div className="flex flex-col md:flex-row h-full">
            {/* Image Side */}
            <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative overflow-hidden">
              <img
                src={imageUrl}
                alt={popup.title || 'Popup'}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Text & Form Side */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              {popup.title && (
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {popup.title}
                </h2>
              )}
              
              {popup.content_html && (
                <div
                  className="prose prose-lg max-w-none text-gray-700 mb-6"
                  dangerouslySetInnerHTML={{ __html: popup.content_html }}
                />
              )}

              {/* Newsletter Form */}
              <NewsletterForm storeId={storeId} onSuccess={onClose} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

