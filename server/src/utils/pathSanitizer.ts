import path from 'path';

/**
 * Sanitize a request path to prevent directory traversal attacks
 */
export function sanitizePath(requestPath: string): string {
  // Remove any null bytes
  let cleanPath = requestPath.replace(/\0/g, '');
  
  // Normalize the path to remove .. and .
  cleanPath = path.normalize(cleanPath);
  
  // Remove any leading ../ sequences
  while (cleanPath.startsWith('../')) {
    cleanPath = cleanPath.slice(3);
  }
  
  // Remove any /../ sequences
  cleanPath = cleanPath.replace(/\/\.\.\//g, '/');
  
  // Remove trailing ..
  if (cleanPath.endsWith('/..')) {
    cleanPath = cleanPath.slice(0, -3);
  }
  
  // Ensure path doesn't start with ../
  if (cleanPath.startsWith('..')) {
    cleanPath = cleanPath.slice(2);
  }
  
  return cleanPath;
}

/**
 * Validate that a path is safe to serve
 */
export function isPathSafe(requestPath: string): boolean {
  // Check for common attack patterns
  const dangerousPatterns = [
    /\.\.[\/\\]/,  // Directory traversal
    /^\.\.$/,       // Parent directory
    /\0/,           // Null bytes
    /^\/etc\//,     // System directories
    /^\/proc\//,
    /^\/sys\//,
    /^\/dev\//,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(requestPath));
}