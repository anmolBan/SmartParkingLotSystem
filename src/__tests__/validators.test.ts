import { describe, it, expect } from 'vitest';
import { 
    adminSignInSchema 
} from '../validators/userSchemas.js';
import { 
    createParkingLotSchema, 
    vehicleCheckInSchema, 
    vehicleCheckOutSchema 
} from '../validators/parkingSchema.js';

describe('Validators', () => {
    describe('adminSignInSchema', () => {
        it('should validate correct admin credentials', () => {
            const result = adminSignInSchema.safeParse({
                email: 'admin@test.com',
                password: 'password123'
            });
            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const result = adminSignInSchema.safeParse({
                email: 'invalid-email',
                password: 'password123'
            });
            expect(result.success).toBe(false);
        });

        it('should reject empty password', () => {
            const result = adminSignInSchema.safeParse({
                email: 'admin@test.com',
                password: ''
            });
            expect(result.success).toBe(false);
        });

        it('should reject missing fields', () => {
            const result = adminSignInSchema.safeParse({});
            expect(result.success).toBe(false);
        });
    });

    describe('createParkingLotSchema', () => {
        it('should validate correct parking lot data', () => {
            const result = createParkingLotSchema.safeParse({
                name: 'Main Parking Lot',
                location: '123 Main Street',
                floorsReservedForTrucks: 2,
                spotsPerFloorReservedForTrucks: 10,
                floorsReservedForBikes: 1,
                spotsPerFloorReservedForBikes: 20,
                floorsReservedForCompact: 3,
                spotsPerFloorReservedForCompact: 15
            });
            expect(result.success).toBe(true);
        });

        it('should use defaults for optional floor fields', () => {
            const result = createParkingLotSchema.safeParse({
                name: 'Small Lot',
                location: '456 Side Street'
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.floorsReservedForTrucks).toBe(0);
                expect(result.data.floorsReservedForBikes).toBe(0);
                expect(result.data.floorsReservedForCompact).toBe(0);
            }
        });

        it('should reject empty name', () => {
            const result = createParkingLotSchema.safeParse({
                name: '',
                location: '123 Main Street'
            });
            expect(result.success).toBe(false);
        });

        it('should reject negative floor counts', () => {
            const result = createParkingLotSchema.safeParse({
                name: 'Test Lot',
                location: '123 Main Street',
                floorsReservedForTrucks: -1
            });
            expect(result.success).toBe(false);
        });

        it('should reject non-integer floor counts', () => {
            const result = createParkingLotSchema.safeParse({
                name: 'Test Lot',
                location: '123 Main Street',
                floorsReservedForTrucks: 2.5
            });
            expect(result.success).toBe(false);
        });
    });

    describe('vehicleCheckInSchema', () => {
        it('should validate correct check-in data for BIKE', () => {
            const result = vehicleCheckInSchema.safeParse({
                licensePlate: 'ABC-1234',
                vehicleType: 'BIKE'
            });
            expect(result.success).toBe(true);
        });

        it('should validate correct check-in data for COMPACT', () => {
            const result = vehicleCheckInSchema.safeParse({
                licensePlate: 'XYZ-5678',
                vehicleType: 'COMPACT'
            });
            expect(result.success).toBe(true);
        });

        it('should validate correct check-in data for LARGE', () => {
            const result = vehicleCheckInSchema.safeParse({
                licensePlate: 'TRK-9999',
                vehicleType: 'LARGE'
            });
            expect(result.success).toBe(true);
        });

        it('should reject invalid vehicle type', () => {
            const result = vehicleCheckInSchema.safeParse({
                licensePlate: 'ABC-1234',
                vehicleType: 'INVALID'
            });
            expect(result.success).toBe(false);
        });

        it('should reject empty license plate', () => {
            const result = vehicleCheckInSchema.safeParse({
                licensePlate: '',
                vehicleType: 'BIKE'
            });
            expect(result.success).toBe(false);
        });

        it('should reject license plate exceeding max length', () => {
            const result = vehicleCheckInSchema.safeParse({
                licensePlate: 'A'.repeat(21),
                vehicleType: 'BIKE'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('vehicleCheckOutSchema', () => {
        it('should validate correct checkout data', () => {
            const result = vehicleCheckOutSchema.safeParse({
                licensePlate: 'ABC-1234'
            });
            expect(result.success).toBe(true);
        });

        it('should reject empty license plate', () => {
            const result = vehicleCheckOutSchema.safeParse({
                licensePlate: ''
            });
            expect(result.success).toBe(false);
        });

        it('should reject missing license plate', () => {
            const result = vehicleCheckOutSchema.safeParse({});
            expect(result.success).toBe(false);
        });
    });
});
