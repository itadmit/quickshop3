# 🗺️ תוכנית פיתוח - Quickshop3

## 📊 סטטוס כללי

**מודולים פעילים:** 15/15  
**API Routes:** ✅ רוב ה-API routes מוכנים  
**UI Components:** ⚠️ חלק מהקומפוננטות חסרות  
**Events:** ⚠️ חלק מהאירועים לא מיושמים  

---

## 🎯 מודולים לפי עדיפות

### 🔴 עדיפות גבוהה (Core Features)

#### 1. **Products** - מוצרים
**סטטוס:** ✅ 80% מוכן

**חסר:**
- [ ] Collections (אוספים) - API endpoints + UI
- [ ] Tags (תגיות) - API endpoints + UI
- [ ] Meta Fields (שדות מטא מותאמים) - API endpoints + UI
- [ ] Size Charts (טבלאות מידות) - API endpoints + UI
- [ ] Product Addons (תוספות למוצרים) - API endpoints + UI
- [ ] Variant update event (`variant.updated`) - Listener

**API Endpoints חסרים:**
- `POST /api/products/:id/collections`
- `GET /api/products/:id/collections`
- `POST /api/products/:id/tags`
- `GET /api/products/:id/tags`
- `POST /api/products/:id/meta-fields`
- `POST /api/products/:id/size-charts`
- `POST /api/products/:id/addons`

---

#### 2. **Orders** - הזמנות
**סטטוס:** ✅ 70% מוכן

**חסר:**
- [ ] Send receipt/invoice (שליחת קבלה/חשבונית) - Email integration
- [ ] Mark as fraud/risk (סימון הונאה/סיכון) - UI + API
- [ ] Order timeline (טיימליין הערות) - UI Component
- [ ] Manual order creation (יצירת הזמנה ידנית) - UI + API

**UI Components חסרים:**
- `OrderTimeline` - טיימליין הערות

**API Endpoints חסרים:**
- `POST /api/orders/:id/send-receipt`
- `POST /api/orders/:id/mark-fraud`
- `GET /api/orders/:id/timeline`

---

#### 3. **Customers** - לקוחות
**סטטוס:** ✅ 60% מוכן

**חסר:**
- [ ] Customer tags (תגיות לקוח) - API + UI
- [ ] Customer segments (סגמנטים) - API + UI
- [ ] Customer search & filters (חיפוש ופילטרים) - UI
- [ ] Export customers (ייצוא לקוחות) - API + UI
- [ ] Customer groups (קבוצות לקוחות) - API + UI
- [ ] Customer lifetime value (ערך חיים של לקוח) - API + UI

**API Endpoints חסרים:**
- `POST /api/customers/:id/tags`
- `GET /api/customers/:id/tags`
- `DELETE /api/customers/:id/tags/:tagName`
- `GET /api/customers/segments`
- `POST /api/customers/export`
- `GET /api/customers/:id/lifetime-value`

**UI Components חסרים:**
- `CustomerTags` - תגיות לקוח
- `CustomerSegments` - סגמנטים

---

### 🟡 עדיפות בינונית (Important Features)

#### 4. **Analytics** - אנליטיקס
**סטטוס:** ✅ 40% מוכן

**חסר:**
- [ ] Revenue charts (גרפי הכנסות) - UI Component
- [ ] Order trends (מגמות הזמנות) - UI Component
- [ ] Customer analytics (אנליטיקס לקוחות) - API + UI
- [ ] Product performance (ביצועי מוצרים) - API + UI
- [ ] Traffic analytics (אנליטיקס תנועה) - API + UI
- [ ] Conversion rates (שיעורי המרה) - API + UI
- [ ] Export reports (ייצוא דוחות) - API + UI

**API Endpoints חסרים:**
- `GET /api/analytics/revenue` - ⚠️ קיים אבל לא מלא
- `GET /api/analytics/conversion` - ⚠️ קיים אבל לא מלא
- `GET /api/analytics/customers`
- `GET /api/analytics/products`
- `GET /api/analytics/traffic`
- `POST /api/analytics/export`

**UI Components חסרים:**
- `RevenueChart` - גרף הכנסות
- `OrderTrendsChart` - גרף מגמות הזמנות
- `TrafficChart` - גרף תנועה

---

#### 5. **Blog** - בלוג
**סטטוס:** ✅ 50% מוכן

**חסר:**
- [ ] Post categories (קטגוריות פוסטים) - API + UI
- [ ] Post tags (תגיות פוסטים) - API + UI
- [ ] Post SEO (SEO לפוסטים) - API + UI
- [ ] Post scheduling (תזמון פוסטים) - API + UI
- [ ] Post comments (תגובות פוסטים) - API + UI
- [ ] Post featured image (תמונה ראשית) - API + UI

