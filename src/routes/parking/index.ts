import express, { Request, Response } from "express";
import { vehicleCheckInSchema } from "../../validators/parkingSchema.js";
import { prisma } from "../../lib/prisma.js";
import { SpotType } from "../../generated/prisma/enums.js";

const router = express.Router();

router.post('/checkin', async (req: Request, res: Response) => {
    const body = req.body;

    const parsedBody = vehicleCheckInSchema.safeParse(body);

    if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.issues.map(issue => issue.message) });
    }

    const { licensePlate, vehicleType } = parsedBody.data;

    try {
        const parkingSpot = await prisma.parkingSpot.findFirst({
            where: {
                spotType: vehicleType as SpotType,
                isOccupied: false
            },
            orderBy: {
                id: 'asc'
            }
        });

        if (!parkingSpot) {
            return res.status(400).json({ error: 'No available parking spots for this vehicle type' });
        }

        await prisma.vehicle.create({
            data: {
                licensePlate,
                vehicleType: vehicleType as SpotType,
                checkInTime: new Date(),
                parkingSpotId: parkingSpot.id
            }
        });

        await prisma.parkingSpot.update({
            where: { id: parkingSpot.id },
            data: {
                isOccupied: true
            }
        });

        res.json({ message: 'Vehicle checked in successfully', parkingFloor: parkingSpot.floor, parkingSpot: parkingSpot.spotNumber });
    } catch (error) {
        console.error('Error during vehicle check-in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;