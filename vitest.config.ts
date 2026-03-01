import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/__tests__/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/__tests__/**', 'src/generated/**', 'src/types/**']
        },
        testTimeout: 10000,
        hookTimeout: 10000
    }
});
