import { StorageEngine, StorageConfig } from './types.js';
import { FilesystemStorage } from './filesystem.js';
import { S3Storage } from './s3.js';

/**
 * Create a storage engine based on configuration
 */
export function createStorageEngine(config: StorageConfig): StorageEngine {
  switch (config.engine) {
    case 'filesystem':
      if (!config.filesystem?.basePath) {
        throw new Error('Filesystem storage requires basePath configuration');
      }
      return new FilesystemStorage(config.filesystem.basePath);
    
    case 's3':
      if (!config.s3) {
        throw new Error('S3 storage requires configuration');
      }
      if (!config.s3.endpoint || !config.s3.accessKeyId || !config.s3.secretAccessKey || !config.s3.bucket) {
        throw new Error('S3 storage requires endpoint, accessKeyId, secretAccessKey, and bucket');
      }
      return new S3Storage(config.s3);
    
    default:
      throw new Error(`Unsupported storage engine: ${config.engine}`);
  }
}

/**
 * Get storage configuration from environment variables
 */
export function getStorageConfig(): StorageConfig {
  const engine = process.env.STORAGE_ENGINE || 'filesystem';
  
  if (engine === 's3') {
    return {
      engine: 's3',
      s3: {
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
        bucket: process.env.S3_BUCKET || 'website-archives',
        region: process.env.S3_REGION || 'us-east-1',
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        useSSL: process.env.S3_USE_SSL === 'true',
      },
    };
  }
  
  // Default to filesystem
  return {
    engine: 'filesystem',
    filesystem: {
      basePath: process.env.STORAGE_PATH || './mirror',
    },
  };
}

/**
 * Generate a timestamp-based archive path
 */
export function generateArchivePath(domain: string): string {
  const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\.[0-9]{3}Z$/, 'Z');
  return `${domain}/source/${timestamp}`;
}