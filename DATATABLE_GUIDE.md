# DataTable Component Guide

<div dir="rtl">

## סקירה כללית

קומפוננטת `DataTable` היא קומפוננטה אחידה לכל הטבלאות במערכת. היא מספקת:

- 📊 **טבלה מעוצבת** - עיצוב אחיד עם Tailwind
- 🔍 **חיפוש ופילטרים** - מערכת פילטרים מובנית
- ✅ **בחירה מרובה** - checkboxes לבחירת שורות
- 🎨 **התאמה אישית** - render functions לכל עמודה
- 📱 **Responsive** - מתאים לכל גודל מסך
- 🎯 **כפתורי פעולה** - כפתור ראשי וכפתורים משניים
- 🔄 **מצב טעינה** - loading state מובנה

---

## שימוש בסיסי

### דוגמה: טבלת הזמנות

```tsx
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Order {
  id: number;
  orderNumber: string;
  customer: string;
  email: string;
  date: string;
  status: string;
  amount: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([...]);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());

  const columns: TableColumn<Order>[] = [
    {
      key: 'orderNumber',
      label: 'מספר הזמנה',
      width: '150px',
    },
    {
      key: 'customer',
      label: 'לקוח',
      render: (order) => (
        <div>
          <div className="font-medium">{order.customer}</div>
          <div className="text-xs text-gray-500">{order.email}</div>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'תאריך',
    },
    {
      key: 'status',
      label: 'סטטוס',
      render: (order) => (
        <StatusBadge status={order.status} />
      ),
    },
    {
      key: 'amount',
      label: 'סכום',
      render: (order) => `₪${order.amount.toFixed(2)}`,
    },
  ];

  return (
    <DataTable
      // Header
      title="הזמנות"
      description="נהל ועקוב אחר כל ההזמנות שלך"
      
      // Actions
      primaryAction={{
        label: '+ יצירת הזמנה ידנית',
        onClick: () => console.log('create'),
      }}
      
      // Search
      searchPlaceholder="חפש לפי מספר הזמנה, שם לקוח או אימייל..."
      onSearch={(value) => console.log('search:', value)}
      
      // Filters
      filters={[
        {
          type: 'select',
          label: 'סטטוס',
          options: [
            { value: 'all', label: 'כל הסטטוסים' },
            { value: 'paid', label: 'שולם' },
            { value: 'pending', label: 'ממתין' },
          ],
          onChange: (value) => console.log('filter:', value),
        },
      ]}
      
      // Table
      columns={columns}
      data={orders}
      keyExtractor={(order) => order.id}
      
      // Selection
      selectable
      selectedItems={selectedOrders}
      onSelectionChange={setSelectedOrders}
      
      // Row Actions
      rowActions={(order) => (
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded">
            <EyeIcon />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded">
            <EditIcon />
          </button>
        </div>
      )}
    />
  );
}
```

---

## Props API

### Header Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | ✅ | כותרת העמוד |
| `description` | `string` | ❌ | תיאור העמוד |

### Actions Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `primaryAction` | `{ label, onClick, icon? }` | ❌ | כפתור ראשי (ירוק) |
| `secondaryActions` | `Array<{ label, onClick }>` | ❌ | כפתורים משניים (אפורים) |

### Search & Filters Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `searchPlaceholder` | `string` | ❌ | placeholder לשדה חיפוש |
| `onSearch` | `(value: string) => void` | ❌ | callback לחיפוש |
| `filters` | `TableFilter[]` | ❌ | מערך פילטרים |

### Table Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `columns` | `TableColumn<T>[]` | ✅ | הגדרות עמודות |
| `data` | `T[]` | ✅ | מערך הנתונים |
| `keyExtractor` | `(item: T) => string \| number` | ✅ | מחלץ key ייחודי |

### Selection Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `selectable` | `boolean` | ❌ | האם להציג checkboxes |
| `selectedItems` | `Set<string \| number>` | ❌ | פריטים נבחרים |
| `onSelectionChange` | `(selected: Set) => void` | ❌ | callback לשינוי בחירה |

