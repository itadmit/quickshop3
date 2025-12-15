'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { HiSave, HiX, HiPlus, HiTrash, HiSearch, HiUser } from 'react-icons/hi';
import { ProductWithDetails, ProductVariant } from '@/types/product';
import { CustomerWithDetails } from '@/types/customer';
import { ContactWithDetails } from '@/types/contact';
import { CreateOrderRequest } from '@/types/order';

interface LineItem {
  product_id?: number;
  variant_id?: number;
  title: string;
  quantity: number;
  price: string;
  sku?: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [contacts, setContacts] = useState<ContactWithDetails[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<CreateOrderRequest>>({
    customer_id: undefined,
    email: '',
    phone: '',
    name: '',
    line_items: [],
    billing_address: {},
    shipping_address: {},
    discount_codes: [],
    note: '',
    tags: '',
  });

  useEffect(() => {
    loadProducts();
    loadContacts();
  }, []);

  // Reload contacts when dialog opens or search changes
  useEffect(() => {
    if (showCustomerDialog) {
      // Always reload contacts when dialog opens to get latest data
      const timeoutId = setTimeout(() => {
        loadContacts(customerSearch);
      }, customerSearch ? 300 : 0); // No delay if no search term
      return () => clearTimeout(timeoutId);
    }
  }, [customerSearch, showCustomerDialog]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products?status=active&limit=100', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

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
      
      // Check response status first
      if (!response.ok) {
        let errorData: any = {};
        const contentType = response.headers.get('content-type');
        
        // Try to parse error response if it's JSON
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse error response as JSON:', jsonError);
          }
        } else {
          // If not JSON, try to get text
          try {
            const text = await response.text();
            if (text) {
              errorData = { message: text };
            }
          } catch (textError) {
            console.error('Failed to read error response as text:', textError);
          }
        }
        
        const errorMessage = errorData?.error || errorData?.message || 
          (response.status === 401 ? 'אינך מחובר. אנא התחבר מחדש.' :
           response.status === 403 ? 'אין לך הרשאה לגשת לאנשי קשר.' :
           response.status === 500 ? 'שגיאת שרת. אנא נסה שוב מאוחר יותר.' :
           `שגיאה בטעינת אנשי קשר: ${response.status} ${response.statusText}`);
        
        console.error('Failed to load contacts:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData?.error || errorData?.message || 'Unknown error',
          errorData
        });
        
