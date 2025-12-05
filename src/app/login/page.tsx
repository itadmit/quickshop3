'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiMail, HiLockClosed, HiArrowLeft } from 'react-icons/hi';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהתחברות');
      }

      const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 300);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'שגיאה בהתחברות. נסה שוב.');
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
            <h1 className="text-4xl font-logo text-gray-900 mb-2 whitespace-nowrap overflow-visible" style={{ lineHeight: '1.5', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
              Quick Shop
            </h1>
            <p className="text-sm text-gray-500 whitespace-nowrap">מערכת ניהול חנויות אונליין</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">התחבר לחשבון שלך</h2>
            <p className="text-sm text-gray-600">
              אנא הזן את הפרטים שלך
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="h-12 text-base border-gray-300 focus:!border-[#15b981] focus:!ring-[#15b981] focus-visible:!ring-[#15b981] focus-visible:!border-[#15b981] pr-10"
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
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  className="h-12 text-base border-gray-300 focus:!border-[#15b981] focus:!ring-[#15b981] focus-visible:!ring-[#15b981] focus-visible:!border-[#15b981] pr-10"
                />
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 space-x-reverse">
                <input type="checkbox" id="remember" className="w-4 h-4 text-[#15b981] border-gray-300 rounded focus:ring-[#15b981]" />
                <Label htmlFor="remember" className="text-gray-600 cursor-pointer">
                  זכור ל-30 יום
                </Label>
              </div>
              <Link href="#" className="text-[#15b981] hover:text-[#10b981] hover:underline">
                שכחת סיסמה?
              </Link>
            </div>
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 !bg-[#15b981] hover:!bg-[#10b981] !bg-none text-white font-semibold shadow-lg hover:shadow-xl transition-all border-0" 
                disabled={loading}
              >
                {loading ? "מתחבר..." : "התחבר"}
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
              התחבר עם Google
            </Button>
          </div>

          <div className="mt-6">
            <div className="text-sm text-center text-gray-600">
              אין לך חשבון?{" "}
              <Link href="/register" className="text-[#15b981] hover:text-[#10b981] hover:underline font-semibold">
                הירשם כעת
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
            src="/images/auth/login-bg.jpg"
            alt="Online shopping"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 0vw, 60vw"
          />
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        <div className="relative z-10 w-full flex items-center justify-center p-12 lg:p-16" dir="rtl">
          <div className="max-w-2xl text-white">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Empowering your business</h2>
            <p className="text-xl text-emerald-50 mb-8">ניהול חנות אונליין מקצועי במקום אחד</p>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-2">חנות מקצועית</h3>
                <p className="text-sm text-emerald-50">צור חנות אונליין מקצועית תוך דקות</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-2">ניהול פשוט</h3>
                <p className="text-sm text-emerald-50">ממשק ניהול אינטואיטיבי ונוח</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-2">ניתוחים ודוחות</h3>
                <p className="text-sm text-emerald-50">מעקב אחר מכירות והכנסות</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold mb-2">תשלומים ומשלוחים</h3>
                <p className="text-sm text-emerald-50">תמיכה מלאה בתשלומים ומשלוחים</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden fixed inset-0 bg-gradient-to-br from-[#15b981] via-emerald-600 to-emerald-700 -z-10 opacity-20"></div>
    </div>
  );
}
