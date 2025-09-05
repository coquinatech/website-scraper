import mime from 'mime-types';
import path from 'path';

/**
 * Get MIME type for a file based on its extension
 */
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  // Handle special cases
  if (filePath.endsWith('/') || filePath === '' || ext === '') {
    return 'text/html';
  }
  
  // Use mime-types library
  const mimeType = mime.lookup(filePath);
  
  // Default to octet-stream if unknown
  return mimeType || 'application/octet-stream';
}

/**
 * Check if a MIME type is compressible
 */
export function isCompressible(mimeType: string): boolean {
  const compressibleTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/svg+xml',
    'application/x-javascript',
  ];
  
  return compressibleTypes.some(type => mimeType.startsWith(type));
}