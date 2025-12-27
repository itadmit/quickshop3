/**
 * Migration tool from old QuickShop to new system
 */

import { query, queryOne } from '@/lib/db';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { v2 as cloudinary } from 'cloudinary';
import { OldProduct, OldProductVariant, ParsedVariantOptions } from './old-quickshop-types';

// Configure Cloudinary
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Download image from S3 and upload to Cloudinary
 * 
 * Supports multiple S3 URL formats:
 * 1. Full URL: https://s3.amazonaws.com/bucket/store_id/filename
 * 2. Full URL: https://bucket.s3.amazonaws.com/store_id/filename
 * 3. Full URL: https://bucket.s3.region.amazonaws.com/store_id/filename
 * 4. Filename only: will try multiple formats
 */
async function migrateImageFromS3(
  s3UrlOrFilename: string,
  storeId: number,
  entityType: string = 'products'
): Promise<string | null> {
  try {
    // Skip noimage.svg
    if (s3UrlOrFilename === 'noimage.svg' || !s3UrlOrFilename) {
      return null;
    }
    
    // If it's already a full URL, use it
    let imageUrl: string | null = null;
    if (s3UrlOrFilename.startsWith('http://') || s3UrlOrFilename.startsWith('https://')) {
      imageUrl = s3UrlOrFilename;
    } else {
      // Try multiple S3 URL formats
      const s3BaseUrl = process.env.OLD_S3_BASE_URL;
      const possibleUrls: string[] = [];
      
      if (s3BaseUrl) {
        // Use configured base URL
        possibleUrls.push(`${s3BaseUrl}/${storeId}/${s3UrlOrFilename}`);
        possibleUrls.push(`${s3BaseUrl}/${s3UrlOrFilename}`);
      } else {
        // Try common S3 formats
        const bucketName = process.env.OLD_S3_BUCKET || 'quickshop-images';
        const region = process.env.OLD_S3_REGION || 'us-east-1';
        
        possibleUrls.push(`https://${bucketName}.s3.${region}.amazonaws.com/${storeId}/${s3UrlOrFilename}`);
        possibleUrls.push(`https://${bucketName}.s3.${region}.amazonaws.com/${s3UrlOrFilename}`);
        possibleUrls.push(`https://s3.${region}.amazonaws.com/${bucketName}/${storeId}/${s3UrlOrFilename}`);
        possibleUrls.push(`https://s3.${region}.amazonaws.com/${bucketName}/${s3UrlOrFilename}`);
        possibleUrls.push(`https://s3.amazonaws.com/${bucketName}/${storeId}/${s3UrlOrFilename}`);
        possibleUrls.push(`https://s3.amazonaws.com/${bucketName}/${s3UrlOrFilename}`);
      }
      
      // Try each URL until one works
      for (const url of possibleUrls) {
        try {
          const testResponse = await fetch(url, { method: 'HEAD' });
          if (testResponse.ok) {
            imageUrl = url;
            break;
          }
        } catch (e) {
          // Continue to next URL
        }
      }
      
      if (!imageUrl) {
        console.warn(`Could not find image: ${s3UrlOrFilename}, tried: ${possibleUrls.join(', ')}`);
        return null;
      }
    }

    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Failed to download image: ${imageUrl} (${response.status})`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    const filename = s3UrlOrFilename.split('/').pop() || s3UrlOrFilename || 'image.jpg';

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: `quickshop3/${storeId}/${entityType}`,
        public_id: filename.replace(/\.[^/.]+$/, ''),
        resource_type: 'image',
        transformation: [
          {
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error(`Error migrating image ${s3UrlOrFilename}:`, error);
    return null;
  }
}

/**
 * Save image to media_files table
 */
async function saveToMediaFiles(
  storeId: number,
  filename: string,
  fileUrl: string,
  fileSize: number,
  mimeType: string
): Promise<number> {
  const result = await queryOne<{ id: number }>(
    `INSERT INTO media_files (
      store_id, filename, original_filename, file_path, file_url,
      file_type, mime_type, file_size, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
    RETURNING id`,
    [
      storeId,
      filename,
      filename,
      fileUrl, // file_path
      fileUrl, // file_url
      'image',
      mimeType,
      fileSize,
    ]
  );

  return result?.id || 0;
}

/**
 * Parse variant_options JSON
 */
function parseVariantOptions(variantOptionsJson: string | null): ParsedVariantOptions | null {
  if (!variantOptionsJson) return null;
  
  try {
    return JSON.parse(variantOptionsJson);
  } catch (error) {
    console.error('Error parsing variant_options:', error);
    return null;
  }
}

/**
 * Parse gallery JSON array
 */
function parseGallery(galleryJson: string | null): string[] {
  if (!galleryJson) return [];
  
  try {
    const parsed = JSON.parse(galleryJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Try to parse as comma-separated string
    if (typeof galleryJson === 'string') {
      return galleryJson.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }
}

/**
 * Build variant title from options
 */
function buildVariantTitle(options: ParsedVariantOptions | null): string {
  if (!options || Object.keys(options).length === 0) {
    return 'Default Title';
  }
  
  const values = Object.values(options);
  return values.join(' / ') || 'Default Title';
}

/**
 * Extract unique options from variants
 */
function extractOptionsFromVariants(variants: OldProductVariant[]): Map<string, Set<string>> {
  const optionsMap = new Map<string, Set<string>>();
  
  for (const variant of variants) {
    const options = parseVariantOptions(variant.variant_options);
    if (options) {
      for (const [optionName, optionValue] of Object.entries(options)) {
        if (!optionsMap.has(optionName)) {
          optionsMap.set(optionName, new Set());
        }
        optionsMap.get(optionName)!.add(optionValue);
      }
    }
  }
  
  return optionsMap;
}

/**
 * Create product options and values
 */
async function createProductOptions(
  productId: number,
  optionsMap: Map<string, Set<string>>
): Promise<Map<string, number>> {
  const optionIdMap = new Map<string, number>(); // option name -> option id
  
  let position = 1;
  for (const [optionName, values] of optionsMap.entries()) {
    // Create option
    const option = await queryOne<{ id: number }>(
      `INSERT INTO product_options (
        product_id, name, type, position, created_at
      ) VALUES ($1, $2, $3, $4, now())
      RETURNING id`,
      [productId, optionName, 'button', position]
    );
    
    if (option) {
      const optionId = option.id;
      optionIdMap.set(optionName, optionId);
      
      // Create option values
      let valuePosition = 1;
      for (const value of Array.from(values).sort()) {
        await query(
          `INSERT INTO product_option_values (
            option_id, value, position, created_at
          ) VALUES ($1, $2, $3, now())`,
          [optionId, value, valuePosition]
        );
        valuePosition++;
      }
    }
    
    position++;
  }
  
  return optionIdMap;
}

/**
 * Migrate a single product from old system
 */
export async function migrateProduct(
  oldProduct: OldProduct,
  oldVariants: OldProductVariant[],
  newStoreId: number
): Promise<{ productId: number; variantIds: number[] }> {
  // Generate unique slug
  const handle = await generateUniqueSlug(oldProduct.name, 'products', newStoreId);

  // Create product
  const product = await queryOne<{ id: number }>(
    `INSERT INTO products (
      store_id, title, handle, body_html, vendor, product_type,
      status, published_scope, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
    RETURNING id`,
    [
      newStoreId,
      oldProduct.name,
      handle,
      oldProduct.description || null,
      oldProduct.vendor || null,
      oldProduct.product_type || null,
      oldProduct.is_active ? 'active' : 'draft',
      'web',
    ]
  );

  if (!product) {
    throw new Error(`Failed to create product: ${oldProduct.name}`);
  }

  const productId = product.id;
  const variantIds: number[] = [];

  // Migrate images
  const imageUrls: string[] = [];
  
  // Main product image
  if (oldProduct.product_image && oldProduct.product_image !== 'noimage.svg') {
    const cloudinaryUrl = await migrateImageFromS3(
      oldProduct.product_image,
      oldProduct.store_id,
      'products'
    );
    if (cloudinaryUrl) {
      imageUrls.push(cloudinaryUrl);
      // Save to media_files
      await saveToMediaFiles(
        newStoreId,
        oldProduct.product_image,
        cloudinaryUrl,
        0, // size unknown
        'image/jpeg'
      );
    }
  }

  // Product gallery
  const galleryFiles = parseGallery(oldProduct.product_gallery);
  for (const filename of galleryFiles) {
    const cloudinaryUrl = await migrateImageFromS3(
      filename,
      oldProduct.store_id,
      'products'
    );
    if (cloudinaryUrl) {
      imageUrls.push(cloudinaryUrl);
      await saveToMediaFiles(
        newStoreId,
        filename,
        cloudinaryUrl,
        0,
        'image/jpeg'
      );
    }
  }

  // Save images to product_images
  for (let i = 0; i < imageUrls.length; i++) {
    await query(
      `INSERT INTO product_images (
        product_id, position, src, alt, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, now(), now())`,
      [productId, i + 1, imageUrls[i], null]
    );
  }

  // Migrate variants
  if (oldVariants.length === 0) {
    // No variants - create default variant
    const price = oldProduct.sale_price || oldProduct.regular_price || 0;
    const variant = await queryOne<{ id: number }>(
      `INSERT INTO product_variants (
        product_id, title, price, compare_at_price, sku, taxable,
        inventory_quantity, position, inventory_policy, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
      RETURNING id`,
      [
        productId,
        'Default Title',
        price.toString(),
        oldProduct.sale_price && oldProduct.regular_price ? oldProduct.regular_price.toString() : null,
        oldProduct.sku || null,
        true,
        oldProduct.inventory_quantity || 0,
        1,
        'deny',
      ]
    );
    if (variant) {
      variantIds.push(variant.id);
    }
  } else {
    // Extract options from all variants
    const optionsMap = extractOptionsFromVariants(oldVariants);
    
    // Create product options and values
    const optionIdMap = await createProductOptions(productId, optionsMap);
    
    // Migrate each variant
    for (let i = 0; i < oldVariants.length; i++) {
      const oldVariant = oldVariants[i];
      const options = parseVariantOptions(oldVariant.variant_options);
      const variantTitle = buildVariantTitle(options);
      
      // Extract option values (in order of option creation)
      let option1: string | null = null;
      let option2: string | null = null;
      let option3: string | null = null;
      
      if (options) {
        const optionNames = Array.from(optionsMap.keys());
        const optionValues = Object.values(options);
        
        if (optionNames.length > 0 && optionValues.length > 0) {
          option1 = optionValues[0] || null;
        }
        if (optionNames.length > 1 && optionValues.length > 1) {
          option2 = optionValues[1] || null;
        }
        if (optionNames.length > 2 && optionValues.length > 2) {
          option3 = optionValues[2] || null;
        }
      }

      const price = oldVariant.sale_price || oldVariant.regular_price || 0;
      const variant = await queryOne<{ id: number }>(
        `INSERT INTO product_variants (
          product_id, title, price, compare_at_price, sku, taxable,
          inventory_quantity, option1, option2, option3,
          position, inventory_policy, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
        RETURNING id`,
        [
          productId,
          variantTitle,
          price.toString(),
          oldVariant.sale_price && oldVariant.regular_price ? oldVariant.regular_price.toString() : null,
          oldVariant.sku || null,
          true,
          oldVariant.inventory_quantity || 0,
          option1,
          option2,
          option3,
          i + 1,
          'deny',
        ]
      );
      
      if (variant) {
        variantIds.push(variant.id);
      }

      // Migrate variant images
      if (oldVariant.variant_image) {
        const cloudinaryUrl = await migrateImageFromS3(
          oldVariant.variant_image,
          oldProduct.store_id,
          'products'
        );
        if (cloudinaryUrl) {
          await query(
            `INSERT INTO product_images (
              product_id, position, src, alt, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, now(), now())`,
            [productId, imageUrls.length + 1, cloudinaryUrl, null]
          );
        }
      }

      // Migrate variant gallery
      const variantGalleryFiles = parseGallery(oldVariant.variant_gallery);
      for (const filename of variantGalleryFiles) {
        const cloudinaryUrl = await migrateImageFromS3(
          filename,
          oldProduct.store_id,
          'products'
        );
        if (cloudinaryUrl) {
          await query(
            `INSERT INTO product_images (
              product_id, position, src, alt, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, now(), now())`,
            [productId, imageUrls.length + 1, cloudinaryUrl, null]
          );
        }
      }
    }
  }

  return { productId, variantIds };
}

