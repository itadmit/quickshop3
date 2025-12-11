'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { HiSave, HiX, HiCreditCard, HiSearch, HiUser } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { ContactWithDetails } from '@/types/contact';

export default function NewStoreCreditPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactWithDetails[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    balance: '',
    currency: 'ILS',
    expires_at: '',
    description: '',
    order_id: '',
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
      params.append('limit', '10');
      params.append('page', '1');
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
    setFormData({
      ...formData,
      customer_id: contact.customer_id?.toString() || '',
      customer_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'לקוח',
    });
    setShowCustomerDialog(false);
    setCustomerSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.customer_id.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לקוח',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.balance || parseFloat(formData.balance) === 0) {
      toast({
        title: 'שגיאה',
        description: 'סכום הקרדיט חייב להיות שונה מ-0',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload: any = {
        customer_id: parseInt(formData.customer_id),
        balance: parseFloat(formData.balance),
        currency: formData.currency,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        description: formData.description || null,
        transaction_type: 'manual_adjustment',
        order_id: formData.order_id ? parseInt(formData.order_id) : null,
      };

      const response = await fetch('/api/store-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'שגיאה ביצירת קרדיט בחנות');
      }

      const data = await response.json();
      
      toast({
        title: 'הצלחה',
        description: `קרדיט בחנות נוצר בהצלחה עבור ${formData.customer_name}`,
      });

      router.push('/store-credits');
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת קרדיט בחנות',
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
          <h1 className="text-2xl font-bold text-gray-900">קרדיט בחנות חדש</h1>
          <p className="text-gray-500 mt-1">צור קרדיט בחנות חדש ללקוח</p>
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
            <HiCreditCard className="w-5 h-5" />
            פרטי קרדיט בחנות
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="customer">לקוח *</Label>
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
            </div>

            <div>
              <Label htmlFor="balance">סכום קרדיט (₪) *</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                placeholder="100"
                required
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">הסכום שיתווסף ליתרת הקרדיט של הלקוח</p>
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
              <p className="text-sm text-gray-500 mt-1">קשור קרדיט להזמנה ספציפית</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">תיאור</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תיאור הקרדיט (למשל: פיצוי על החזרה, בונוס לקוח VIP, וכו')..."
                rows={3}
                className="mt-1"
              />
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
            {loading ? 'שומר...' : 'שמור קרדיט בחנות'}
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
                  {customerError ? 'שגיאה בטעינת לקוחות' : 'לא נמצאו לקוחות'}
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
            {contacts.length === 10 && (
              <div className="text-center text-sm text-gray-500 pt-2">
                מוצגים 10 תוצאות ראשונות. השתמש בחיפוש כדי למצוא לקוחות ספציפיים.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

