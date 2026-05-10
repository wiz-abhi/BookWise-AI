import fs from 'fs/promises';
import path from 'path';
import { 
    S3Client, 
    PutObjectCommand, 
    GetObjectCommand, 
    DeleteObjectCommand,
    HeadBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './uploads';

// Backblaze B2 (S3 API) client
let s3Client: S3Client | null = null;
const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'bookbuddy-b2';

if (STORAGE_TYPE === 'b2') {
    if (!process.env.B2_ENDPOINT || !process.env.B2_REGION || !process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY) {
        console.warn('⚠️ B2 credentials or endpoint not fully provided in environment variables.');
    }

    s3Client = new S3Client({
        region: process.env.B2_REGION || 'us-east-005',
        endpoint: process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',
        credentials: {
            accessKeyId: process.env.B2_APPLICATION_KEY_ID || '',
            secretAccessKey: process.env.B2_APPLICATION_KEY || '',
        },
        forcePathStyle: true, // Required for Backblaze B2 compatibility in some cases
    });
}

/**
 * Initialize storage (create directories or check buckets)
 */
export async function initializeStorage(): Promise<void> {
    if (STORAGE_TYPE === 'local') {
        // Create local storage directory if it doesn't exist
        await fs.mkdir(LOCAL_STORAGE_PATH, { recursive: true });
        console.log(`📁 Local storage initialized at: ${LOCAL_STORAGE_PATH}`);
    } else if (STORAGE_TYPE === 'b2' && s3Client) {
        try {
            // Check if bucket exists/is accessible
            await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
            console.log(`📦 B2 bucket accessible: ${BUCKET_NAME}`);
        } catch (error: any) {
            console.error(`⚠️ B2 bucket ${BUCKET_NAME} might not exist or is not accessible. Please create it in Backblaze Console. Error: ${error.message}`);
        }
    }
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
    file: Buffer,
    filename: string,
    userId: string
): Promise<string> {
    const fileKey = `${userId}/${Date.now()}-${filename}`;

    if (STORAGE_TYPE === 'local') {
        const filePath = path.join(LOCAL_STORAGE_PATH, fileKey);
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, file);
        return fileKey;
    } else if (STORAGE_TYPE === 'b2' && s3Client) {
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: file,
            // You can also add ContentType if known, but B2 will handle it
        }));
        return fileKey;
    }

    throw new Error('Invalid storage configuration');
}

/**
 * Download a file from storage
 */
export async function downloadFile(fileKey: string): Promise<Buffer> {
    if (STORAGE_TYPE === 'local') {
        const filePath = path.join(LOCAL_STORAGE_PATH, fileKey);
        return await fs.readFile(filePath);
    } else if (STORAGE_TYPE === 'b2' && s3Client) {
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
        }));
        
        // AWS SDK v3 streams body, we need to convert to Buffer
        const stream = response.Body as NodeJS.ReadableStream;
        const chunks: Buffer[] = [];
        
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }

    throw new Error('Invalid storage configuration');
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileKey: string): Promise<void> {
    if (STORAGE_TYPE === 'local') {
        const filePath = path.join(LOCAL_STORAGE_PATH, fileKey);
        try {
            await fs.unlink(filePath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') throw error;
        }
    } else if (STORAGE_TYPE === 'b2' && s3Client) {
        try {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileKey,
            }));
        } catch (error: any) {
            console.warn('B2 delete warning:', error.message);
        }
    }
}

/**
 * Get file URL (presigned for B2) or path (for local)
 */
export async function getFileUrl(fileKey: string): Promise<string> {
    if (STORAGE_TYPE === 'local') {
        return path.join(LOCAL_STORAGE_PATH, fileKey);
    } else if (STORAGE_TYPE === 'b2' && s3Client) {
        // Generate presigned URL (valid for 24 hours)
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
        });
        return await getSignedUrl(s3Client, command, { expiresIn: 24 * 60 * 60 });
    }

    throw new Error('Invalid storage configuration');
}
