import cors from "cors";
import type { Express } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createClient, RedisClientType } from "redis";

import { PrismaClient } from "./generated/prisma/client";
import {
    createDependencyInjectionMiddleware,
    log,
    requestid_middleware,
    winston_logger,
} from "./middlewares";
import { healthcheck_router } from "./routes";
import { Cache } from "./utils/cache";

export interface ServerCfg {
    port: number;
    api_prefix: string;
    cache: Cache | Record<string, unknown>;
    origins: Array<string>;
    listen_addr: string;
}

export class Server {
    app: Express; // Express application instance
    config: ServerCfg; // Server configuration
    prisma: PrismaClient | null; // PrismaClient instance
    redis: RedisClientType | null; // Redis client instance

    constructor(cfg: Partial<ServerCfg>) {
        this.app = express();
        this.config = Object.assign<ServerCfg, Partial<ServerCfg>>(
            this.#defaultConfig(),
            cfg,
        );
        this.prisma = null;
        this.redis = null;
    }

    #defaultConfig(): ServerCfg {
        return {
            port: 8998,
            api_prefix: "/api/v1",
            cache: {},
            origins: ["localhost:3000"],
            listen_addr: `http://${Bun.env.HOST || "localhost"}:${
                Bun.env.PORT || "8989"
            }`,
        };
    }

    //#region Server setup
    async setup() {
        // Validate required environment variables
        this.#validateEnvironment();

        // Setup the database and redis cache
        await this.#setupDatabase();
        log.info("Successfully connected to the database and cache");

        // Setup middlewares
        this.#setupMiddlewares();
        log.info("Successfully registered middlewares");

        // Setup routes
        this.#setupRoutes();
        log.info("Successfully registered routes");
    }
    //#endregion Server setup

    // @NOTE Private methods
    //#region Server private methods

    // Validate required environment variables
    #validateEnvironment() {
        const required = ["DATABASE_URL", "PORT", "HOST"];
        const missing = required.filter((key) => !Bun.env[key]);

        if (missing.length > 0) {
            const error = `Missing required environment variables: ${missing.join(
                ", ",
            )}`;
            log.error(error);
            throw new Error(error);
        }

        log.info("Environment variables validated successfully");
    }

    // Setup Database and redis cache
    async #setupDatabase() {
        try {
            // Validate DATABASE_URL before connecting
            if (!Bun.env.DATABASE_URL) {
                throw new Error("DATABASE_URL is required");
            }

            // Prisma + PostgreSQL setup with connection pooling
            this.prisma = new PrismaClient({
                datasources: {
                    db: {
                        url: Bun.env.DATABASE_URL,
                    },
                },
                log: [
                    { emit: "event", level: "error" },
                    { emit: "event", level: "warn" },
                ],
            });

            // Log Prisma errors and warnings
            this.prisma.$on("error" as never, (e: unknown) => {
                log.error("Prisma Client Error", e);
            });
            this.prisma.$on("warn" as never, (e: unknown) => {
                log.warn("Prisma Client Warning", e);
            });

            await this.prisma.$connect();
            log.info("Connected to the database successfully");

            // Redis setup
            this.redis = createClient({
                url: Bun.env.REDIS_URL || "redis://localhost:6379",
                pingInterval: 10000,
                socket: {
                    connectTimeout: 10000,
                    enableTrace: true,
                },
            });
            this.redis.on("error", (err) =>
                log.error("Redis Client Error", err),
            );

            await this.redis.connect();
            log.info("Connected to Redis successfully");
        } catch (err) {
            log.error("Failed to setup database connections", err);
            throw err;
        }
    }

    // Setup routes
    #setupRoutes() {
        this.app.use(this.config.api_prefix, healthcheck_router); // Healthcheck route
    }

    #setupMiddlewares() {
        // Body parsing with size limits
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(
            express.urlencoded({
                extended: true,
                limit: "10mb",
            }),
        );

        // Security headers with Helmet
        this.app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        scriptSrc: ["'self'"],
                        imgSrc: ["'self'", "data:", "https:"],
                    },
                },
                crossOriginEmbedderPolicy: false,
            }),
        );

        // Rate limiting
        this.app.use(
            rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // Limit each IP to 100 requests per windowMs
                message:
                    "Too many requests from this IP, please try again later.",
                standardHeaders: true,
                legacyHeaders: false,
            }),
        );

        // CORS with environment-based origins
        this.app.use(
            cors({
                origin: this.config.origins,
                credentials: true,
                allowedHeaders: ["Content-Type", "Authorization"],
                preflightContinue: false,
                optionsSuccessStatus: 204,
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            }),
        );

        // Logging and request tracking
        this.app.use(winston_logger);
        this.app.use(requestid_middleware);

        // Dependency injection - must be registered after other middlewares
        // but before routes to ensure dependencies are available in all route handlers
        if (this.prisma && this.redis) {
            this.app.use(
                createDependencyInjectionMiddleware(this.prisma, this.redis),
            );
            log.info("Dependency injection middleware registered");
        } else {
            log.warn(
                "Prisma or Redis not initialized. Dependency injection middleware not registered.",
            );
        }
    }

    // @NOTE End Private methods
    //#endregion Server private methods

    start() {
        this.app.listen(Bun.env.PORT || 8989, () => {
            log.info(`Server is listening on: ${this.config.listen_addr}`);
        });
    }

    // Graceful shutdown
    async shutdown() {
        log.info("Shutting down server gracefully...");
        try {
            if (this.prisma) {
                await this.prisma.$disconnect();
                log.info("Disconnected from database");
            }
            if (this.redis && this.redis.isOpen) {
                await this.redis.quit();
                log.info("Disconnected from Redis");
            }
            log.info("Server shutdown complete");
        } catch (err) {
            log.error("Error during shutdown", err);
            throw err;
        }
    }
}
