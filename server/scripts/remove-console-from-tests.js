#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Remove console.log and console.error statements from a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<{modified: boolean, removedCount: number}>}
 */
async function removeConsoleStatements(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Pattern to match console.log and console.error statements
    // This handles:
    // - Single line: console.log('something')
    // - Multi-line: console.log(
    //     'something',
    //     variable
    //   )
    // - With any whitespace before
    const patterns = [
      // Multi-line console statements
      /^\s*console\.(log|error)\s*\([^)]*\)[;,]?\s*$/gm,
      // Multi-line with opening parenthesis on same line
      /^\s*console\.(log|error)\s*\([^)]*\n([^)]*\n)*[^)]*\)[;,]?\s*$/gm,
      // Console statements that might be part of a larger expression
      /^\s*console\.(log|error)\s*\([^)]*\)[;,]?\s*(?=\n)/gm,
    ];
    
    let modifiedContent = content;
    let totalRemoved = 0;
    
    for (const pattern of patterns) {
      const matches = modifiedContent.match(pattern) || [];
      totalRemoved += matches.length;
      modifiedContent = modifiedContent.replace(pattern, '');
    }
    
    // Clean up any resulting double blank lines
    modifiedContent = modifiedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (modifiedContent !== content) {
      await fs.writeFile(filePath, modifiedContent, 'utf-8');
      return { modified: true, removedCount: totalRemoved };
    }
    
    return { modified: false, removedCount: 0 };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { modified: false, removedCount: 0, error: error.message };
  }
}

/**
 * Find all test files in a directory
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>}
 */
async function findTestFiles(dir) {
  const testFiles = [];
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      // Skip node_modules and other common directories
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        // Match test files
        if (entry.name.match(/\.(test|spec|integration\.test)\.(ts|tsx|js|jsx)$/)) {
          testFiles.push(fullPath);
        }
      }
    }
  }
  
  await walk(dir);
  return testFiles;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || path.join(__dirname, '..');
  
  console.log(`${colors.cyan}${colors.bright}🔍 Searching for test files in: ${colors.reset}${targetDir}\n`);
  
  const testFiles = await findTestFiles(targetDir);
  
  if (testFiles.length === 0) {
    console.log(`${colors.yellow}No test files found.${colors.reset}`);
    return;
  }
  
  console.log(`${colors.blue}Found ${testFiles.length} test file(s)${colors.reset}\n`);
  
  let totalModified = 0;
  let totalStatements = 0;
  const errors = [];
  
  for (const file of testFiles) {
    const relativePath = path.relative(targetDir, file);
    const result = await removeConsoleStatements(file);
    
    if (result.error) {
      errors.push({ file: relativePath, error: result.error });
    } else if (result.modified) {
      totalModified++;
      totalStatements += result.removedCount;
      console.log(`${colors.green}✓${colors.reset} ${relativePath} - removed ${result.removedCount} console statement(s)`);
    }
  }
  
  // Summary
  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  console.log(`  Files processed: ${testFiles.length}`);
  console.log(`  Files modified: ${totalModified}`);
  console.log(`  Console statements removed: ${totalStatements}`);
  
  if (errors.length > 0) {
    console.log(`\n${colors.red}${colors.bright}Errors:${colors.reset}`);
    errors.forEach(({ file, error }) => {
      console.log(`  ${colors.red}✗${colors.reset} ${file}: ${error}`);
    });
  }
  
  if (totalModified > 0) {
    console.log(`\n${colors.green}${colors.bright}✨ Successfully cleaned ${totalModified} test file(s)!${colors.reset}`);
  } else {
    console.log(`\n${colors.green}${colors.bright}✨ All test files are already clean!${colors.reset}`);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}${colors.bright}Error:${colors.reset}`, error);
  process.exit(1);
});