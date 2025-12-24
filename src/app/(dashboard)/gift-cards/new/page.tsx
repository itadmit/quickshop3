'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { HiSave, HiX, HiGift, HiMail, HiUser, HiSearch } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { ContactWithDetails } from '@/types/contact';

export default function NewGiftCardPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<ContactWithDetails[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    initial_value: '',
    currency: 'ILS',
    expires_at: '',
    customer_id: '',
    customer_name: '',
    order_id: '',
    note: '',
    // פרטי נמען ושולח
    recipient_email: '',
    recipient_name: '',
    sender_name: '',
    message: '',
    send_email: true,
    is_active: true,
  });

  // Reload contacts when dialog opens or search changes
  useEffect(() => {
    if (showCustomerDialog) {
      const timeoutId = setTimeout(() => {
        loadContacts(customerSearch);
      }, customerSearch ? 300 : 0);
      return () => clearTimeout(timeoutId);
    }
  }, [customerSearch, showCustomerDialog]);

  const loadContacts = async (searchTerm?: string) => {
    try {
      setCustomerError(null);
      const params = new URLSearchParams();
      params.append('limit', '20');
      params.append('page', '1');
      // Only fetch contacts that have a customer_id
      params.append('has_customer', 'true');
      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      const response = await fetch(`/api/contacts?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errorData: any = {};
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse error response as JSON:', jsonError);
          }
        }
        
        const errorMessage = errorData?.error || errorData?.message || 
          (response.status === 401 ? 'אינך מחובר. אנא התחבר מחדש.' :
           response.status === 403 ? 'אין לך הרשאה לגשת לאנשי קשר.' :
           response.status === 500 ? 'שגיאת שרת. אנא נסה שוב מאוחר יותר.' :
           `שגיאה בטעינת אנשי קשר: ${response.status} ${response.statusText}`);
        
        setCustomerError(errorMessage);
        setContacts([]);
        return;
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
        throw new Error('שגיאה בפענוח התשובה מהשרת');
      }
      
      setContacts(data.contacts || []);
      setCustomerError(null);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
      const errorMessage = error.message || 'שגיאה בטעינת אנשי קשר';
      setCustomerError(errorMessage);
      setContacts([]);
    }
  };

  const handleSelectContact = (contact: ContactWithDetails) => {
    if (!contact.customer_id) {
      toast({
        title: 'שגיאה',
        description: 'איש קשר זה אינו מקושר ללקוח. יש לבחור לקוח שביצע הזמנה בעבר.',
        variant: 'destructive',
      });
      return;
    }
    
    setFormData({
      ...formData,
      customer_id: contact.customer_id.toString(),
      customer_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'לקוח',
    });
    setShowCustomerDialog(false);
    setCustomerSearch('');
  };

  // Generate random code if empty
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    const newErrors: Record<string, string> = {};
    
    if (!formData.code || !formData.code.trim()) {
      newErrors.code = 'קוד הגיפט קארד הוא שדה חובה';
    }

    if (!formData.initial_value || parseFloat(formData.initial_value) <= 0) {
      newErrors.initial_value = 'ערך ראשוני חייב להיות גדול מ-0';
    }

    if (formData.send_email && !formData.recipient_email) {
      newErrors.recipient_email = 'אימייל נמען הוא חובה כאשר בוחרים לשלוח מייל';
    }
    
    // If there are errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'שגיאה',
        description: Object.values(newErrors)[0], // Show first error in toast
        variant: 'destructive',
      });
      return;
    }
    
    // Clear errors if validation passed
    setErrors({});

    try {
      setLoading(true);
      
      const payload: any = {
        code: formData.code.toUpperCase().trim(),
        initial_value: parseFloat(formData.initial_value),
        currency: formData.currency,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        order_id: formData.order_id ? parseInt(formData.order_id) : null,
        note: formData.note || null,
        recipient_email: formData.recipient_email || null,
        recipient_name: formData.recipient_name || null,
        sender_name: formData.sender_name || null,
        message: formData.message || null,
        send_email: formData.send_email,
      };

      const response = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה ביצירת גיפט קארד');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `גיפט קארד "${data.gift_card?.code || formData.code}" נוצר בהצלחה`,
      });

      router.push('/gift-cards');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת גיפט קארד',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">גיפט קארד חדש</h1>
          <p className="text-gray-500 mt-1">צור גיפט קארד חדש</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <HiX className="w-4 h-4" />
          ביטול
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiGift className="w-5 h-5" />
            פרטי הגיפט קארד
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="code" className={errors.code ? 'text-red-600' : ''}>קוד הגיפט קארד *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData({ ...formData, code: e.target.value });
                    if (errors.code) setErrors(prev => ({ ...prev, code: '' }));
                  }}
                  placeholder="GIFT12345678"
                  required
                  className={`flex-1 ${errors.code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateCode}
                  className="whitespace-nowrap"
                >
                  צור קוד
                </Button>
              </div>
              {errors.code ? (
                <p className="text-sm text-red-600 mt-1">{errors.code}</p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">הקוד יומר לאותיות גדולות אוטומטית</p>
              )}
            </div>

            <div>
              <Label htmlFor="initial_value" className={errors.initial_value ? 'text-red-600' : ''}>ערך ראשוני (₪) *</Label>
              <Input
                id="initial_value"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.initial_value}
                onChange={(e) => {
                  setFormData({ ...formData, initial_value: e.target.value });
                  if (errors.initial_value) setErrors(prev => ({ ...prev, initial_value: '' }));
                }}
                placeholder="100"
                required
                className={`mt-1 ${errors.initial_value ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.initial_value ? (
                <p className="text-sm text-red-600 mt-1">{errors.initial_value}</p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">הסכום הראשוני של הגיפט קארד</p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">מטבע</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר מטבע" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ILS">₪ שקל (ILS)</SelectItem>
                  <SelectItem value="USD">$ דולר (USD)</SelectItem>
                  <SelectItem value="EUR">€ אירו (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expires_at">תאריך תפוגה</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">השאר ריק ללא הגבלת זמן</p>
            </div>

            <div>
              <Label htmlFor="customer">לקוח</Label>
              <div className="mt-1">
                {formData.customer_id ? (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <HiUser className="w-4 h-4 text-green-600" />
                    <span className="flex-1 text-sm text-gray-900">{formData.customer_name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, customer_id: '', customer_name: '' })}
                      className="h-6 w-6 p-0"
                    >
                      <HiX className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCustomerDialog(true)}
                    className="w-full justify-start"
                  >
                    <HiUser className="w-4 h-4 ml-2" />
                    בחר לקוח
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">קשור גיפט קארד ללקוח ספציפי (אופציונלי)</p>
            </div>

            <div>
              <Label htmlFor="order_id">ID הזמנה</Label>
              <Input
                id="order_id"
                type="number"
                min="1"
                value={formData.order_id}
                onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                placeholder="אופציונלי"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">קשור גיפט קארד להזמנה ספציפית</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="note">הערה</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="הערות נוספות על הגיפט קארד..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  גיפט קארד פעיל
                </Label>
              </div>
              <p className="text-sm text-gray-500 mt-1">רק גיפט קארד פעילים יכולים לשמש בהזמנות</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiMail className="w-5 h-5" />
            פרטי נמען ושולח
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="recipient_email" className={errors.recipient_email ? 'text-red-600' : ''}>
                אימייל נמען {formData.send_email && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="recipient_email"
                type="email"
                value={formData.recipient_email}
                onChange={(e) => {
                  setFormData({ ...formData, recipient_email: e.target.value });
                  if (errors.recipient_email) setErrors(prev => ({ ...prev, recipient_email: '' }));
                }}
                placeholder="recipient@example.com"
                className={`mt-1 ${errors.recipient_email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.recipient_email ? (
                <p className="text-sm text-red-600 mt-1">{errors.recipient_email}</p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">אימייל של מקבל הגיפט קארד</p>
              )}
            </div>

            <div>
              <Label htmlFor="recipient_name">שם נמען</Label>
              <Input
                id="recipient_name"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                placeholder="שם הנמען"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sender_name">שם שולח</Label>
              <Input
                id="sender_name"
                value={formData.sender_name}
                onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                placeholder="שם השולח"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="message">הודעה אישית</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="הודעה אישית לנמען..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send_email"
                  checked={formData.send_email}
                  onCheckedChange={(checked) => setFormData({ ...formData, send_email: checked as boolean })}
                />
                <Label htmlFor="send_email" className="cursor-pointer">
                  שלח מייל לנמען עם פרטי הגיפט קארד
                </Label>
              </div>
              <p className="text-sm text-gray-500 mt-1 mr-6">
                אם מסומן, מייל עם פרטי הגיפט קארד יישלח אוטומטית לנמען
              </p>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            <HiX className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <HiSave className="w-4 h-4 ml-2" />
            {loading ? 'שומר...' : 'שמור גיפט קארד'}
          </Button>
        </div>
      </form>

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>בחר לקוח</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div className="relative">
              <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="חיפוש לקוחות לפי שם, אימייל או טלפון..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {customerError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                {customerError}
              </div>
            )}

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {customerError ? 'שגיאה בטעינת לקוחות' : 'לא נמצאו לקוחות שביצעו הזמנה'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleSelectContact(contact)}
                      className="w-full p-3 text-right hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {contact.first_name || contact.last_name
                              ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                              : 'ללא שם'}
                          </div>
                          {contact.email && (
                            <div className="text-sm text-gray-500 mt-1">{contact.email}</div>
                          )}
                          {contact.phone && (
                            <div className="text-sm text-gray-500">{contact.phone}</div>
                          )}
                          {contact.customer_id && (
                            <div className="text-xs text-gray-400 mt-1">ID: {contact.customer_id}</div>
                          )}
                        </div>
                        <HiUser className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {contacts.length >= 10 && (
              <div className="text-center text-sm text-gray-500 pt-2">
                מוצגים עד 20 תוצאות ראשונות. השתמש בחיפוש כדי למצוא לקוחות ספציפיים.
              </div>
            )}
            <div className="text-center text-xs text-gray-400 pt-2 pb-2">
              מוצגים רק לקוחות שביצעו הזמנה (יש להם מזהה לקוח)
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



