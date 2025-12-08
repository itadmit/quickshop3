'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { 
  HiPlus, 
  HiEye, 
  HiPencil, 
  HiTrash, 
  HiUsers,
  HiDotsVertical,
  HiChevronLeft,
  HiChevronRight,
  HiSearch,
  HiShoppingBag,
  HiUser,
  HiMail,
  HiChat,
  HiCheckCircle,
  HiXCircle,
} from 'react-icons/hi';
import { ContactWithDetails, ContactCategory } from '@/types/contact';
import { useDebounce } from '@/hooks/useDebounce';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { ContactFilters, ContactFilters as ContactFiltersType } from '@/components/contacts/ContactFilters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ContactCategoryType = 'all' | 'CUSTOMER' | 'CLUB_MEMBER' | 'NEWSLETTER' | 'CONTACT_FORM';

const CATEGORY_CONFIG: Record<ContactCategoryType, { label: string; icon: any; color: string }> = {
  all: { label: 'הכל', icon: HiUsers, color: 'bg-gray-500' },
  CUSTOMER: { label: 'לקוחות', icon: HiShoppingBag, color: 'bg-green-500' },
  CLUB_MEMBER: { label: 'חברי מועדון', icon: HiUser, color: 'bg-blue-500' },
  NEWSLETTER: { label: 'דיוור', icon: HiMail, color: 'bg-orange-500' },
  CONTACT_FORM: { label: 'יצירת קשר', icon: HiChat, color: 'bg-purple-500' },
};

