/**
 * Authentication Routes
 * @maintainer dtg-lucifer <dev.bosepiush@gmail.com>
 *
 * Handles user authentication, email verification, and token management
 *
 * NOTE: No signup endpoint - users are pre-added by administrators
 */

import type { Request, Response, Router } from "express";
import express from "express";
import { AuthService } from "../../services/auth.service";
import { UserService } from "../../services/user.service";
import { EmailService, emailService } from "../../utils/email";
import { PrismaClient } from "../../generated/prisma/client";
import { RedisClientType } from "redis";
import { authenticate, AuthRequest } from "../../middlewares/auth";
import { api_response } from "../../utils/api_response";
import { log } from "../../middlewares";

interface VerifyEmailRequest {
    token: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

interface RefreshTokenRequest {
    refreshToken: string;
}

interface ResendVerificationRequest {
    email: string;
}

export function createAuthRouter(
    prisma: PrismaClient,
    redis: RedisClientType,
): Router {
    const router = express.Router();
    const authService = new AuthService(prisma, redis);
    const userService = new UserService(prisma, redis);

    /**
     * @route   GET /api/v1/auth/verify-email
     * @desc    Verify email via token (returns HTML page)
     * @access  Public
     * @query   token
     */
    router.get("/verify-email", async (req: Request, res: Response) => {
        try {
            const { token } = req.query;

            if (!token || typeof token !== "string") {
                return res
                    .status(400)
                    .send(EmailService.getVerificationExpiredHTML());
            }

            const user = await authService.verifyEmail(token);

            if (!user) {
                return res
                    .status(400)
                    .send(EmailService.getVerificationExpiredHTML());
            }

            return res
                .status(200)
                .send(EmailService.getVerificationSuccessHTML(user.name));
        } catch (error) {
            log.error("Email verification error:", error);
            return res
                .status(500)
                .send(EmailService.getVerificationExpiredHTML());
        }
    });

    /**
     * @route   POST /api/v1/auth/verify-email
     * @desc    Verify email via token (returns JSON)
     * @access  Public
     * @body    { token }
     */
    router.post("/verify-email", async (req: Request, res: Response) => {
        try {
            const { token } = req.body as VerifyEmailRequest;

            if (!token) {
                const response = api_response.error("Token is required", 400);
                return res.status(response.statusCode).json(response);
            }

            const user = await authService.verifyEmail(token);

            if (!user) {
                const response = api_response.error(
                    "Invalid or expired verification token",
                    400,
                );
                return res.status(response.statusCode).json(response);
            }

            const response = api_response.success(
                "Email verified successfully",
                {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        is_verified: user.is_verified,
                    },
                },
                200,
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            log.error("Email verification error:", error);
            const response = api_response.error(
                "An error occurred during email verification",
                500,
            );
            return res.status(response.statusCode).json(response);
        }
    });

    /**
     * @route   POST /api/v1/auth/login
     * @desc    Login user and return tokens
     * @access  Public
     * @body    { email, password }
     */
    router.post("/login", async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body as LoginRequest;

            if (!email || !password) {
                const response = api_response.error(
                    "Email and password are required",
                    400,
                );
                return res.status(response.statusCode).json(response);
            }

            const result = await authService.login(email, password);

            if (!result) {
                const response = api_response.error(
                    "Invalid email or password",
                    401,
                );
                return res.status(response.statusCode).json(response);
            }

            const response = api_response.success(
                "Login successful",
                {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        name: result.user.name,
                        role: result.user.role,
                        is_verified: result.user.is_verified,
                    },
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
                200,
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            log.error("Login error:", error);
            const response = api_response.error("Login failed", 500);
            return res.status(response.statusCode).json(response);
        }
    });

