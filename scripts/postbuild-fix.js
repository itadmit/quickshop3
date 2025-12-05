const { mkdirSync, writeFileSync, existsSync, readdirSync } = require('fs');
const path = require('path');

/**
 * Next.js 15 sometimes skips generating `page_client-reference-manifest.js`
 * for route groups. This causes Vercel's file tracing step to fail.
 * We create an empty manifest if it does not exist so tracing succeeds.
 */
function ensureManifest(routeGroup) {
  const routePath = path.join(
    process.cwd(),
    '.next',
    'server',
    'app',
    routeGroup
  );

  // Check if route directory exists
  if (!existsSync(routePath)) {
    console.log(`[postbuild] ${routeGroup} directory does not exist, skipping manifest fix.`);
    return;
  }

  const manifestPath = path.join(
    routePath,
    'page_client-reference-manifest.js'
  );

  const manifestDir = path.dirname(manifestPath);

  try {
    if (!existsSync(manifestPath)) {
      mkdirSync(manifestDir, { recursive: true });
      writeFileSync(
        manifestPath,
        "module.exports = { clientModules: [], clientImports: [] };",
        'utf-8'
      );
      console.log(
        `[postbuild] ✅ Created missing ${routeGroup} client reference manifest for Vercel.`
      );
    }
    
    // Also ensure the route manifest exists
    const routeManifestPath = path.join(
      routePath,
      'route_client-reference-manifest.js'
    );
    
    if (!existsSync(routeManifestPath)) {
      writeFileSync(
        routeManifestPath,
        "module.exports = { clientModules: [], clientImports: [] };",
        'utf-8'
      );
      console.log(`[postbuild] ✅ Created missing ${routeGroup} route manifest.`);
    }
  } catch (error) {
    console.warn(`[postbuild] ⚠️ Failed to ensure ${routeGroup} client reference manifest:`, error.message);
  }
}

// Ensure manifests for both route groups
ensureManifest('(dashboard)');
ensureManifest('(storefront)');

