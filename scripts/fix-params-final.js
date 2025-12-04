const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/blog/posts/[id]/route.ts',
  'src/app/api/categories/[id]/route.ts',
  'src/app/api/customers/segments/[id]/route.ts',
  'src/app/api/discounts/[id]/route.ts',
  'src/app/api/loyalty/rules/[id]/route.ts',
  'src/app/api/loyalty/tiers/[id]/route.ts',
  'src/app/api/pages/[id]/route.ts',
  'src/app/api/payments/providers/[id]/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/products/addons/[id]/route.ts',
  'src/app/api/products/size-charts/[id]/route.ts',
  'src/app/api/shipping/zones/[id]/route.ts',
  'src/app/api/webhooks/subscriptions/[id]/route.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let changed = false;

  // Fix broken function signatures like:
  // { params }: { params: Promise<{ id: string }> } }
  // Should be:
  // { params }: { params: Promise<{ id: string }> }
  const brokenSigPattern = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*Promise<\{\s*([^}]+)\s*\}\s*>\s*\}\s*\}/g;
  const brokenMatches = [...content.matchAll(brokenSigPattern)];
  
  for (const match of brokenMatches) {
    const paramContent = match[1].trim();
    const fixed = `{ params }: { params: Promise<{ ${paramContent} }> }`;
    content = content.replace(match[0], fixed);
    changed = true;
  }

  // Fix broken function signatures with extra brace:
  // {
  //   { params }: { params: Promise<{ id: string }> } }
  // Should be:
  // { params }: { params: Promise<{ id: string }> }
  const brokenSigPattern2 = /\{\s*\n\s*\{\s*params\s*\}\s*:\s*\{\s*params:\s*Promise<\{\s*([^}]+)\s*\}\s*>\s*\}\s*\}\s*\n\s*\}/g;
  const brokenMatches2 = [...content.matchAll(brokenSigPattern2)];
  
  for (const match of brokenMatches2) {
    const paramContent = match[1].trim();
    const fixed = `{ params }: { params: Promise<{ ${paramContent} }> }`;
    content = content.replace(match[0], fixed);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

console.log(`Fixing ${files.length} files...\n`);

let fixed = 0;
for (const file of files) {
  if (fixFile(file)) {
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed} files`);

