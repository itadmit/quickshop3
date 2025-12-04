const fs = require('fs');
const path = require('path');

// List of files that have errors
const files = [
  'src/app/api/blog/posts/[id]/route.ts',
  'src/app/api/categories/[id]/route.ts',
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/customers/[id]/tags/route.ts',
  'src/app/api/discounts/[id]/route.ts',
  'src/app/api/loyalty/rules/[id]/route.ts',
  'src/app/api/loyalty/tiers/[id]/route.ts',
  'src/app/api/payments/providers/[id]/route.ts',
  'src/app/api/pages/[id]/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/products/addons/[id]/route.ts',
  'src/app/api/products/[id]/meta-fields/route.ts',
  'src/app/api/products/size-charts/[id]/route.ts',
  'src/app/api/orders/[id]/route.ts',
  'src/app/api/shipping/zones/[id]/route.ts',
  'src/app/api/webhooks/subscriptions/[id]/route.ts',
  'src/app/api/customers/segments/[id]/route.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let changed = false;

  // Fix pattern: { params: Promise<{ const { id } = await params; id: string }> }
  // Should be: { params: Promise<{ id: string }> }
  const brokenPattern = /\{\s*params:\s*Promise<\{\s*const\s+\{\s*(\w+)\s*\}\s*=\s*await\s+params;\s*([^}]+)\s*\}\s*>\s*\}/g;
  const brokenMatches = [...content.matchAll(brokenPattern)];
  
  for (const match of brokenMatches) {
    const paramContent = match[2].trim();
    const fixed = `{ params: Promise<{ ${paramContent} }> }`;
    content = content.replace(match[0], fixed);
    changed = true;
  }

  // Fix pattern in function signature: { params }: { params: Promise<{ const { id } = await params; id: string }> }
  const brokenSigPattern = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*Promise<\{\s*const\s+\{\s*(\w+)\s*\}\s*=\s*await\s+params;\s*([^}]+)\s*\}\s*>\s*\}/g;
  const brokenSigMatches = [...content.matchAll(brokenSigPattern)];
  
  for (const match of brokenSigMatches) {
    const paramContent = match[2].trim();
    const fixed = `{ params }: { params: Promise<{ ${paramContent} }> }`;
    content = content.replace(match[0], fixed);
    changed = true;
  }

  // Fix duplicate await params: const { id } = await params; params }: { params: Promise<{ id: string }> }
  const duplicatePattern = /const\s+\{\s*(\w+)\s*\}\s*=\s*await\s+params;\s*params\s*\}\s*:\s*\{\s*params:\s*Promise<\{([^}]+)\}>/g;
  const duplicateMatches = [...content.matchAll(duplicatePattern)];
  
  for (const match of duplicateMatches) {
    const paramContent = match[2].trim();
    const fixed = `{ params }: { params: Promise<{ ${paramContent} }> }`;
    content = content.replace(match[0], fixed);
    changed = true;
  }

  // Now ensure all functions with params: Promise have await params at the start of try block
  const functionRegex = /export\s+async\s+function\s+(\w+)\s*\([^)]*\{[^}]*params[^}]*Promise[^}]*\}[^)]*\)\s*\{/g;
  const functionMatches = [...content.matchAll(functionRegex)];
  
  for (const funcMatch of functionMatches) {
    const funcStart = funcMatch.index;
    const funcBodyStart = funcStart + funcMatch[0].length;
    
    // Find the try block
    const restOfContent = content.substring(funcBodyStart);
    const tryIndex = restOfContent.indexOf('try');
    
    if (tryIndex !== -1) {
      const tryBraceIndex = restOfContent.indexOf('{', tryIndex);
      if (tryBraceIndex !== -1) {
        const insertPoint = funcBodyStart + tryBraceIndex + 1;
        
        // Check if params is already awaited
        const beforeInsert = content.substring(0, insertPoint);
        const afterInsert = content.substring(insertPoint, insertPoint + 200);
        
        // Extract param names from function signature
        const funcSig = funcMatch[0];
        const paramsMatch = funcSig.match(/params:\s*Promise<\{([^}]+)\}>/);
        
        if (paramsMatch && !beforeInsert.includes('await params') && !afterInsert.match(/const\s+\{[^}]+\}\s*=\s*await\s+params/)) {
          const paramNames = paramsMatch[1].split(',').map(p => {
            const parts = p.trim().split(':');
            return parts[0].trim();
          });
          
          const destructure = `const { ${paramNames.join(', ')} } = await params;`;
          const indent = '    ';
          content = content.slice(0, insertPoint) + `\n${indent}${destructure}` + content.slice(insertPoint);
          changed = true;
          
          // Replace params.X with just X in the function body
          const funcEnd = content.indexOf('\n}', insertPoint);
          if (funcEnd !== -1) {
            const funcBody = content.substring(insertPoint, funcEnd);
            let newFuncBody = funcBody;
            for (const paramName of paramNames) {
              const regex = new RegExp(`params\\.${paramName}\\b`, 'g');
              newFuncBody = newFuncBody.replace(regex, paramName);
            }
            if (newFuncBody !== funcBody) {
              content = content.slice(0, insertPoint) + newFuncBody + content.slice(funcEnd);
            }
          }
        }
      }
    }
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