### Additional Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rowActions` | `(item: T) => ReactNode` | ❌ | פעולות לכל שורה |
| `emptyState` | `ReactNode` | ❌ | מה להציג כשאין נתונים |
| `loading` | `boolean` | ❌ | מצב טעינה |

---

## TableColumn Interface

```typescript
interface TableColumn<T> {
  key: string;              // מפתח העמודה
  label: string;            // כותרת העמודה
  width?: string;           // רוחב העמודה (אופציונלי)
  render?: (item: T) => ReactNode;  // פונקציית render מותאמת
  sortable?: boolean;       // האם ניתן למיין (עתידי)
}
```

---

## TableFilter Interface

```typescript
interface TableFilter {
  type: 'select' | 'search' | 'date';  // סוג הפילטר
  label: string;                        // תווית
  placeholder?: string;                 // placeholder
  options?: { value: string; label: string }[];  // אופציות ל-select
  value?: string;                       // ערך נוכחי
  onChange?: (value: string) => void;   // callback לשינוי
}
```

---

## דוגמאות נוספות

### 1. טבלת מוצרים פשוטה (ללא בחירה)

```tsx
<DataTable
  title="מוצרים"
  description="נהל את כל המוצרים שלך"
  
  primaryAction={{
    label: '+ מוצר חדש',
    onClick: handleAddProduct,
  }}
  
  secondaryActions={[
    { label: 'ייבוא', onClick: handleImport },
    { label: 'ייצוא', onClick: handleExport },
  ]}
  
  searchPlaceholder="חיפוש לפי שם, מקט..."
  onSearch={handleSearch}
  
  filters={[
    {
      type: 'select',
      options: [
        { value: 'all', label: 'כל המוצרים' },
        { value: 'active', label: 'פעילים' },
        { value: 'draft', label: 'טיוטה' },
      ],
      onChange: handleStatusFilter,
    },
  ]}
  
  columns={productColumns}
  data={products}
  keyExtractor={(p) => p.id}
/>
```

### 2. טבלה עם תמונות ופעולות מורכבות

```tsx
const columns: TableColumn<Product>[] = [
  {
    key: 'image',
    label: 'תמונה',
    width: '80px',
    render: (product) => (
      <img
        src={product.image}
        alt={product.name}
        className="w-12 h-12 rounded object-cover"
      />
    ),
  },
  {
    key: 'name',
    label: 'שם מוצר',
    render: (product) => (
      <div>
        <div className="font-medium">{product.name}</div>
        <div className="text-xs text-gray-500">מקט: {product.sku}</div>
      </div>
    ),
  },
  // ... עמודות נוספות
];
```

### 3. טבלה עם מצב ריק מותאם אישית

```tsx
<DataTable
  // ... props אחרים
  
  emptyState={
    <div className="text-center py-12">
      <div className="text-4xl mb-4">📦</div>
      <h3 className="text-lg font-semibold mb-2">אין מוצרים עדיין</h3>
      <p className="text-gray-500 mb-4">התחל למכור עם קטלוג מוצרים מקצועי</p>
      <Button onClick={handleAddProduct}>
        הוסף מוצר ראשון
      </Button>
    </div>
  }
/>
```

---

## עיצוב ונראות

### מבנה הקומפוננטה

