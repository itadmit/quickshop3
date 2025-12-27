import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Product } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { getUserFromRequest } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

// Configure Cloudinary
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Convert image to WebP if needed
 */
async function convertToWebPIfNeeded(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; extension: string; mimeType: string }> {
  const isImage = mimeType?.startsWith('image/');
  
  if (!isImage) {
    const ext = mimeType?.split('/')[1] || 'file';
    return { buffer, extension: ext, mimeType };
  }

  // If already WebP, return as is
  if (mimeType === 'image/webp') {
    return { buffer, extension: 'webp', mimeType: 'image/webp' };
  }

  try {
    // Convert to WebP
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 85, effort: 4 })
      .toBuffer();
    
    return { buffer: webpBuffer, extension: 'webp', mimeType: 'image/webp' };
  } catch (error) {
    console.warn('Error converting image to WebP, using original:', error);
    const ext = mimeType?.split('/')[1] || 'jpg';
    return { buffer, extension: ext, mimeType };
  }
}

/**
 * Download image from S3, convert to WebP if needed, upload to Cloudinary, and save to media_files
 */
async function migrateImageFromS3(
  s3UrlOrFilename: string,
  storeId: number,
  entityType: string = 'products',
  userId?: number
): Promise<{ cloudinaryUrl: string; mediaFileId: number } | null> {
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
        console.warn(`Could not find image: ${s3UrlOrFilename}`);
        return null;
      }
    }

    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Failed to download image: ${imageUrl} (${response.status})`);
      return null;
    }

    const originalBuffer = Buffer.from(await response.arrayBuffer());
    const originalMimeType = response.headers.get('content-type') || 'image/jpeg';
    const originalFilename = s3UrlOrFilename.split('/').pop() || s3UrlOrFilename || 'image.jpg';
    const fileSize = originalBuffer.length;

    // Get image dimensions
    let width: number | null = null;
    let height: number | null = null;
    try {
      const metadata = await sharp(originalBuffer).metadata();
      width = metadata.width || null;
      height = metadata.height || null;
    } catch (e) {
      console.warn('Could not get image dimensions:', e);
    }

    // Convert to WebP if needed
    const { buffer: processedBuffer, extension, mimeType: finalMimeType } = 
      await convertToWebPIfNeeded(originalBuffer, originalMimeType);

    // Create unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const filename = `${timestamp}-${randomSuffix}_${originalFilename.replace(/\.[^/.]+$/, '')}.${extension}`;

    // Upload to Cloudinary
    const cloudinaryUrl = await new Promise<string>((resolve, reject) => {
      const uploadOptions: any = {
        folder: `quickshop3/${storeId}/${entityType}`,
        public_id: filename.replace(/\.[^/.]+$/, ''),
        resource_type: 'image',
        transformation: [
          {
            quality: 'auto',
            fetch_format: 'auto', // Cloudinary will serve WebP/AVIF automatically
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

      uploadStream.end(processedBuffer);
    });

    // Save to media_files (as if uploaded manually)
    const mediaFile = await queryOne<{ id: number }>(
      `INSERT INTO media_files (
        store_id, filename, original_filename, file_path, file_url,
        file_type, mime_type, file_size, width, height,
        folder_path, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
      RETURNING id`,
      [
        storeId,
        filename,
        originalFilename,
        cloudinaryUrl, // file_path
        cloudinaryUrl, // file_url
        'image',
        finalMimeType,
        processedBuffer.length, // Use processed buffer size
        width,
        height,
        `${entityType}`, // folder_path
        userId || null, // created_by
      ]
    );

    if (!mediaFile) {
      throw new Error('Failed to save media file to database');
    }

    return {
      cloudinaryUrl,
      mediaFileId: mediaFile.id,
    };
  } catch (error) {
    console.error(`Error migrating image ${s3UrlOrFilename}:`, error);
    return null;
  }
}

// POST /api/products/import - Import products from CSV
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const storeId = user.store_id;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read CSV file
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Parse header - support Hebrew and English
    // תואם בדיוק לפורמט של קוויק שופ הישן:
    // ID,"שם מוצר",סלאג,תיאור,"מחיר רגיל","מחיר מבצע",מקט,"כמות במלאי","התעלם ממלאי",מוסתר,קטגוריות,תגים,"סוג מוצר","תמונה ראשית","תאריך יצירה"
    const headerMap: Record<string, string> = {
      // English
      'id': 'id',
      'name': 'name',
      'title': 'name',
      'slug': 'slug',
      'handle': 'slug',
      'description': 'description',
      'price': 'price',
      'regular_price': 'price',
      'sale_price': 'sale_price',
      'compare_at_price': 'sale_price',
      'sku': 'sku',
      'inventory_quantity': 'inventory_quantity',
      'inventoryqty': 'inventory_quantity',
      'vendor': 'vendor',
      'product_type': 'product_type',
      'type': 'product_type',
      'status': 'status',
      'image': 'image',
      'product_image': 'image',
      'tags': 'tags',
      'categories': 'categories',
      // Hebrew - תואם בדיוק לפורמט הישן
      'שם מוצר': 'name',
      'סלאג': 'slug',
      'תיאור': 'description',
      'מחיר רגיל': 'price',
      'מחיר מבצע': 'sale_price',
      'מקט': 'sku',
      'כמות במלאי': 'inventory_quantity',
      'התעלם ממלאי': 'ignore_inventory',
      'מוסתר': 'hidden',
      'קטגוריות': 'categories',
      'תגים': 'tags',
      'סוג מוצר': 'product_type',
      'תמונה ראשית': 'image',
      'תאריך יצירה': 'created_at',
    };

    // Parse CSV header with proper quote handling
    const parseCSVRow = (line: string): string[] => {
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            currentValue += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      return values;
    };

    // Remove BOM if present
    let headerLine = lines[0];
    if (headerLine.charCodeAt(0) === 0xFEFF) {
      headerLine = headerLine.slice(1);
    }
    
    const rawHeaders = parseCSVRow(headerLine);
    const headers = rawHeaders.map(h => {
      const normalized = h.trim().toLowerCase().replace(/"/g, '');
      return headerMap[normalized] || normalized;
    });
    
    const requiredFields = ['name', 'price'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const imported: Array<{ id: string; name: string }> = [];
    const errors: string[] = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVRow(lines[i]);
      
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        let value = (values[index] || '').trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        row[header] = value;
      });

      try {
        const name = row.name;
        const price = parseFloat(row.price || row['מחיר רגיל'] || '0');

        if (!name) {
          errors.push(`Row ${i + 1}: Missing product name`);
          continue;
        }

        if (isNaN(price) || price < 0) {
          errors.push(`Row ${i + 1}: Invalid price: ${row.price}`);
          continue;
        }

        // Generate unique slug (use provided slug or generate from name)
        const providedSlug = row.slug || row.handle;
        const handle = providedSlug ? await generateUniqueSlug(providedSlug, 'products', storeId) : await generateUniqueSlug(name, 'products', storeId);

        // Parse sale price
        const salePrice = row.sale_price || row['מחיר מבצע'];
        const compareAtPrice = salePrice && parseFloat(salePrice) > 0 ? parseFloat(salePrice) : null;
        const regularPrice = price;

        // Determine status
        const isHidden = row.hidden === 'כן' || row.hidden === 'yes' || row.hidden === '1' || row['מוסתר'] === 'כן';
        const status = isHidden ? 'draft' : (row.status === 'active' ? 'active' : 'draft');

        // Create product
        const sql = `
          INSERT INTO products (
            store_id, title, handle, body_html, vendor, product_type,
            status, published_scope, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
          RETURNING *
        `;

        const product = await queryOne<Product>(sql, [
          storeId,
          name,
          handle,
          row.description || row['תיאור'] || null,
          row.vendor || null,
          row.product_type || row['סוג מוצר'] || null,
          status,
          'web',
        ]);

        if (product) {
          // Parse inventory quantity
          const inventoryQty = parseInt(row.inventory_quantity || row['כמות במלאי'] || '0') || 0;
          const ignoreInventory = row.ignore_inventory === 'כן' || row.ignore_inventory === 'yes' || row['התעלם ממלאי'] === 'כן';

          // Create default variant with price
          await query(
            `INSERT INTO product_variants (
              product_id, title, price, compare_at_price, sku, position, inventory_quantity,
              inventory_policy, weight_unit, requires_shipping, taxable,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())`,
            [
              product.id,
              'Default Title',
              regularPrice.toString(),
              compareAtPrice ? compareAtPrice.toString() : null,
              row.sku || row['מקט'] || null,
              1,
              inventoryQty,
              ignoreInventory ? 'continue' : 'deny',
              'kg',
              true,
              true,
            ]
          );

          // Handle product image if provided
          const imageFilename = row.image || row['תמונה ראשית'];
          if (imageFilename && imageFilename !== 'noimage.svg' && imageFilename.trim()) {
            try {
              // Download from S3, convert to WebP if needed, upload to Cloudinary, save to media_files
              const imageResult = await migrateImageFromS3(
                imageFilename,
                storeId,
                'products',
                user.id
              );
              
              if (imageResult) {
                // Save to product_images (link to the uploaded image)
                await query(
                  `INSERT INTO product_images (
                    product_id, position, src, alt, created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, now(), now())`,
                  [product.id, 1, imageResult.cloudinaryUrl, null]
                );
              }
            } catch (imageError: any) {
              console.warn(`Failed to import image for product ${product.id}: ${imageError.message}`);
              // Continue without image
            }
          }

          // Handle categories (קטגוריות) - comma-separated
          const categoriesStr = row.categories || row['קטגוריות'];
          if (categoriesStr && categoriesStr.trim()) {
            const categoryNames = categoriesStr.split(',').map(c => c.trim()).filter(c => c);
            for (const categoryName of categoryNames) {
              try {
                // Find or create collection (categories are collections in our system)
                let collection = await queryOne<{ id: number }>(
                  'SELECT id FROM product_collections WHERE store_id = $1 AND title = $2',
                  [storeId, categoryName]
                );

                if (!collection) {
                  // Create new collection
                  const handle = await generateUniqueSlug(categoryName, 'collections', storeId);
                  const newCollection = await queryOne<{ id: number }>(
                    `INSERT INTO product_collections (
                      store_id, title, handle, created_at, updated_at
                    ) VALUES ($1, $2, $3, now(), now())
                    RETURNING id`,
                    [storeId, categoryName, handle]
                  );
                  collection = newCollection;
                }

                if (collection) {
                  // Get max position for this collection
                  const maxPosition = await queryOne<{ max_position: number }>(
                    'SELECT COALESCE(MAX(position), 0) as max_position FROM product_collection_map WHERE collection_id = $1',
                    [collection.id]
                  );

                  // Link product to collection
                  await query(
                    `INSERT INTO product_collection_map (
                      product_id, collection_id, position
                    ) VALUES ($1, $2, $3)
                    ON CONFLICT (product_id, collection_id) DO NOTHING`,
                    [product.id, collection.id, (maxPosition?.max_position || 0) + 1]
                  );
                }
              } catch (categoryError: any) {
                console.warn(`Failed to add category "${categoryName}" to product ${product.id}: ${categoryError.message}`);
                // Continue without category
              }
            }
          }

          // Handle tags (תגים) - comma-separated
          const tagsStr = row.tags || row['תגים'];
          if (tagsStr && tagsStr.trim()) {
            const tagNames = tagsStr.split(',').map(t => t.trim()).filter(t => t);
            for (const tagName of tagNames) {
              try {
                // Find or create tag
                let tag = await queryOne<{ id: number }>(
                  'SELECT id FROM product_tags WHERE store_id = $1 AND name = $2',
                  [storeId, tagName]
                );

                if (!tag) {
                  // Create new tag
                  const newTag = await queryOne<{ id: number }>(
                    `INSERT INTO product_tags (
                      store_id, name, created_at
                    ) VALUES ($1, $2, now())
                    RETURNING id`,
                    [storeId, tagName]
                  );
                  tag = newTag;
                }

                if (tag) {
                  // Link product to tag
                  await query(
                    `INSERT INTO product_tag_map (
                      product_id, tag_id
                    ) VALUES ($1, $2)
                    ON CONFLICT (product_id, tag_id) DO NOTHING`,
                    [product.id, tag.id]
                  );
                }
              } catch (tagError: any) {
                console.warn(`Failed to add tag "${tagName}" to product ${product.id}: ${tagError.message}`);
                // Continue without tag
              }
            }
          }

          // Emit product.created event
          await eventBus.emitEvent('product.created', { product }, {
            store_id: storeId,
            source: 'api',
          });

          imported.push({ id: product.id.toString(), name: product.title });
        } else {
          errors.push(`Row ${i + 1}: Failed to create product`);
        }
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      imported: imported.length,
      errors: errors.length,
      errorDetails: errors,
      products: imported,
    });
  } catch (error: any) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import products' },
      { status: 500 }
    );
  }
}

