// This script seeds the database with the initial data
// required for the application to function correctly.
//
// Requirements:
//       1. Add super admins to the DB
//       2. Add some sample events with all the metadata
//       3. Sample tickets
//       4. Sample registrations

import csvParser from "csv-parser";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { PrismaClient, ROLE } from "../generated/prisma/client";
import { generatePassword } from "../lib/password";
import { generateUID } from "../lib/uid";
import { log } from "../middlewares";
import { EventCSVRow, UserCSVRow } from "../utils/types";

dotenv.config();

const prisma = new PrismaClient();

// File paths
const usersFilePath = path.join(__dirname, "data", "users.csv");
const eventsFilePath = path.join(__dirname, "data", "events.csv");

async function seedCampuses(campusNames: Set<string>) {
	log.info("Seeding campuses...");

	for (const campusName of campusNames) {
		if (!campusName) continue;

		await prisma.campus.upsert({
			where: { name: campusName },
			create: {
				uid: generateUID("CAM_"),
				name: campusName,
				max_ambassadors: 10,
			},
			update: {},
		});
	}

	log.info(`✓ ${campusNames.size} campuses seeded`);
}

async function seedUsers() {
	return new Promise<void>((resolve, reject) => {
		const users: UserCSVRow[] = [];

		// Check if file exists
		if (!fs.existsSync(usersFilePath)) {
			log.error("Error: users.csv file not found!");
			reject(new Error("users.csv not found"));
			return;
		}

		fs.createReadStream(usersFilePath)
			.pipe(csvParser())
			.on("data", (row: UserCSVRow) => {
				users.push(row);
			})
			.on("end", async () => {
				try {
					log.info("Processing users CSV...");

					// First, collect unique campus names and seed them
					const campusNames = new Set(users.map((u) => u.Campus).filter(Boolean));
					await seedCampuses(campusNames);

					// Now seed users
					for (const row of users) {
						const {
							First_Name,
							Middle_Name,
							Last_Name,
							Email,
							Phone,
							Campus,
							Role,
							Timestamp,
						} = row;

						// Validate role
						if (!Object.keys(ROLE).includes(Role)) {
							log.warn(`Invalid role ${Role} for user ${Email}, skipping...`);
							continue;
						}

						// Generate prefix and password
						let prefix = "";
						switch (Role) {
							case "SUPER_ADMIN":
								prefix = "SA_";
								break;
							case "DOMAIN_LEAD":
								prefix = "DL_";
								break;
							case "CHECKIN_CREW":
								prefix = "CC_";
								break;
							case "CAMPUS_AMBASSADOR":
								prefix = "CA_";
								break;
						}

						const password = generatePassword(prefix, First_Name, Timestamp);
						const fullName = `${First_Name} ${Middle_Name} ${Last_Name}`
							.replace(/\s+/g, " ")
							.trim();

						// Find campus if provided
						let campusId: string | undefined;
						if (Campus) {
							const campus = await prisma.campus.findUnique({
								where: { name: Campus },
								select: { id: true },
							});
							campusId = campus?.id;
						}

						await prisma.user.upsert({
							where: { p_email: Email },
							create: {
								uid: generateUID(prefix),
								p_email: Email,
								email: Email,
								name: fullName,
								phone: Phone || null,
								password: password,
								role: Role as ROLE,
								is_verified: true, // Auto-verify seed users
								campusId: campusId || null,
							},
							update: {
								name: fullName,
								phone: Phone || null,
								role: Role as ROLE,
								campusId: campusId || null,
							},
						});

						log.info(`✓ User seeded: ${Email} (${Role}) - Password: ${password}`);
					}

					log.info(`✓ ${users.length} users processed successfully`);
					resolve();
				} catch (error) {
					log.error("Error processing users:", error);
					reject(error);
				}
			})
			.on("error", (error) => {
				log.error("Error reading users CSV:", error);
				reject(error);
			});
	});
}

async function seedEvents() {
	return new Promise<void>((resolve, reject) => {
		const events: EventCSVRow[] = [];

		// Check if file exists
		if (!fs.existsSync(eventsFilePath)) {
			log.warn("⛌ Warning: events.csv file not found, skipping event seeding");
			resolve();
			return;
		}

		fs.createReadStream(eventsFilePath)
			.pipe(csvParser())
			.on("data", (row: EventCSVRow) => {
				events.push(row);
			})
			.on("end", async () => {
				try {
					if (events.length === 0) {
						log.info("No events to seed");
						resolve();
						return;
					}

					log.info("Processing events CSV...");

					for (const row of events) {
						const {
							Name,
							Description,
							Slug,
							Thumb_URL,
							Max_Registrations,
							Domain_Lead_Email,
							Date: EventDate,
						} = row;

						// Find domain lead
						const domainLead = await prisma.user.findUnique({
							where: { email: Domain_Lead_Email },
							select: { id: true },
						});

						if (!domainLead) {
							log.warn(
								`Domain lead ${Domain_Lead_Email} not found, skipping event ${Name}`,
							);
							continue;
						}

						await prisma.event.upsert({
							where: { slug: Slug },
							create: {
								slug: Slug,
								name: Name,
								description: Description,
								thumb_url: Thumb_URL,
								max_registrations: Max_Registrations
									? parseInt(Max_Registrations)
									: null,
								domain_lead_id: domainLead.id,
								date: new Date(EventDate),
							},
							update: {
								name: Name,
								description: Description,
								thumb_url: Thumb_URL,
								max_registrations: Max_Registrations
									? parseInt(Max_Registrations)
									: null,
								date: new Date(EventDate),
							},
						});

						log.info(`✓ Event seeded: ${Name}`);
					}

					log.info(`✓ ${events.length} events processed successfully`);
					resolve();
				} catch (error) {
					log.error("Error processing events:", error);
					reject(error);
				}
			})
			.on("error", (error) => {
				log.error("Error reading events CSV:", error);
				reject(error);
			});
	});
}

async function main() {
	try {
		log.info("🌱 Starting database seeding...");

		const campuses: Set<string> = new Set();
		campuses.add("TIU001");
		campuses.add("IEM001");
		campuses.add("SNU001");
		campuses.add("AMITY001");
		campuses.add("IIHM001");
		campuses.add("NSBIHM001");

		await seedCampuses(campuses);
		await seedUsers();
		await seedEvents();

		log.info("✅ Database seeding completed successfully!");
	} catch (error) {
		log.error("❌ Seeding failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