**UI Components חסרים:**
- `BlogPostForm` - טופס פוסט
- `BlogPostEditor` - עורך פוסט (Rich Text Editor)
- `BlogPostPreview` - תצוגה מקדימה

---

#### 6. **Categories** - קטגוריות
**סטטוס:** ✅ 30% מוכן

**חסר:**
- [ ] Create category (יצירת קטגוריה) - UI + API
- [ ] Edit category (עריכת קטגוריה) - UI + API
- [ ] Delete category (מחיקת קטגוריה) - UI + API
- [ ] Category image (תמונת קטגוריה) - API + UI
- [ ] Category products (מוצרי קטגוריה) - UI
- [ ] Category SEO (SEO לקטגוריה) - API + UI
- [ ] Category visibility (נראות קטגוריה) - API + UI
- [ ] Category sorting (מיון קטגוריות) - API + UI

**API Endpoints חסרים:**
- `GET /api/categories/:id` - ⚠️ קיים אבל לא מלא
- `PUT /api/categories/:id` - ⚠️ קיים אבל לא מלא
- `DELETE /api/categories/:id` - ⚠️ קיים אבל לא מלא
- `POST /api/categories/:id/image`
- `GET /api/categories/:id/products`

**UI Components חסרים:**
- `CategoryForm` - טופס קטגוריה
- `CategoryProducts` - מוצרי קטגוריה

**Events חסרים:**
- `category.created` - ⚠️ לא מיושם
- `category.updated` - ⚠️ לא מיושם
- `category.deleted` - ⚠️ לא מיושם

---

#### 7. **Discounts** - הנחות
**סטטוס:** ✅ 60% מוכן

**חסר:**
- [ ] Discount usage tracking (מעקב שימוש בהנחה) - API + UI
- [ ] Discount rules (חוקי הנחה) - API + UI
- [ ] Automatic discounts (הנחות אוטומטיות) - API + UI
- [ ] Discount combinations (שילובי הנחות) - API + UI
- [ ] Export discount codes (ייצוא קודי הנחה) - API + UI

**UI Components חסרים:**
- `DiscountForm` - טופס הנחה
- `DiscountUsageChart` - גרף שימוש

**Events חסרים:**
- `discount.used` - ⚠️ לא מיושם
- Listener ל-`order.created` - ⚠️ לא מיושם

---

### 🟢 עדיפות נמוכה (Nice to Have)

#### 8. **Loyalty** - מועדון לקוחות
**סטטוס:** ✅ 40% מוכן

**חסר:**
- [ ] Create loyalty tier (יצירת רמת נאמנות) - UI + API
- [ ] Edit loyalty tier (עריכת רמת נאמנות) - UI + API
- [ ] Delete loyalty tier (מחיקת רמת נאמנות) - UI + API
- [ ] Create loyalty rule (יצירת חוק נאמנות) - UI + API
- [ ] Edit loyalty rule (עריכת חוק נאמנות) - UI + API
- [ ] Delete loyalty rule (מחיקת חוק נאמנות) - UI + API
- [ ] Customer points management (ניהול נקודות לקוח) - UI + API
- [ ] Points history (היסטוריית נקודות) - UI + API
- [ ] Rewards redemption (מימוש פרסים) - UI + API

**UI Components חסרים:**
- `TierForm` - טופס רמה
- `RuleForm` - טופס חוק
- `PointsManager` - מנהל נקודות

**Events חסרים:**
- `loyalty.tier.created` - ⚠️ לא מיושם
- `loyalty.points.added` - ⚠️ לא מיושם
- `loyalty.points.redeemed` - ⚠️ לא מיושם
- Listeners ל-`order.created` ו-`order.paid` - ⚠️ לא מיושמים

---

#### 9. **Payments** - תשלומים
**סטטוס:** ✅ 50% מוכן

**חסר:**
- [ ] Edit provider settings (עריכת הגדרות ספק) - UI + API
- [ ] Delete provider (מחיקת ספק) - UI + API
- [ ] Provider configuration (הגדרת ספק) - UI + API
- [ ] Test payments (תשלומי בדיקה) - API + UI
- [ ] Payment methods (שיטות תשלום) - API + UI
- [ ] Refund management (ניהול החזרים) - API + UI
- [ ] Payment gateway logs (לוגים של שער תשלום) - API + UI

**UI Components חסרים:**
- `ProviderForm` - טופס ספק
- `ProviderSettings` - הגדרות ספק

