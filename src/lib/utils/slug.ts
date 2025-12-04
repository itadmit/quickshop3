import { queryOne } from '@/lib/db';

/**
 * Generate a unique slug (handle) for a product, page, or blog post
 * @param title - Title
 * @param tableName - Table name ('products', 'pages', 'blog_posts')
 * @param storeId - Store ID
 * @param excludeId - ID to exclude from uniqueness check (for updates)
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  title: string,
  tableName: 'products' | 'pages' | 'blog_posts',
  storeId: number,
  excludeId?: number
): Promise<string> {
  // Convert title to slug
  let baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[\u0590-\u05FF]/g, '') // Remove Hebrew characters
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // If slug is empty after processing, use a default
  if (!baseSlug) {
    baseSlug = tableName === 'products' ? 'product' : tableName === 'pages' ? 'page' : 'post';
  }

  // Check if slug already exists
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM ${tableName} 
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

