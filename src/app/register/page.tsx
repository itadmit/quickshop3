'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiMail, HiLockClosed, HiUser, HiOfficeBuilding, HiPhone, HiArrowLeft } from 'react-icons/hi';
import Image from 'next/image';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
  });

  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setFormData((prev) => ({ ...prev, email: emailFromUrl }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהרשמה');
      }

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'שגיאה בהרשמה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Form - 40% */}
      <div className="flex-1 lg:w-2/5 flex items-center justify-center bg-white p-8 lg:p-12" dir="rtl">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 overflow-visible pt-2 pb-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 whitespace-nowrap overflow-visible" style={{ letterSpacing: '2px', lineHeight: '1.5', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
              Quick Shop
            </h1>
            <p className="text-sm text-gray-500 whitespace-nowrap">מערכת ניהול חנויות אונליין</p>
          </div>

          <div className="mb-8">
            <div className="mb-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
              <span className="text-emerald-700 font-semibold">✨ 7 ימי נסיון חינם - ללא צורך באשראי</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">צור חשבון חדש</h2>
            <p className="text-sm text-gray-600">
              מלא את הפרטים ליצירת חשבון והתחל למכור אונליין
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                שם מלא
              </Label>
              <div className="relative">
                <HiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="ישראל ישראלי"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                אימייל
              </Label>
              <div className="relative">
                <HiMail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="הזן את האימייל שלך"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                סיסמה
              </Label>
              <div className="relative">
                <HiLockClosed className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="לפחות 8 תווים"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  minLength={8}
                  className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                שם החברה
              </Label>
              <div className="relative">
                <HiOfficeBuilding className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="החברה שלי בע״מ"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  disabled={loading}
                  className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                טלפון
              </Label>
              <div className="relative">
                <HiPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="050-1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                  className="h-12 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all" 
                disabled={loading}
              >
                {loading ? "יוצר חשבון..." : "צור חשבון"}
              </Button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">או</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                // Google sign in - implement if needed
              }}
              disabled={loading}
              className="w-full h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              הירשם עם Google
            </Button>
          </div>

          <div className="mt-6">
            <div className="text-sm text-center text-gray-600">
              כבר יש לך חשבון?{" "}
              <Link href="/login" className="text-emerald-600 hover:text-emerald-700 hover:underline font-semibold">
                התחבר
              </Link>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-2">
              <HiArrowLeft className="w-4 h-4" />
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </div>

      {/* Right Preview - 60% */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0">
          <Image
            src="/images/auth/register-bg.jpg"
            alt="Business growth"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 0vw, 60vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-800/75 to-emerald-900/85"></div>
        </div>

        <div className="relative z-10 w-full flex items-center justify-center p-12 lg:p-16" dir="rtl">
          <div className="max-w-2xl text-white">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Start your journey</h2>
            <p className="text-xl text-emerald-100 mb-8">התחל ליצור את החנות האונליין שלך היום</p>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-2">התחלה מהירה</h3>
                <p className="text-sm text-emerald-100">הקמת חנות אונליין תוך דקות</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-2">עיצוב מקצועי</h3>
                <p className="text-sm text-emerald-100">תבניות מוכנות ועיצוב מודרני</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-2">תמיכה מלאה</h3>
                <p className="text-sm text-emerald-100">כל הכלים לניהול החנות שלך</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-2">גדל בקלות</h3>
                <p className="text-sm text-emerald-100">פתרון שמתאים לכל גודל עסק</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden fixed inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 -z-10 opacity-20"></div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
