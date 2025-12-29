'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi';

interface InvitationData {
  id: number;
  email: string;
  storeName: string;
  role: string;
  roleLabel: string;
  expiresAt: string;
  inviterName: string;
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      setError('קישור הזמנה לא תקין');
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const response = await fetch(`/api/staff/accept-invitation?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'שגיאה בטעינת ההזמנה');
        return;
      }

      setInvitation(data.invitation);
    } catch (error) {
      setError('שגיאה בטעינת ההזמנה');
      console.error('Error loading invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !invitation) return;

    // Validation
    if (!formData.firstName.trim()) {
      setError('נא להזין שם פרטי');
      return;
    }

    if (!formData.lastName.trim()) {
      setError('נא להזין שם משפחה');
      return;
    }

    if (formData.password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/staff/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'שגיאה באישור ההזמנה');
        return;
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/staff/login');
      }, 2000);
    } catch (error) {
      setError('שגיאה באישור ההזמנה');
      console.error('Error accepting invitation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">טוען...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <HiCheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ההזמנה אושרה!</h1>
            <p className="text-gray-600 mb-4">החשבון שלך נוצר בהצלחה</p>
            <p className="text-sm text-gray-500">מעביר אותך לעמוד התחברות...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <HiXCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">קישור לא תקין</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/staff/login')} className="bg-green-500 hover:bg-green-600">
              חזרה להתחברות
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center text-white rounded-t-lg">
          <h1 className="text-2xl font-bold mb-2">הזמנה להצטרף לצוות</h1>
          <p className="text-green-50">{invitation?.storeName}</p>
        </div>

        <div className="p-6">
          {invitation && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <HiClock className="w-5 h-5" />
                  <span className="font-semibold">פרטי ההזמנה</span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>אימייל:</strong> {invitation.email}</p>
                  <p><strong>תפקיד:</strong> {invitation.roleLabel}</p>
                  <p><strong>מזמין:</strong> {invitation.inviterName}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="firstName">שם פרטי *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">שם משפחה *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">סיסמה *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="לפחות 8 תווים"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">אימות סיסמה *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="הזן שוב את הסיסמה"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  {submitting ? 'מאשר...' : 'אשר הזמנה וצור חשבון'}
                </Button>
              </form>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

