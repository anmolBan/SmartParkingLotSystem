import express, { Request, Response } from 'express';
import { prisma } from "../../lib/prisma.js";
import { adminSignInSchema } from '../../validators/userSchemas.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../../generated/prisma/client.js';
import { createParkingLotSchema } from '../../validators/parkingSchema.js';
import { authMiddleware } from '../../middlewares/auth.js';

dotenv.config();

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Welcome to the API v1');
});

router.post('/signin', async (req: Request, res: Response) => {
    const body = req.body;

    const parsedBody = adminSignInSchema.safeParse(body);

    if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.issues.map(issue => issue.message) });
    }

    const { email, password } = parsedBody.data;

    const admin: User | null = await prisma.user.findUnique({
        where: { email, type: 'ADMIN', password }
    });

    if (!admin) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: admin.id, type: admin.type, email: admin.email }, process.env.JWT_SECRET!, { expiresIn: '12h' });

    res.json({
        message: 'Sign-in successful',
        token 
    });
});

router.post('/createParkingLot', authMiddleware, async (req: Request, res: Response) => {
    const body = req.body;

    const parsedBody = createParkingLotSchema.safeParse(body);

    if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.issues.map(issue => issue.message) });
    }

    const { name, location, floorsReservedForTrucks, spotsPerFloorReservedForTrucks, floorsReservedForBikes, spotsPerFloorReservedForBikes, floorsReservedForCompact, spotsPerFloorReservedForCompact } = parsedBody.data;

    try {
        const newParkingLot = await prisma.parkingLot.create({
            data: {
                name,
                location,
                floorsReservedForTrucks,
                spotsPerFloorReservedForTrucks,
                floorsReservedForBikes,
                spotsPerFloorReservedForBikes,
                floorsReservedForCompact,
                spotsPerFloorReservedForCompact
            }
        });

        // Auto-create parking spots
        const parkingSpots: { lotId: number; floor: number; spotNumber: string; isOccupied: boolean; spotType: 'LARGE' | 'COMPACT' | 'BIKE' }[] = [];
        let currentFloor = 1;

        // 1. LARGE (truck) spots on lowest floors
        for (let f = 0; f < newParkingLot.floorsReservedForTrucks; f++) {
            for (let s = 1; s <= newParkingLot.spotsPerFloorReservedForTrucks; s++) {
                parkingSpots.push({
                    lotId: newParkingLot.id,
                    floor: currentFloor,
                    spotNumber: `LARGE-${currentFloor}-${s}`,
                    isOccupied: false,
                    spotType: 'LARGE'
                });
            }
            currentFloor++;
        }

        // 2. COMPACT spots on middle floors
        for (let f = 0; f < newParkingLot.floorsReservedForCompact; f++) {
            for (let s = 1; s <= newParkingLot.spotsPerFloorReservedForCompact; s++) {
                parkingSpots.push({
                    lotId: newParkingLot.id,
                    floor: currentFloor,
                    spotNumber: `COMPACT-${currentFloor}-${s}`,
                    isOccupied: false,
                    spotType: 'COMPACT'
                });
            }
            currentFloor++;
        }

        // 3. BIKE spots on uppermost floors
        for (let f = 0; f < newParkingLot.floorsReservedForBikes; f++) {
            for (let s = 1; s <= newParkingLot.spotsPerFloorReservedForBikes; s++) {
                parkingSpots.push({
                    lotId: newParkingLot.id,
                    floor: currentFloor,
                    spotNumber: `BIKE-${currentFloor}-${s}`,
                    isOccupied: false,
                    spotType: 'BIKE'
                });
            }
            currentFloor++;
        }

        // Bulk insert all spots
        await prisma.parkingSpot.createMany({ data: parkingSpots });

        res.status(201).json({ 
            message: 'Parking lot created successfully',
            parkingLot: newParkingLot,
            spotsCreated: {
                large: newParkingLot.floorsReservedForTrucks * newParkingLot.spotsPerFloorReservedForTrucks,
                compact: newParkingLot.floorsReservedForCompact * newParkingLot.spotsPerFloorReservedForCompact,
                bike: newParkingLot.floorsReservedForBikes * newParkingLot.spotsPerFloorReservedForBikes,
                total: parkingSpots.length
            },
            totalFloors: currentFloor - 1
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create parking lot' });
    }
});

export default router;