    /**
     * @route   POST /api/v1/auth/refresh-token
     * @desc    Refresh access token
     * @access  Public
     * @body    { refreshToken }
     */
    router.post("/refresh-token", async (req: Request, res: Response) => {
        try {
            const { refreshToken } = req.body as RefreshTokenRequest;

            if (!refreshToken) {
                const response = api_response.error(
                    "Refresh token is required",
                    400,
                );
                return res.status(response.statusCode).json(response);
            }

            const accessToken = await authService.refreshAccessToken(
                refreshToken,
            );

            if (!accessToken) {
                const response = api_response.error(
                    "Invalid or expired refresh token",
                    401,
                );
                return res.status(response.statusCode).json(response);
            }

            const response = api_response.success(
                "Token refreshed successfully",
                {
                    accessToken: accessToken,
                },
                200,
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            log.error("Token refresh error:", error);
            const response = api_response.error("Token refresh failed", 500);
            return res.status(response.statusCode).json(response);
        }
    });

    /**
     * @route   POST /api/v1/auth/resend-verification
     * @desc    Resend verification email
     * @access  Public
     * @body    { email }
     */
    router.post(
        "/resend-verification",
        async (req: Request, res: Response) => {
            try {
                const { email } = req.body as ResendVerificationRequest;

                if (!email) {
                    const response = api_response.error(
                        "Email is required",
                        400,
                    );
                    return res.status(response.statusCode).json(response);
                }

                const user = await userService.getUserByEmail(email);

                if (!user) {
                    const response = api_response.error("User not found", 404);
                    return res.status(response.statusCode).json(response);
                }

                if (user.is_verified) {
                    const response = api_response.success(
                        "Email already verified",
                        {},
                        200,
                    );
                    return res.status(response.statusCode).json(response);
                }

                const verificationToken = await authService
                    .generateNewVerificationToken(user.id);

                if (!verificationToken) {
                    const response = api_response.error(
                        "Failed to generate verification token",
                        500,
                    );
                    return res.status(response.statusCode).json(response);
                }

                const verificationLink = `${
                    Bun.env.APP_URL || "http://localhost:3000"
                }/verify-email?token=${verificationToken}`;

                const emailSent = await emailService.sendVerificationEmail(
                    email,
                    user.name,
                    verificationLink,
                );

                if (!emailSent) {
                    const response = api_response.error(
                        "Failed to send verification email",
                        500,
                    );
                    return res.status(response.statusCode).json(response);
                }

                const response = api_response.success(
                    "Verification email sent successfully",
                    {},
                    200,
                );
                return res.status(response.statusCode).json(response);
            } catch (error) {
                log.error("Resend verification error:", error);
                const response = api_response.error("Resend failed", 500);
                return res.status(response.statusCode).json(response);
            }
        },
    );

    /**
     * @route   POST /api/v1/auth/logout
     * @desc    Logout user (invalidate refresh token)
     * @access  Protected
     * @headers Authorization: Bearer <access_token>
     */
    router.post(
        "/logout",
        authenticate,
        async (req: AuthRequest, res: Response) => {
            try {
                if (!req.user) {
                    const response = api_response.error("Unauthorized", 401);
                    return res.status(response.statusCode).json(response);
                }

                const success = await authService.logout(req.user.id);

                if (!success) {
                    const response = api_response.error("Logout failed", 500);
                    return res.status(response.statusCode).json(response);
                }

                const response = api_response.success(
                    "Logged out successfully",
                    {},
                    200,
                );
                return res.status(response.statusCode).json(response);
            } catch (error) {
                log.error("Logout error:", error);
                const response = api_response.error("Logout failed", 500);
                return res.status(response.statusCode).json(response);
            }
        },
    );

    /**
     * @route   GET /api/v1/auth/me
     * @desc    Get current user profile
     * @access  Protected
     * @headers Authorization: Bearer <access_token>
     */
    router.get(
        "/me",
        authenticate,
        async (req: AuthRequest, res: Response) => {
            try {
                if (!req.user) {
                    const response = api_response.error("Unauthorized", 401);
                    return res.status(response.statusCode).json(response);
                }

                const user = await userService.getUserWithAssociations(
                    req.user.id,
                );

                if (!user) {
                    const response = api_response.error("User not found", 404);
                    return res.status(response.statusCode).json(response);
                }

                const response = api_response.success(
                    "Profile retrieved successfully",
                    {
                        user: user,
                    },
                    200,
                );
                return res.status(response.statusCode).json(response);
            } catch (error) {
                log.error("Get profile error:", error);
                const response = api_response.error(
                    "Failed to get profile",
                    500,
                );
                return res.status(response.statusCode).json(response);
            }
        },
    );

    return router;
}

export const auth_router = createAuthRouter;
