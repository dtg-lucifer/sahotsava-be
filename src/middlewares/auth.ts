/**
 * Authentication Middleware
 * @maintainer dtg-lucifer <dev.bosepiush@gmail.com>
 *
 * JWT verification and authorization middleware
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { log } from "./logger";
import { api_response } from "../utils/api_response";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
    token?: string;
}

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): any => {
    try {
        const decoded = jwt.verify(
            token,
            Bun.env.JWT_SECRET || "your-secret-key",
        );
        return decoded;
    } catch (error) {
        return null;
    }
};

/**
 * Generate JWT token
 */
export const generateToken = (
    payload: object,
    expiresIn: string = "24h",
): string => {
    return jwt.sign(payload, Bun.env.JWT_SECRET || "your-secret-key", {
        expiresIn: expiresIn as string,
    } as jwt.SignOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: object): string => {
    return jwt.sign(payload, Bun.env.JWT_REFRESH_SECRET || "refresh-secret", {
        expiresIn: "30d",
    } as jwt.SignOptions);
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): any => {
    try {
        const decoded = jwt.verify(
            token,
            Bun.env.JWT_REFRESH_SECRET || "refresh-secret",
        );
        return decoded;
    } catch (error) {
        return null;
    }
};

/**
 * Authentication middleware - Verify JWT from Authorization header
 */
export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            const response = api_response.error(
                "Missing or invalid authorization header",
                401,
            );
            return res.status(response.statusCode).json(response);
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded) {
            const response = api_response.error(
                "Invalid or expired token",
                401,
            );
            return res.status(response.statusCode).json(response);
        }

        req.user = decoded;
        req.token = token;
        next();
    } catch (error) {
        log.error("Authentication error:", error);
        const response = api_response.error("Authentication failed", 401);
        return res.status(response.statusCode).json(response);
    }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                const response = api_response.error(
                    "User not authenticated",
                    401,
                );
                return res.status(response.statusCode).json(response);
            }

            if (!allowedRoles.includes(req.user.role)) {
                const response = api_response.error(
                    "Insufficient permissions",
                    403,
                );
                return res.status(response.statusCode).json(response);
            }

            next();
        } catch (error) {
            log.error("Authorization error:", error);
            const response = api_response.error("Authorization failed", 403);
            return res.status(response.statusCode).json(response);
        }
    };
};

/**
 * Optional authentication - doesn't fail if no token, just sets user if valid
 */
export const optionalAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);

            if (decoded) {
                req.user = decoded;
                req.token = token;
            }
        }

        next();
    } catch (error) {
        log.error("Optional authentication error:", error);
        next();
    }
};
