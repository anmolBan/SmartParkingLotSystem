import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock environment variables
vi.stubEnv('JWT_SECRET', 'test-secret-key');
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');

// Mock Prisma
const mockPrisma = {
    vehicle: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
    },
    parkingSpot: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
    },
    parkingHistory: {
        create: vi.fn()
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn()
};

vi.mock('../../lib/prisma.js', () => ({
    prisma: mockPrisma
}));

// Import after mocking
const { default: parkingRouter } = await import('../../routes/parking/index.js');

describe('Parking Routes', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/parking', parkingRouter);
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /parking/checkin', () => {
        it('should return 400 for invalid vehicle type', async () => {
            const response = await request(app)
                .post('/parking/checkin')
                .send({
                    licensePlate: 'ABC-1234',
                    vehicleType: 'INVALID_TYPE'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });

        it('should return 400 for missing license plate', async () => {
            const response = await request(app)
                .post('/parking/checkin')
                .send({
                    vehicleType: 'BIKE'
                });
            
            expect(response.status).toBe(400);
        });

        it('should return 400 for empty license plate', async () => {
            const response = await request(app)
                .post('/parking/checkin')
                .send({
                    licensePlate: '',
                    vehicleType: 'BIKE'
                });
            
            expect(response.status).toBe(400);
        });

        it('should return 400 when vehicle is already parked', async () => {
            const mockTransaction = vi.fn().mockImplementation(async (fn) => {
                return fn({
                    vehicle: {
                        findUnique: vi.fn().mockResolvedValue({
                            id: 1,
                            licensePlate: 'ABC-1234'
                        })
                    },
                    $queryRaw: vi.fn()
                });
            });
            
            mockPrisma.$transaction.mockImplementation(mockTransaction);

            const response = await request(app)
                .post('/parking/checkin')
                .send({
                    licensePlate: 'ABC-1234',
                    vehicleType: 'BIKE'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Vehicle is already parked in the lot');
        });

        it('should return 400 when no spots available', async () => {
            const mockTransaction = vi.fn().mockImplementation(async (fn) => {
                return fn({
                    vehicle: {
                        findUnique: vi.fn().mockResolvedValue(null),
                        create: vi.fn()
                    },
                    parkingSpot: {
                        update: vi.fn()
                    },
                    $queryRaw: vi.fn().mockResolvedValue([])
                });
            });
            
            mockPrisma.$transaction.mockImplementation(mockTransaction);

            const response = await request(app)
                .post('/parking/checkin')
                .send({
                    licensePlate: 'NEW-1234',
                    vehicleType: 'BIKE'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('No available parking spots for this vehicle type');
        });

        it('should successfully check in vehicle when spot available', async () => {
            const mockSpot = {
                id: 1,
                floor: 3,
                spotNumber: 'BIKE-3-1'
            };

            const mockVehicle = {
                id: 1,
                licensePlate: 'NEW-1234',
                vehicleType: 'BIKE',
                checkInTime: new Date(),
                parkingSpotId: 1
            };

            const mockTransaction = vi.fn().mockImplementation(async (fn) => {
                const tx = {
                    vehicle: {
                        findUnique: vi.fn().mockResolvedValue(null),
                        create: vi.fn().mockResolvedValue(mockVehicle)
                    },
                    parkingSpot: {
                        update: vi.fn().mockResolvedValue({ ...mockSpot, isOccupied: true })
                    },
                    $queryRaw: vi.fn().mockResolvedValue([mockSpot])
                };
                return fn(tx);
            });
            
            mockPrisma.$transaction.mockImplementation(mockTransaction);

            const response = await request(app)
                .post('/parking/checkin')
                .send({
                    licensePlate: 'NEW-1234',
                    vehicleType: 'BIKE'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Vehicle checked in successfully');
            expect(response.body.parkingFloor).toBe(3);
            expect(response.body.parkingSpot).toBe('BIKE-3-1');
        });
    });

    describe('POST /parking/checkout', () => {
        it('should return 400 for missing license plate', async () => {
            const response = await request(app)
                .post('/parking/checkout')
                .send({});
            
            expect(response.status).toBe(400);
        });

        it('should return 400 when vehicle not found', async () => {
            const mockTransaction = vi.fn().mockImplementation(async (fn) => {
                return fn({
                    vehicle: {
                        delete: vi.fn()
                    },
                    parkingSpot: {
                        findUnique: vi.fn(),
                        update: vi.fn()
                    },
                    parkingHistory: {
                        create: vi.fn()
                    },
                    $queryRaw: vi.fn().mockResolvedValue([])
                });
            });
            
            mockPrisma.$transaction.mockImplementation(mockTransaction);

            const response = await request(app)
                .post('/parking/checkout')
                .send({
                    licensePlate: 'NOT-FOUND'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Vehicle not found');
        });

        it('should successfully checkout vehicle and calculate fee', async () => {
            const checkInTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
            
            const mockVehicle = {
                id: 1,
                licensePlate: 'ABC-1234',
                vehicleType: 'BIKE',
                checkInTime: checkInTime,
                parkingSpotId: 1
            };

            const mockSpot = {
                id: 1,
                floor: 3,
                spotNumber: 'BIKE-3-1',
                isOccupied: true
            };

            const mockTransaction = vi.fn().mockImplementation(async (fn) => {
                const tx = {
                    vehicle: {
                        delete: vi.fn().mockResolvedValue(mockVehicle)
                    },
                    parkingSpot: {
                        findUnique: vi.fn().mockResolvedValue(mockSpot),
                        update: vi.fn().mockResolvedValue({ ...mockSpot, isOccupied: false })
                    },
                    parkingHistory: {
                        create: vi.fn().mockResolvedValue({})
                    },
                    $queryRaw: vi.fn().mockResolvedValue([mockVehicle])
                };
                return fn(tx);
            });
            
            mockPrisma.$transaction.mockImplementation(mockTransaction);

            const response = await request(app)
                .post('/parking/checkout')
                .send({
                    licensePlate: 'ABC-1234'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Vehicle checked out successfully');
            expect(response.body.parkingFloor).toBe(3);
            expect(response.body.parkingSpot).toBe('BIKE-3-1');
            expect(response.body.parkingFee).toBeDefined();
            expect(response.body.parkingFee.parkingFee).toBeGreaterThanOrEqual(60); // At least 2 hours * 30 rupees
        });
    });
});
