'use client';

import { useState, useEffect, use } from 'react';
import { AdvisorWizard } from '@/components/storefront/AdvisorWizard';
import { AdvisorQuizWithQuestions, AdvisorResult } from '@/types/advisor';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ storeSlug: string; slug: string }>;
}

export default function AdvisorPage({ params }: PageProps) {
  const { storeSlug, slug } = use(params);
  const [quiz, setQuiz] = useState<AdvisorQuizWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [storeSlug, slug]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/storefront/advisor/${slug}?store=${storeSlug}`);
      const data = await res.json();

      if (res.ok) {
        setQuiz(data.quiz);
      } else {
        setError(data.error || 'היועץ לא נמצא');
      }
    } catch (err) {
      setError('שגיאה בטעינת היועץ');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (results: AdvisorResult[]) => {
    console.log('Quiz completed with results:', results);
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const res = await fetch(`/api/storefront/products/${productId}`);
      const data = await res.json();
      
      if (res.ok && data.product) {
        console.log('Add to cart:', productId);
        window.location.href = `/shops/${storeSlug}/products/${data.product.handle}`;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {error || 'היועץ לא נמצא'}
          </h1>
          <p className="text-gray-500">
            ייתכן שהיועץ הוסר או שהכתובת שגויה
          </p>
          <a 
            href={`/shops/${storeSlug}`}
            className="inline-block px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            חזרה לחנות
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdvisorWizard
      quiz={quiz}
      storeSlug={storeSlug}
      onComplete={handleComplete}
      onAddToCart={handleAddToCart}
    />
  );
}

