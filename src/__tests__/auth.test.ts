import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock environment
vi.stubEnv('JWT_SECRET', 'test-secret-key');

// Import after mocking
const { authMiddleware } = await import('../middlewares/auth.js');
import type { JwtPayload } from '../middlewares/auth.js';

describe('Auth Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {}
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        nextFunction = vi.fn();
    });

    it('should return 401 if authorization header is missing', async () => {
        await authMiddleware(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authorization header missing' });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is missing from header', async () => {
        mockRequest.headers = { authorization: 'Bearer ' };

        await authMiddleware(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Token missing' });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
        mockRequest.headers = { authorization: 'Bearer invalid-token' };

        await authMiddleware(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() and attach user to request if token is valid', async () => {
        const payload = { userId: 1, type: 'ADMIN', email: 'admin@test.com' };
        const token = jwt.sign(payload, 'test-secret-key');
        mockRequest.headers = { authorization: `Bearer ${token}` };

        await authMiddleware(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalled();
        expect((mockRequest as any).user).toMatchObject(payload);
    });

    it('should return 401 if token is expired', async () => {
        const payload = { userId: 1, type: 'ADMIN', email: 'admin@test.com' };
        const token = jwt.sign(payload, 'test-secret-key', { expiresIn: '-1h' });
        mockRequest.headers = { authorization: `Bearer ${token}` };

        await authMiddleware(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
        expect(nextFunction).not.toHaveBeenCalled();
    });
});
