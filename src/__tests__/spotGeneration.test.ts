import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpotType } from '../generated/prisma/enums.js';

describe('Parking Lot Spot Generation', () => {
    // Helper function that mirrors the admin route logic
    function generateParkingSpots(parkingLot: {
        id: number;
        floorsReservedForTrucks: number;
        spotsPerFloorReservedForTrucks: number;
        floorsReservedForCompact: number;
        spotsPerFloorReservedForCompact: number;
        floorsReservedForBikes: number;
        spotsPerFloorReservedForBikes: number;
    }) {
        const parkingSpots: { lotId: number; floor: number; spotNumber: string; isOccupied: boolean; spotType: 'LARGE' | 'COMPACT' | 'BIKE' }[] = [];
        let currentFloor = 1;

        // LARGE (truck) spots on lowest floors
        for (let f = 0; f < parkingLot.floorsReservedForTrucks; f++) {
            for (let s = 1; s <= parkingLot.spotsPerFloorReservedForTrucks; s++) {
                parkingSpots.push({
                    lotId: parkingLot.id,
                    floor: currentFloor,
                    spotNumber: `LARGE-${currentFloor}-${s}`,
                    isOccupied: false,
                    spotType: 'LARGE'
                });
            }
            currentFloor++;
        }

        // COMPACT spots on middle floors
        for (let f = 0; f < parkingLot.floorsReservedForCompact; f++) {
            for (let s = 1; s <= parkingLot.spotsPerFloorReservedForCompact; s++) {
                parkingSpots.push({
                    lotId: parkingLot.id,
                    floor: currentFloor,
                    spotNumber: `COMPACT-${currentFloor}-${s}`,
                    isOccupied: false,
                    spotType: 'COMPACT'
                });
            }
            currentFloor++;
        }

        // BIKE spots on uppermost floors
        for (let f = 0; f < parkingLot.floorsReservedForBikes; f++) {
            for (let s = 1; s <= parkingLot.spotsPerFloorReservedForBikes; s++) {
                parkingSpots.push({
                    lotId: parkingLot.id,
                    floor: currentFloor,
                    spotNumber: `BIKE-${currentFloor}-${s}`,
                    isOccupied: false,
                    spotType: 'BIKE'
                });
            }
            currentFloor++;
        }

        return { parkingSpots, totalFloors: currentFloor - 1 };
    }

    describe('generateParkingSpots', () => {
        it('should generate correct number of spots', () => {
            const parkingLot = {
                id: 1,
                floorsReservedForTrucks: 1,
                spotsPerFloorReservedForTrucks: 5,
                floorsReservedForCompact: 2,
                spotsPerFloorReservedForCompact: 10,
                floorsReservedForBikes: 2,
                spotsPerFloorReservedForBikes: 15
            };

            const { parkingSpots, totalFloors } = generateParkingSpots(parkingLot);

            // Total spots: 5 + 20 + 30 = 55
            expect(parkingSpots.length).toBe(55);
            expect(totalFloors).toBe(5);
        });

        it('should place LARGE spots on lowest floors', () => {
            const parkingLot = {
                id: 1,
                floorsReservedForTrucks: 2,
                spotsPerFloorReservedForTrucks: 3,
                floorsReservedForCompact: 1,
                spotsPerFloorReservedForCompact: 5,
                floorsReservedForBikes: 1,
                spotsPerFloorReservedForBikes: 10
            };

            const { parkingSpots } = generateParkingSpots(parkingLot);
            
            const largeSpots = parkingSpots.filter(s => s.spotType === 'LARGE');
            expect(largeSpots.length).toBe(6);
            expect(largeSpots.every(s => s.floor <= 2)).toBe(true);
            expect(largeSpots.filter(s => s.floor === 1).length).toBe(3);
            expect(largeSpots.filter(s => s.floor === 2).length).toBe(3);
        });

        it('should place COMPACT spots on middle floors', () => {
            const parkingLot = {
                id: 1,
                floorsReservedForTrucks: 1,
                spotsPerFloorReservedForTrucks: 5,
                floorsReservedForCompact: 2,
                spotsPerFloorReservedForCompact: 8,
                floorsReservedForBikes: 1,
                spotsPerFloorReservedForBikes: 10
            };

            const { parkingSpots } = generateParkingSpots(parkingLot);
            
            const compactSpots = parkingSpots.filter(s => s.spotType === 'COMPACT');
            expect(compactSpots.length).toBe(16);
            expect(compactSpots.every(s => s.floor >= 2 && s.floor <= 3)).toBe(true);
        });

        it('should place BIKE spots on uppermost floors', () => {
            const parkingLot = {
                id: 1,
                floorsReservedForTrucks: 1,
                spotsPerFloorReservedForTrucks: 5,
                floorsReservedForCompact: 2,
                spotsPerFloorReservedForCompact: 8,
                floorsReservedForBikes: 2,
                spotsPerFloorReservedForBikes: 12
            };

            const { parkingSpots, totalFloors } = generateParkingSpots(parkingLot);
            
            const bikeSpots = parkingSpots.filter(s => s.spotType === 'BIKE');
            expect(bikeSpots.length).toBe(24);
            expect(bikeSpots.every(s => s.floor >= 4 && s.floor <= 5)).toBe(true);
            expect(totalFloors).toBe(5);
        });

        it('should generate correct spot numbers', () => {
            const parkingLot = {
                id: 1,
                floorsReservedForTrucks: 1,
                spotsPerFloorReservedForTrucks: 2,
                floorsReservedForCompact: 1,
                spotsPerFloorReservedForCompact: 2,
                floorsReservedForBikes: 1,
                spotsPerFloorReservedForBikes: 2
            };

            const { parkingSpots } = generateParkingSpots(parkingLot);

            expect(parkingSpots[0].spotNumber).toBe('LARGE-1-1');
            expect(parkingSpots[1].spotNumber).toBe('LARGE-1-2');
            expect(parkingSpots[2].spotNumber).toBe('COMPACT-2-1');
            expect(parkingSpots[3].spotNumber).toBe('COMPACT-2-2');
            expect(parkingSpots[4].spotNumber).toBe('BIKE-3-1');
            expect(parkingSpots[5].spotNumber).toBe('BIKE-3-2');
        });

        it('should handle parking lot with no truck spots', () => {
            const parkingLot = {
                id: 1,
                floorsReservedForTrucks: 0,
                spotsPerFloorReservedForTrucks: 0,
                floorsReservedForCompact: 2,
                spotsPerFloorReservedForCompact: 5,
                floorsReservedForBikes: 1,
                spotsPerFloorReservedForBikes: 10
            };

            const { parkingSpots, totalFloors } = generateParkingSpots(parkingLot);

            expect(parkingSpots.filter(s => s.spotType === 'LARGE').length).toBe(0);
            expect(parkingSpots.filter(s => s.spotType === 'COMPACT').length).toBe(10);
            expect(parkingSpots.filter(s => s.spotType === 'BIKE').length).toBe(10);
            expect(totalFloors).toBe(3);
            
            // Compact should start at floor 1 when no trucks
            expect(parkingSpots[0].floor).toBe(1);
            expect(parkingSpots[0].spotType).toBe('COMPACT');
        });

        it('should set all spots as not occupied by default', () => {
            const parkingLot = {
                id: 1,
                floorsReservedForTrucks: 1,
                spotsPerFloorReservedForTrucks: 5,
                floorsReservedForCompact: 1,
                spotsPerFloorReservedForCompact: 5,
                floorsReservedForBikes: 1,
                spotsPerFloorReservedForBikes: 5
            };

            const { parkingSpots } = generateParkingSpots(parkingLot);

            expect(parkingSpots.every(s => s.isOccupied === false)).toBe(true);
        });

        it('should assign correct lotId to all spots', () => {
            const parkingLot = {
                id: 42,
                floorsReservedForTrucks: 1,
                spotsPerFloorReservedForTrucks: 3,
                floorsReservedForCompact: 1,
                spotsPerFloorReservedForCompact: 3,
                floorsReservedForBikes: 1,
                spotsPerFloorReservedForBikes: 3
            };

            const { parkingSpots } = generateParkingSpots(parkingLot);

            expect(parkingSpots.every(s => s.lotId === 42)).toBe(true);
        });
    });
});
