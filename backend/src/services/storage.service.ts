import fs from 'fs/promises';
import path from 'path';
import { Client as MinioClient } from 'minio';

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './uploads';

// MinIO client (S3-compatible)
let minioClient: MinioClient | null = null;

if (STORAGE_TYPE === 'minio') {
    minioClient = new MinioClient({
        endPoint: process.env.MINIO_ENDPOINT || 'localhost',
        port: parseInt(process.env.MINIO_PORT || '9000'),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
}

const BUCKET_NAME = process.env.MINIO_BUCKET || 'bookbuddy';

/**
 * Initialize storage (create directories or buckets)
 */
export async function initializeStorage(): Promise<void> {
    if (STORAGE_TYPE === 'local') {
        // Create local storage directory if it doesn't exist
        await fs.mkdir(LOCAL_STORAGE_PATH, { recursive: true });
        console.log(`📁 Local storage initialized at: ${LOCAL_STORAGE_PATH}`);
    } else if (STORAGE_TYPE === 'minio' && minioClient) {
        // Create MinIO bucket if it doesn't exist
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            console.log(`📦 MinIO bucket created: ${BUCKET_NAME}`);
        } else {
            console.log(`📦 MinIO bucket exists: ${BUCKET_NAME}`);
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
    } else if (STORAGE_TYPE === 'minio' && minioClient) {
        await minioClient.putObject(BUCKET_NAME, fileKey, file);
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
    } else if (STORAGE_TYPE === 'minio' && minioClient) {
        const chunks: Buffer[] = [];
        const stream = await minioClient.getObject(BUCKET_NAME, fileKey);

        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
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
        await fs.unlink(filePath);
    } else if (STORAGE_TYPE === 'minio' && minioClient) {
        await minioClient.removeObject(BUCKET_NAME, fileKey);
    }
}

/**
 * Get file URL (for MinIO) or path (for local)
 */
export async function getFileUrl(fileKey: string): Promise<string> {
    if (STORAGE_TYPE === 'local') {
        return path.join(LOCAL_STORAGE_PATH, fileKey);
    } else if (STORAGE_TYPE === 'minio' && minioClient) {
        // Generate presigned URL (valid for 24 hours)
        return await minioClient.presignedGetObject(BUCKET_NAME, fileKey, 24 * 60 * 60);
    }

    throw new Error('Invalid storage configuration');
}
