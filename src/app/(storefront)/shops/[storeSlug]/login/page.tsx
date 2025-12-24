"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { useOptimisticToast } from "@/hooks/useOptimisticToast"
import { HiMail, HiArrowLeft, HiKey } from "react-icons/hi"
import Link from "next/link"
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader"
import { Skeleton } from "@/components/ui/Skeleton"
import { emitTrackingEvent } from "@/lib/tracking/events"

interface Store {
  id: number
  name: string
  logo: string | null
}

export default function StorefrontLoginPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useOptimisticToast()
  const storeSlug = params.storeSlug as string

  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    fetchStoreInfo()
    
    // בדיקה אם כבר מחובר
    const token = localStorage.getItem(`storefront_token_${storeSlug}`)
    const customerData = localStorage.getItem(`storefront_customer_${storeSlug}`)
    
    if (token && customerData) {
      router.push(`/shops/${storeSlug}/account`)
    }
  }, [storeSlug, router])

  const fetchStoreInfo = async () => {
    try {
      const response = await fetch(`/api/storefront/stores?slug=${storeSlug}`)
      if (response.ok) {
        const data = await response.json()
        setStore(data.store)
      }
    } catch (error) {
      console.error("Error fetching store info:", error)
    } finally {
      setLoading(false)
    }
  }

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!email) {
      setError("אנא הזן כתובת אימייל")
      return
    }

    setSendingOtp(true)

    try {
      const response = await fetch("/api/storefront/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeSlug,
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בשליחת קוד")
      }

      setOtpSent(true)
      setCountdown(60) // 60 seconds countdown
      toast({
        title: "קוד נשלח!",
        description: "בדוק את תיבת הדואר הנכנס שלך",
      })
    } catch (error: any) {
      console.error("Send OTP error:", error)
      setError(error.message || "שגיאה בשליחת קוד. נסה שוב.")
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!otpCode || otpCode.length !== 6) {
      setError("אנא הזן קוד בן 6 ספרות")
      return
    }

    setVerifyingOtp(true)

    try {
      const response = await fetch("/api/storefront/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeSlug,
          email,
          code: otpCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "קוד שגוי")
      }

      // שמירת הטוקן והלקוח ב-localStorage
      localStorage.setItem(`storefront_token_${storeSlug}`, data.token)
      localStorage.setItem(`storefront_customer_${storeSlug}`, JSON.stringify(data.customer))

      // ✅ שליחת event לעדכון הקומפוננטות (כמו צ'ק אאוט)
      window.dispatchEvent(new Event('customerDataChanged'))

      // Track Login event
      emitTrackingEvent({
        event: 'Login',
        method: 'otp',
        user_id: String(data.customer.id || data.customer.email),
      })

      toast({
        title: "התחברות הצליחה!",
        description: `ברוך הבא, ${data.customer.first_name || data.customer.email}`,
      })

      // ✅ בדיקה אם יש redirect parameter (למשל מצ'ק אאוט)
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect')
      if (redirectUrl) {
        router.push(redirectUrl)
      } else {
        // הפניה לדף החשבון
        router.push(`/shops/${storeSlug}/account`)
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error)
      setError(error.message || "קוד שגוי. נסה שוב.")
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    
    setError(null)
    setSendingOtp(true)

    try {
      const response = await fetch("/api/storefront/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeSlug,
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בשליחת קוד")
      }

      setCountdown(60)
      toast({
        title: "קוד נשלח שוב!",
        description: "בדוק את תיבת הדואר הנכנס שלך",
      })
    } catch (error: any) {
      console.error("Resend OTP error:", error)
      setError(error.message || "שגיאה בשליחת קוד. נסה שוב.")
    } finally {
      setSendingOtp(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <StorefrontHeader 
          storeSlug={storeSlug}
          storeName={undefined}
          storeLogo={undefined}
        />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Logo/Title Skeleton */}
            <div className="text-center space-y-4">
              <Skeleton className="h-16 w-32 mx-auto" />
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
            
            {/* Form Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
            
            {/* Back Link Skeleton */}
            <div className="text-center">
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <StorefrontHeader 
        storeSlug={storeSlug}
        storeName={store?.name}
        storeLogo={store?.logo || undefined}
      />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="flex justify-center mb-3 sm:mb-4">
              {store?.logo ? (
                <img 
                  src={store.logo} 
                  alt={store.name} 
                  className="h-12 sm:h-16 w-auto object-contain"
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {store?.name || "התחברות"}
                </h1>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              התחבר לחשבון שלך
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              או{" "}
              <Link
                href={`/shops/${storeSlug}/register`}
                className="font-medium text-black hover:text-gray-800 underline-offset-2 hover:underline transition-all"
              >
                צור חשבון חדש
              </Link>
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            {!otpSent ? (
              <form className="space-y-5 sm:space-y-6" onSubmit={handleSendOtp}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm sm:text-base">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    כתובת אימייל
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <HiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      dir="ltr"
                      className="pr-10 text-sm sm:text-base h-11 sm:h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      disabled={sendingOtp}
                    />
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-gray-500">
                    נשלח לך קוד התחברות חד-פעמי למייל
                  </p>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={sendingOtp || !email}
                    className="w-full flex justify-center py-3 sm:py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-colors"
                  >
                    {sendingOtp ? "שולח קוד..." : "שלח קוד התחברות"}
                  </Button>
                </div>
              </form>
            ) : (
              <form className="space-y-5 sm:space-y-6" onSubmit={handleVerifyOtp}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm sm:text-base">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="otp" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    קוד התחברות
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <HiKey className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      dir="ltr"
                      className="pr-10 text-center text-xl sm:text-2xl tracking-widest h-14 sm:h-16"
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setOtpCode(value)
                      }}
                      placeholder="000000"
                      disabled={verifyingOtp}
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-gray-500 break-all">
                    הקוד נשלח ל-{email}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={verifyingOtp || otpCode.length !== 6}
                    className="w-full flex justify-center py-3 sm:py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-colors"
                  >
                    {verifyingOtp ? "מאמת..." : "אימות והתחברות"}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || sendingOtp}
                      className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {countdown > 0 ? `שלח קוד שוב בעוד ${countdown} שניות` : "שלח קוד שוב"}
                    </button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false)
                        setOtpCode("")
                        setError(null)
                      }}
                      className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      שנה כתובת אימייל
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Back Link */}
          <div className="text-center pt-2">
            <Link
              href={`/shops/${storeSlug}`}
              className="inline-flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors"
            >
              <HiArrowLeft className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              חזור לחנות
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

