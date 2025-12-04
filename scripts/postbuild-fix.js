const { mkdirSync, writeFileSync, existsSync } = require('fs');
const path = require('path');

/**
 * Next.js 15 sometimes skips generating `page_client-reference-manifest.js`
 * for route groups. This causes Vercel's file tracing step to fail.
 * We create an empty manifest if it does not exist so tracing succeeds.
 */
const manifestPath = path.join(
  process.cwd(),
  '.next',
  'server',
  'app',
  '(dashboard)',
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
      '[postbuild] Created missing (dashboard) client reference manifest for Vercel.'
    );
  } else {
    console.log('[postbuild] Client reference manifest already exists.');
  }
} catch (error) {
  console.warn('[postbuild] Failed to ensure client reference manifest:', error);
}

