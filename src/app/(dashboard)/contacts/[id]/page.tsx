'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { 
  HiArrowRight, 
  HiPencil,
  HiTrash,
  HiCheckCircle,
  HiXCircle,
  HiMail,
  HiPhone,
  HiOfficeBuilding,
  HiTag,
  HiUser,
  HiShoppingBag,
  HiRefresh,
} from 'react-icons/hi';
import { ContactWithDetails, ContactCategory } from '@/types/contact';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

export default function ContactDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const contactId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [categories, setCategories] = useState<ContactCategory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (contactId) {
      const abortController = new AbortController();
      const signal = abortController.signal;

      loadContact(signal);
      loadCategories();

      return () => {
        abortController.abort();
      };
    }
  }, [contactId]);

  const loadContact = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contacts/${contactId}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/contacts');
          return;
        }
        throw new Error('Failed to load contact');
      }
      const data = await response.json();
      setContact(data.contact);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading contact:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת איש הקשר',
        variant: 'destructive',
      });
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/contacts/categories', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSave = async () => {
    if (!contact) return;

    try {
      setSaving(true);
      
      // Prepare update data
      const updateData: any = {
        email: editData.email !== undefined ? editData.email : contact.email,
        first_name: editData.first_name !== undefined ? editData.first_name : contact.first_name,
        last_name: editData.last_name !== undefined ? editData.last_name : contact.last_name,
        phone: editData.phone !== undefined ? editData.phone : contact.phone,
        company: editData.company !== undefined ? editData.company : contact.company,
        notes: editData.notes !== undefined ? editData.notes : contact.notes,
        tags: editData.tags !== undefined ? editData.tags : contact.tags,
        email_marketing_consent: editData.email_marketing_consent !== undefined 
          ? editData.email_marketing_consent 
          : contact.email_marketing_consent,
        category_types: editData.category_types !== undefined ? editData.category_types : undefined,
      };

      // Update contact
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update contact');
      }

      // Categories are updated in the same request via category_types field

      toast({
        title: 'הצלחה',
        description: 'איש הקשר עודכן בהצלחה',
      });
      
      await loadContact();
      setIsEditing(false);
      setEditData({});
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון איש הקשר',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contact) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'איש הקשר נמחק בהצלחה',
        });
        router.push('/contacts');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete contact');
      }
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה במחיקת איש הקשר',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setShowDeleteDialog(false);
    }
  };

  const getContactName = (contact: ContactWithDetails) => {
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    }
    return contact.email.split('@')[0];
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6">
        <p className="text-gray-500">איש קשר לא נמצא</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {getContactName(contact)}
            </h1>
            {/* ✅ קישור לפרופיל הלקוח אם יש customer_id */}
            {contact.customer_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/customers/${contact.customer_id}`)}
                className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <HiUser className="w-4 h-4" />
                <span>פרופיל לקוח</span>
                <HiArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            נוצר ב-{new Date(contact.created_at).toLocaleString('he-IL')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            חזרה
          </Button>
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(true);
                  setEditData({
                    email: contact.email,
                    first_name: contact.first_name || '',
                    last_name: contact.last_name || '',
                    phone: contact.phone || '',
                    company: contact.company || '',
                    notes: contact.notes || '',
                    tags: contact.tags || [],
                    category_types: contact.category_assignments?.map(ca => ca.category.type) || [],
                    email_marketing_consent: contact.email_marketing_consent,
                  });
                }}
              >
                <HiPencil className="w-4 h-4 ml-1" />
                ערוך
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <HiTrash className="w-4 h-4 ml-1" />
                מחק
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">פרטי איש קשר</h2>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true);
                      setEditData({
                        email: contact.email,
                        first_name: contact.first_name || '',
                        last_name: contact.last_name || '',
                        phone: contact.phone || '',
                        company: contact.company || '',
                        notes: contact.notes || '',
                        tags: contact.tags || [],
                        category_types: contact.category_assignments?.map(ca => ca.category.type) || [],
                        email_marketing_consent: contact.email_marketing_consent,
                      });
                    }}
                  >
                    <HiPencil className="w-4 h-4 ml-1" />
                    ערוך
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">אימייל *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      placeholder="example@email.com"
                    />
                  </div>

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">שם פרטי</Label>
                      <Input
                        id="first_name"
                        value={editData.first_name}
                        onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                        placeholder="שם פרטי"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">שם משפחה</Label>
                      <Input
                        id="last_name"
                        value={editData.last_name}
                        onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                        placeholder="שם משפחה"
                      />
                    </div>
                  </div>

                  {/* Phone & Company */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">טלפון</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        placeholder="050-1234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">חברה</Label>
                      <Input
                        id="company"
                        value={editData.company}
                        onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                        placeholder="שם החברה"
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="space-y-2">
                    <Label>קטגוריות</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={editData.category_types?.includes(category.type) || false}
                            onChange={(e) => {
                              const currentTypes = editData.category_types || [];
                              if (e.target.checked) {
                                setEditData({
                                  ...editData,
                                  category_types: [...currentTypes, category.type],
                                });
                              } else {
                                setEditData({
                                  ...editData,
                                  category_types: currentTypes.filter((t: string) => t !== category.type),
                                });
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">תגיות (מופרדות בפסיק)</Label>
                    <Input
                      id="tags"
                      value={Array.isArray(editData.tags) ? editData.tags.join(', ') : editData.tags || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          tags: e.target.value
                            .split(',')
                            .map((t: string) => t.trim())
                            .filter((t: string) => t.length > 0),
                        })
                      }
                      placeholder="תגית1, תגית2, תגית3"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">הערות</Label>
                    <Textarea
                      id="notes"
                      value={editData.notes || ''}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      placeholder="הערות נוספות על איש הקשר..."
                      rows={4}
                    />
                  </div>

                  {/* Email Marketing Consent */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="email_marketing_consent"
                      checked={editData.email_marketing_consent || false}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          email_marketing_consent: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="email_marketing_consent" className="cursor-pointer">
                      אישור דיוור שיווקי
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'שומר...' : 'שמור שינויים'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({});
                      }}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <HiMail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500 mb-1">אימייל</div>
                      <div className="text-gray-900 font-medium">{contact.email}</div>
                    </div>
                  </div>

                  {/* Name */}
                  {(contact.first_name || contact.last_name) && (
                    <div className="flex items-start gap-3">
                      <HiUser className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-1">שם</div>
                        <div className="text-gray-900 font-medium">
                          {getContactName(contact)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {contact.phone && (
                    <div className="flex items-start gap-3">
                      <HiPhone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-1">טלפון</div>
                        <div className="text-gray-900">{contact.phone}</div>
                      </div>
                    </div>
                  )}

                  {/* Company */}
                  {contact.company && (
                    <div className="flex items-start gap-3">
                      <HiOfficeBuilding className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-1">חברה</div>
                        <div className="text-gray-900">{contact.company}</div>
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {contact.category_assignments && contact.category_assignments.length > 0 && (
                    <div className="flex items-start gap-3">
                      <HiTag className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-2">קטגוריות</div>
                        <div className="flex flex-wrap gap-2">
                          {contact.category_assignments.map((assignment) => {
                            const category = assignment.category;
                            return (
                              <span
                                key={assignment.id}
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: category.color ? `${category.color}15` : undefined,
                                  borderColor: category.color || undefined,
                                  color: category.color || undefined,
                                  border: '1px solid',
                                }}
                              >
                                {category.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <HiTag className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-1">תגיות</div>
                        <div className="flex flex-wrap gap-2">
                          {contact.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {contact.notes && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-1">הערות</div>
                        <div className="text-gray-900 whitespace-pre-wrap">{contact.notes}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Email Marketing Consent */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">אישור דיוור</h2>
              <div className="flex items-center gap-2">
                {contact.email_marketing_consent ? (
                  <>
                    <HiCheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">מאושר</span>
                  </>
                ) : (
                  <>
                    <HiXCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-500">לא מאושר</span>
                  </>
                )}
              </div>
              {contact.email_marketing_consent_at && (
                <div className="text-sm text-gray-500 mt-2">
                  תאריך אישור: {new Date(contact.email_marketing_consent_at).toLocaleDateString('he-IL')}
                </div>
              )}
            </div>
          </Card>

          {/* Customer Info */}
          {contact.customer_id && contact.customer ? (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">לקוח</h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">מספר הזמנות</div>
                    <div className="text-lg font-semibold text-gray-900 flex items-center gap-2 mt-1">
                      <HiShoppingBag className="w-5 h-5" />
                      {contact.customer.orders_count}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">סכום כולל</div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">
                      ₪{parseFloat(contact.customer.total_spent || '0').toLocaleString('he-IL')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => router.push(`/customers/${contact.customer_id}`)}
                  >
                    צפה בפרופיל הלקוח
                  </Button>
                </div>
              </div>
            </Card>
          ) : contact.email ? (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">לקוח</h2>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    איש קשר זה עדיין לא קשור ללקוח במערכת. המרה ללקוח תאפשר לאימייל להתחבר דרך הפרונט.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      try {
                        setSaving(true);
                        const response = await fetch(`/api/contacts/${contactId}/convert-to-customer`, {
                          method: 'POST',
                          credentials: 'include',
                        });

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || 'Failed to convert contact');
                        }

                        toast({
                          title: 'הצלחה',
                          description: 'איש הקשר הומר ללקוח בהצלחה. כעת האימייל יכול להתחבר דרך הפרונט.',
                        });

                        await loadContact();
                      } catch (error: any) {
                        console.error('Error converting contact:', error);
                        toast({
                          title: 'שגיאה',
                          description: error.message || 'אירעה שגיאה בהמרת איש הקשר ללקוח',
                          variant: 'destructive',
                        });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    <HiRefresh className="w-4 h-4 ml-1" />
                    {saving ? 'ממיר...' : 'המר ללקוח'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Source */}
          {contact.source && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">מקור</h2>
                <div className="text-sm text-gray-600">
                  {contact.source === 'manual' ? 'הוזן ידנית' :
                   contact.source === 'contact_form' ? 'טופס יצירת קשר' :
                   contact.source === 'import' ? 'ייבוא' :
                   contact.source}
                </div>
              </div>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">תאריכים</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-gray-500">נוצר ב</div>
                  <div className="text-gray-900">
                    {new Date(contact.created_at).toLocaleString('he-IL')}
                  </div>
                </div>
                {contact.updated_at && contact.updated_at !== contact.created_at && (
                  <div>
                    <div className="text-gray-500">עודכן ב</div>
                    <div className="text-gray-900">
                      {new Date(contact.updated_at).toLocaleString('he-IL')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת איש קשר</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p className="text-gray-600">
              האם אתה בטוח שברצונך למחוק את איש הקשר <strong>{getContactName(contact)}</strong>?
              פעולה זו לא ניתנת לביטול.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'מוחק...' : 'מחק'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