```
┌─────────────────────────────────────────────┐
│  [Title]                                    │
│  [Description]                              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ╔═══════════════════════════════╗   │   │
│  │ ║ Card Header (Filters Bar)    ║   │   │
│  │ ║─────────────────────────────  ║   │   │
│  │ ║ [Search] ────── [Actions]     ║   │   │
│  │ ║ [Filter 1] [Filter 2]         ║   │   │
│  │ ╚═══════════════════════════════╝   │   │
│  │ ────────────────────────────────    │   │
│  │  ┌────────────────────────────┐     │   │
│  │  │ Table Header               │     │   │
│  │  ├────────────────────────────┤     │   │
│  │  │ Table Row 1                │     │   │
│  │  │ Table Row 2                │     │   │
│  │  │ Table Row 3                │     │   │
│  │  └────────────────────────────┘     │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**עיצוב מאוחד:**
- החיפוש, הכפתורים והפילטרים נמצאים **בתוך ה-Card** בחלק העליון
- קיים מפריד ויזואלי ברור (`border-b`) בין בר הפילטרים לטבלה
- הכל חלק מיחידה ויזואלית אחת - מסודר ומקצועי

### צבעים וסטיילינג

- **Filters Bar**: רקע לבן `bg-white`, border תחתון `border-b border-gray-200`
- **Table Header**: רקע `bg-gray-50`, טקסט `text-gray-600`
- **Table Rows**: רקע לבן, hover `hover:bg-gray-50`
- **Selected Row**: `bg-blue-50`
- **Borders**: `border-gray-200`
- **Inputs/Selects**: border `border-gray-200`, focus ring `ring-primary-green`

---

## Best Practices

### ✅ מומלץ

```tsx
// 1. השתמש ב-render function לתוכן מורכב
{
  key: 'status',
  render: (item) => <StatusBadge status={item.status} />
}

// 2. הגדר רוחב לעמודות צרות
{
  key: 'id',
  width: '100px',
}

// 3. השתמש ב-keyExtractor עם מפתח ייחודי
keyExtractor={(item) => item.id}
```

### ❌ לא מומלץ

```tsx
// 1. לא להשתמש ב-index כ-key
keyExtractor={(item, index) => index}  // רע!

// 2. לא לשכוח render function למידע מורכב
{
  key: 'user',  // אם user הוא object, זה לא יעבוד
}

// 3. לא ליצור functions חדשות בתוך render
rowActions={(item) => handleAction(item)}  // יצור re-renders מיותרים
```

---

## Migration Guide

### המרה מטבלה קיימת

**לפני:**
```tsx
<div className="space-y-6 p-6">
  <div>
    <h1>הזמנות</h1>
  </div>
  
  <div className="flex items-center justify-between">
    <Input placeholder="חיפוש..." />
    <Button>+ יצירת הזמנה</Button>
  </div>
  
  <div className="flex gap-3">
    <select>...</select>
    <select>...</select>
  </div>
  
  <Card>
    <table>
      {/* ... */}
    </table>
  </Card>
</div>
```

**אחרי:**
```tsx
<DataTable
  title="הזמנות"
  searchPlaceholder="חיפוש..."
  onSearch={handleSearch}
  primaryAction={{
    label: '+ יצירת הזמנה',
    onClick: handleCreate,
  }}
  filters={[
    {
      type: 'select',
      options: [...],
      onChange: handleFilter,
    }
  ]}
  columns={columns}
  data={orders}
  keyExtractor={(o) => o.id}
/>
```

**היתרונות:**
- ✅ החיפוש והפילטרים משולבים בכרטיס הטבלה
- ✅ מראה אחיד ומקצועי יותר
- ✅ פחות קוד ועיצוב עקבי
- ✅ כל הפונקציונליות במקום אחד

---

## Todo: תכונות עתידיות

- [ ] מיון עמודות (sortable)
- [ ] Pagination מובנה
- [ ] ייצוא ל-CSV/Excel
- [ ] בחירת עמודות להצגה
- [ ] שמירת העדפות משתמש
- [ ] Drag & Drop לשורות
- [ ] Bulk actions עבור פריטים נבחרים
- [ ] Virtual scrolling לטבלאות גדולות

---

## תמיכה ועזרה

יצרת טבלה חדשה? וודא ש:
1. ✅ השתמשת ב-`DataTable` במקום לבנות טבלה ידנית
2. ✅ הגדרת `keyExtractor` נכון
3. ✅ השתמשת ב-`render` functions לתוכן מורכב
4. ✅ הוספת `emptyState` מותאם אישית
5. ✅ בדקת את הטבלה במסכים שונים

---

</div>

