/**
 * Utility functions for storage operations
 */

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000,
  maxDelay = 30000,
  backoffFactor = 2
): Promise<T> {
  let lastError: Error | undefined;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt + 1} failed: ${lastError.message}. Retrying in ${delay}ms...`);
        await sleep(delay);
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: any): boolean {
  // Don't retry on authentication errors
  if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
    return true;
  }
  
  // Don't retry on 4xx errors except for rate limiting
  if (error.$metadata?.httpStatusCode >= 400 && error.$metadata?.httpStatusCode < 500) {
    return error.$metadata?.httpStatusCode !== 429; // 429 is rate limiting
  }
  
  return false;
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sanitize a path for use as an S3 key
 */
export function sanitizeS3Key(key: string): string {
  // Remove leading slashes
  key = key.replace(/^\/+/, '');
  
  // Replace multiple consecutive slashes with single slash
  key = key.replace(/\/+/g, '/');
  
  // Remove trailing slashes (except for directories)
  if (!key.endsWith('/index.html')) {
    key = key.replace(/\/+$/, '');
  }
  
  return key;
}

/**
 * Chunk an array into smaller arrays
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}