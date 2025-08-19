import * as dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

// Set NODE_ENV to test for all tests
process.env.NODE_ENV = 'test';

// Load .env file for tests
dotenv.config();

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],  // Global setup file
    isolate: true,  // Isolate each test file
    fileParallelism: true,  // Allow parallel execution
    pool: 'threads',  // Use threads for better performance
    poolOptions: {
      threads: {
        singleThread: false,  // Allow multiple threads
        isolate: true  // Isolate each test file
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.ts',
        '**/*.d.ts',
        '**/*.types.ts',
        'src/types/**'
      ]
    },
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/__tests__/archived/**' // Archived SSE integration tests that hang
      // SSE streaming is now tested via unit tests in sse-stream.test.ts
      // MCP tests work - mcp-server-everything:3001 is running in devcontainer
    ],
    testTimeout: 10000  // 10 seconds default timeout
  }
});