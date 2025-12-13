import fs from 'fs/promises';
import path from 'path';
import { Client as MinioClient } from 'minio';
import { Storage } from '@google-cloud/storage';

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

// Google Cloud Storage client
let gcsClient: Storage | null = null;
let gcsBucket: any = null;

if (STORAGE_TYPE === 'gcs') {
    const credentialsJson = process.env.GCS_CREDENTIALS;

    if (!process.env.GCS_KEY_FILE && !credentialsJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn('⚠️ GCS credentials not provided. GCS may fail if not running in a GCP environment.');
    }

    const storageOptions: any = {
        projectId: process.env.GCS_PROJECT_ID,
    };

    if (credentialsJson) {
        try {
            storageOptions.credentials = JSON.parse(credentialsJson);
            console.log('🔑 Loaded GCS credentials from environment variable');
        } catch (e) {
            console.warn('⚠️ Standard JSON parse failed, trying Base64 decode for GCS_CREDENTIALS...');
            try {
                const decodedJson = Buffer.from(credentialsJson, 'base64').toString('utf-8');
                storageOptions.credentials = JSON.parse(decodedJson);
                console.log('🔑 Loaded Base64-encoded GCS credentials');
            } catch (base64Error) {
                console.error('❌ Failed to parse GCS_CREDENTIALS (Invalid JSON or Base64)');
            }
        }
    } else if (process.env.GCS_KEY_FILE) {
        storageOptions.keyFilename = process.env.GCS_KEY_FILE;
    }

    gcsClient = new Storage(storageOptions);
}

const BUCKET_NAME = process.env.MINIO_BUCKET || process.env.GCS_BUCKET_NAME || 'bookbuddy';

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
    } else if (STORAGE_TYPE === 'gcs' && gcsClient) {
        gcsBucket = gcsClient.bucket(BUCKET_NAME);
        const [exists] = await gcsBucket.exists();
        if (exists) {
            console.log(`📦 GCS bucket exists: ${BUCKET_NAME}`);
        } else {
            console.log(`⚠️ GCS bucket ${BUCKET_NAME} does not exist. Please create it in GCP Console.`);
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
    } else if (STORAGE_TYPE === 'gcs' && gcsBucket) {
        const fileObj = gcsBucket.file(fileKey);
        await fileObj.save(file);
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
    } else if (STORAGE_TYPE === 'gcs' && gcsBucket) {
        const [buffer] = await gcsBucket.file(fileKey).download();
        return buffer;
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
    } else if (STORAGE_TYPE === 'gcs' && gcsBucket) {
        await gcsBucket.file(fileKey).delete().catch((e: any) => console.warn('GCS delete warning:', e.message));
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
    } else if (STORAGE_TYPE === 'gcs' && gcsBucket) {
        const [url] = await gcsBucket.file(fileKey).getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });
        return url;
    }

    throw new Error('Invalid storage configuration');
}
