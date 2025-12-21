"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { useOptimisticToast } from "@/hooks/useOptimisticToast"
import { HiMail, HiArrowLeft, HiUser, HiPhone, HiIdentification, HiCalendar } from "react-icons/hi"
import Link from "next/link"
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader"
import { Skeleton } from "@/components/ui/Skeleton"
import { emitTrackingEvent } from "@/lib/tracking/events"

interface Store {
  id: number
  name: string
  logo: string | null
  settings?: {
    show_id_number?: boolean
    show_birth_date?: boolean
  }
}

export default function StorefrontRegisterPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useOptimisticToast()
  const storeSlug = params.storeSlug as string

  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    id_number: "",
    birth_date: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchStoreInfo()
  }, [storeSlug])

  const fetchStoreInfo = async () => {
    try {
      const response = await fetch(`/api/storefront/stores?slug=${storeSlug}`)
      if (response.ok) {
        const data = await response.json()
        setStore(data.store)
        
        // Fetch store settings for showing/hiding fields
        try {
          const settingsResponse = await fetch(`/api/storefront/stores/${data.store.id}/settings`)
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json()
            setStore(prev => prev ? { ...prev, settings: settingsData.settings } : null)
          }
        } catch (err) {
          // If settings fetch fails, use defaults
          console.error('Error fetching store settings:', err)
        }
      }
    } catch (error) {
      console.error("Error fetching store info:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name?.trim()) {
      newErrors.first_name = "שם פרטי הוא שדה חובה"
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = "שם משפחה הוא שדה חובה"
    }

    if (!formData.email?.trim()) {
      newErrors.email = "אימייל הוא שדה חובה"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "כתובת אימייל לא תקינה"
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "טלפון הוא שדה חובה"
    } else if (!/^[0-9]{9,10}$/.test(formData.phone.replace(/-/g, ""))) {
      newErrors.phone = "מספר טלפון לא תקין (9-10 ספרות)"
    }

    if (store?.settings?.show_id_number && !formData.id_number?.trim()) {
      newErrors.id_number = "מספר תעודת זהות הוא שדה חובה"
    } else if (formData.id_number && !/^[0-9]{9}$/.test(formData.id_number.replace(/-/g, ""))) {
      newErrors.id_number = "מספר תעודת זהות לא תקין (9 ספרות)"
    }

    if (store?.settings?.show_birth_date && !formData.birth_date) {
      newErrors.birth_date = "תאריך לידה הוא שדה חובה"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setRegistering(true)

    try {
      const response = await fetch("/api/storefront/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeSlug,
          ...formData,
          id_number: store?.settings?.show_id_number ? formData.id_number : undefined,
          birth_date: store?.settings?.show_birth_date ? formData.birth_date : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בהרשמה")
      }

      // Track SignUp event
      emitTrackingEvent({
        event: 'SignUp',
        method: 'email',
      })

      toast({
        title: "הרשמה הצליחה!",
        description: "קוד התחברות נשלח למייל שלך",
      })

      // Redirect to login page with email pre-filled
      router.push(`/shops/${storeSlug}/login?email=${encodeURIComponent(formData.email)}`)
    } catch (error: any) {
      console.error("Register error:", error)
      toast({
        title: "שגיאה בהרשמה",
        description: error.message || "אירעה שגיאה בהרשמה. נסה שוב.",
        variant: "destructive",
      })
    } finally {
      setRegistering(false)
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
            <div className="text-center space-y-4">
              <Skeleton className="h-16 w-32 mx-auto" />
              <Skeleton className="h-8 w-64 mx-auto" />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
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
                  {store?.name || "הרשמה"}
                </h1>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              צור חשבון חדש
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              או{" "}
              <Link
                href={`/shops/${storeSlug}/login`}
                className="font-medium text-black hover:text-gray-800 underline-offset-2 hover:underline transition-all"
              >
                התחבר לחשבון קיים
              </Link>
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
              {/* First Name */}
              <div>
                <Label htmlFor="first_name" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  שם פרטי *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <HiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    className={`pr-10 text-sm sm:text-base h-11 sm:h-12 ${errors.first_name ? 'border-red-500' : ''}`}
                    value={formData.first_name}
                    onChange={(e) => {
                      setFormData({ ...formData, first_name: e.target.value })
                      if (errors.first_name) setErrors({ ...errors, first_name: "" })
                    }}
                    placeholder="שם פרטי"
                    disabled={registering}
                  />
                </div>
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="last_name" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  שם משפחה *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <HiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    className={`pr-10 text-sm sm:text-base h-11 sm:h-12 ${errors.last_name ? 'border-red-500' : ''}`}
                    value={formData.last_name}
                    onChange={(e) => {
                      setFormData({ ...formData, last_name: e.target.value })
                      if (errors.last_name) setErrors({ ...errors, last_name: "" })
                    }}
                    placeholder="שם משפחה"
                    disabled={registering}
                  />
                </div>
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  אימייל *
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
                    className={`pr-10 text-sm sm:text-base h-11 sm:h-12 ${errors.email ? 'border-red-500' : ''}`}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: "" })
                    }}
                    placeholder="your@email.com"
                    disabled={registering}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  טלפון *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <HiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    dir="ltr"
                    className={`pr-10 text-sm sm:text-base h-11 sm:h-12 ${errors.phone ? 'border-red-500' : ''}`}
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")
                      setFormData({ ...formData, phone: value })
                      if (errors.phone) setErrors({ ...errors, phone: "" })
                    }}
                    placeholder="0501234567"
                    maxLength={10}
                    disabled={registering}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* ID Number - Conditional */}
              {store?.settings?.show_id_number && (
                <div>
                  <Label htmlFor="id_number" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    מספר תעודת זהות *
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <HiIdentification className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="id_number"
                      name="id_number"
                      type="text"
                      required
                      dir="ltr"
                      className={`pr-10 text-sm sm:text-base h-11 sm:h-12 ${errors.id_number ? 'border-red-500' : ''}`}
                      value={formData.id_number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 9)
                        setFormData({ ...formData, id_number: value })
                        if (errors.id_number) setErrors({ ...errors, id_number: "" })
                      }}
                      placeholder="123456789"
                      maxLength={9}
                      disabled={registering}
                    />
                  </div>
                  {errors.id_number && (
                    <p className="mt-1 text-xs text-red-600">{errors.id_number}</p>
                  )}
                </div>
              )}

              {/* Birth Date - Conditional */}
              {store?.settings?.show_birth_date && (
                <div>
                  <Label htmlFor="birth_date" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    תאריך לידה *
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <HiCalendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="birth_date"
                      name="birth_date"
                      type="date"
                      required
                      className={`pr-10 text-sm sm:text-base h-11 sm:h-12 ${errors.birth_date ? 'border-red-500' : ''}`}
                      value={formData.birth_date}
                      onChange={(e) => {
                        setFormData({ ...formData, birth_date: e.target.value })
                        if (errors.birth_date) setErrors({ ...errors, birth_date: "" })
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      disabled={registering}
                    />
                  </div>
                  {errors.birth_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.birth_date}</p>
                  )}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  disabled={registering}
                  className="w-full flex justify-center py-3 sm:py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-colors"
                >
                  {registering ? "נרשם..." : "הרשמה"}
                </Button>
              </div>
            </form>
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

