import express, { Request, Response } from 'express';
import { prisma } from "../../lib/prisma.js";
import { adminSignInSchema } from '../../validators/userSchemas.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../../generated/prisma/client.js';

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

    const token = jwt.sign({ userId: admin.id, type: admin.type, email: admin.email }, process.env.JWT_SECRET!, { expiresIn: '48h' });

    res.json({
        message: 'Sign-in successful',
        token 
    });
});

router.post('/createParkingLot', async (req: Request, res: Response) => {
    
});

export default router;