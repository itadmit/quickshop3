/**
 * Generate a URL-friendly slug from Hebrew text
 * Keeps Hebrew characters, replaces spaces with hyphens, removes special characters
 * @param text - Hebrew text to convert
 * @returns URL-friendly slug
 */
export function generateSlugFromHebrew(text: string): string {
  if (!text) return '';

  let slug = text
    .trim()
    .split('')
    .map((char) => {
      // Keep Hebrew characters (א-ת)
      if (/[\u0590-\u05FF]/.test(char)) {
        return char;
      }
      // Keep Latin letters and numbers
      if (/[a-zA-Z0-9]/.test(char)) {
        return char;
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

  // If slug is empty after processing, generate a fallback
  if (!slug) {
    slug = 'category';
  }

  return slug;
}

