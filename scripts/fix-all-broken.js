const fs = require('fs');
const path = require('path');

const files = [
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

  // Fix pattern:
  //   {
  //     { params }: { params: Promise<{ id: string }> }
  //   )
  // Should be:
  //   { params }: { params: Promise<{ id: string }> }
  //   )
  const brokenPattern = /(\s+)\{\s*\n\s*\{\s*params\s*\}\s*:\s*\{\s*params:\s*Promise<\{\s*([^}]+)\s*\}\s*>\s*\}\s*\n\s*\}\s*\)/g;
  
  content = content.replace(brokenPattern, (match, indent, paramContent) => {
    changed = true;
    return `${indent}{ params }: { params: Promise<{ ${paramContent.trim()} }> }\n${indent})`;
  });

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

