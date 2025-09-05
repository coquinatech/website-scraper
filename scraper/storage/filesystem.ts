import * as fs from 'fs';
import * as path from 'path';
import { StorageEngine } from './types.js';

export class FilesystemStorage implements StorageEngine {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async save(filePath: string, content: Buffer): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    const dir = path.dirname(fullPath);
    
    // Create directory structure
    await fs.promises.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.promises.writeFile(fullPath, content);
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, filePath);
    try {
      await fs.promises.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async read(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, filePath);
    return await fs.promises.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    try {
      await fs.promises.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async list(prefix: string): Promise<string[]> {
    const fullPath = path.join(this.basePath, prefix);
    const results: string[] = [];

    async function walkDir(dir: string, baseDir: string) {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const entryPath = path.join(dir, entry.name);
          const relativePath = path.relative(baseDir, entryPath);
          
          if (entry.isDirectory()) {
            await walkDir(entryPath, baseDir);
          } else {
            results.push(relativePath.split(path.sep).join('/'));
          }
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    await walkDir(fullPath, this.basePath);
    return results;
  }

  async initialize(): Promise<void> {
    // Create base directory if it doesn't exist
    await fs.promises.mkdir(this.basePath, { recursive: true });
  }

  async cleanupIncomplete(prefix: string): Promise<void> {
    // For filesystem, we'll delete the entire prefix directory if it exists
    const fullPath = path.join(this.basePath, prefix);
    
    try {
      const stats = await fs.promises.stat(fullPath);
      if (stats.isDirectory()) {
        await fs.promises.rm(fullPath, { recursive: true, force: true });
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}