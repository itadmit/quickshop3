import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [{ title: "עגלת קניות | QuickShop" }];
};

// בפרודקשן, העגלה תישמר ב-session או ב-cookie
export async function loader({ request }: LoaderFunctionArgs) {
  // TODO: לטעון עגלה מה-session
  return json({
    items: [],
    total: 0,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  switch (intent) {
    case "update":
      // עדכון כמות
      break;
    case "remove":
      // הסרת פריט
      break;
    case "checkout":
      // מעבר לתשלום
      break;
  }
  
  return json({ success: true });
}

export default function CartPage() {
  const { items, total } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            ⚡ QuickShop
          </Link>
          <Link to="/" className="text-gray-600 hover:text-black transition-colors">
            ← המשך בקניות
          </Link>
        </div>
      </nav>
      
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">עגלת קניות</h1>
        
        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold mb-2">העגלה ריקה</h2>
            <p className="text-gray-500 mb-6">עדיין לא הוספת מוצרים לעגלה</p>
            <Link 
              to="/products" 
              className="btn btn-primary inline-block"
            >
              צפייה במוצרים
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-2xl border border-gray-100 divide-y">
              {/* כאן יהיו פריטי העגלה */}
            </div>
            
            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between text-lg font-semibold mb-6">
                <span>סה״כ לתשלום:</span>
                <span>₪{total.toFixed(2)}</span>
              </div>
              
              <button className="w-full btn btn-primary py-4 text-lg">
                מעבר לתשלום
              </button>
            </div>
          </div>
        )}
        
        {/* Demo Notice */}
        <div className="mt-12 p-6 bg-blue-50 rounded-2xl text-blue-800">
          <h3 className="font-semibold mb-2">💡 הערה:</h3>
          <p className="text-sm">
            זה פרויקט דמו. העגלה תישמר ב-session/cookies ותתחבר ל-API הקיים של QuickShop.
          </p>
        </div>
      </main>
    </div>
  );
}

