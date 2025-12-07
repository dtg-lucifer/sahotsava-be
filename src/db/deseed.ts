// This script clears all seeded data from the database
// Use this to reset the database before re-seeding

import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { log } from "../middlewares";

dotenv.config();

const adapter = new PrismaPg({ connectionString: Bun.env.DATABASE_URL! });
const prisma = new PrismaClient({
    adapter: adapter,
    log: [
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" },
    ],
});

async function deseedDatabase() {
    try {
        log.info("🧹 Starting database cleanup...");

        // Delete in order respecting foreign key constraints
        // Start with dependent tables first

        log.info("Deleting user-team assignments...");
        const userTeamsDeleted = await prisma.userTeam.deleteMany({});
        log.info(`✓ Deleted ${userTeamsDeleted.count} user-team assignments`);

        log.info("Deleting user-category assignments...");
        const userCategoriesDeleted = await prisma.userCategory.deleteMany({});
        log.info(
            `✓ Deleted ${userCategoriesDeleted.count} user-category assignments`,
        );

        log.info("Deleting tickets...");
        const ticketsDeleted = await prisma.ticket.deleteMany({});
        log.info(`✓ Deleted ${ticketsDeleted.count} tickets`);

        log.info("Deleting registrations...");
        const registrationsDeleted = await prisma.registration.deleteMany({});
        log.info(`✓ Deleted ${registrationsDeleted.count} registrations`);

        log.info("Deleting events...");
        const eventsDeleted = await prisma.event.deleteMany({});
        log.info(`✓ Deleted ${eventsDeleted.count} events`);

        log.info("Deleting users...");
        const usersDeleted = await prisma.user.deleteMany({});
        log.info(`✓ Deleted ${usersDeleted.count} users`);

        log.info("Deleting teams...");
        const teamsDeleted = await prisma.team.deleteMany({});
        log.info(`✓ Deleted ${teamsDeleted.count} teams`);

        log.info("Deleting campuses...");
        const campusesDeleted = await prisma.campus.deleteMany({});
        log.info(`✓ Deleted ${campusesDeleted.count} campuses`);

        log.info("✅ Database cleanup completed successfully!");
        log.info(`
📊 Summary:
  - User-Team Assignments: ${userTeamsDeleted.count}
  - User-Category Assignments: ${userCategoriesDeleted.count}
  - Tickets: ${ticketsDeleted.count}
  - Registrations: ${registrationsDeleted.count}
  - Events: ${eventsDeleted.count}
  - Users: ${usersDeleted.count}
  - Teams: ${teamsDeleted.count}
  - Campuses: ${campusesDeleted.count}
		`);
    } catch (error) {
        log.error("❌ Database cleanup failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

deseedDatabase();
