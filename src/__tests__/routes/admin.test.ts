import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock environment variables
vi.stubEnv('JWT_SECRET', 'test-secret-key');
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');

// Mock Prisma
const mockPrisma = {
    user: {
        findUnique: vi.fn()
    },
    parkingLot: {
        create: vi.fn()
    },
    parkingSpot: {
        createMany: vi.fn()
    },
    $transaction: vi.fn()
};

vi.mock('../../lib/prisma.js', () => ({
    prisma: mockPrisma
}));

// Import after mocking
const { default: adminRouter } = await import('../../routes/admin/index.js');

describe('Admin Routes', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/admin', adminRouter);
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /admin/', () => {
        it('should return welcome message', async () => {
            const response = await request(app).get('/admin/');
            expect(response.status).toBe(200);
            expect(response.text).toBe('Welcome to the API v1');
        });
    });

    describe('POST /admin/signin', () => {
        it('should return 400 for invalid email format', async () => {
            const response = await request(app)
                .post('/admin/signin')
                .send({ email: 'invalid-email', password: 'password123' });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });

        it('should return 400 for missing password', async () => {
            const response = await request(app)
                .post('/admin/signin')
                .send({ email: 'admin@test.com' });
            
            expect(response.status).toBe(400);
        });

        it('should return 401 for non-existent user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/admin/signin')
                .send({ email: 'admin@test.com', password: 'password123' });
            
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid email or password');
        });

        it('should return token for valid admin credentials', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 1,
                email: 'admin@test.com',
                type: 'ADMIN',
                password: 'password123'
            });

            const response = await request(app)
                .post('/admin/signin')
                .send({ email: 'admin@test.com', password: 'password123' });
            
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Sign-in successful');
            expect(response.body.token).toBeDefined();
            
            // Verify token is valid
            const decoded = jwt.verify(response.body.token, 'test-secret-key') as any;
            expect(decoded.userId).toBe(1);
            expect(decoded.type).toBe('ADMIN');
        });
    });

    describe('POST /admin/createParkingLot', () => {
        it('should return 401 without authorization header', async () => {
            const response = await request(app)
                .post('/admin/createParkingLot')
                .send({
                    name: 'Test Lot',
                    location: '123 Test Street'
                });
            
            expect(response.status).toBe(401);
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app)
                .post('/admin/createParkingLot')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                    name: 'Test Lot',
                    location: '123 Test Street'
                });
            
            expect(response.status).toBe(401);
        });

        it('should return 400 for invalid parking lot data', async () => {
            const token = jwt.sign(
                { userId: 1, type: 'ADMIN', email: 'admin@test.com' },
                'test-secret-key'
            );

            const response = await request(app)
                .post('/admin/createParkingLot')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: '', // Invalid: empty name
                    location: '123 Test Street'
                });
            
            expect(response.status).toBe(400);
        });

        it('should create parking lot with valid data and auth', async () => {
            const token = jwt.sign(
                { userId: 1, type: 'ADMIN', email: 'admin@test.com' },
                'test-secret-key'
            );

            const mockParkingLot = {
                id: 1,
                name: 'Test Lot',
                location: '123 Test Street',
                floorsReservedForTrucks: 1,
                spotsPerFloorReservedForTrucks: 5,
                floorsReservedForBikes: 2,
                spotsPerFloorReservedForBikes: 10,
                floorsReservedForCompact: 2,
                spotsPerFloorReservedForCompact: 8
            };

            mockPrisma.parkingLot.create.mockResolvedValue(mockParkingLot);
            mockPrisma.parkingSpot.createMany.mockResolvedValue({ count: 41 });

            const response = await request(app)
                .post('/admin/createParkingLot')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Lot',
                    location: '123 Test Street',
                    floorsReservedForTrucks: 1,
                    spotsPerFloorReservedForTrucks: 5,
                    floorsReservedForBikes: 2,
                    spotsPerFloorReservedForBikes: 10,
                    floorsReservedForCompact: 2,
                    spotsPerFloorReservedForCompact: 8
                });
            
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Parking lot created successfully');
            expect(response.body.parkingLot).toBeDefined();
        });
    });
});
