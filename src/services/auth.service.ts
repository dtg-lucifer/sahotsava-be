/**
 * Auth Service
 * @maintainer dtg-lucifer <dev.bosepiush@gmail.com>
 *
 * Business logic for authentication operations with caching support
 */

import { PrismaClient, ROLE, User } from "../generated/prisma/client";
import { RedisClientType } from "redis";
import { compareHashedPassword, hashPassword } from "../lib/password";
import {
    generateRefreshToken,
    generateToken,
    verifyRefreshToken,
} from "../middlewares/auth";
import { generateUID } from "../lib/uid";
import { log } from "../middlewares";
import crypto from "crypto";

export class AuthService {
    constructor(
        private prisma: PrismaClient,
        private redis: RedisClientType,
    ) {}

    /**
     * Generate a verification token
     */
    generateVerificationToken(): string {
        return crypto.randomBytes(32).toString("hex");
    }

    /**
     * Register a new user (usually called by seeding or admin)
     */
    async registerUser(
        email: string,
        name: string,
        phone: string | null,
        role: ROLE,
        password: string,
        campusId?: string,
    ): Promise<User | null> {
        try {
            const hashedPassword = await hashPassword(password);
            const verificationToken = this.generateVerificationToken();

            const user = await this.prisma.user.create({
                data: {
                    uid: generateUID(this.getRolePrefix(role)),
                    p_email: email,
                    email: email,
                    name: name,
                    phone: phone || null,
                    password: hashedPassword,
                    role: role,
                    verification_token: verificationToken,
                    is_verified: false,
                    campusId: campusId || null,
                },
            });

            // Cache the verification token
            await this.redis.set(
                `verification:${verificationToken}`,
                user.id,
                { EX: 86400 }, // 24 hours
            );

            log.info(`✓ User registered: ${email}`);
            return user;
        } catch (error) {
            log.error("Error registering user:", error);
            return null;
        }
    }

    /**
     * Verify email using token
     */
    async verifyEmail(token: string): Promise<User | null> {
        try {
            // Check if token exists in cache
            const userId = await this.redis.get(`verification:${token}`);

            if (!userId) {
                log.warn("Invalid or expired verification token");
                return null;
            }

            // Update user as verified
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    is_verified: true,
                    verification_token: null,
                },
            });

            // Remove token from cache
            await this.redis.del(`verification:${token}`);

            log.info(`✓ Email verified for user: ${user.email}`);
            return user;
        } catch (error) {
            log.error("Error verifying email:", error);
            return null;
        }
    }

    /**
     * Login user
     */
    async login(
        email: string,
        password: string,
    ): Promise<
        {
            user: User;
            accessToken: string;
            refreshToken: string;
        } | null
    > {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: email },
            });

            if (!user) {
                log.warn(`Login attempt with non-existent email: ${email}`);
                return null;
            }

            // Check if email is verified
            if (!user.is_verified) {
                log.warn(`Login attempt with unverified email: ${email}`);
                return null;
            }

            // Compare password
            const isPasswordValid = compareHashedPassword(
                password,
                user.password,
            );

            if (!isPasswordValid) {
                log.warn(`Invalid password attempt for user: ${email}`);
                return null;
            }

            // Generate tokens
            const accessToken = generateToken(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                "24h",
            );

            const refreshToken = generateRefreshToken({
                id: user.id,
                email: user.email,
            });

            // Cache refresh token
            await this.redis.set(
                `refresh_token:${user.id}`,
                refreshToken,
                { EX: 2592000 }, // 30 days
            );

            log.info(`✓ User logged in: ${email}`);
            return { user, accessToken, refreshToken };
        } catch (error) {
            log.error("Error during login:", error);
            return null;
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken: string): Promise<string | null> {
        try {
            const decoded = verifyRefreshToken(refreshToken);

            if (!decoded) {
                log.warn("Invalid refresh token");
                return null;
            }

            // Verify token in cache
            const cachedToken = await this.redis.get(
                `refresh_token:${decoded.id}`,
            );

            if (cachedToken !== refreshToken) {
                log.warn(`Refresh token mismatch for user: ${decoded.id}`);
                return null;
            }

            // Get fresh user data
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.id },
            });

            if (!user || !user.is_verified) {
                log.warn(
                    `Invalid user or unverified for refresh: ${decoded.id}`,
                );
                return null;
            }

            // Generate new access token
            const newAccessToken = generateToken(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                "24h",
            );

            log.info(`✓ Access token refreshed for user: ${user.email}`);
            return newAccessToken;
        } catch (error) {
            log.error("Error refreshing token:", error);
            return null;
        }
    }

    /**
     * Logout user
     */
    async logout(userId: string): Promise<boolean> {
        try {
            await this.redis.del(`refresh_token:${userId}`);
            log.info(`✓ User logged out: ${userId}`);
            return true;
        } catch (error) {
            log.error("Error during logout:", error);
            return false;
        }
    }

    /**
     * Resend verification email
     */
    async generateNewVerificationToken(userId: string): Promise<string | null> {
        try {
            const verificationToken = this.generateVerificationToken();

            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    verification_token: verificationToken,
                },
            });

            // Cache the verification token
            await this.redis.set(
                `verification:${verificationToken}`,
                userId,
                { EX: 86400 }, // 24 hours
            );

            log.info(`✓ New verification token generated for user: ${userId}`);
            return verificationToken;
        } catch (error) {
            log.error("Error generating verification token:", error);
            return null;
        }
    }

    /**
     * Get role prefix for UID generation
     */
    private getRolePrefix(role: ROLE): string {
        switch (role) {
            case "SUPER_ADMIN":
                return "SA_";
            case "DOMAIN_LEAD":
                return "DL_";
            case "CAMPUS_AMBASSADOR":
                return "CA_";
            case "CHECKIN_CREW":
                return "CC_";
            default:
                return "USR_";
        }
    }
}
