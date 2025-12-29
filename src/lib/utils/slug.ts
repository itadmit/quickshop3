import { queryOne } from '@/lib/db';

/**
 * Generate a unique slug (handle) for a product, page, blog post, or collection
 * @param title - Title
 * @param tableName - Table name ('products', 'pages', 'blog_posts', 'collections')
 * @param storeId - Store ID
 * @param excludeId - ID to exclude from uniqueness check (for updates)
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  title: string,
  tableName: 'products' | 'pages' | 'blog_posts' | 'collections',
  storeId: number,
  excludeId?: number
): Promise<string> {
  // Convert title to slug - keep Hebrew and Latin characters
  // Normalize: preserve existing spaces, add space before numbers that follow Hebrew/Latin letters
  let normalized = title
    .trim()
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Add space before numbers that follow Hebrew/Latin letters (e.g., "שמפו450" -> "שמפו 450")
    .replace(/([\u0590-\u05FFa-zA-Z])(\d)/g, '$1 $2')
    // Add space between Hebrew and Latin characters
    .replace(/([\u0590-\u05FF])([a-zA-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])([\u0590-\u05FF])/g, '$1 $2');
  
  let baseSlug = normalized
    .split('')
    .map((char, index, array) => {
      // Keep Hebrew characters (א-ת)
      if (/[\u0590-\u05FF]/.test(char)) {
        return char;
      }
      // Keep Latin letters and numbers (lowercase)
      if (/[a-zA-Z0-9]/.test(char)) {
        return char.toLowerCase();
      }
      // Replace spaces with hyphen
      if (/\s/.test(char)) {
        return '-';
      }
      // Remove other special characters
      return '';
    })
    .join('')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // If slug is empty after processing, use a default
  if (!baseSlug) {
    baseSlug = tableName === 'products' ? 'product' : tableName === 'pages' ? 'page' : 'post';
  }

  // Check if slug already exists
  let slug = baseSlug;
  let counter = 1;

  // Map table name to actual database table
  const dbTableName = tableName === 'collections' ? 'product_collections' : tableName;

  while (true) {
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM ${dbTableName} 
       WHERE store_id = $1 AND handle = $2 
       ${excludeId ? 'AND id != $3' : ''}`,
      excludeId ? [storeId, slug, excludeId] : [storeId, slug]
    );

    if (!existing) {
      return slug; // Slug is unique
    }

    // Slug exists, append counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

