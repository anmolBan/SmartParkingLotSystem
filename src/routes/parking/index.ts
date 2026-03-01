import express, { Request, Response } from "express";
import { vehicleCheckInSchema, vehicleCheckOutSchema } from "../../validators/parkingSchema.js";
import { prisma } from "../../lib/prisma.js";
import { SpotType } from "../../generated/prisma/enums.js";
import { calculateParkingFee } from "../../lib/pricing.js";

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
            // Find available spot
            const parkingSpot = await tx.parkingSpot.findFirst({
                where: {
                    spotType: vehicleType as SpotType,
                    isOccupied: false
                },
                orderBy: {
                    id: 'asc'
                }
            });

            if (!parkingSpot) {
                throw new Error('NO_SPOT_AVAILABLE');
            }

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
        });

        res.json({ 
            message: 'Vehicle checked in successfully', 
            parkingFloor: result.parkingSpot.floor, 
            parkingSpot: result.parkingSpot.spotNumber 
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'NO_SPOT_AVAILABLE') {
            return res.status(400).json({ error: 'No available parking spots for this vehicle type' });
        }
        console.error('Error during vehicle check-in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// function calculateParkingFee(checkInTime: Date, checkOutTime: Date, vehicleType: SpotType): number {
//     const durationInHours = Math.ceil((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
//     let ratePerHour = 0;
//     switch (vehicleType) {

router.post('/checkout', async (req: Request, res: Response) => {
    const body = req.body;

    const parsedBody = vehicleCheckOutSchema.safeParse(body);
    
    if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.issues.map(issue => issue.message) });
    }

    const { licensePlate } = parsedBody.data;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Find vehicle record
            const vehicle = await tx.vehicle.findUnique({
                where: { licensePlate },
                include: { ParkingSpot: true }
            });

            if (!vehicle) {
                throw new Error('VEHICLE_NOT_FOUND');
            }

            // Mark spot as available
            await tx.parkingSpot.update({
                where: { id: vehicle.parkingSpotId },
                data: { isOccupied: false }
            });

            // Keep it for history, but set check-out time
            vehicle.checkOutTime = new Date();

            // delete vehicle record after check-out and strore history
            await tx.parkingHistory.create({
                data: {
                    licensePlate: vehicle.licensePlate,
                    vehicleType: vehicle.vehicleType,
                    checkInTime: vehicle.checkInTime,
                    checkOutTime: vehicle.checkOutTime,
                    parkingFee: calculateParkingFee(vehicle.checkInTime, vehicle.checkOutTime || new Date(), vehicle.vehicleType).parkingFee,
                    parkingSpotNumber: vehicle.ParkingSpot.spotNumber
                }
            });

            await tx.vehicle.delete({
                where: { id: vehicle.id }
            });

            return { vehicle };
        });
        const parkingFee = calculateParkingFee(result.vehicle.checkInTime, result.vehicle.checkOutTime || new Date(), result.vehicle.vehicleType);

        return res.json({ 
            message: 'Vehicle checked out successfully', 
            parkingFloor: result.vehicle.ParkingSpot.floor, 
            parkingSpot: result.vehicle.ParkingSpot.spotNumber,
            parkingFee: parkingFee
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