export default function ContactsPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [contacts, setContacts] = useState<ContactWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ContactCategoryType>('all');
  const [emailConsentFilter, setEmailConsentFilter] = useState<string>('all');
  const [filters, setFilters] = useState<ContactFiltersType>({});
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ContactCategory[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    notes: '',
    tags: [] as string[],
    category_types: [] as string[],
    email_marketing_consent: false,
  });
  
  // Pagination
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Initialize categories once on mount
  useEffect(() => {
    fetch('/api/contacts/categories/init', { method: 'POST', credentials: 'include' })
      .catch(() => {}); // Ignore errors
    loadCategories();
  }, []);

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

  const handleCreateNew = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      company: '',
      notes: '',
      tags: [],
      category_types: [],
      email_marketing_consent: false,
    });
    setDialogOpen(true);
  };

  const handleSaveContact = async () => {
    if (!formData.email.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין כתובת אימייל',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'איש הקשר נוצר בהצלחה',
        });
        setDialogOpen(false);
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה ביצירת איש הקשר',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה ביצירת איש הקשר',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Load contacts when filters change
  useEffect(() => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    loadContacts(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm, activeTab, emailConsentFilter, filters, pagination.page]);

  const loadContacts = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (activeTab !== 'all') params.append('categoryType', activeTab);
      
      // Email marketing consent - use filter if set, otherwise use emailConsentFilter
      if (filters.email_marketing_consent !== undefined) {
        params.append('emailMarketingConsent', filters.email_marketing_consent.toString());
      } else if (emailConsentFilter !== 'all') {
        params.append('emailMarketingConsent', emailConsentFilter);
      }
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.min_orders !== undefined) params.append('min_orders', filters.min_orders.toString());
      if (filters.max_orders !== undefined) params.append('max_orders', filters.max_orders.toString());
      if (filters.min_total_spent !== undefined) params.append('min_total_spent', filters.min_total_spent.toString());
      if (filters.max_total_spent !== undefined) params.append('max_total_spent', filters.max_total_spent.toString());
      if (filters.created_after) params.append('created_after', filters.created_after);
      if (filters.created_before) params.append('created_before', filters.created_before);
      if (filters.has_customer !== undefined) params.append('has_customer', filters.has_customer.toString());
      
      params.append('limit', pagination.limit.toString());
      params.append('page', pagination.page.toString());

      const response = await fetch(`/api/contacts?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load contacts');
      const data = await response.json();
      setContacts(data.contacts || []);
      
      // Update pagination if provided
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading contacts:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת אנשי הקשר',
        variant: 'destructive',
      });
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedArray = Array.from(selectedContacts);
    if (selectedArray.length === 0) {
      toast({
        title: 'שים לב',
        description: 'לא נבחרו אנשי קשר למחיקה',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedArray.length} אנשי קשר?`)) {
      return;
    }

    try {
      for (const contactId of selectedArray) {
        const response = await fetch(`/api/contacts/${contactId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to delete contact');
      }
      toast({
        title: 'הצלחה',
        description: `${selectedArray.length} אנשי קשר נמחקו בהצלחה`,
      });
      setSelectedContacts(new Set());
      // Reset pagination and reload
      setPagination((prev) => ({ ...prev, page: 1 }));
    } catch (error: any) {
      console.error('Error deleting contacts:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת אנשי הקשר',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק איש קשר זה?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'איש הקשר נמחק בהצלחה',
        });
        // Reset pagination and reload
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו למחוק את איש הקשר',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת איש הקשר',
        variant: 'destructive',
      });
    }
  };

  const getContactName = (contact: ContactWithDetails) => {
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    }
    return contact.email.split('@')[0];
  };

  const getCategoryBadges = (contact: ContactWithDetails) => {
    if (!contact.category_assignments || contact.category_assignments.length === 0) {
      return null;
    }

    return contact.category_assignments.map((assignment) => {
      const category = assignment.category;
      const config = CATEGORY_CONFIG[category.type as ContactCategoryType] || CATEGORY_CONFIG.all;
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
    });
  };

  const columns: TableColumn<ContactWithDetails>[] = [
    {
      key: 'name',
      label: 'איש קשר',
      render: (contact) => (
        <div>
          <div className="font-medium text-gray-900">{getContactName(contact)}</div>
          {contact.company && (
            <div className="text-sm text-gray-500">{contact.company}</div>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'אימייל',
      render: (contact) => (
        <div className="text-gray-900">{contact.email}</div>
      ),
    },
    {
      key: 'phone',
      label: 'טלפון',
      render: (contact) => (
        <div className="text-gray-900">{contact.phone || '-'}</div>
      ),
    },
    {
      key: 'categories',
      label: 'קטגוריות',
      render: (contact) => (
        <div className="flex flex-wrap gap-1">
          {getCategoryBadges(contact) || <span className="text-gray-400 text-sm">-</span>}
        </div>
      ),
    },
    {
      key: 'email_marketing_consent',
      label: 'אישור דיוור',
      render: (contact) => (
        <div className="flex items-center gap-1">
          {contact.email_marketing_consent ? (
            <>
              <HiCheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">מאושר</span>
            </>
          ) : (
            <>
              <HiXCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">לא מאושר</span>
            </>
          )}
        </div>
      ),
    },
    ...(activeTab === 'CUSTOMER' ? [{
      key: 'customer',
      label: 'הזמנות',
      render: (contact) => (
        <div className="text-gray-900">
          {contact.customer?.orders_count || 0}
        </div>
      ),
    } as TableColumn<ContactWithDetails>, {
      key: 'total_spent',
      label: 'סכום כולל',
      render: (contact) => (
        <div className="font-semibold text-gray-900">
          ₪{parseFloat(contact.customer?.total_spent || '0').toLocaleString('he-IL')}
        </div>
      ),
    } as TableColumn<ContactWithDetails>] : []),
    {
      key: 'created_at',
      label: 'תאריך הצטרפות',
      render: (contact) => (
        <div className="text-sm text-gray-600">
          {new Date(contact.created_at).toLocaleDateString('he-IL')}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">אנשי קשר</h1>
          <p className="text-sm md:text-base text-gray-600">נהל ועקוב אחר כל אנשי הקשר שלך</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleCreateNew}
            className="flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            הוסף איש קשר
          </Button>
          {selectedContacts.size > 0 && (
            <Button
              onClick={handleBulkDelete}
              variant="destructive"
              className="hidden md:flex"
            >
              <HiTrash className="w-4 h-4 ml-2" />
              מחק {selectedContacts.size} נבחרו
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as ContactCategoryType);
        setPagination((prev) => ({ ...prev, page: 1 }));
      }}>
        {/* Filters */}
        <TabsContent value={activeTab} className="mt-4">
          <ContactFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            availableTags={Array.from(
              new Set(
                contacts
                  .filter(c => c.tags && c.tags.length > 0)
                  .flatMap(c => c.tags!)
              )
            )}
          />
          
          <Card className="mt-4">
            <div className="px-4 md:px-6 py-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="חיפוש לפי שם, אימייל או טלפון..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="pr-10"
                  />
                </div>

                {/* Email Consent Filter */}
                <select
                  value={emailConsentFilter}
                  onChange={(e) => {
                    setEmailConsentFilter(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all w-full md:w-[180px] flex-shrink-0"
                >
                  <option value="all">כל אנשי הקשר</option>
                  <option value="true">עם אישור דיוור</option>
                  <option value="false">ללא אישור דיוור</option>
                </select>
              </div>
            </div>
          </Card>
          
          {/* DataTable wrapped in Card with padding */}
          <Card className="mt-4 overflow-hidden">
            <div className="p-4 md:p-6">
              {/* Tabs List inside Card */}
              <TabsList className="grid w-full grid-cols-5 mb-4">
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <TabsTrigger key={key} value={key} className="flex items-center justify-center gap-2">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">{config.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              <DataTable
                  title=""
                  description=""
                  primaryAction={undefined}
                  secondaryActions={undefined}
                  searchPlaceholder=""
                  onSearch={undefined}
                  filters={undefined}
                  columns={columns}
                  data={contacts}
                  keyExtractor={(contact) => contact.id}
                  loading={loading}
                  selectable
                  selectedItems={selectedContacts as Set<string | number>}
                  onSelectionChange={(selected) => setSelectedContacts(selected as Set<number>)}
                  onRowClick={(contact) => router.push(`/contacts/${contact.id}`)}
                  noPadding={true}
                  rowActions={(contact) => {
                    return (
                      <>
                        {/* Desktop: Dropdown Menu */}
                        <div className="hidden md:block" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu
                            trigger={
                              <button 
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded transition-colors"
                              >
                                <HiDotsVertical className="w-5 h-5 text-gray-600" />
                              </button>
                            }
                            items={[
                              {
                                label: 'צפה',
                                icon: <HiEye className="w-4 h-4" />,
                                onClick: () => router.push(`/contacts/${contact.id}`),
                              },
                              {
                                label: 'ערוך',
                                icon: <HiPencil className="w-4 h-4" />,
                                onClick: () => router.push(`/contacts/${contact.id}`),
                              },
                              {
                                label: 'מחק',
                                icon: <HiTrash className="w-4 h-4" />,
                                onClick: () => handleDeleteContact(contact.id),
                                variant: 'destructive' as const,
                              },
                            ]}
                            align="end"
                          />
                        </div>
                        
                        {/* Mobile: Action buttons */}
                        <div className="md:hidden flex w-full gap-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => router.push(`/contacts/${contact.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <HiEye className="w-4 h-4 flex-shrink-0" />
                            <span>צפה</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteContact(contact.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <HiTrash className="w-4 h-4 flex-shrink-0" />
                            <span>מחק</span>
                          </button>
                        </div>
                      </>
                    );
                  }}
                  emptyState={
                    <div className="text-center py-12">
                      <HiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">אין אנשי קשר להצגה</p>
                    </div>
                  }
                />
            </div>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                מציג {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} מתוך {pagination.total} אנשי קשר
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  <HiChevronRight className="w-4 h-4" />
                  קודם
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  הבא
                  <HiChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Contact Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>הוסף איש קשר חדש</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">אימייל *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="example@email.com"
              />
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">שם פרטי</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  placeholder="שם פרטי"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">שם משפחה</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, last_name: e.target.value }))
                  }
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
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="050-1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">חברה</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, company: e.target.value }))
                  }
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
                      checked={formData.category_types.includes(category.type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            category_types: [...prev.category_types, category.type],
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            category_types: prev.category_types.filter(
                              (t) => t !== category.type
                            ),
                          }));
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
                value={formData.tags.join(', ')}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter((t) => t.length > 0),
                  }))
                }
                placeholder="תגית1, תגית2, תגית3"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="הערות נוספות על איש הקשר..."
                rows={3}
              />
            </div>

            {/* Email Marketing Consent */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="email_marketing_consent"
                checked={formData.email_marketing_consent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email_marketing_consent: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="email_marketing_consent" className="cursor-pointer">
                אישור דיוור שיווקי
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              ביטול
            </Button>
            <Button onClick={handleSaveContact} disabled={saving}>
              {saving ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

