import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { StorageEngine } from './types.js';
import { retryWithBackoff, sanitizeS3Key } from './utils.js';

export class S3Storage implements StorageEngine {
  private client: S3Client;
  private bucket: string;

  constructor(config: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region?: string;
    forcePathStyle?: boolean;
    useSSL?: boolean;
  }) {
    this.bucket = config.bucket;
    
    // Parse endpoint to determine if SSL should be used
    const url = new URL(config.endpoint);
    const useSSL = config.useSSL !== undefined ? config.useSSL : url.protocol === 'https:';
    
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? true, // Required for MinIO
      tls: useSSL,
    });
  }

  async save(path: string, content: Buffer): Promise<void> {
    const key = sanitizeS3Key(path);
    
    await retryWithBackoff(async () => {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: content,
      });
      
      await this.client.send(command);
    });
  }

  async exists(path: string): Promise<boolean> {
    const key = sanitizeS3Key(path);
    
    try {
      await retryWithBackoff(async () => {
        const command = new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });
        
        await this.client.send(command);
      });
      return true;
    } catch (error: any) {
      if (error.$metadata?.httpStatusCode === 404 || error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async read(path: string): Promise<Buffer> {
    const key = sanitizeS3Key(path);
    
    return await retryWithBackoff(async () => {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      
      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error(`No body returned for object: ${key}`);
      }
      
      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    });
  }

  async delete(path: string): Promise<void> {
    const key = sanitizeS3Key(path);
    
    await retryWithBackoff(async () => {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      
      await this.client.send(command);
    });
  }

  async list(prefix: string): Promise<string[]> {
    const sanitizedPrefix = sanitizeS3Key(prefix);
    const results: string[] = [];
    let continuationToken: string | undefined;
    
    do {
      const response = await retryWithBackoff(async () => {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: sanitizedPrefix,
          ContinuationToken: continuationToken,
        });
        
        return await this.client.send(command);
      });
      
      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key) {
            results.push(object.Key);
          }
        }
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    return results;
  }

  async initialize(): Promise<void> {
    // Check if bucket exists
    try {
      const command = new HeadBucketCommand({
        Bucket: this.bucket,
      });
      
      await this.client.send(command);
    } catch (error: any) {
      if (error.$metadata?.httpStatusCode === 404 || error.name === 'NotFound') {
        // Create bucket if it doesn't exist
        const createCommand = new CreateBucketCommand({
          Bucket: this.bucket,
        });
        
        await this.client.send(createCommand);
        console.log(`Created S3 bucket: ${this.bucket}`);
      } else {
        throw error;
      }
    }
  }

  async cleanupIncomplete(prefix: string): Promise<void> {
    // List all objects with the prefix and delete them
    const objects = await this.list(prefix);
    
    for (const key of objects) {
      await this.delete(key);
    }
    
    if (objects.length > 0) {
      console.log(`Cleaned up ${objects.length} incomplete files from ${prefix}`);
    }
  }
}