/**
 * User Service
 * @maintainer dtg-lucifer <dev.bosepiush@gmail.com>
 *
 * Business logic for user operations with caching support
 */

import { PrismaClient, User, UserCategory } from "../generated/prisma/client";
import { RedisClientType } from "redis";
import { log } from "../middlewares";

export class UserService {
    constructor(
        private prisma: PrismaClient,
        private redis: RedisClientType,
    ) {}

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<User | null> {
        try {
            // Try cache first
            const cached = await this.redis.get(`user:${userId}`);
            if (cached) {
                return JSON.parse(cached);
            }

            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });

            if (user) {
                // Cache for 1 hour
                await this.redis.set(`user:${userId}`, JSON.stringify(user), {
                    EX: 3600,
                });
            }

            return user;
        } catch (error) {
            log.error("Error getting user by ID:", error);
            return null;
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const cacheKey = `user:email:${email}`;

            // Try cache first
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }

            const user = await this.prisma.user.findUnique({
                where: { email: email },
            });

            if (user) {
                // Cache for 1 hour
                await this.redis.set(cacheKey, JSON.stringify(user), {
                    EX: 3600,
                });
            }

            return user;
        } catch (error) {
            log.error("Error getting user by email:", error);
            return null;
        }
    }

    /**
     * Update user
     */
    async updateUser(
        userId: string,
        data: Partial<User>,
    ): Promise<User | null> {
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    p_email: data.p_email,
                },
            });

            // Invalidate cache
            await this.redis.del(`user:${userId}`);
            if (data.email) {
                await this.redis.del(`user:email:${data.email}`);
            }

            log.info(`✓ User updated: ${userId}`);
            return user;
        } catch (error) {
            log.error("Error updating user:", error);
            return null;
        }
    }

    /**
     * Get user with all associations
     */
    async getUserWithAssociations(userId: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    campus: true,
                    user_teams: {
                        include: {
                            team: true,
                        },
                    },
                    user_categories: true,
                },
            });

            return user;
        } catch (error) {
            log.error("Error getting user with associations:", error);
            return null;
        }
    }

    /**
     * Get user's categories
     */
    async getUserCategories(userId: string): Promise<UserCategory[]> {
        try {
            return await this.prisma.userCategory.findMany({
                where: { userId: userId },
            });
        } catch (error) {
            log.error("Error getting user categories:", error);
            return [];
        }
    }

    /**
     * Check if user is verified
     */
    async isUserVerified(userId: string): Promise<boolean> {
        try {
            const user = await this.getUserById(userId);
            return user?.is_verified ?? false;
        } catch (error) {
            log.error("Error checking user verification:", error);
            return false;
        }
    }

    /**
     * Get verification token for user
     */
    async getVerificationToken(userId: string): Promise<string | null> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { verification_token: true },
            });

            return user?.verification_token ?? null;
        } catch (error) {
            log.error("Error getting verification token:", error);
            return null;
        }
    }

    /**
     * Bulk get users
     */
    async getUsersByIds(userIds: string[]): Promise<User[]> {
        try {
            return await this.prisma.user.findMany({
                where: {
                    id: {
                        in: userIds,
                    },
                },
            });
        } catch (error) {
            log.error("Error getting users by IDs:", error);
            return [];
        }
    }

    /**
     * Get users by role
     */
    async getUsersByRole(role: string) {
        try {
            return await this.prisma.user.findMany({
                where: {
                    role: role as any,
                    is_verified: true,
                },
            });
        } catch (error) {
            log.error("Error getting users by role:", error);
            return [];
        }
    }
}
