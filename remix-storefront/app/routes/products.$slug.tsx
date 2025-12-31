import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { useState } from "react";
import { fetchPageLayout, addToCart, type ProductDetails, type Section } from "~/lib/api.server";
import { formatPrice, getDiscountPercent } from "~/lib/utils";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.product) {
    return [{ title: "מוצר לא נמצא" }];
  }
  return [
    { title: `${data.product.title} | ${data.store?.name || "QuickShop"}` },
    { name: "description", content: data.product.body_html?.replace(/<[^>]*>/g, "").substring(0, 160) || "" },
  ];
};

// 🔥 LOADER - טוען את המוצר דרך Layout API
export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const storeSlug = url.searchParams.get("store") || "demo";
  const handle = params.slug!;
  
  const layout = await fetchPageLayout(storeSlug, "product", handle);
  
  if (!layout || !layout.product) {
    throw new Response("מוצר לא נמצא", { status: 404 });
  }
  
  return json({ 
    product: layout.product, 
    store: layout.store,
    sections: layout.sections || [],
    storeSlug 
  });
}

// 🚀 ACTION - מטפל בהוספה לעגלה
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const storeId = Number(formData.get("storeId"));
  const productData = formData.get("product") as string;
  const variantId = Number(formData.get("variantId"));
  const quantity = Number(formData.get("quantity")) || 1;
  
  if (!storeId || !productData) {
    return json({ success: false, message: "נתונים חסרים" }, { status: 400 });
  }
  
  try {
    const product = JSON.parse(productData) as ProductDetails;
    await addToCart(storeId, product, variantId, quantity);
    return json({ success: true, message: "נוסף לעגלה!" });
  } catch (error: any) {
    console.error("Cart error:", error);
    return json({ 
      success: false, 
      message: error.message || "שגיאה בהוספה לעגלה" 
    }, { status: 400 });
  }
}

export default function ProductPage() {
  const { product, store, sections, storeSlug } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ success: boolean; message: string }>();
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.id || 0);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  
  const isSubmitting = fetcher.state === "submitting";
  const isAdded = fetcher.data?.success;
  
  const selectedVariantData = product.variants?.find(v => v.id === selectedVariant);
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? getDiscountPercent(product.price, product.compare_at_price!) 
    : 0;
  
  // מציאת Header/Footer מה-sections
  const headerSection = sections.find((s: Section) => s.type === "header");
  const footerSection = sections.find((s: Section) => s.type === "footer");
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      {headerSection && (
        <Header section={headerSection} store={store} storeSlug={storeSlug} />
      )}
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* תמונות */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
              {product.images?.[activeImage]?.src ? (
                <img 
                  src={product.images[activeImage].src} 
                  alt={product.images[activeImage].alt || product.title}
                  className="w-full h-full object-cover"
                />
              ) : product.image ? (
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  📦
                </div>
              )}
            </div>
            
            {/* גלריה */}
            {(product.images?.length || 0) > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images?.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === activeImage ? "border-black" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img src={img.src} alt={img.alt || ""} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* פרטי מוצר */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-3">{product.title}</h1>
              {product.vendor && (
                <span className="text-gray-500">{product.vendor}</span>
              )}
              {product.product_type && (
                <span className="text-gray-500 mr-2">• {product.product_type}</span>
              )}
            </div>
            
            {/* מחיר */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold">{formatPrice(product.price, store?.currency)}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.compare_at_price!, store?.currency)}
                  </span>
                  <span className="bg-red-100 text-red-600 text-sm font-medium px-2 py-1 rounded">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>
            
            {/* תיאור */}
            {product.body_html && (
              <div 
                className="text-gray-600 text-lg leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.body_html }}
              />
            )}
            
            {/* Options (Size, Color, etc.) */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-4">
                {product.options.map((option) => (
                  <div key={option.id} className="space-y-3">
                    <label className="block font-medium">{option.name}:</label>
                    <div className="flex flex-wrap gap-2">
                      {option.values?.map((value) => {
                        // מציאת variant שמתאים לערך הזה
                        const matchingVariant = product.variants?.find(v => 
                          v.option1 === value.value || 
                          v.option2 === value.value || 
                          v.option3 === value.value
                        );
                        
                        return (
                          <button
                            key={value.id}
                            onClick={() => matchingVariant && setSelectedVariant(matchingVariant.id)}
                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                              matchingVariant?.id === selectedVariant
                                ? "border-black bg-black text-white"
                                : "border-gray-200 hover:border-gray-400"
                            } ${matchingVariant?.available === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={matchingVariant?.available === 0}
                          >
                            {option.type === 'color' && value.metadata?.color && (
                              <span 
                                className="inline-block w-4 h-4 rounded-full mr-2 align-middle"
                                style={{ backgroundColor: value.metadata.color }}
                              />
                            )}
                            {value.value}
                            {matchingVariant?.available === 0 && " (אזל)"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Variants פשוטים (ללא options) */}
            {(!product.options || product.options.length === 0) && product.variants && product.variants.length > 1 && (
              <div className="space-y-3">
                <label className="block font-medium">בחר אפשרות:</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedVariant === variant.id
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-gray-400"
                      } ${variant.available === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={variant.available === 0}
                    >
                      {variant.title}
                      {variant.available === 0 && " (אזל)"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* כמות */}
            <div className="space-y-3">
              <label className="block font-medium">כמות:</label>
              <div className="flex items-center border border-gray-200 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors text-xl"
                >
                  -
                </button>
                <span className="px-6 py-2 font-medium min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors text-xl"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* כפתור הוספה לעגלה */}
            <fetcher.Form method="post" className="space-y-4">
              <input type="hidden" name="storeId" value={store?.id || 0} />
              <input type="hidden" name="product" value={JSON.stringify(product)} />
              <input type="hidden" name="variantId" value={selectedVariant} />
              <input type="hidden" name="quantity" value={quantity} />
              
              <button
                type="submit"
                disabled={isSubmitting || (selectedVariantData?.available || 0) === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isAdded
                    ? "bg-green-500 text-white"
                    : (selectedVariantData?.available || 0) > 0
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    מוסיף...
                  </span>
                ) : isAdded ? (
                  "✓ נוסף לעגלה!"
                ) : (selectedVariantData?.available || 0) > 0 ? (
                  `הוסף לעגלה - ${formatPrice((selectedVariantData?.price || product.price) * quantity, store?.currency)}`
                ) : (
                  "אזל מהמלאי"
                )}
              </button>
            </fetcher.Form>
            
            {/* הודעת הצלחה */}
            {isAdded && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800">
                <p className="font-medium">🎉 המוצר נוסף לעגלה בהצלחה!</p>
              </div>
            )}
            
            {/* Info badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl mb-1">🚚</div>
                <div className="text-sm text-gray-600">משלוח מהיר</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">↩️</div>
                <div className="text-sm text-gray-600">החזרה קלה</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🔒</div>
                <div className="text-sm text-gray-600">תשלום מאובטח</div>
              </div>
            </div>
            
            {/* Meta Fields */}
            {product.metafields && product.metafields.length > 0 && (
              <div className="pt-6 border-t border-gray-100 space-y-2">
                <h3 className="font-semibold mb-3">פרטים נוספים</h3>
                {product.metafields.map((field, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-600">{field.name || field.key}:</span>
                    <span className="font-medium">{field.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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

// Error Boundary
export function ErrorBoundary() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">מוצר לא נמצא</h1>
        <p className="text-gray-600 mb-8">המוצר שחיפשת לא קיים או הוסר</p>
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
