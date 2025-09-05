export interface StorageEngine {
  /**
   * Save content to storage at the specified path
   */
  save(path: string, content: Buffer): Promise<void>;
  
  /**
   * Check if a resource exists at the specified path
   */
  exists(path: string): Promise<boolean>;
  
  /**
   * Read content from storage at the specified path
   */
  read(path: string): Promise<Buffer>;
  
  /**
   * Delete a resource at the specified path
   */
  delete(path: string): Promise<void>;
  
  /**
   * List all resources under a given prefix
   */
  list(prefix: string): Promise<string[]>;
  
  /**
   * Initialize storage (create directories, buckets, etc.)
   */
  initialize(): Promise<void>;
  
  /**
   * Clean up incomplete uploads for a given prefix
   */
  cleanupIncomplete(prefix: string): Promise<void>;
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