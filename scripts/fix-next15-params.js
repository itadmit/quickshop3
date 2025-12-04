const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

/**
 * Script to upgrade all API route handlers to Next.js 15 format
 * where params is now a Promise
 */

function upgradeRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Pattern: { params }: { params: { id: string } } -> { params }: { params: Promise<{ id: string }> }
  const paramTypePattern = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{([^}]+)\}\s*\}/g;
  const matches = [...content.matchAll(paramTypePattern)];
  
  for (const match of matches) {
    const paramsContent = match[1];
    const newType = `params: Promise<{${paramsContent}}>`;
    const oldPattern = match[0];
    const newPattern = `{ params }: { ${newType} }`;
    
    content = content.replace(oldPattern, newPattern);
    changed = true;
  }

  // Pattern: Update params.id, params.slug, etc. to await params first
  // Find function signatures that have params: Promise
  const functionPattern = /export\s+async\s+function\s+(\w+)\s*\([^)]*\{[^}]*params[^}]*Promise[^}]*\}[^)]*\)\s*\{/g;
  const functionMatches = [...content.matchAll(functionPattern)];
  
  for (const funcMatch of functionMatches) {
    const funcStart = funcMatch.index;
    const funcEnd = content.indexOf('}', funcStart + funcMatch[0].length);
    const funcBody = content.substring(funcStart, funcEnd);
    
    // Find all params.X accesses in this function
    const paramAccessPattern = /params\.(\w+)/g;
    const paramAccesses = [...funcBody.matchAll(paramAccessPattern)];
    
    if (paramAccesses.length > 0) {
      // Get unique param keys
      const paramKeys = [...new Set(paramAccesses.map(m => m[1]))];
      
      // Check if params is already awaited
      const firstAccess = paramAccesses[0];
      const beforeFirstAccess = funcBody.substring(0, firstAccess.index);
      
      if (!beforeFirstAccess.includes('await params')) {
        // Find the opening brace of the function
        const tryIndex = funcBody.indexOf('try');
        if (tryIndex !== -1) {
          const afterTry = funcBody.indexOf('{', tryIndex);
          if (afterTry !== -1) {
            const insertPoint = funcStart + afterTry + 1;
            const indent = '    '; // 4 spaces
            const destructure = `const { ${paramKeys.join(', ')} } = await params;`;
            content = content.slice(0, insertPoint) + 
                     `\n${indent}${destructure}` +
                     content.slice(insertPoint);
            changed = true;
            
            // Replace all params.X with just X
            for (const key of paramKeys) {
              const regex = new RegExp(`params\\.${key}`, 'g');
              content = content.replace(regex, key);
            }
          }
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

function main() {
  const apiRoutes = globSync('src/app/api/**/[*]/route.ts', {
    cwd: process.cwd(),
    absolute: true,
  });

  console.log(`Found ${apiRoutes.length} API route files to check...\n`);

  let updated = 0;
  for (const file of apiRoutes) {
    if (upgradeRouteFile(file)) {
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated} files`);
}

main();

