import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { fetchPageLayout, fetchProducts, fetchCollections, fetchStoreSettings, type ProductListItem, type Section, type Collection } from "~/lib/api.server";
import { formatPrice, getDiscountPercent } from "~/lib/utils";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.store) {
    return [{ title: "QuickShop" }];
  }
  return [
    { title: `${data.store.name} | QuickShop` },
    { name: "description", content: `חנות אונליין - ${data.store.name}` },
  ];
};

// 🚀 LOADER - טוען את ה-Layout של דף הבית
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const storeSlug = url.searchParams.get("store") || "demo";
  
  console.log(`[Remix Loader] Loading home page for store: ${storeSlug}`);
  
  // נסה לטעון Layout, אם זה נכשל - נטען ישירות products ו-collections
  let layout = await fetchPageLayout(storeSlug, "home");
  
  // Fallback: אם Layout API נכשל, נטען ישירות
  if (!layout) {
    console.warn(`[Remix Loader] Layout API failed, trying direct APIs...`);
    
    try {
      const [products, collections, store] = await Promise.all([
        fetchProducts(storeSlug, { limit: 20 }),
        fetchCollections(storeSlug, 6),
        fetchStoreSettings(storeSlug).catch(() => null), // Fallback אם נכשל
      ]);
      
      console.log(`[Remix Loader] Direct APIs result:`, {
        productsCount: products.length,
        collectionsCount: collections.length,
        storeFound: !!store,
      });
      
      return json({
        store: store ? {
          id: store.id || 0,
          name: store.name,
          slug: store.slug || storeSlug,
          currency: store.currency || 'ILS',
          locale: store.locale || 'he-IL',
          timezone: store.timezone || 'Asia/Jerusalem',
        } : null,
        sections: [],
        products,
        collections: collections || [],
        storeSlug,
      });
    } catch (error: any) {
      console.error(`[Remix Loader] Direct APIs also failed:`, error.message);
      return json({
        store: null,
        sections: [],
        products: [],
        collections: [],
        storeSlug,
        error: `API Error: ${error.message}`,
      });
    }
  }
  
  console.log(`[Remix Loader] Layout loaded:`, {
    storeName: layout.store?.name,
    productsCount: layout.products?.length || 0,
  });
  
  // אם Layout לא החזיר מוצרים, נטען אותם ישירות
  let products = layout.products || [];
  if (products.length === 0) {
    console.log(`[Remix Loader] No products in layout, fetching directly...`);
    products = await fetchProducts(storeSlug, { limit: 20 });
  }
  
  // טעינת קולקציות
  const collections = await fetchCollections(storeSlug, 6);
  
  return json({
    store: layout.store,
    sections: layout.sections || [],
    products,
    collections,
    storeSlug,
  });
}

