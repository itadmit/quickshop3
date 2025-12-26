import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
// Cloudinary SDK automatically reads CLOUDINARY_URL if it exists
// Format: cloudinary://api_key:api_secret@cloud_name
// Example: cloudinary://471447719311179:H6KY-xcaqn0LR7IWdSfBqrtkk2A@dpbsspc1b
// If CLOUDINARY_URL is not set, fallback to individual environment variables
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}
// If CLOUDINARY_URL exists, Cloudinary SDK will automatically use it

// פונקציה להמרת תמונות ל-WebP
async function convertToWebP(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; extension: string }> {
  const isImage = mimeType?.startsWith('image/');
  
  if (!isImage) {
    if (mimeType?.startsWith('video/')) {
      const videoExt = mimeType.split('/')[1] || 'mp4';
      return { buffer, extension: videoExt };
    }
    const ext = mimeType === 'application/pdf' ? 'pdf' : 'file';
    return { buffer, extension: ext };
  }
  
  try {
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 85, effort: 4 })
      .toBuffer();
    
    return { buffer: webpBuffer, extension: 'webp' };
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    const ext = mimeType?.split('/')[1] || 'jpg';
    return { buffer, extension: ext };
  }
}

// פונקציה להעלאה ל-Cloudinary
async function uploadToCloudinary(
  buffer: Buffer, 
  filename: string, 
  entityType: string, 
  shopId: string, 
  mimeType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // זיהוי סוג הקובץ לפי mimeType
    const isVideo = mimeType?.startsWith('video/');
    const isImage = mimeType?.startsWith('image/');
    const resourceType = isVideo ? 'video' : isImage ? 'image' : 'auto';
    
    // הגדרת options בסיסיות
    const uploadOptions: any = {
      folder: `quickshop3/${shopId}/${entityType}`,
      public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
      resource_type: resourceType,
    };
    
    // הוספת transformations רק לתמונות (לא לווידאו)
    if (isImage) {
      uploadOptions.transformation = [
        {
          quality: 'auto', // Auto quality optimization
          fetch_format: 'auto', // Auto format (WebP, AVIF, etc.)
        },
      ];
    }
    
    // עבור וידאו, אפשר להוסיף אופטימיזציות ספציפיות אם צריך
    if (isVideo) {
      // Cloudinary יעשה אופטימיזציה אוטומטית לווידאו
      // אפשר להוסיף כאן transformations ספציפיות לווידאו אם צריך
    }
    
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
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string || 'products';
    const entityId = formData.get("entityId") as string || 'new';
    const shopId = formData.get("shopId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    // Check if Cloudinary is configured
    // Support both CLOUDINARY_URL and individual variables
    const useCloudinary = !!(
      process.env.CLOUDINARY_URL ||
      (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      )
    );

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const originalFilename = file.name;
    const mimeType = file.type;

    // המרה ל-WebP (רק לתמונות) - רק אם לא משתמשים ב-Cloudinary
    // אם משתמשים ב-Cloudinary, נשאיר את המקור ו-Cloudinary יעשה אופטימיזציה
    // אם לא משתמשים ב-Cloudinary, נמיר ל-WebP מקומי
    const { buffer: processedBuffer, extension } = useCloudinary 
      ? { buffer: fileBuffer, extension: originalFilename.split('.').pop() || 'jpg' }
      : await convertToWebP(fileBuffer, mimeType);

    // יצירת שם קובץ ייחודי
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const filename = `${timestamp}-${randomSuffix}_${originalFilename.split('.')[0]}.${extension}`;

    let fileUrl: string;

    if (useCloudinary) {
      // העלאה ל-Cloudinary
      try {
        fileUrl = await uploadToCloudinary(processedBuffer, filename, entityType, shopId, mimeType);
      } catch (cloudinaryError: any) {
        console.error('Cloudinary upload failed:', cloudinaryError);
        const errorMessage = cloudinaryError?.message || 'Failed to upload to Cloudinary';
        return NextResponse.json(
          { error: errorMessage, details: cloudinaryError },
          { status: 500 }
        );
      }
    } else {
      // Fallback: שמירה מקומית
      console.warn('Cloudinary not configured, saving locally');
      
      const uploadDir = `./public/uploads/${entityType}`;
      const { existsSync, mkdirSync, writeFileSync } = await import('fs');
      
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = `${uploadDir}/${filename}`;
      writeFileSync(filePath, processedBuffer);
      fileUrl = `/uploads/${entityType}/${filename}`;
    }

    // שמירה ב-DB (אופציונלי)
    try {
      const pool = getDb();
      await pool.query(
        `INSERT INTO files (shop_id, name, path, size, mime_type, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [shopId, originalFilename, fileUrl, file.size, mimeType, entityType, entityId]
      );
    } catch (dbError) {
      console.warn('Could not save to database:', dbError);
      // Don't fail the request if DB save fails
    }

    return NextResponse.json({
      success: true,
      file: {
        name: originalFilename,
        path: fileUrl,
        size: file.size,
        mimeType,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
