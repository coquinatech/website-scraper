import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
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
        testTimeout: 10000
    }
});
