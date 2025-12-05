# 🔍 אפיון טכני לפרונט החנות - QA & Performance Optimization

<div dir="rtl">

## 📋 תוכן עניינים

1. [סקירת בעיות זוהו](#סקירת-בעיות-זוהו)
2. [אופטימיזציות נדרשות](#אופטימיזציות-נדרשות)
3. [מניעת בקשות כפולות](#מניעת-בקשות-כפולות)
4. [Cache Strategy](#cache-strategy)
5. [Database Query Optimization](#database-query-optimization)
6. [Network Request Optimization](#network-request-optimization)
7. [זרימת לקוח מיטבית](#זרימת-לקוח-מיטבית)
8. [Checklist יישום](#checklist-יישום)

---

## 🚨 סקירת בעיות זוהו

### בעיות קריטיות שזוהו בקוד הקיים:

#### 1. N+1 Query Problem בדף מוצר
**מיקום:** `src/app/(storefront)/shops/[storeSlug]/products/products/[handle]/page.tsx`

**בעיה:**
```typescript
// ❌ רע - N+1 queries
const variantsWithInventory = await Promise.all(
  variants.map(async (variant) => {
    const inventory = await queryOne<{ available: number }>(
      'SELECT available FROM variant_inventory WHERE variant_id = $1',
      [variant.id]
    );
    return { ...variant, available: inventory?.available || 0 };
  })
);
```

**למה זה בעייתי:**
- אם יש 5 variants → 5 queries נפרדים
- אם יש 20 variants → 20 queries נפרדים
- עומס מיותר על ה-DB
- זמן תגובה איטי

**פתרון:**
```typescript
// ✅ טוב - Single query עם JOIN או IN clause
const variantIds = variants.map(v => v.id);
const inventory = await query<{ variant_id: number; available: number }>(
  `SELECT variant_id, available 
   FROM variant_inventory 
   WHERE variant_id = ANY($1::int[])`,
  [variantIds]
);

const inventoryMap = new Map(
  inventory.map(inv => [inv.variant_id, inv.available])
);

const variantsWithInventory = variants.map(variant => ({
  ...variant,
  available: inventoryMap.get(variant.id) || 0,
}));
```

#### 2. בקשות כפולות לדף בית/מוצרים
**מיקום:** `src/app/(storefront)/shops/[storeSlug]/page.tsx`

**בעיה:**
```typescript
// ❌ רע - N queries לכל מוצר
const productsWithDetails = await Promise.all(
  products.map(async (product) => {
    const [image, variant] = await Promise.all([
      query<{ src: string }>(...), // Query 1
      query<{ price: number }>(...), // Query 2
    ]);
    // אם יש 8 מוצרים → 16 queries!
  })
);
```

**פתרון:**
```typescript
// ✅ טוב - Single query עם JOIN
const productsWithDetails = await query<{
  id: number;
  title: string;
  handle: string;
  image_src: string;
  price: number;
}>(
  `SELECT 
    p.id, p.title, p.handle,
    pi.src as image_src,
    pv.price
   FROM products p
   LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.position = 0
   LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 0
   WHERE p.store_id = $1 AND p.status = 'active'
   ORDER BY p.created_at DESC
   LIMIT 8`,
  [storeId]
);
```

#### 3. אין Cache לדפים סטטיים
**בעיה:**
- כל טעינת דף בית = queries חדשים
- כל טעינת דף מוצר = queries חדשים
- עומס מיותר על ה-DB

**פתרון:**
```typescript
// ✅ טוב - Cache עם Next.js unstable_cache
import { unstable_cache } from 'next/cache';

const getFeaturedProducts = unstable_cache(
  async (storeId: number) => {
    // ... query logic
  },
  ['featured-products'],
  { 
    revalidate: 300, // 5 דקות
    tags: ['products', `store-${storeId}`]
  }
);
```

#### 4. בקשות API כפולות ב-useCartCalculator
**מיקום:** `src/hooks/useCartCalculator.ts`

**בעיה:**
```typescript
// ❌ רע - API call בכל שינוי בעגלה
useEffect(() => {
  if (options.autoCalculate !== false) {
    recalculate(); // API call
  }
}, [recalculate, options.autoCalculate]);
```

**למה זה בעייתי:**
- כל שינוי כמות = API call
- כל הוספת פריט = API call
- עומס מיותר על השרת

**פתרון:**
```typescript
// ✅ טוב - Debounce + Memoization
const debouncedRecalculate = useMemo(
  () => debounce(recalculate, 300),
  [recalculate]
);

useEffect(() => {
  if (options.autoCalculate !== false) {
    debouncedRecalculate();
  }
}, [cartItems, discountCode, debouncedRecalculate]);
```

#### 5. אין Request Deduplication
**בעיה:**
- אם 2 קומפוננטות קוראות לאותו API → 2 בקשות
- אין שיתוף של בקשות זהות

**פתרון:**
```typescript
// ✅ טוב - Request deduplication עם SWR או React Query
import useSWR from 'swr';

const { data, error } = useSWR(
  `/api/products?storeId=${storeId}`,
  fetcher,
  {
    dedupingInterval: 2000, // 2 שניות
    revalidateOnFocus: false,
  }
);
```

---

## ⚡ אופטימיזציות נדרשות

### 1. Database Query Optimization

#### א. Batch Queries במקום N+1
```typescript
// ❌ רע
for (const product of products) {
  const images = await query('SELECT * FROM product_images WHERE product_id = $1', [product.id]);
}

// ✅ טוב
const productIds = products.map(p => p.id);
const allImages = await query(
  'SELECT * FROM product_images WHERE product_id = ANY($1::int[])',
  [productIds]
);
const imagesMap = new Map();
allImages.forEach(img => {
  if (!imagesMap.has(img.product_id)) {
    imagesMap.set(img.product_id, []);
  }
  imagesMap.get(img.product_id).push(img);
});
```

#### ב. JOIN במקום Multiple Queries
```typescript
// ❌ רע - 3 queries
const product = await query('SELECT * FROM products WHERE id = $1', [id]);
const images = await query('SELECT * FROM product_images WHERE product_id = $1', [id]);
const variants = await query('SELECT * FROM product_variants WHERE product_id = $1', [id]);

// ✅ טוב - 1 query עם JOIN
const product = await query(`
  SELECT 
    p.*,
    json_agg(DISTINCT jsonb_build_object(
      'id', pi.id,
      'src', pi.src,
      'alt', pi.alt,
      'position', pi.position
    )) FILTER (WHERE pi.id IS NOT NULL) as images,
    json_agg(DISTINCT jsonb_build_object(
      'id', pv.id,
      'title', pv.title,
      'price', pv.price,
      'sku', pv.sku
    )) FILTER (WHERE pv.id IS NOT NULL) as variants
  FROM products p
  LEFT JOIN product_images pi ON pi.product_id = p.id
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  WHERE p.id = $1
  GROUP BY p.id
`, [id]);
```

#### ג. Indexes נדרשים
```sql
-- ✅ חובה - Indexes לביצועים
CREATE INDEX idx_products_store_status ON products(store_id, status);
CREATE INDEX idx_product_images_product_position ON product_images(product_id, position);
CREATE INDEX idx_product_variants_product_position ON product_variants(product_id, position);
CREATE INDEX idx_variant_inventory_variant ON variant_inventory(variant_id);
```

### 2. Cache Strategy

#### א. SSR Cache לדפים סטטיים
```typescript
// ✅ Cache לדף בית
const getHomePageData = unstable_cache(
  async (storeId: number) => {
    const [products, collections] = await Promise.all([
      getFeaturedProducts(storeId),
      getCollections(storeId),
    ]);
    return { products, collections };
  },
  ['home-page'],
  {
    revalidate: 300, // 5 דקות
    tags: [`store-${storeId}`, 'home']
  }
);
```

#### ב. ISR (Incremental Static Regeneration)
```typescript
// ✅ ISR לדפי מוצרים
export const revalidate = 3600; // 1 שעה

export default async function ProductPage({ params }) {
  const product = await getProduct(params.handle);
  return <ProductDetails product={product} />;
}
```

#### ג. Client-Side Cache עם SWR
```typescript
// ✅ Cache ב-Client עם SWR
import useSWR from 'swr';

function ProductList({ storeId }) {
  const { data, error, isLoading } = useSWR(
    `/api/products?storeId=${storeId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
    }
  );
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error />;
  return <ProductGrid products={data.products} />;
}
```

### 3. Network Request Optimization

#### א. Request Deduplication
```typescript
// ✅ Deduplication עם SWR
const { data } = useSWR('/api/products', fetcher, {
  dedupingInterval: 2000, // בקשות זהות תוך 2 שניות = בקשה אחת
});
```

#### ב. Request Batching
```typescript
// ✅ Batching - כמה בקשות בקריאה אחת
const batchRequests = async (requests: Request[]) => {
  const response = await fetch('/api/batch', {
    method: 'POST',
    body: JSON.stringify({ requests }),
  });
  return response.json();
};
```

#### ג. Debouncing & Throttling
```typescript
// ✅ Debounce לחיפוש
const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    searchProducts(term);
  }, 300),
  []
);

// ✅ Throttle ל-scroll events
const throttledScroll = useMemo(
  () => throttle(() => {
    loadMoreProducts();
  }, 500),
  []
);
```

### 4. Code Splitting & Lazy Loading

#### א. Dynamic Imports
```typescript
// ✅ Lazy loading לקומפוננטות כבדות
const ProductGallery = dynamic(() => import('@/components/ProductGallery'), {
  loading: () => <GallerySkeleton />,
  ssr: false, // אם לא צריך SSR
});

const Customizer = dynamic(() => import('@/components/Customizer'), {
  loading: () => <CustomizerSkeleton />,
});
```

#### ב. Route-based Code Splitting
```typescript
// ✅ Next.js עושה זאת אוטומטית, אבל אפשר לשלוט
export const dynamic = 'force-dynamic'; // או 'force-static'
export const revalidate = 3600;
```

---

## 🚫 מניעת בקשות כפולות

### 1. Request Memoization

```typescript
// ✅ Memoization של בקשות
const requestCache = new Map<string, Promise<any>>();

async function fetchWithCache(url: string) {
  if (requestCache.has(url)) {
    return requestCache.get(url);
  }
  
  const promise = fetch(url).then(res => res.json());
  requestCache.set(url, promise);
  
  // נקה cache אחרי 5 שניות
  setTimeout(() => requestCache.delete(url), 5000);
  
  return promise;
}
```

### 2. SWR/React Query

```typescript
// ✅ שימוש ב-SWR (מומלץ)
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function ProductsPage() {
  const { data, error } = useSWR('/api/products', fetcher, {
    dedupingInterval: 2000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  
  // בקשות זהות תוך 2 שניות = בקשה אחת
}
```

### 3. AbortController לניהול בקשות

```typescript
// ✅ AbortController למניעת בקשות מיותרות
function useProducts() {
  const abortControllerRef = useRef<AbortController>();
  
  const loadProducts = useCallback(async () => {
    // בטל בקשה קודמת
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/products', {
        signal: abortControllerRef.current.signal,
      });
      // ...
    } catch (error) {
      if (error.name === 'AbortError') return;
      // ...
    }
  }, []);
  
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);
}
```

---

## 💾 Cache Strategy מפורטת

### 1. Server-Side Cache (Next.js)

#### א. unstable_cache לדפים סטטיים
```typescript
import { unstable_cache } from 'next/cache';

// Cache לדף בית
const getHomePageData = unstable_cache(
  async (storeId: number) => {
    // ... queries
  },
  ['home-page-data'],
  {
    revalidate: 300, // 5 דקות
    tags: [`store-${storeId}`, 'home']
  }
);

// Cache לדף מוצר
const getProduct = unstable_cache(
  async (handle: string, storeId: number) => {
    // ... query
  },
  ['product'],
  {
    revalidate: 3600, // 1 שעה
    tags: [`product-${handle}`, `store-${storeId}`]
  }
);
```

#### ב. Revalidation עם Tags
```typescript
// ✅ Revalidate כשמוצר מתעדכן
import { revalidateTag } from 'next/cache';

export async function updateProduct(productId: number) {
  // ... update logic
  revalidateTag(`product-${productId}`);
  revalidateTag('products');
}
```

### 2. Client-Side Cache (SWR)

```typescript
// ✅ SWR Configuration גלובלי
import { SWRConfig } from 'swr';

function App({ children }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url) => fetch(url).then(res => res.json()),
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
        refreshInterval: 0,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

### 3. Browser Cache (HTTP Headers)

```typescript
// ✅ Cache Headers ב-API Routes
export async function GET(request: NextRequest) {
  const data = await getData();
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

---

## 🗄️ Database Query Optimization

### 1. Batch Queries

```typescript
// ✅ Helper function ל-batch queries
async function batchQuery<T>(
  ids: number[],
  queryFn: (ids: number[]) => Promise<T[]>,
  mapFn: (item: T) => number
): Promise<Map<number, T>> {
  if (ids.length === 0) return new Map();
  
  const items = await queryFn(ids);
  return new Map(items.map(item => [mapFn(item), item]));
}

// שימוש:
const productIds = products.map(p => p.id);
const imagesMap = await batchQuery(
  productIds,
  (ids) => query('SELECT * FROM product_images WHERE product_id = ANY($1)', [ids]),
  (img) => img.product_id
);
```

### 2. JOIN Queries

```typescript
// ✅ Single query עם JOINs
const productsWithDetails = await query(`
  SELECT 
    p.id,
    p.title,
    p.handle,
    json_agg(
      DISTINCT jsonb_build_object(
        'id', pi.id,
        'src', pi.src,
        'alt', pi.alt,
        'position', pi.position
      )
    ) FILTER (WHERE pi.id IS NOT NULL) as images,
    json_agg(
      DISTINCT jsonb_build_object(
        'id', pv.id,
        'title', pv.title,
        'price', pv.price,
        'sku', pv.sku
      )
    ) FILTER (WHERE pv.id IS NOT NULL) as variants
  FROM products p
  LEFT JOIN product_images pi ON pi.product_id = p.id
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  WHERE p.store_id = $1 AND p.status = 'active'
  GROUP BY p.id
  ORDER BY p.created_at DESC
  LIMIT 8
`, [storeId]);
```

### 3. Prepared Statements

```typescript
// ✅ Prepared statements (pg כבר עושה זאת אוטומטית)
// אבל אפשר לשפר עם connection pooling
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // מקסימום connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 🌐 Network Request Optimization

### 1. Request Deduplication

```typescript
// ✅ Deduplication Hook
function useDeduplicatedFetch<T>(
  url: string,
  options?: RequestInit
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    // בדיקה אם יש בקשה פעילה לאותו URL
    const activeRequest = activeRequests.get(url);
    if (activeRequest) {
      activeRequest.then(result => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      });
      return;
    }
    
    // יצירת בקשה חדשה
    const requestPromise = fetch(url, options)
      .then(res => res.json())
      .then(result => {
        activeRequests.delete(url);
        return result;
      })
      .catch(err => {
        activeRequests.delete(url);
        throw err;
      });
    
    activeRequests.set(url, requestPromise);
    
    requestPromise
      .then(result => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });
    
    return () => {
      cancelled = true;
    };
  }, [url]);
  
  return { data, loading, error };
}

const activeRequests = new Map<string, Promise<any>>();
```

### 2. Request Batching

```typescript
// ✅ Batch API Route
// POST /api/batch
export async function POST(request: Request) {
  const { requests } = await request.json();
  
  const results = await Promise.all(
    requests.map(async (req: { url: string; method: string; body?: any }) => {
      // ... execute request
      return { url: req.url, data: result };
    })
  );
  
  return NextResponse.json({ results });
}
```

### 3. Debouncing & Throttling

```typescript
// ✅ Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// שימוש:
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearchTerm) {
    searchProducts(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

---

## 👤 זרימת לקוח מיטבית

### 1. Loading States

```typescript
// ✅ Skeleton Loaders
function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-48 rounded" />
      <div className="h-4 bg-gray-200 rounded mt-2" />
      <div className="h-4 bg-gray-200 rounded mt-2 w-3/4" />
    </div>
  );
}

