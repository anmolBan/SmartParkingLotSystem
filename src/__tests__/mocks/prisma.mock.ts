import { vi } from 'vitest';

// Mock Prisma client for testing
export const mockPrisma = {
    user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    parkingLot: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    parkingSpot: {
        create: vi.fn(),
        createMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    vehicle: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    parkingHistory: {
        create: vi.fn(),
        findMany: vi.fn()
    },
    $transaction: vi.fn((fn) => fn(mockPrisma)),
    $queryRaw: vi.fn()
};

// Reset all mocks
export function resetMocks() {
    Object.values(mockPrisma).forEach(model => {
        if (typeof model === 'object') {
            Object.values(model).forEach(method => {
                if (typeof method === 'function' && 'mockReset' in method) {
                    (method as any).mockReset();
                }
            });
        }
    });
}
