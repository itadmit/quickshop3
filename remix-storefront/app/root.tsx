import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  // כאן אפשר לטעון הגדרות גלובליות מה-API
  return json({
    ENV: {
      API_URL: process.env.API_URL || "http://localhost:3000/api",
    },
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-white text-gray-900 font-sans antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  
  return <Outlet context={data} />;
}

export function ErrorBoundary() {
  return (
    <html lang="he" dir="rtl">
      <head>
        <title>שגיאה</title>
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">אופס!</h1>
          <p className="mt-4 text-gray-600">משהו השתבש</p>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

