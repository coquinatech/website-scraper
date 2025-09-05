import { Router, Request, Response, NextFunction } from 'express';
import { ArchiveResolver } from '../services/archiveResolver.js';
import { getMimeType } from '../utils/mimeTypes.js';
import { sanitizePath, isPathSafe } from '../utils/pathSanitizer.js';
import { StorageEngine } from '../storage/types.js';

export function createArchiveRouter(storage: StorageEngine, defaultDomain: string): Router {
  const router = Router();
  const resolver = new ArchiveResolver(storage);
  
  // Cache the latest archive path for a short time to avoid repeated lookups
  let cachedArchivePath: string | null = null;
  let cacheTimestamp = 0;
  const CACHE_TTL = 60000; // 1 minute
  
  // Health check endpoint
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', domain: defaultDomain });
  });
  
  // Serve archived resources
  router.get('*', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      // Sanitize the request path
      const requestPath = sanitizePath(req.path);
      
      // Security check
      if (!isPathSafe(requestPath)) {
        return res.status(400).json({ error: 'Invalid path' });
      }
      
      // Get the latest archive path (with simple caching)
      const now = Date.now();
      if (!cachedArchivePath || now - cacheTimestamp > CACHE_TTL) {
        cachedArchivePath = await resolver.findLatestArchive(defaultDomain);
        cacheTimestamp = now;
        
        if (!cachedArchivePath) {
          return res.status(404).json({ 
            error: `No archives found for domain: ${defaultDomain}` 
          });
        }
        
        console.log(`Using archive: ${cachedArchivePath}`);
      }
      
      // Build the full resource path
      let resourcePath = requestPath;
      
      // Handle root path
      if (resourcePath === '/' || resourcePath === '') {
        resourcePath = 'index.html';
      }
      
      // Remove leading slash for path construction
      if (resourcePath.startsWith('/')) {
        resourcePath = resourcePath.slice(1);
      }
      
      // Try with the exact path first
      let fullPath = resolver.buildResourcePath(cachedArchivePath, defaultDomain, resourcePath);
      let exists = await resolver.resourceExists(fullPath);
      
      // If not found and no extension, try adding index.html
      if (!exists && !resourcePath.includes('.')) {
        const indexPath = resourcePath.endsWith('/') 
          ? `${resourcePath}index.html`
          : `${resourcePath}/index.html`;
        fullPath = resolver.buildResourcePath(cachedArchivePath, defaultDomain, indexPath);
        exists = await resolver.resourceExists(fullPath);
      }
      
      if (!exists) {
        return res.status(404).json({ 
          error: 'Resource not found',
          path: requestPath 
        });
      }
      
      // Get the resource
      const content = await resolver.getResource(fullPath);
      
      if (!content) {
        return res.status(500).json({ error: 'Failed to read resource' });
      }
      
      // Set appropriate headers
      const mimeType = getMimeType(fullPath);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', content.length.toString());
      
      // Cache headers for static assets
      if (mimeType.startsWith('image/') || 
          mimeType.startsWith('font/') ||
          fullPath.endsWith('.css') ||
          fullPath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
      
      // Send the content
      res.send(content);
      
    } catch (error) {
      next(error);
    }
  });
  
  return router;
}