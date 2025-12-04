import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// יצירת S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

/**
 * העלאת קובץ ל-S3
 */
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      // אפשר להוסיף ACL אם צריך גישה ציבורית
      // ACL: 'public-read',
    });

    await s3Client.send(command);

    // החזרת URL של הקובץ
    // אם ה-bucket הוא public, אפשר להחזיר URL ישיר
    // אחרת, נחזיר את ה-key ונשתמש ב-presigned URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

/**
 * קבלת presigned URL לקובץ (לקבצים פרטיים)
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

/**
 * מחיקת קובץ מ-S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
}

/**
 * העתקת קובץ ב-S3
 */
export async function copyInS3(sourceKey: string, destinationKey: string): Promise<void> {
  try {
    const command = new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${sourceKey}`,
      Key: destinationKey,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error copying file in S3:', error);
    throw error;
  }
}

/**
 * רשימת כל הקבצים בתיקייה ב-S3
 */
export async function listFilesInS3(prefix: string): Promise<string[]> {
  try {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);
      
      if (response.Contents) {
        keys.push(...response.Contents.map(item => item.Key || '').filter(Boolean));
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  } catch (error) {
    console.error('Error listing files in S3:', error);
    throw error;
  }
}

/**
 * העברת כל הקבצים מתיקייה ישנה לחדשה
 */
export async function moveFilesInS3(oldPrefix: string, newPrefix: string): Promise<{ moved: number; failed: number }> {
  let moved = 0;
  let failed = 0;

  try {
    // רשימת כל הקבצים בתיקייה הישנה
    const files = await listFilesInS3(oldPrefix);

    // העתקת כל הקבץ
    for (const oldKey of files) {
      try {
        // יצירת key חדש עם prefix חדש
        const newKey = oldKey.replace(oldPrefix, newPrefix);
        
        // העתקה
        await copyInS3(oldKey, newKey);
        
        // מחיקת הקובץ הישן
        await deleteFromS3(oldKey);
        
        moved++;
      } catch (error) {
        console.error(`Error moving file ${oldKey}:`, error);
        failed++;
      }
    }

    return { moved, failed };
  } catch (error) {
    console.error('Error moving files in S3:', error);
    throw error;
  }
}

/**
 * חילוץ key מ-S3 מה-URL
 */
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    if (!url.includes('.s3.')) return null;
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // הסרת ה-/ הראשונה
  } catch {
    return null;
  }
}

/**
 * יצירת key (נתיב) לקובץ ב-S3
 * מבנה: shops/{shopSlug}/{entityType}/{identifier}/{fileName}
 * @param shopSlug - slug של החנות (חובה)
 * @param entityType - סוג ה-entity (products, collections, logo, favicon, builders וכו')
 * @param identifier - מזהה: ID עבור products/collections, null עבור logo/favicon
 * @param fileName - שם הקובץ
 */
export function generateS3Key(shopSlug: string, entityType: string, identifier: string | null, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // אם יש identifier, נוסיף אותו לנתיב
  if (identifier) {
    return `shops/${shopSlug}/${entityType}/${identifier}/${timestamp}-${sanitizedFileName}`;
  } else {
    // עבור logo, favicon וכו' - ללא identifier
    return `shops/${shopSlug}/${entityType}/${timestamp}-${sanitizedFileName}`;
  }
}

