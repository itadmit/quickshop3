/**
 * Generate a URL-friendly slug from Hebrew text
 * Keeps Hebrew characters, replaces spaces with hyphens, removes special characters
 * @param text - Hebrew text to convert
 * @returns URL-friendly slug
 */
export function generateSlugFromHebrew(text: string): string {
  if (!text) return '';

  // Normalize: preserve existing spaces, add space before numbers that follow Hebrew/Latin letters
  let normalized = text
    .trim()
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Add space before numbers that follow Hebrew/Latin letters (e.g., "שמפו450" -> "שמפו 450")
    .replace(/([\u0590-\u05FFa-zA-Z])(\d)/g, '$1 $2')
    // Add space between Hebrew and Latin characters
    .replace(/([\u0590-\u05FF])([a-zA-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])([\u0590-\u05FF])/g, '$1 $2');

  let slug = normalized
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

