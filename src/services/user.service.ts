/**
 * User Service
 * @maintainer dtg-lucifer <dev.bosepiush@gmail.com>
 *
 * Business logic for user operations with caching support
 */

import { PrismaClient, User } from "../generated/prisma/client";
import { RedisClientType } from "redis";

export class UserService {
    constructor(
        private prisma: PrismaClient,
        private redis: RedisClientType,
    ) {}
}
