import { StorageEngine } from '../storage/types.js';

export class ArchiveResolver {
  constructor(private storage: StorageEngine) {}

  /**
   * Find the latest archive timestamp for a given domain
   */
  async findLatestArchive(domain: string): Promise<string | null> {
    try {
      // List all files under the domain/source/ prefix
      const prefix = `${domain}/source/`;
      const files = await this.storage.list(prefix);
      
      if (files.length === 0) {
        return null;
      }
      
      // Extract unique timestamps from the file paths
      const timestamps = new Set<string>();
      
      for (const file of files) {
        // Parse timestamp from path: domain/source/TIMESTAMP/...
        const parts = file.split('/');
        if (parts.length >= 3 && parts[1] === 'source') {
          timestamps.add(parts[2]);
        }
      }
      
      if (timestamps.size === 0) {
        return null;
      }
      
      // Sort timestamps and get the latest one
      const sortedTimestamps = Array.from(timestamps).sort();
      const latestTimestamp = sortedTimestamps[sortedTimestamps.length - 1];
      
      return `${domain}/source/${latestTimestamp}`;
    } catch (error) {
      console.error(`Error finding latest archive for ${domain}:`, error);
      return null;
    }
  }
  
  /**
   * Build the full storage path for a resource
   */
  buildResourcePath(archivePath: string, domain: string, resourcePath: string): string {
    // Remove leading slash from resource path
    const cleanResourcePath = resourcePath.startsWith('/') 
      ? resourcePath.slice(1) 
      : resourcePath;
    
    // Handle root path
    if (cleanResourcePath === '' || cleanResourcePath === '/') {
      return `${archivePath}/${domain}/index.html`;
    }
    
    // Build full path
    return `${archivePath}/${domain}/${cleanResourcePath}`;
  }
  
  /**
   * Check if a resource exists in the archive
   */
  async resourceExists(path: string): Promise<boolean> {
    try {
      return await this.storage.exists(path);
    } catch (error) {
      console.error(`Error checking resource existence at ${path}:`, error);
      return false;
    }
  }
  
  /**
   * Get a resource from the archive
   */
  async getResource(path: string): Promise<Buffer | null> {
    try {
      return await this.storage.read(path);
    } catch (error) {
      console.error(`Error reading resource at ${path}:`, error);
      return null;
    }
  }
}