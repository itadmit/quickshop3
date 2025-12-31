import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { fetchPageLayout, fetchProducts, type ProductListItem, type Section } from "~/lib/api.server";
import { formatPrice, getDiscountPercent } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [
    { title: "כל המוצרים | QuickShop" },
    { name: "description", content: "צפו בכל המוצרים שלנו" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const storeSlug = url.searchParams.get("store") || "demo";
  const collection = url.searchParams.get("collection");
  const sort = url.searchParams.get("sort") || "newest";
  
  // טעינת Layout + Products
  const [layout, products] = await Promise.all([
    fetchPageLayout(storeSlug, collection ? "collection" : "products", collection || undefined),
    fetchProducts(storeSlug, { collection, sort }),
  ]);
  
  return json({ 
    products, 
    store: layout?.store,
    sections: layout?.sections || [],
    collection: layout?.collection,
    storeSlug 
  });
}

export default function ProductsPage() {
  const { products, store, sections, collection, storeSlug } = useLoaderData<typeof loader>();
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
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold">
              {collection ? collection.title : "כל המוצרים"}
            </h1>
            {collection?.description && (
              <p className="text-gray-500 mt-2">{collection.description}</p>
            )}
            <p className="text-gray-500 mt-2">{products.length} מוצרים</p>
          </div>
          
          {/* Sort */}
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
              <option value="name-desc">לפי שם (ב-א)</option>
            </select>
          </div>
        </div>
        
        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-semibold mb-2">אין מוצרים</h3>
            <p className="text-gray-500">לא נמצאו מוצרים בקטגוריה זו</p>
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
          ← חזרה
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
