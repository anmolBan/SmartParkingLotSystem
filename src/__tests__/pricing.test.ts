import { describe, it, expect } from 'vitest';
import { 
    HOURLY_RATES, 
    getHourlyRate, 
    calculateParkingDuration, 
    calculateParkingFee 
} from '../lib/pricing.js';
import { SpotType } from '../generated/prisma/enums.js';

describe('Pricing Module', () => {
    describe('HOURLY_RATES', () => {
        it('should have correct rate for BIKE', () => {
            expect(HOURLY_RATES.BIKE).toBe(30);
        });

        it('should have correct rate for COMPACT', () => {
            expect(HOURLY_RATES.COMPACT).toBe(50);
        });

        it('should have correct rate for LARGE', () => {
            expect(HOURLY_RATES.LARGE).toBe(200);
        });
    });

    describe('getHourlyRate', () => {
        it('should return correct rate for BIKE', () => {
            expect(getHourlyRate(SpotType.BIKE)).toBe(30);
        });

        it('should return correct rate for COMPACT', () => {
            expect(getHourlyRate(SpotType.COMPACT)).toBe(50);
        });

        it('should return correct rate for LARGE', () => {
            expect(getHourlyRate(SpotType.LARGE)).toBe(200);
        });
    });

    describe('calculateParkingDuration', () => {
        it('should calculate 1 hour for 30 minutes (rounds up)', () => {
            const checkIn = new Date('2026-03-02T10:00:00');
            const checkOut = new Date('2026-03-02T10:30:00');
            expect(calculateParkingDuration(checkIn, checkOut)).toBe(1);
        });

        it('should calculate 1 hour for exactly 1 hour', () => {
            const checkIn = new Date('2026-03-02T10:00:00');
            const checkOut = new Date('2026-03-02T11:00:00');
            expect(calculateParkingDuration(checkIn, checkOut)).toBe(1);
        });

        it('should calculate 2 hours for 1 hour 1 minute (rounds up)', () => {
            const checkIn = new Date('2026-03-02T10:00:00');
            const checkOut = new Date('2026-03-02T11:01:00');
            expect(calculateParkingDuration(checkIn, checkOut)).toBe(2);
        });

        it('should calculate 3 hours for 2 hours 30 minutes', () => {
            const checkIn = new Date('2026-03-02T10:00:00');
            const checkOut = new Date('2026-03-02T12:30:00');
            expect(calculateParkingDuration(checkIn, checkOut)).toBe(3);
        });

        it('should calculate 24 hours for full day parking', () => {
            const checkIn = new Date('2026-03-02T10:00:00');
            const checkOut = new Date('2026-03-03T10:00:00');
            expect(calculateParkingDuration(checkIn, checkOut)).toBe(24);
        });
    });

    describe('calculateParkingFee', () => {
        it('should calculate correct fee for BIKE parked for 2 hours', () => {
            const checkIn = new Date('2026-03-02T10:00:00');
            const checkOut = new Date('2026-03-02T12:00:00');
            const result = calculateParkingFee(checkIn, checkOut, SpotType.BIKE);
            
            expect(result.durationInHours).toBe(2);
            expect(result.ratePerHour).toBe(30);
            expect(result.parkingFee).toBe(60); // 2 * 30
        });

        it('should calculate correct fee for COMPACT parked for 3 hours', () => {
            const checkIn = new Date('2026-03-02T10:00:00');
            const checkOut = new Date('2026-03-02T13:00:00');
            const result = calculateParkingFee(checkIn, checkOut, SpotType.COMPACT);
            
            expect(result.durationInHours).toBe(3);
            expect(result.ratePerHour).toBe(50);
            expect(result.parkingFee).toBe(150); // 3 * 50
        });

        it('should calculate correct fee for LARGE parked for 5 hours', () => {
            const checkIn = new Date('2026-03-02T10:00:00');
            const checkOut = new Date('2026-03-02T15:00:00');
            const result = calculateParkingFee(checkIn, checkOut, SpotType.LARGE);
            
            expect(result.durationInHours).toBe(5);
            expect(result.ratePerHour).toBe(200);
            expect(result.parkingFee).toBe(1000); // 5 * 200
        });

        it('should round up partial hours when calculating fee', () => {
            const checkIn = new Date('2026-03-02T10:00:00');
            const checkOut = new Date('2026-03-02T10:15:00'); // 15 minutes
            const result = calculateParkingFee(checkIn, checkOut, SpotType.BIKE);
            
            expect(result.durationInHours).toBe(1); // Rounded up
            expect(result.parkingFee).toBe(30); // 1 * 30
        });

        it('should calculate overnight parking fee correctly', () => {
            const checkIn = new Date('2026-03-02T22:00:00');
            const checkOut = new Date('2026-03-03T08:00:00'); // 10 hours
            const result = calculateParkingFee(checkIn, checkOut, SpotType.COMPACT);
            
            expect(result.durationInHours).toBe(10);
            expect(result.parkingFee).toBe(500); // 10 * 50
        });
    });
});