export default function Index() {
  const { store, sections, products, collections, storeSlug } = useLoaderData<typeof loader>();
  
  // מציאת sections לפי סוג
  const headerSection = sections.find((s: Section) => s.type === "header");
  const heroSection = sections.find((s: Section) => s.type === "hero" || s.type === "image_banner");
  const featuredProductsSection = sections.find((s: Section) => s.type === "featured_products" || s.type === "product_grid");
  const collectionsSection = sections.find((s: Section) => s.type === "featured_collections");
  const footerSection = sections.find((s: Section) => s.type === "footer");
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header - דינמי מה-Layout */}
      {headerSection && (
        <Header section={headerSection} store={store} storeSlug={storeSlug} />
      )}
      
      {/* Hero Section */}
      {heroSection ? (
        <HeroSection section={heroSection} />
      ) : (
        <DefaultHero store={store} />
      )}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Featured Products */}
        {featuredProductsSection ? (
          <FeaturedProductsSection 
            section={featuredProductsSection} 
            products={products}
            storeSlug={storeSlug}
          />
        ) : products.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold">מוצרים מובילים</h2>
              <Link 
                to={`/products?store=${storeSlug}`} 
                className="text-gray-600 hover:text-black transition-colors"
              >
                לכל המוצרים ←
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product: ProductListItem) => (
                <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
              ))}
            </div>
          </div>
        )}
        
        {/* Collections */}
        {collectionsSection ? (
          <CollectionsSection section={collectionsSection} storeSlug={storeSlug} />
        ) : collections && collections.length > 0 && (
          <section className="mt-20">
            <h2 className="text-3xl font-bold mb-10">קולקציות</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {collections.map((collection: Collection) => (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.handle}?store=${storeSlug}`}
                  className="group relative h-64 rounded-2xl overflow-hidden bg-gray-100"
                >
                  {collection.image_url && (
                    <img 
                      src={collection.image_url} 
                      alt={collection.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white">{collection.title}</h3>
                    {collection.products_count > 0 && (
                      <p className="text-white/80 text-sm">{collection.products_count} מוצרים</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        
        {/* No Products Message */}
        {products.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-semibold mb-2">
              {store ? "אין מוצרים להצגה" : "בעיה בחיבור ל-API"}
            </h3>
            <p className="text-gray-500 mb-4">
              {store 
                ? "אין מוצרים בחנות זו כרגע"
                : `לא ניתן לטעון נתונים מה-backend. יש בעיה בחיבור למסד הנתונים.`
              }
            </p>
            {!store && (
              <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-2xl max-w-xl mx-auto text-right">
                <h4 className="font-semibold mb-3 text-yellow-800">🔧 בעיה זוהתה:</h4>
                <p className="text-yellow-700 text-sm mb-3">
                  ה-backend מחזיר timeout בחיבור למסד הנתונים. זה אומר שיש בעיה עם:
                </p>
                <ol className="space-y-2 text-yellow-700 text-sm text-right">
                  <li>• חיבור למסד הנתונים (Neon PostgreSQL)</li>
                  <li>• Redis cache (אם מוגדר)</li>
                  <li>• ה-DATABASE_URL ב-.env של ה-backend</li>
                </ol>
                <div className="mt-4 pt-4 border-t border-yellow-300">
                  <p className="text-xs text-yellow-600">
                    💡 פתרון: בדוק את הקונסול של ה-Next.js backend (פורט 3099) לראות את השגיאה המדויקת.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      {footerSection && <Footer section={footerSection} store={store} />}
    </div>
  );
}

// ============================================
// Components
// ============================================

function Header({ section, store, storeSlug }: { section: Section; store: any; storeSlug?: string }) {
  const logo = section.settings?.logo;
  const navigation = section.settings?.navigation || {};
  const menuItems = navigation.menu_items || [];
  
  // Helper to add storeSlug to URLs
  const getUrl = (url: string) => {
    if (!url || url === "#") return "#";
    if (url.startsWith("http")) return url; // External links
    if (url.startsWith("/")) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${storeSlug ? `${separator}store=${storeSlug}` : ""}`;
    }
    return url;
  };
  
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to={storeSlug ? `/?store=${storeSlug}` : "/"} className="flex items-center gap-3">
          {logo?.image_url ? (
            <img src={logo.image_url} alt={store?.name || "Logo"} className="h-10" />
          ) : (
            <span className="text-2xl font-bold">{logo?.text || store?.name || "⚡ QuickShop"}</span>
          )}
        </Link>
        
        <div className="flex items-center gap-6">
          {menuItems.map((item: any, idx: number) => (
            <Link 
              key={idx}
              to={getUrl(item.url || "#")} 
              className="text-gray-600 hover:text-black transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link 
            to={`/products?store=${store?.slug || "demo"}`}
            className="text-gray-600 hover:text-black transition-colors"
          >
            מוצרים
          </Link>
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center">
              0
            </span>
          </button>
        </div>
      </nav>
    </header>
  );
}

function DefaultHero({ store }: { store: any }) {
  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="relative z-10 text-center py-24 px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          {store?.name || "חנות אונליין"}
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            מהירה במיוחד
          </span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          Remix.js + Edge Computing = ⚡ מהירות שלא ידעתם
        </p>
      </div>
    </section>
  );
}

function HeroSection({ section }: { section: Section }) {
  const image = section.settings?.image;
  const title = section.settings?.title || section.blocks?.[0]?.settings?.title;
  const subtitle = section.settings?.subtitle || section.blocks?.[0]?.settings?.subtitle;
  
  return (
    <section className="relative h-[60vh] min-h-[400px] bg-gray-900 text-white">
      {image && (
        <img 
          src={image} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div>
          {title && <h1 className="text-5xl md:text-7xl font-bold mb-6">{title}</h1>}
          {subtitle && <p className="text-xl text-gray-300">{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}

function FeaturedProductsSection({ 
  section, 
  products, 
  storeSlug 
}: { 
  section: Section; 
  products: ProductListItem[];
  storeSlug: string;
}) {
  const title = section.settings?.title || "מוצרים מובילים";
  const limit = section.settings?.limit || 8;
  const displayProducts = products.slice(0, limit);
  
  return (
    <section className="mb-20">
      <h2 className="text-3xl font-bold mb-10">{title}</h2>
      {displayProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product: ProductListItem) => (
            <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-12">אין מוצרים להצגה</p>
      )}
    </section>
  );
}

function CollectionsSection({ section, storeSlug }: { section: Section; storeSlug: string }) {
  // זה יטען את הקטגוריות מה-API
  return (
    <section className="mt-20">
      <h2 className="text-3xl font-bold mb-10">קולקציות</h2>
      <p className="text-gray-500 text-center py-12">קולקציות יטענו כאן</p>
    </section>
  );
}

function Footer({ section, store }: { section: Section; store: any }) {
  const footerText = section.settings?.footer_text || `© ${new Date().getFullYear()} ${store?.name || "QuickShop"}`;
  
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
        <p>{footerText}</p>
        <p className="text-sm mt-2">
          ⚡ Powered by <span className="font-semibold text-black">Remix.js</span>
        </p>
      </div>
    </footer>
  );
}

function ProductCard({ product, storeSlug }: { product: ProductListItem; storeSlug: string }) {
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? getDiscountPercent(product.price, product.compare_at_price!) 
    : 0;
  
  return (
    <Link 
      to={`/products/${product.handle}?store=${storeSlug}`}
      className="group card overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            📦
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercent}%
          </span>
        )}
        {product.available === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">אזל מהמלאי</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 group-hover:text-gray-600 transition-colors line-clamp-2">
          {product.title}
        </h3>
        {product.vendor && (
          <p className="text-sm text-gray-500 mb-1">{product.vendor}</p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
