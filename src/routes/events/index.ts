/**
 * Events Routes
 * @maintainer dtg-lucifer <dev.bosepiush@gmail.com>
 *
 * CRUD operations for events
 */

import type { Request, Response, Router } from "express";
import express from "express";
import { EventService } from "../../services/event.service";
import { PrismaClient } from "../../generated/prisma/client";
import { RedisClientType } from "redis";
import { api_response } from "../../utils/api_response";
import { log } from "../../middlewares";

interface GetAllEventsQuery {
    skip?: string;
    take?: string;
}

interface GetEventsByRegistrationsQuery {
    order?: "asc" | "desc";
    skip?: string;
    take?: string;
}

export function createEventRouter(
    prisma: PrismaClient,
    redis: RedisClientType,
): Router {
    const router = express.Router();
    const eventService = new EventService(prisma, redis);

    /**
     * @route   GET /api/v1/events
     * @desc    Get all events with optional pagination
     * @access  Public
     * @query   skip, take
     */
    router.get("/", async (req: Request, res: Response) => {
        try {
            const { skip, take } = req.query as GetAllEventsQuery;

            const skipNum = skip ? parseInt(skip) : undefined;
            const takeNum = take ? parseInt(take) : undefined;

            const events = await eventService.getAllEvents(
                skipNum,
                takeNum,
            );

            if (!events) {
                const response = api_response.error(
                    "Failed to retrieve events",
                    500,
                );
                return res.status(response.statusCode).json(response);
            }

            const response = api_response.success(
                "Events retrieved successfully",
                {
                    events,
                    count: events.length,
                },
                200,
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            log.error("Get all events error:", error);
            const response = api_response.error(
                "Failed to retrieve events",
                500,
            );
            return res.status(response.statusCode).json(response);
        }
    });

    /**
     * @route   GET /api/v1/events/id/:id
     * @desc    Get event by ID
     * @access  Public
     * @param   id - Event UUID
     */
    router.get("/id/:id", async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            if (!id) {
                const response = api_response.error(
                    "Event ID is required",
                    400,
                );
                return res.status(response.statusCode).json(response);
            }

            const event = await eventService.getEventById(id);

            if (!event) {
                const response = api_response.error("Event not found", 404);
                return res.status(response.statusCode).json(response);
            }

            const response = api_response.success(
                "Event retrieved successfully",
                { event },
                200,
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            log.error("Get event by ID error:", error);
            const response = api_response.error(
                "Failed to retrieve event",
                500,
            );
            return res.status(response.statusCode).json(response);
        }
    });

    /**
     * @route   GET /api/v1/events/slug/:slug
     * @desc    Get event by slug
     * @access  Public
     * @param   slug - Event slug
     */
    router.get("/slug/:slug", async (req: Request, res: Response) => {
        try {
            const { slug } = req.params;

            if (!slug) {
                const response = api_response.error(
                    "Event slug is required",
                    400,
                );
                return res.status(response.statusCode).json(response);
            }

            const event = await eventService.getEventBySlug(slug);

            if (!event) {
                const response = api_response.error("Event not found", 404);
                return res.status(response.statusCode).json(response);
            }

            const response = api_response.success(
                "Event retrieved successfully",
                { event },
                200,
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            log.error("Get event by slug error:", error);
            const response = api_response.error(
                "Failed to retrieve event",
                500,
            );
            return res.status(response.statusCode).json(response);
        }
    });

    /**
     * @route   GET /api/v1/events/search/name
     * @desc    Search events by name (fuzzy search)
     * @access  Public
     * @query   q - Search query
     */
    router.get("/search/name", async (req: Request, res: Response) => {
        try {
            const { q } = req.query;

            if (!q || typeof q !== "string") {
                const response = api_response.error(
                    "Search query is required",
                    400,
                );
                return res.status(response.statusCode).json(response);
            }

            const events = await eventService.getEventsByName(q);

            if (!events) {
                const response = api_response.error(
                    "Failed to search events",
                    500,
                );
                return res.status(response.statusCode).json(response);
            }

            const response = api_response.success(
                "Events search completed successfully",
                {
                    events,
                    count: events.length,
                    query: q,
                },
                200,
            );
            return res.status(response.statusCode).json(response);
        } catch (error) {
            log.error("Search events by name error:", error);
            const response = api_response.error(
                "Failed to search events",
                500,
            );
            return res.status(response.statusCode).json(response);
        }
    });

    /**
     * @route   GET /api/v1/events/search/domain-lead
     * @desc    Search events by domain lead name or email
     * @access  Public (Dashboard)
     * @query   q - Search query (name or email)
     */
    router.get(
        "/search/domain-lead",
        async (req: Request, res: Response) => {
            try {
                const { q } = req.query;

                if (!q || typeof q !== "string") {
                    const response = api_response.error(
                        "Search query is required",
                        400,
                    );
                    return res.status(response.statusCode).json(response);
                }

                const events = await eventService.getEventsByDomainLead(q);

                if (!events) {
                    const response = api_response.error(
                        "Failed to search events by domain lead",
                        500,
                    );
                    return res.status(response.statusCode).json(response);
                }

                const response = api_response.success(
                    "Events retrieved successfully",
                    {
                        events,
                        count: events.length,
                        query: q,
                    },
                    200,
                );
                return res.status(response.statusCode).json(response);
            } catch (error) {
                log.error("Search events by domain lead error:", error);
                const response = api_response.error(
                    "Failed to search events",
                    500,
                );
                return res.status(response.statusCode).json(response);
            }
        },
    );

    /**
     * @route   GET /api/v1/events/dashboard/registrations
     * @desc    Get events ordered by registration count (for dashboard)
     * @access  Public (Dashboard)
     * @query   order - Sort order ('asc' or 'desc'), skip, take
     */
    router.get(
        "/dashboard/registrations",
        async (req: Request, res: Response) => {
            try {
                const { order, skip, take } = req
                    .query as GetEventsByRegistrationsQuery;

                const sortOrder: "asc" | "desc" = order === "asc"
                    ? "asc"
                    : "desc";
                const skipNum = skip ? parseInt(skip) : undefined;
                const takeNum = take ? parseInt(take) : undefined;

                const events = await eventService.getEventsByRegistrations(
                    sortOrder,
                    skipNum,
                    takeNum,
                );

                if (!events) {
                    const response = api_response.error(
                        "Failed to retrieve events",
                        500,
                    );
                    return res.status(response.statusCode).json(response);
                }

                const response = api_response.success(
                    "Events retrieved successfully",
                    {
                        events,
                        count: events.length,
                        order: sortOrder,
                    },
                    200,
                );
                return res.status(response.statusCode).json(response);
            } catch (error) {
                log.error("Get events by registrations error:", error);
                const response = api_response.error(
                    "Failed to retrieve events",
                    500,
                );
                return res.status(response.statusCode).json(response);
            }
        },
    );

    return router;
}

export const events_router = createEventRouter;
