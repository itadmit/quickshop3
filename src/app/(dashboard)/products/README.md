# Products Module – Feature Checklist
# מודול מוצרים – צ'קליסט תכונות

## Core Features | תכונות ליבה

- [x] List products | רשימת מוצרים
- [x] Create product | יצירת מוצר
- [x] Edit product | עריכת מוצר
- [x] Delete product | מחיקת מוצר
- [x] Upload images gallery | העלאת גלריית תמונות (API endpoint ready)
- [x] Auto-generate unique slug | יצירת סלאג אוטומטי
- [x] Variants (size/color/stock) | וריאציות (מידה/צבע/מלאי) (API endpoints ready)
- [x] Inventory per variant | מלאי לכל וריאציה
- [x] Bulk actions | פעולות גורפות
- [ ] Collections | אוספים (API endpoints needed)
- [ ] Tags | תגיות (API endpoints needed)
- [ ] Meta Fields | שדות מטא מותאמים (API endpoints needed)
- [ ] Size Charts | טבלאות מידות (API endpoints needed)
- [ ] Product Addons | תוספות למוצרים (API endpoints needed)

## Events | אירועים

### Events Emitted | אירועים שנשלחים מהמודול הזה

| Event Topic | מתי נשלח | Payload | Source | Status |
|------------|----------|---------|--------|--------|
| `product.created` | כשנוצר מוצר חדש | `{ product: {...} }` | api, dashboard | ✅ |
| `product.updated` | כשמוצר עודכן | `{ product: {...}, changes: {...} }` | api, dashboard | ✅ |
| `product.deleted` | כשמוצר נמחק | `{ product: {...} }` | api, dashboard | ✅ |
| `product.published` | כשמוצר פורסם | `{ product: {...} }` | api, dashboard | ✅ |
| `variant.created` | כשנוצרה וריאציה | `{ variant: {...} }` | api, dashboard | ✅ |
| `variant.updated` | כשעודכנה וריאציה | `{ variant: {...}, changes: {...} }` | api, dashboard | ⚠️ (לא מיושם עדיין) |
| `inventory.updated` | כשמלאי עודכן | `{ variant_id: number, quantity: number, reason: string }` | api, dashboard | ✅ |

### Events Listened | אירועים שהמודול מאזין להם

| Event Topic | מה קורה | מתי | Status |
|------------|---------|-----|--------|
| `order.created` | הורדת מלאי | כשנוצרת הזמנה | ✅ |
| `order.cancelled` | החזרת מלאי | כשהזמנה מבוטלת | ✅ |

**Listener:** `src/lib/events/listeners/productInventoryListener.ts`

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/products` | Get products list (with filters) | ✅ |
| GET | `/api/products/:id` | Get product details | ✅ |
| POST | `/api/products` | Create product | ✅ |
| PUT | `/api/products/:id` | Update product | ✅ |
| DELETE | `/api/products/:id` | Delete product | ✅ |
| POST | `/api/products/:id/variants` | Create variant | ✅ |
| POST | `/api/products/:id/variants/sync` | Sync variants | ✅ |
| POST | `/api/products/:id/variants/clear` | Clear variants | ✅ |
| POST | `/api/products/:id/options/sync` | Sync options | ✅ |
| POST | `/api/products/:id/options/clear` | Clear options | ✅ |
| POST | `/api/products/bulk` | Bulk operations | ✅ |
| POST | `/api/products/import` | Import CSV | ✅ |
| POST | `/api/products/:id/images` | Upload images | ✅ |
| DELETE | `/api/products/:id/images/:imageId` | Delete image | ✅ |

## UI Components

- [x] ProductsTable | טבלת מוצרים (DataTable component)
- [x] ProductForm | טופס מוצר (עמוד עריכת מוצר)
- [x] ImageGallery | גלריית תמונות ✅
- [x] VariantsManager | מנהל וריאציות ✅
- [x] InventoryManager | מנהל מלאי ✅

**מיקום Components:**
- `src/components/products/ImageGallery.tsx`
- `src/components/products/VariantsManager.tsx`
- `src/components/products/InventoryManager.tsx`