        setCustomerError(errorMessage);
        setContacts([]);
        return;
      }
      
      // Parse successful response
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

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.handle.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Use contacts directly from API (already filtered)
  const filteredContacts = contacts;

  const handleSelectContact = (contact: ContactWithDetails) => {
    setFormData({
      ...formData,
      customer_id: contact.customer_id || undefined, // Use customer_id if exists, otherwise undefined
      email: contact.email || '',
      phone: contact.phone || '',
      name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    });
    setShowCustomerDialog(false);
    setCustomerSearch('');
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    const variant = selectedVariant || selectedProduct.variants?.[0];
    const price = variant?.price || '0';
    const sku = variant?.sku || '';
    
    const newItem: LineItem = {
      product_id: selectedProduct.id,
      variant_id: variant?.id,
      title: selectedProduct.title + (variant?.title ? ` - ${variant.title}` : ''),
      quantity: 1,
      price,
      sku,
    };

    setFormData({
      ...formData,
      line_items: [...(formData.line_items || []), newItem],
    });
    
    setSelectedProduct(null);
    setSelectedVariant(null);
    setShowProductDialog(false);
    setProductSearch('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...(formData.line_items || [])];
    newItems.splice(index, 1);
    setFormData({ ...formData, line_items: newItems });
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...(formData.line_items || [])];
    newItems[index].quantity = Math.max(1, quantity);
    setFormData({ ...formData, line_items: newItems });
  };

  const handleUpdateItemPrice = (index: number, price: string) => {
    const newItems = [...(formData.line_items || [])];
    newItems[index].price = price;
    setFormData({ ...formData, line_items: newItems });
  };

  const calculateSubtotal = () => {
    return (formData.line_items || []).reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      alert('נא להזין אימייל לקוח');
      return;
    }
    
    if (!formData.line_items || formData.line_items.length === 0) {
      alert('נא להוסיף לפחות פריט אחד');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customer_id: formData.customer_id || null,
          email: formData.email,
          phone: formData.phone || null,
          name: formData.name || null,
          line_items: formData.line_items,
          billing_address: Object.keys(formData.billing_address || {}).length > 0 ? formData.billing_address : null,
          shipping_address: Object.keys(formData.shipping_address || {}).length > 0 ? formData.shipping_address : null,
          discount_codes: formData.discount_codes && formData.discount_codes.length > 0 ? formData.discount_codes : null,
          note: formData.note || null,
          tags: formData.tags || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const data = await response.json();
      router.push(`/orders/${data.order.id}`);
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(error.message || 'שגיאה ביצירת ההזמנה');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">יצירת הזמנה חדשה</h1>
        <Button variant="ghost" onClick={() => router.back()}>
          <HiX className="w-5 h-5 ml-2" />
          ביטול
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Section */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי לקוח</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>חיפוש איש קשר</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="חפש לפי שם, אימייל או טלפון..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={() => setShowCustomerDialog(true)}
                    />
                    <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="ghost" onClick={() => setShowCustomerDialog(true)}>
                    <HiUser className="w-5 h-5 ml-2" />
                    בחר איש קשר
                  </Button>
                </div>
              </div>

              {formData.customer_id && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-900">
                    {formData.name || 'לקוח נבחר'}
                  </div>
                  <div className="text-sm text-green-700">{formData.email}</div>
                  {formData.phone && (
                    <div className="text-sm text-green-700">{formData.phone}</div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>אימייל *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@example.com"
                    required
                  />
                </div>
                <div>
                  <Label>טלפון</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="050-1234567"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>שם מלא</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="שם פרטי ושם משפחה"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Line Items Section */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">פריטי הזמנה</h2>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowProductDialog(true)}
                className="flex items-center gap-2"
              >
                הוסף פריט
                <HiPlus className="w-4 h-4" />
              </Button>
            </div>

            {formData.line_items && formData.line_items.length > 0 ? (
              <div className="space-y-4">
                {formData.line_items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      {item.sku && (
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>כמות:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>מחיר:</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleUpdateItemPrice(index, e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <div className="font-semibold text-gray-900 w-24 text-left">
                      ₪{(parseFloat(item.price) * item.quantity).toLocaleString('he-IL')}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <HiTrash className="w-5 h-5 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>אין פריטים בהזמנה</p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowProductDialog(true)}
                  className="flex items-center gap-2 mt-4"
                >
                  הוסף פריט ראשון
                  <HiPlus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Summary Section */}
        {formData.line_items && formData.line_items.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">סיכום</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">סה"כ ביניים</span>
                  <span className="text-gray-900">₪{subtotal.toLocaleString('he-IL')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>סה"כ</span>
                  <span>₪{subtotal.toLocaleString('he-IL')}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Notes Section */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">הערות</h2>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="הערות פנימיות להזמנה..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={loading || !formData.email || !formData.line_items || formData.line_items.length === 0}>
            {loading ? 'יוצר...' : 'צור הזמנה'}
          </Button>
        </div>
      </form>

      {/* Customer Selection Dialog */}
      <Dialog 
        open={showCustomerDialog} 
        onOpenChange={(open) => {
          setShowCustomerDialog(open);
          if (open) {
            // Reload contacts when dialog opens to ensure latest data
            loadContacts(customerSearch);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>בחר איש קשר</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <Input
              type="text"
              placeholder="חפש איש קשר..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="mb-4"
            />
            {customerError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">{customerError}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => loadContacts(customerSearch)}
                  className="mt-2 text-red-600 hover:text-red-700"
                >
                  נסה שוב
                </Button>
              </div>
            )}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredContacts.length > 0 ? (
                <>
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                      {contact.phone && (
                        <div className="text-sm text-gray-500">{contact.phone}</div>
                      )}
                      {contact.customer_id && (
                        <div className="text-xs text-green-600 mt-1">לקוח קיים</div>
                      )}
                    </div>
                  ))}
                  {filteredContacts.length === 10 && (
                    <div className="text-center text-sm text-gray-500 pt-2">
                      מוצגים 10 תוצאות ראשונות. השתמש בחיפוש כדי למצוא לקוחות ספציפיים.
                    </div>
                  )}
                </>
              ) : !customerError ? (
                <div className="text-center py-8 text-gray-500">
                  לא נמצאו אנשי קשר
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCustomerDialog(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Selection Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="w-[700px] h-[600px]">
          <DialogHeader>
            <DialogTitle>הוסף מוצר</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 flex-1 h-[450px]">
            <Input
              type="text"
              placeholder="חפש מוצר..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="mb-4"
            />
            
            {selectedProduct ? (
              <div className="space-y-4 h-[380px]">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="font-medium text-gray-900">{selectedProduct.title}</div>
                  {/* לפי האפיון: כל מוצר חייב לפחות variant אחד */}
                  {/* הצג selector רק אם יש יותר מ-variant אחד שאינו Default Title */}
                  {(() => {
                    // סנן וריאציות שאינן Default Title
                    const nonDefaultVariants = selectedProduct.variants?.filter(v => 
                      v.title && v.title !== 'Default Title'
                    ) || [];
                    
                    // אם יש וריאציות שאינן Default Title, הצג את הבורר
                    if (nonDefaultVariants.length > 0) {
                      return (
                        <div className="mt-4">
                          <Label>בחר וריאציה:</Label>
                          <Select
                            value={selectedVariant?.id?.toString()}
                            onValueChange={(value) => {
                              const variant = selectedProduct.variants?.find(v => v.id.toString() === value);
                              setSelectedVariant(variant || null);
                            }}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="בחר וריאציה">
                                {selectedVariant ? `${selectedVariant.title === 'Default Title' ? selectedProduct.title : selectedVariant.title} - ₪${parseFloat(selectedVariant.price).toLocaleString('he-IL')}` : 'בחר וריאציה'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {selectedProduct.variants?.filter(v => v.title && v.title !== 'Default Title').map((variant) => (
                                <SelectItem key={variant.id} value={variant.id.toString()}>
                                  {variant.title} - ₪{parseFloat(variant.price).toLocaleString('he-IL')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedVariant(null);
                    }}
                  >
                    חזור
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={(() => {
                      const nonDefaultVariants = selectedProduct.variants?.filter(v => 
                        v.title && v.title !== 'Default Title'
                      ) || [];
                      return nonDefaultVariants.length > 0 && !selectedVariant;
                    })()}
                  >
                    הוסף להזמנה
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-[380px] overflow-y-auto space-y-2">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    // סנן וריאציות שאינן Default Title
                    const nonDefaultVariants = product.variants?.filter(v => 
                      v.title && v.title !== 'Default Title'
                    ) || [];
                    
                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product);
                          // לפי האפיון: כל מוצר חייב לפחות variant אחד
                          // אם אין וריאציות שאינן Default Title, בחר את הראשון
                          if (nonDefaultVariants.length === 0 && product.variants && product.variants.length > 0) {
                            setSelectedVariant(product.variants[0]);
                          } else if (nonDefaultVariants.length === 1) {
                            // אם יש רק וריאציה אחת שאינה Default Title, בחר אותה
                            setSelectedVariant(nonDefaultVariants[0]);
                          } else {
                            // אם יש יותר מוריאציה אחת, צריך לבחור ידנית
                            setSelectedVariant(null);
                          }
                        }}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900">{product.title}</div>
                        {/* הצג מידע רק אם יש יותר מוריאציה אחת שאינה Default Title */}
                        {nonDefaultVariants.length > 1 && (
                          <div className="text-sm text-gray-500">
                            {nonDefaultVariants.length} וריאציות זמינות
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    לא נמצאו מוצרים
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowProductDialog(false);
              setSelectedProduct(null);
              setSelectedVariant(null);
              setProductSearch('');
            }}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
