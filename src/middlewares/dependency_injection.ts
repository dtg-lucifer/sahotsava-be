/**
 * Dependency Injection Middleware
 * @maintainer dtg-lucifer <dev.bosepiush@gmail.com>
 *
 * This middleware injects Prisma and Redis instances into res.locals
 * making them available throughout the request-response cycle.
 */

import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { RedisClientType } from "redis";
import { log } from "./logger";

export interface AppDependencies {
    prisma: PrismaClient;
    redis: RedisClientType;
}

// Extend Express types to include our dependencies in res.locals
declare global {
    namespace Express {
        interface Locals {
            prisma: PrismaClient;
            redis: RedisClientType;
        }
    }
}

/**
 * Creates a middleware that injects Prisma and Redis dependencies into res.locals
 *
 * @param prisma - PrismaClient instance
 * @param redis - Redis client instance
 * @returns Express middleware function
 *
 * @example
 * ```ts
 * // In server setup:
 * app.use(createDependencyInjectionMiddleware(prisma, redis));
 *
 * // In routes:
 * router.get('/users', async (req, res) => {
 *   const { prisma, redis } = res.locals;
 *   const users = await prisma.user.findMany();
 *   res.json(users);
 * });
 * ```
 */
export const createDependencyInjectionMiddleware = (
    prisma: PrismaClient,
    redis: RedisClientType,
) => {
    log.info("Dependency injection middleware initialized");

    return (req: Request, res: Response, next: NextFunction) => {
        // Inject dependencies into res.locals for this request
        res.locals.prisma = prisma;
        res.locals.redis = redis;
        next();
    };
};
