import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { fetchPageLayout, type ProductListItem, type Section } from "~/lib/api.server";
import { formatPrice, getDiscountPercent } from "~/lib/utils";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.collection) {
    return [{ title: "קולקציה לא נמצאה" }];
  }
  return [
    { title: `${data.collection.title} | ${data.store?.name || "QuickShop"}` },
    { name: "description", content: data.collection.description || "" },
  ];
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const storeSlug = url.searchParams.get("store") || "demo";
  const handle = params.handle!;
  
  const layout = await fetchPageLayout(storeSlug, "collection", handle);
  
  if (!layout || !layout.collection) {
    throw new Response("קולקציה לא נמצאה", { status: 404 });
  }
  
  return json({
    collection: layout.collection,
    products: layout.products || [],
    store: layout.store,
    sections: layout.sections || [],
    storeSlug,
  });
}

export default function CollectionPage() {
  const { collection, products, store, sections, storeSlug } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";
  
  const headerSection = sections.find((s: Section) => s.type === "header");
  const footerSection = sections.find((s: Section) => s.type === "footer");
  
  const handleSort = (sort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sort", sort);
    setSearchParams(newParams);
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      {headerSection && (
        <Header section={headerSection} store={store} storeSlug={storeSlug} />
      )}
      
      {/* Collection Hero */}
      {collection.image_url && (
        <section className="relative h-64 bg-gray-900">
          <img 
            src={collection.image_url} 
            alt={collection.title}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{collection.title}</h1>
              {collection.description && (
                <p className="text-xl text-gray-200 max-w-2xl">{collection.description}</p>
              )}
            </div>
          </div>
        </section>
      )}
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        {!collection.image_url && (
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-4">{collection.title}</h1>
            {collection.description && (
              <p className="text-gray-600 text-lg">{collection.description}</p>
            )}
          </div>
        )}
        
        {/* Sort & Count */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <p className="text-gray-500">
            {products.length} {products.length === 1 ? "מוצר" : "מוצרים"}
            {collection.product_count && collection.product_count > products.length && (
              <span> מתוך {collection.product_count}</span>
            )}
          </p>
          
          <div className="flex items-center gap-3">
            <span className="text-gray-600">מיון:</span>
            <select 
              value={currentSort}
              onChange={(e) => handleSort(e.target.value)}
              className="input max-w-[180px]"
            >
              <option value="newest">חדשים ביותר</option>
              <option value="price-low">מחיר: נמוך לגבוה</option>
              <option value="price-high">מחיר: גבוה לנמוך</option>
              <option value="name-asc">לפי שם (א-ב)</option>
            </select>
          </div>
        </div>
        
        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-semibold mb-2">אין מוצרים בקולקציה זו</h3>
            <Link 
              to={`/?store=${storeSlug}`}
              className="text-blue-600 hover:underline"
            >
              חזרה לחנות
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: ProductListItem) => (
              <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
            ))}
          </div>
        )}
      </main>
      
      {/* Footer */}
      {footerSection && <Footer section={footerSection} store={store} />}
    </div>
  );
}

function Header({ section, store, storeSlug }: { section: Section; store: any; storeSlug: string }) {
  const logo = section.settings?.logo;
  
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to={`/?store=${storeSlug}`} className="flex items-center gap-3">
          {logo?.image_url ? (
            <img src={logo.image_url} alt={store?.name || "Logo"} className="h-10" />
          ) : (
            <span className="text-xl font-bold">{logo?.text || store?.name || "⚡ QuickShop"}</span>
          )}
        </Link>
        <Link to={`/?store=${storeSlug}`} className="text-gray-600 hover:text-black transition-colors">
          ← חזרה לחנות
        </Link>
      </div>
    </nav>
  );
}

function Footer({ section, store }: { section: Section; store: any }) {
  const footerText = section.settings?.footer_text || `© ${new Date().getFullYear()} ${store?.name || "QuickShop"}`;
  
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
        <p>{footerText}</p>
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
      className="group card overflow-hidden hover:shadow-lg transition-all duration-300"
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

// Error Boundary
export function ErrorBoundary() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">קולקציה לא נמצאה</h1>
        <p className="text-gray-600 mb-8">הקולקציה שחיפשת לא קיימת</p>
        <Link 
          to="/" 
          className="btn btn-primary inline-block"
        >
          חזרה לחנות
        </Link>
      </div>
    </div>
  );
}