// ✅ Progressive Loading
function ProductList() {
  const { data, isLoading, error } = useSWR('/api/products', fetcher);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  if (error) return <ErrorState />;
  return <ProductGrid products={data.products} />;
}
```

### 2. Error Handling

```typescript
// ✅ Error Boundaries
'use client';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 3. Optimistic Updates

```typescript
// ✅ Optimistic UI
function AddToCartButton({ productId, variantId }) {
  const { mutate } = useSWRConfig();
  
  const handleAddToCart = async () => {
    // עדכון מיידי ב-UI
    mutate('/api/cart', (cart) => ({
      ...cart,
      items: [...cart.items, { productId, variantId, quantity: 1 }],
    }), false);
    
    try {
      await addToCart(productId, variantId);
      // revalidate
      mutate('/api/cart');
    } catch (error) {
      // rollback
      mutate('/api/cart');
      showError('שגיאה בהוספה לעגלה');
    }
  };
  
  return <button onClick={handleAddToCart}>הוסף לעגלה</button>;
}
```

### 4. Retry Logic

```typescript
// ✅ Retry עם exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## ✅ Checklist יישום

### Database Optimization:
- [ ] תיקון N+1 queries בדף מוצר (batch query למלאי)
- [ ] תיקון N+1 queries בדף בית (JOIN במקום multiple queries)
- [ ] הוספת Indexes נדרשים
- [ ] שימוש ב-JOINs במקום multiple queries
- [ ] Connection pooling מוגדר נכון

### Cache Strategy:
- [ ] הוספת unstable_cache לדף בית
- [ ] הוספת unstable_cache לדף מוצר
- [ ] הוספת unstable_cache לדף קטגוריה
- [ ] הוספת ISR לדפים סטטיים
- [ ] הוספת SWR/React Query ל-client-side cache
- [ ] הוספת Cache Headers ב-API Routes

### Network Optimization:
- [ ] הוספת Request Deduplication
- [ ] הוספת Debouncing לחיפוש
- [ ] הוספת Throttling ל-scroll events
- [ ] שימוש ב-AbortController למניעת בקשות מיותרות
- [ ] הוספת Request Batching (אופציונלי)

### Code Splitting:
- [ ] Lazy loading ל-ProductGallery
- [ ] Lazy loading ל-Customizer
- [ ] Lazy loading לקומפוננטות כבדות אחרות
- [ ] Route-based code splitting

### UX Improvements:
- [ ] הוספת Skeleton Loaders
- [ ] הוספת Error Boundaries
- [ ] הוספת Optimistic Updates
- [ ] הוספת Retry Logic
- [ ] הוספת Loading States לכל פעולה

### Monitoring:
- [ ] הוספת Logging לבקשות כפולות
- [ ] הוספת Metrics לביצועים
- [ ] הוספת Alerts לבעיות ביצועים

---

## 📊 Metrics & Monitoring

### מה לבדוק:

1. **Database Queries:**
   - מספר queries לדף
   - זמן ביצוע query
   - N+1 queries

2. **Network Requests:**
   - מספר בקשות לדף
   - בקשות כפולות
   - זמן תגובה

3. **Cache Hit Rate:**
   - אחוז cache hits
   - Cache misses

4. **Page Load Time:**
   - Time to First Byte (TTFB)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)

### כלי ניטור:

- **Vercel Analytics** - ביצועים אוטומטיים
- **Lighthouse** - בדיקות ביצועים
- **Web Vitals** - Core Web Vitals
- **Custom Logging** - לוגים מותאמים

---

## 🎯 סיכום

המטרה היא:
1. ✅ **אפס בקשות כפולות** - כל בקשה רק פעם אחת
2. ✅ **Cache מקסימלי** - SSR cache + Client cache
3. ✅ **Queries מיטביים** - Batch + JOINs
4. ✅ **UX מעולה** - Loading states + Optimistic updates
5. ✅ **ביצועים מעולים** - מהירות מקסימלית

**כל שינוי צריך להיבדק עם:**
- Lighthouse Score > 90
- Network Tab - אין בקשות כפולות
- Database - אין N+1 queries
- User Experience - חלק ומהיר

</div>

