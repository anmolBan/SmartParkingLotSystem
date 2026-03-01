import express, { Request, Response } from "express";
import { vehicleCheckInSchema, vehicleCheckOutSchema } from "../../validators/parkingSchema.js";
import { prisma } from "../../lib/prisma.js";
import { SpotType } from "../../generated/prisma/enums.js";
import { calculateParkingFee } from "../../lib/pricing.js";
import { Prisma } from "../../generated/prisma/client.js";

const router = express.Router();

router.post('/checkin', async (req: Request, res: Response) => {
    const body = req.body;

    const parsedBody = vehicleCheckInSchema.safeParse(body);

    if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.issues.map(issue => issue.message) });
    }

    const { licensePlate, vehicleType } = parsedBody.data;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Check if vehicle is already parked
            const existingVehicle = await tx.vehicle.findUnique({
                where: { licensePlate }
            });

            if (existingVehicle) {
                throw new Error('VEHICLE_ALREADY_PARKED');
            }

            // Use row-level locking to prevent race conditions
            // FOR UPDATE SKIP LOCKED ensures concurrent requests get different spots
            const availableSpots = await tx.$queryRaw<
                Array<{ id: number; floor: number; spotNumber: string }>
            >`
                SELECT id, floor, "spotNumber"
                FROM "ParkingSpot"
                WHERE "spotType" = ${vehicleType}::"SpotType"
                AND "isOccupied" = false
                ORDER BY id ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            `;

            if (availableSpots.length === 0) {
                throw new Error('NO_SPOT_AVAILABLE');
            }

            const parkingSpot = availableSpots[0];

            // Create vehicle record
            const vehicle = await tx.vehicle.create({
                data: {
                    licensePlate,
                    vehicleType: vehicleType as SpotType,
                    checkInTime: new Date(),
                    parkingSpotId: parkingSpot.id
                }
            });

            // Mark spot as occupied
            await tx.parkingSpot.update({
                where: { id: parkingSpot.id },
                data: { isOccupied: true }
            });

            return { vehicle, parkingSpot };
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 10000  // 10 second timeout to prevent deadlocks
        });

        res.json({ 
            message: 'Vehicle checked in successfully', 
            parkingFloor: result.parkingSpot.floor, 
            parkingSpot: result.parkingSpot.spotNumber 
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'NO_SPOT_AVAILABLE') {
                return res.status(400).json({ error: 'No available parking spots for this vehicle type' });
            }
            if (error.message === 'VEHICLE_ALREADY_PARKED') {
                return res.status(400).json({ error: 'Vehicle is already parked in the lot' });
            }
        }
        console.error('Error during vehicle check-in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/checkout', async (req: Request, res: Response) => {
    const body = req.body;

    const parsedBody = vehicleCheckOutSchema.safeParse(body);
    
    if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.issues.map(issue => issue.message) });
    }

    const { licensePlate } = parsedBody.data;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Lock the vehicle row to prevent double checkout
            const vehicles = await tx.$queryRaw<
                Array<{ 
                    id: number; 
                    licensePlate: string; 
                    checkInTime: Date; 
                    vehicleType: SpotType; 
                    parkingSpotId: number 
                }>
            >`
                SELECT id, "licensePlate", "checkInTime", "vehicleType"::"text"::"SpotType" as "vehicleType", "parkingSpotId"
                FROM "Vehicle"
                WHERE "licensePlate" = ${licensePlate}
                FOR UPDATE
            `;

            if (vehicles.length === 0) {
                throw new Error('VEHICLE_NOT_FOUND');
            }

            const vehicle = vehicles[0];
            const checkOutTime = new Date();

            // Get parking spot details
            const parkingSpot = await tx.parkingSpot.findUnique({
                where: { id: vehicle.parkingSpotId }
            });

            if (!parkingSpot) {
                throw new Error('SPOT_NOT_FOUND');
            }

            // Mark spot as available
            await tx.parkingSpot.update({
                where: { id: vehicle.parkingSpotId },
                data: { isOccupied: false }
            });

            // Calculate parking fee
            const parkingFeeResult = calculateParkingFee(vehicle.checkInTime, checkOutTime, vehicle.vehicleType);

            // Store history
            await tx.parkingHistory.create({
                data: {
                    licensePlate: vehicle.licensePlate,
                    vehicleType: vehicle.vehicleType,
                    checkInTime: vehicle.checkInTime,
                    checkOutTime: checkOutTime,
                    parkingFee: parkingFeeResult.parkingFee,
                    parkingSpotNumber: parkingSpot.spotNumber
                }
            });

            // Delete vehicle record
            await tx.vehicle.delete({
                where: { id: vehicle.id }
            });

            return { vehicle, parkingSpot, checkOutTime, parkingFeeResult };
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 10000
        });

        return res.json({ 
            message: 'Vehicle checked out successfully', 
            parkingFloor: result.parkingSpot.floor, 
            parkingSpot: result.parkingSpot.spotNumber,
            parkingFee: result.parkingFeeResult
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'VEHICLE_NOT_FOUND') {
            return res.status(400).json({ error: 'Vehicle not found' });
        }
        console.error('Error during vehicle check-out:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;