**Events חסרים:**
- `payment.provider.created` - ⚠️ לא מיושם
- `payment.provider.updated` - ⚠️ לא מיושם
- `payment.provider.toggled` - ⚠️ לא מיושם
- Listeners ל-`order.created` ו-`order.paid` - ⚠️ לא מיושמים

---

#### 10. **Shipping** - משלוחים
**סטטוס:** ✅ 40% מוכן

**חסר:**
- [ ] Create shipping zone (יצירת אזור משלוח) - UI + API
- [ ] Edit shipping zone (עריכת אזור משלוח) - UI + API
- [ ] Delete shipping zone (מחיקת אזור משלוח) - UI + API
- [ ] Add shipping rate (הוספת תעריף משלוח) - UI + API
- [ ] Edit shipping rate (עריכת תעריף משלוח) - UI + API
- [ ] Delete shipping rate (מחיקת תעריף משלוח) - UI + API
- [ ] Shipping rules (חוקי משלוח) - API + UI
- [ ] Free shipping threshold (סף משלוח חינם) - API + UI

**API Endpoints חסרים:**
- `GET /api/shipping/zones/:id` - ⚠️ קיים אבל לא מלא
- `PUT /api/shipping/zones/:id` - ⚠️ קיים אבל לא מלא
- `DELETE /api/shipping/zones/:id` - ⚠️ קיים אבל לא מלא
- `PUT /api/shipping/zones/:id/rates/:rateId`
- `DELETE /api/shipping/zones/:id/rates/:rateId`

**UI Components חסרים:**
- `ZoneForm` - טופס אזור
- `RateForm` - טופס תעריף

**Events חסרים:**
- `shipping.zone.created` - ⚠️ לא מיושם
- `shipping.zone.updated` - ⚠️ לא מיושם
- `shipping.rate.created` - ⚠️ לא מיושם
- Listener ל-`order.created` - ⚠️ לא מיושם

---

#### 11. **Webhooks** - Webhooks
**סטטוס:** ✅ 50% מוכן

**חסר:**
- [ ] Create webhook subscription (יצירת מנוי Webhook) - UI + API
- [ ] Edit webhook subscription (עריכת מנוי Webhook) - UI + API
- [ ] Delete webhook subscription (מחיקת מנוי Webhook) - UI + API
- [ ] Test webhook (בדיקת Webhook) - API + UI
- [ ] Webhook delivery logs (לוגי משלוח Webhook) - UI
- [ ] Retry failed deliveries (ניסיון חוזר למשלוחים שנכשלו) - API + UI
- [ ] Webhook security (אבטחת Webhook) - API

**UI Components חסרים:**
- `WebhookForm` - טופס Webhook
- `WebhookDeliveryLogs` - לוגי משלוח

**Events חסרים:**
- `webhook.subscription.created` - ⚠️ לא מיושם
- `webhook.delivered` - ⚠️ לא מיושם
- `webhook.failed` - ⚠️ לא מיושם

---

#### 12. **Settings** - הגדרות
**סטטוס:** ✅ 30% מוכן

**חסר:**
- [ ] Store domain (דומיין חנות) - API + UI
- [ ] Store email (אימייל חנות) - API + UI
- [ ] Store address (כתובת חנות) - API + UI
- [ ] Store logo (לוגו חנות) - API + UI
- [ ] Store currency (מטבע חנות) - API + UI
- [ ] Store locale (שפה חנות) - API + UI
- [ ] Store timezone (אזור זמן) - API + UI
- [ ] Store plan (תוכנית חנות) - API + UI
- [ ] Admin users (משתמשי אדמין) - API + UI
- [ ] User permissions (הרשאות משתמשים) - API + UI
- [ ] API keys (מפתחות API) - API + UI
- [ ] Integrations (אינטגרציות) - API + UI

**API Endpoints חסרים:**
- `GET /api/settings/users` - ⚠️ קיים אבל לא מלא
- `POST /api/settings/users` - ⚠️ קיים אבל לא מלא
- `GET /api/settings/api-keys` - ⚠️ קיים אבל לא מלא
- `POST /api/settings/api-keys` - ⚠️ קיים אבל לא מלא

**UI Components חסרים:**
- `AdminUsersList` - רשימת אדמינים
- `APIKeysList` - רשימת מפתחות API
- `IntegrationsList` - רשימת אינטגרציות

---

#### 13. **Pages** - דפים
**סטטוס:** ✅ 60% מוכן

**חסר:**
- [ ] Page templates (תבניות דפים) - API + UI
- [ ] Page SEO (SEO לדפים) - API + UI
- [ ] Page visibility (נראות דף) - API + UI
- [ ] Page scheduling (תזמון דף) - API + UI
- [ ] Page preview (תצוגה מקדימה) - UI

