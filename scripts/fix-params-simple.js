const fs = require('fs');
const path = require('path');

// List of files to update
const files = [
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/orders/[id]/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/pages/[id]/route.ts',
  'src/app/api/payments/providers/[id]/route.ts',
  'src/app/api/discounts/[id]/usage/route.ts',
  'src/app/api/customers/segments/[id]/route.ts',
  'src/app/api/customers/[id]/tags/route.ts',
  'src/app/api/products/addons/[id]/route.ts',
  'src/app/api/products/[id]/addons/route.ts',
  'src/app/api/products/addons/[id]/options/route.ts',
  'src/app/api/products/[id]/size-charts/route.ts',
  'src/app/api/products/size-charts/[id]/route.ts',
  'src/app/api/products/[id]/meta-fields/route.ts',
  'src/app/api/products/[id]/tags/route.ts',
  'src/app/api/products/[id]/collections/route.ts',
  'src/app/api/orders/[id]/send-receipt/route.ts',
  'src/app/api/orders/[id]/mark-fraud/route.ts',
  'src/app/api/webhooks/subscriptions/[id]/route.ts',
  'src/app/api/blog/posts/[id]/route.ts',
  'src/app/api/loyalty/rules/[id]/route.ts',
  'src/app/api/loyalty/tiers/[id]/route.ts',
  'src/app/api/shipping/zones/[id]/route.ts',
  'src/app/api/categories/[id]/route.ts',
  'src/app/api/orders/[id]/timeline/route.ts',
  'src/app/api/loyalty/customers/[id]/points/route.ts',
  'src/app/api/discounts/[id]/route.ts',
  'src/app/api/shipping/zones/[id]/rates/route.ts',
  'src/app/api/customers/[id]/note/route.ts',
  'src/app/api/orders/[id]/refund/route.ts',
  'src/app/api/orders/[id]/status/route.ts',
  'src/app/api/products/[id]/images/route.ts',
  'src/app/api/products/[id]/variants/clear/route.ts',
  'src/app/api/products/[id]/variants/sync/route.ts',
  'src/app/api/products/[id]/options/clear/route.ts',
  'src/app/api/products/[id]/options/sync/route.ts',
  'src/app/api/products/[id]/variants/route.ts',
];

function upgradeFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let changed = false;

  // Step 1: Update type signature from { params: { id: string } } to { params: Promise<{ id: string }> }
  const oldPattern = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{([^}]+)\}\s*\}/g;
  const matches = [...content.matchAll(oldPattern)];
  
  for (const match of matches) {
    const paramsContent = match[1];
    const newType = `params: Promise<{${paramsContent}}>`;
    const newPattern = `{ params }: { ${newType} }`;
    content = content.replace(match[0], newPattern);
    changed = true;
  }

  // Step 2: For each function that has params: Promise, add await params at the start
  const functionRegex = /export\s+async\s+function\s+\w+\s*\([^)]*\{[^}]*params[^}]*Promise[^}]*\}[^)]*\)\s*\{/g;
  const functionMatches = [...content.matchAll(functionRegex)];
  
  for (const funcMatch of functionMatches) {
    const funcStart = funcMatch.index;
    const funcBodyStart = funcStart + funcMatch[0].length;
    
    // Find the first 'try' or opening brace
    const restOfContent = content.substring(funcBodyStart);
    const tryIndex = restOfContent.indexOf('try');
    const braceIndex = restOfContent.indexOf('{');
    
    let insertPoint = funcBodyStart;
    if (tryIndex !== -1 && (braceIndex === -1 || tryIndex < braceIndex)) {
      const tryBraceIndex = restOfContent.indexOf('{', tryIndex);
      if (tryBraceIndex !== -1) {
        insertPoint = funcBodyStart + tryBraceIndex + 1;
      }
    } else if (braceIndex !== -1) {
      insertPoint = funcBodyStart + braceIndex + 1;
    }
    
    // Check if params is already awaited before this point
    const beforeInsert = content.substring(0, insertPoint);
    if (!beforeInsert.includes('await params') && !beforeInsert.includes('const {') || !beforeInsert.match(/const\s+\{[^}]*\}\s*=\s*=\s*await\s+params/)) {
      // Extract param names from the function signature
      const funcSig = funcMatch[0];
      const paramsMatch = funcSig.match(/params:\s*Promise<\{([^}]+)\}>/);
      if (paramsMatch) {
        const paramNames = paramsMatch[1].split(',').map(p => p.trim().split(':')[0].trim());
        const destructure = `const { ${paramNames.join(', ')} } = await params;`;
        const indent = '    ';
        content = content.slice(0, insertPoint) + `\n${indent}${destructure}` + content.slice(insertPoint);
        changed = true;
        
        // Replace params.X with just X in the function body
        const funcEnd = content.indexOf('\n}', insertPoint);
        if (funcEnd !== -1) {
          const funcBody = content.substring(insertPoint, funcEnd);
          for (const paramName of paramNames) {
            const regex = new RegExp(`params\\.${paramName}\\b`, 'g');
            const newFuncBody = funcBody.replace(regex, paramName);
            content = content.slice(0, insertPoint) + newFuncBody + content.slice(funcEnd);
          }
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

console.log(`Processing ${files.length} files...\n`);

let updated = 0;
for (const file of files) {
  if (upgradeFile(file)) {
    updated++;
  }
}

console.log(`\n✅ Updated ${updated} files`);

