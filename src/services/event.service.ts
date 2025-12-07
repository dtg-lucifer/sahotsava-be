/**
 * Event Service
 * @maintainer dtg-lucifer <dev.bosepiush@gmail.com>
 *
 * Business logic for event operations with caching support
 */

import { Event, PrismaClient } from "../generated/prisma/client";
import { RedisClientType } from "redis";
import { log } from "../middlewares";

export class EventService {
    constructor(
        private prisma: PrismaClient,
        private redis: RedisClientType,
    ) {}

    /**
     * Get all events with optional pagination
     * @param skip - Number of records to skip
     * @param take - Number of records to take
     */
    async getAllEvents(
        skip?: number,
        take?: number,
    ): Promise<Event[] | null> {
        try {
            // Try cache first (cache for 5 minutes for list queries)
            const cacheKey = `events:all:${skip || 0}:${take || 100}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                log.info("Cache hit for all events");
                return JSON.parse(cached);
            }

            const events = await this.prisma.event.findMany({
                skip: skip,
                take: take,
                include: {
                    domain_lead: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            registrations: true,
                        },
                    },
                },
                orderBy: {
                    date: "asc",
                },
            });

            // Cache for 5 minutes
            await this.redis.set(cacheKey, JSON.stringify(events), {
                EX: 300,
            });

            log.info(`Retrieved ${events.length} events`);
            return events;
        } catch (error) {
            log.error("Error getting all events:", error);
            return null;
        }
    }

    /**
     * Get event by ID
     * @param eventId - Event UUID
     */
    async getEventById(eventId: string): Promise<Event | null> {
        try {
            // Try cache first
            const cached = await this.redis.get(`event:id:${eventId}`);
            if (cached) {
                log.info(`Cache hit for event ID: ${eventId}`);
                return JSON.parse(cached);
            }

            const event = await this.prisma.event.findUnique({
                where: { id: eventId },
                include: {
                    domain_lead: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            registrations: true,
                            tickets: true,
                        },
                    },
                },
            });

            if (event) {
                // Cache for 10 minutes
                await this.redis.set(
                    `event:id:${eventId}`,
                    JSON.stringify(event),
                    {
                        EX: 600,
                    },
                );
            }

            return event;
        } catch (error) {
            log.error("Error getting event by ID:", error);
            return null;
        }
    }

    /**
     * Get event by slug
     * @param slug - Event slug (unique identifier)
     */
    async getEventBySlug(slug: string): Promise<Event | null> {
        try {
            // Try cache first
            const cached = await this.redis.get(`event:slug:${slug}`);
            if (cached) {
                log.info(`Cache hit for event slug: ${slug}`);
                return JSON.parse(cached);
            }

            const event = await this.prisma.event.findUnique({
                where: { slug: slug },
                include: {
                    domain_lead: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            registrations: true,
                            tickets: true,
                        },
                    },
                },
            });

            if (event) {
                // Cache for 10 minutes
                await this.redis.set(
                    `event:slug:${slug}`,
                    JSON.stringify(event),
                    {
                        EX: 600,
                    },
                );
            }

            return event;
        } catch (error) {
            log.error("Error getting event by slug:", error);
            return null;
        }
    }

    /**
     * Get events by name (fuzzy search)
     * @param name - Partial or full event name
     */
    async getEventsByName(name: string): Promise<Event[] | null> {
        try {
            // Cache with name as key (5 minutes)
            const cacheKey = `events:name:${name.toLowerCase()}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                log.info(`Cache hit for events with name: ${name}`);
                return JSON.parse(cached);
            }

            const events = await this.prisma.event.findMany({
                where: {
                    name: {
                        contains: name,
                        mode: "insensitive",
                    },
                },
                include: {
                    domain_lead: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            registrations: true,
                        },
                    },
                },
                orderBy: {
                    name: "asc",
                },
            });

            // Cache for 5 minutes
            await this.redis.set(cacheKey, JSON.stringify(events), {
                EX: 300,
            });

            log.info(
                `Found ${events.length} events matching name: ${name}`,
            );
            return events;
        } catch (error) {
            log.error("Error getting events by name:", error);
            return null;
        }
    }

    /**
     * Get events by domain lead (name or email)
     * @param identifier - Domain lead name or email
     */
    async getEventsByDomainLead(
        identifier: string,
    ): Promise<Event[] | null> {
        try {
            // Cache with identifier as key (5 minutes)
            const cacheKey = `events:lead:${identifier.toLowerCase()}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                log.info(
                    `Cache hit for events with domain lead: ${identifier}`,
                );
                return JSON.parse(cached);
            }

            const events = await this.prisma.event.findMany({
                where: {
                    domain_lead: {
                        OR: [
                            {
                                name: {
                                    contains: identifier,
                                    mode: "insensitive",
                                },
                            },
                            {
                                email: {
                                    contains: identifier,
                                    mode: "insensitive",
                                },
                            },
                        ],
                    },
                },
                include: {
                    domain_lead: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            registrations: true,
                        },
                    },
                },
                orderBy: {
                    name: "asc",
                },
            });

            // Cache for 5 minutes
            await this.redis.set(cacheKey, JSON.stringify(events), {
                EX: 300,
            });

            log.info(
                `Found ${events.length} events for domain lead: ${identifier}`,
            );
            return events;
        } catch (error) {
            log.error("Error getting events by domain lead:", error);
            return null;
        }
    }

    /**
     * Get events ordered by registration count
     * @param order - Sort order: 'asc' or 'desc'
     * @param skip - Number of records to skip
     * @param take - Number of records to take
     */
    async getEventsByRegistrations(
        order: "asc" | "desc" = "desc",
        skip?: number,
        take?: number,
    ): Promise<Event[] | null> {
        try {
            // Cache with order as key (3 minutes for dashboard queries)
            const cacheKey = `events:registrations:${order}:${skip || 0}:${
                take || 100
            }`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                log.info(
                    `Cache hit for events ordered by registrations (${order})`,
                );
                return JSON.parse(cached);
            }

            const events = await this.prisma.event.findMany({
                skip: skip,
                take: take,
                include: {
                    domain_lead: {
                        select: {
                            id: true,
                            uid: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    _count: {
                        select: {
                            registrations: true,
                        },
                    },
                },
                orderBy: {
                    registrations: {
                        _count: order,
                    },
                },
            });

            // Cache for 3 minutes (shorter for dynamic data)
            await this.redis.set(cacheKey, JSON.stringify(events), {
                EX: 180,
            });

            log.info(
                `Retrieved ${events.length} events ordered by registrations (${order})`,
            );
            return events;
        } catch (error) {
            log.error("Error getting events by registrations:", error);
            return null;
        }
    }

    /**
     * Invalidate event cache
     * @param eventId - Event ID to invalidate (optional, invalidates all if not provided)
     */
    async invalidateCache(eventId?: string): Promise<void> {
        try {
            if (eventId) {
                // Invalidate specific event cache
                await this.redis.del(`event:id:${eventId}`);
                log.info(`Invalidated cache for event: ${eventId}`);
            } else {
                // Invalidate all event-related caches
                const keys = await this.redis.keys("event:*");
                const eventKeys = await this.redis.keys("events:*");
                const allKeys = [...keys, ...eventKeys];

                if (allKeys.length > 0) {
                    await this.redis.del(allKeys);
                    log.info(
                        `Invalidated ${allKeys.length} event cache entries`,
                    );
                }
            }
        } catch (error) {
            log.error("Error invalidating event cache:", error);
        }
    }
}
