const { mkdirSync, writeFileSync, existsSync, readdirSync } = require('fs');
const path = require('path');

/**
 * Next.js 15 sometimes skips generating `page_client-reference-manifest.js`
 * for route groups. This causes Vercel's file tracing step to fail.
 * We create an empty manifest if it does not exist so tracing succeeds.
 */
const dashboardPath = path.join(
  process.cwd(),
  '.next',
  'server',
  'app',
  '(dashboard)'
);

// Check if dashboard directory exists
if (!existsSync(dashboardPath)) {
  console.log('[postbuild] Dashboard directory does not exist, skipping manifest fix.');
  process.exit(0);
}

// Try to find the actual page file name
let pageFile = null;
try {
  const files = readdirSync(dashboardPath);
  pageFile = files.find(f => f.startsWith('page') && f.endsWith('.js'));
} catch (error) {
  console.warn('[postbuild] Could not read dashboard directory:', error.message);
}

const manifestPath = path.join(
  dashboardPath,
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
      '[postbuild] ✅ Created missing (dashboard) client reference manifest for Vercel.'
    );
  } else {
    console.log('[postbuild] ✅ Client reference manifest already exists.');
  }
  
  // Also ensure the route manifest exists
  const routeManifestPath = path.join(
    dashboardPath,
    'route_client-reference-manifest.js'
  );
  
  if (!existsSync(routeManifestPath)) {
    writeFileSync(
      routeManifestPath,
      "module.exports = { clientModules: [], clientImports: [] };",
      'utf-8'
    );
    console.log('[postbuild] ✅ Created missing route manifest.');
  }
} catch (error) {
  console.warn('[postbuild] ⚠️ Failed to ensure client reference manifest:', error.message);
  // Don't fail the build if this script fails
  process.exit(0);
}

