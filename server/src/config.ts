export interface ServerConfig {
  port: number;
  host: string;
  defaultDomain: string;
  enableLogging: boolean;
  debugMode: boolean;
}

export interface StorageConfig {
  engine: 'filesystem' | 's3';
  filesystem?: {
    basePath: string;
  };
  s3?: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region?: string;
    forcePathStyle?: boolean;
    useSSL?: boolean;
  };
}

export function getServerConfig(): ServerConfig {
  return {
    port: parseInt(process.env.SERVER_PORT || '6767', 10),
    host: process.env.SERVER_HOST || '0.0.0.0',
    defaultDomain: process.env.SERVER_DEFAULT_DOMAIN || 'dylanwatt.com',
    enableLogging: process.env.ENABLE_LOGGING !== 'false',
    debugMode: process.env.DEBUG_MODE === 'true',
  };
}

export function getStorageConfig(): StorageConfig {
  const engine = process.env.STORAGE_ENGINE || 'filesystem';
  
  if (engine === 's3') {
    return {
      engine: 's3',
      s3: {
        endpoint: process.env.S3_ENDPOINT || 'http://minio:9010',
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
        bucket: process.env.S3_BUCKET || 'website-archives',
        region: process.env.S3_REGION || 'us-east-1',
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        useSSL: process.env.S3_USE_SSL === 'true',
      },
    };
  }
  
  return {
    engine: 'filesystem',
    filesystem: {
      basePath: process.env.STORAGE_PATH || './mirror',
    },
  };
}