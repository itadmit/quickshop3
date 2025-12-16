/**
 * Demo data for Customizer Preview
 * מידע דמה קבוע לתצוגה מקדימה בקסטומייזר
 */

// מוצר דמה לתצוגה בקסטומייזר
export const DEMO_PRODUCT = {
  id: 0,
  title: 'מוצר לדוגמה',
  handle: 'demo-product',
  body_html: `<p>תיאור המוצר הזה הוא לדוגמה בלבד. כאן יופיע תיאור המוצר האמיתי שלך.</p>
<p>ניתן להוסיף פרטים על המוצר, מידות, חומרים, הוראות שימוש ועוד.</p>
<ul>
<li>איכות גבוהה</li>
<li>משלוח מהיר</li>
<li>אחריות יצרן</li>
</ul>`,
  vendor: 'מותג לדוגמה',
  product_type: 'קטגוריה',
  status: 'active',
  images: [
    { id: 1, src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop', alt: 'מוצר לדוגמה', position: 1 },
    { id: 2, src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop', alt: 'מוצר לדוגמה 2', position: 2 },
    { id: 3, src: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop', alt: 'מוצר לדוגמה 3', position: 3 },
  ],
  variants: [
    { 
      id: 1, 
      title: 'מידה S / שחור', 
      price: 199.90, 
      compare_at_price: 299.90, 
      sku: 'DEMO-001-S-BLK', 
      option1: 'S', 
      option2: 'שחור',
      option3: null,
      available: 10 
    },
    { 
      id: 2, 
      title: 'מידה M / שחור', 
      price: 199.90, 
      compare_at_price: 299.90, 
      sku: 'DEMO-001-M-BLK', 
      option1: 'M', 
      option2: 'שחור',
      option3: null,
      available: 15 
    },
    { 
      id: 3, 
      title: 'מידה L / שחור', 
      price: 199.90, 
      compare_at_price: 299.90, 
      sku: 'DEMO-001-L-BLK', 
      option1: 'L', 
      option2: 'שחור',
      option3: null,
      available: 8 
    },
    { 
      id: 4, 
      title: 'מידה S / לבן', 
      price: 199.90, 
      compare_at_price: 299.90, 
      sku: 'DEMO-001-S-WHT', 
      option1: 'S', 
      option2: 'לבן',
      option3: null,
      available: 12 
    },
    { 
      id: 5, 
      title: 'מידה M / לבן', 
      price: 199.90, 
      compare_at_price: 299.90, 
      sku: 'DEMO-001-M-WHT', 
      option1: 'M', 
      option2: 'לבן',
      option3: null,
      available: 0 
    },
  ],
  options: [
    { 
      id: 1, 
      name: 'מידה', 
      type: 'button' as const,
      position: 1,
      values: [
        { id: 1, value: 'S', position: 1 },
        { id: 2, value: 'M', position: 2 },
        { id: 3, value: 'L', position: 3 },
      ]
    },
    { 
      id: 2, 
      name: 'צבע', 
      type: 'color' as const,
      position: 2,
      values: [
        { id: 4, value: 'שחור', position: 1, metadata: { color: '#000000' } },
        { id: 5, value: 'לבן', position: 2, metadata: { color: '#FFFFFF' } },
      ]
    }
  ],
  variant_id: 1,
  price: 199.90,
  compare_at_price: 299.90,
  available: 45,
};

// מוצרים קשורים לדוגמה
export const DEMO_RELATED_PRODUCTS = [
  {
    id: 101,
    title: 'מוצר קשור 1',
    handle: 'related-product-1',
    image: 'https://images.unsplash.com/photo-1491553895911-0055uj6bf?w=400&h=400&fit=crop',
    price: 149.90,
    compare_at_price: null,
  },
  {
    id: 102,
    title: 'מוצר קשור 2',
    handle: 'related-product-2',
    image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop',
    price: 179.90,
    compare_at_price: 229.90,
  },
  {
    id: 103,
    title: 'מוצר קשור 3',
    handle: 'related-product-3',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    price: 299.90,
    compare_at_price: null,
  },
  {
    id: 104,
    title: 'מוצר קשור 4',
    handle: 'related-product-4',
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=400&fit=crop',
    price: 249.90,
    compare_at_price: 299.90,
  },
];

// מוצרים שנצפו לאחרונה לדוגמה
export const DEMO_RECENTLY_VIEWED = [
  {
    id: 201,
    title: 'צפית לאחרונה 1',
    handle: 'recently-viewed-1',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    price: 129.90,
    compare_at_price: null,
  },
  {
    id: 202,
    title: 'צפית לאחרונה 2',
    handle: 'recently-viewed-2',
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop',
    price: 89.90,
    compare_at_price: 119.90,
  },
  {
    id: 203,
    title: 'צפית לאחרונה 3',
    handle: 'recently-viewed-3',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop',
    price: 199.90,
    compare_at_price: null,
  },
];

// ביקורות לדוגמה
export const DEMO_REVIEWS = [
  {
    id: 1,
    rating: 5,
    title: 'מוצר מעולה!',
    content: 'המוצר הגיע במהירות ובאיכות גבוהה. ממליץ בחום!',
    author_name: 'ישראל ישראלי',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // לפני שבוע
    verified_purchase: true,
  },
  {
    id: 2,
    rating: 4,
    title: 'טוב מאוד',
    content: 'איכות טובה, המשלוח קצת איחר אבל בסך הכל מרוצה.',
    author_name: 'שרה כהן',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // לפני שבועיים
    verified_purchase: true,
  },
  {
    id: 3,
    rating: 5,
    title: 'בדיוק מה שחיפשתי',
    content: 'המוצר תואם בדיוק את התיאור והתמונות. איכות מצוינת!',
    author_name: 'דוד לוי',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // לפני חודש
    verified_purchase: false,
  },
];

// קולקציה דמה
export const DEMO_COLLECTION = {
  id: 0,
  title: 'קולקציה לדוגמה',
  handle: 'demo-collection',
  description: 'זוהי קולקציה לדוגמה המציגה איך עמוד הקטגוריה ייראה.',
  image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
  product_count: 12,
};

// מוצרי קולקציה לדוגמה
export const DEMO_COLLECTION_PRODUCTS = [
  {
    id: 301,
    title: 'מוצר 1',
    handle: 'collection-product-1',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    price: 149.90,
    compare_at_price: null,
    colors: [
      { value: 'שחור', color: '#000000' },
      { value: 'לבן', color: '#FFFFFF' },
    ],
  },
  {
    id: 302,
    title: 'מוצר 2',
    handle: 'collection-product-2',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    price: 199.90,
    compare_at_price: 249.90,
    colors: [
      { value: 'אדום', color: '#FF0000' },
      { value: 'כחול', color: '#0000FF' },
    ],
  },
  {
    id: 303,
    title: 'מוצר 3',
    handle: 'collection-product-3',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
    price: 89.90,
    compare_at_price: null,
  },
  {
    id: 304,
    title: 'מוצר 4',
    handle: 'collection-product-4',
    image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop',
    price: 299.90,
    compare_at_price: 399.90,
  },
  {
    id: 305,
    title: 'מוצר 5',
    handle: 'collection-product-5',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    price: 249.90,
    compare_at_price: null,
  },
  {
    id: 306,
    title: 'מוצר 6',
    handle: 'collection-product-6',
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=400&fit=crop',
    price: 179.90,
    compare_at_price: 219.90,
  },
];

