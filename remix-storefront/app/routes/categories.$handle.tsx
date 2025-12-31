import type { LoaderFunctionArgs } from "@remix-run/node";

// Redirect /categories/* to /collections/* (they're the same thing)
export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const storeSlug = url.searchParams.get("store") || "demo";
  
  // Get the handle from params (already decoded by Remix)
  const handle = params.handle;
  
  // Build path segments - encode each segment separately for URL safety
  const encodedHandle = encodeURIComponent(handle);
  const encodedStoreSlug = encodeURIComponent(storeSlug);
  
  // Build the redirect URL with properly encoded segments
  const redirectPath = `/collections/${encodedHandle}?store=${encodedStoreSlug}`;
  
  // Use Response.redirect with encoded URL to handle Hebrew characters properly
  return Response.redirect(new URL(redirectPath, url.origin).toString(), 302);
}