**UI Components חסרים:**
- `PageForm` - טופס דף
- `PageEditor` - עורך דף (Rich Text Editor)
- `PagePreview` - תצוגה מקדימה

**Events חסרים:**
- `page.published` - ⚠️ לא מיושם

---

#### 14. **Inventory** - מלאי
**סטטוס:** ✅ 20% מוכן

**חסר:**
- [ ] Inventory tracking (מעקב מלאי) - API + UI
- [ ] Low stock alerts (התראות מלאי נמוך) - API + UI
- [ ] Inventory adjustments (התאמות מלאי) - API + UI
- [ ] Inventory history (היסטוריית מלאי) - API + UI
- [ ] Bulk inventory update (עדכון מלאי בכמות) - API + UI
- [ ] Inventory transfers (העברות מלאי) - API + UI
- [ ] Stock locations (מיקומי מלאי) - API + UI
- [ ] Inventory reports (דוחות מלאי) - API + UI

**API Endpoints חסרים:**
- `GET /api/inventory` - ⚠️ קיים אבל לא מלא
- `PUT /api/inventory/:id` - ⚠️ קיים אבל לא מלא
- `POST /api/inventory/adjustments`
- `GET /api/inventory/history`
- `POST /api/inventory/bulk-update`
- `POST /api/inventory/transfers`
- `GET /api/inventory/locations`
- `GET /api/inventory/reports`

**UI Components חסרים:**
- `InventoryAdjustmentForm` - טופס התאמת מלאי
- `LowStockAlerts` - התראות מלאי נמוך

**Events חסרים:**
- `inventory.low_stock` - ⚠️ לא מיושם

---

#### 15. **Coupons** - קופונים
**סטטוס:** ✅ 30% מוכן

**חסר:**
- [ ] Create coupon (יצירת קופון) - UI + API
- [ ] Edit coupon (עריכת קופון) - UI + API
- [ ] Delete coupon (מחיקת קופון) - UI + API
- [ ] Coupon usage tracking (מעקב שימוש בקופון) - API + UI
- [ ] Coupon expiration (תפוגת קופון) - API + UI
- [ ] Coupon limits (הגבלות קופון) - API + UI
- [ ] Bulk coupon generation (יצירת קופונים בכמות) - API + UI

**UI Components חסרים:**
- `CouponForm` - טופס קופון

**Events חסרים:**
- `coupon.created` - ⚠️ לא מיושם
- `coupon.used` - ⚠️ לא מיושם
- Listener ל-`order.created` - ⚠️ לא מיושם

---

## 📋 סיכום לפי קטגוריות

### API Endpoints
- ✅ **מוכנים:** ~70%
- ⚠️ **צריך שיפור:** ~20%
- ❌ **חסרים:** ~10%

### UI Components
- ✅ **מוכנים:** ~50%
- ❌ **חסרים:** ~50%

### Events System
- ✅ **מיושמים:** ~60%
- ⚠️ **לא מיושמים:** ~40%

---

## 🎯 המלצות לפיתוח

### שלב 1: השלמת Core Features (עדיפות גבוהה)
1. **Products** - Collections, Tags, Meta Fields
2. **Orders** - Timeline, Receipt/Invoice
3. **Customers** - Tags, Segments, Search

### שלב 2: שיפור Analytics & Content (עדיפות בינונית)
4. **Analytics** - Charts, Reports
5. **Blog** - Editor, SEO, Scheduling
6. **Categories** - CRUD מלא

### שלב 3: השלמת מודולים נוספים (עדיפות נמוכה)
7. **Loyalty** - Points Management
8. **Payments** - Provider Settings
9. **Shipping** - Zone Management
10. **Webhooks** - Delivery Logs
11. **Settings** - Admin Users, API Keys
12. **Pages** - Editor, SEO
13. **Inventory** - Tracking, Alerts
14. **Coupons** - CRUD מלא

---

## 📝 הערות חשובות

1. **Rich Text Editor** - צריך להוסיף עורך טקסט עשיר ל-Blog ו-Pages (מומלץ: `react-quill` או `tiptap`)
2. **Email Integration** - צריך להוסיף שליחת אימיילים (SendGrid או Resend)
3. **File Upload** - צריך להוסיף העלאת קבצים (Cloudinary כבר מוגדר)
4. **Charts** - צריך להוסיף ספריית גרפים (מומלץ: `recharts` או `chart.js`)
5. **Export** - צריך להוסיף ייצוא ל-CSV/Excel (מומלץ: `xlsx` או `papaparse`)

---

**עודכן לאחרונה:** {{ date }}
**סטטוס כללי:** 🟡 60% מוכן

