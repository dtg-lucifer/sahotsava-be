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

import { EVENT_CATEGORY, PrismaClient, ROLE } from "../generated/prisma/client";
import { generatePassword, hashPassword } from "../lib/password";
import { generateUID } from "../lib/uid";
import { log } from "../middlewares";
import { EventCSVRow, UserCSVRow } from "../utils/types";
import {
	exportCredentialsToCSV,
	parseCSVField,
	parseEventCategories,
	parseTeamNames,
} from "../utils/seed_utility";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config();

const adapter = new PrismaPg({ connectionString: Bun.env.DATABASE_URL! });
const prisma = new PrismaClient({
	adapter: adapter,
	log: [
		{ emit: "event", level: "error" },
		{ emit: "event", level: "warn" },
	],
});

// File paths
const usersFilePath = path.join(__dirname, "data", "users.csv");
const eventsFilePath = path.join(__dirname, "data", "events.csv");
const credentialsFilePath = path.join(
	__dirname,
	"data",
	"user_credentials.csv",
);

// Store user credentials for export
const userCredentials: Array<{
	name: string;
	email: string;
	role: string;
	password: string;
}> = [];

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

async function seedTeams(teamNames: Set<string>) {
	log.info("Seeding teams...");

	for (const teamName of teamNames) {
		if (!teamName) continue;

		await prisma.team.upsert({
			where: { name: teamName },
			create: {
				uid: generateUID("TEAM_"),
				name: teamName,
			},
			update: {},
		});
	}

	log.info(`✓ ${teamNames.size} teams seeded`);
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
			.pipe(csvParser({
				mapHeaders: ({ header }) =>
					header.replace(/^\uFEFF/, "").trim(),
				skipLines: 0,
			}))
			.on("data", (row: UserCSVRow) => {
				users.push(row);
			})
			.on("end", async () => {
				try {
					log.info("Processing users CSV...");

					// First, collect unique campus names and team names
					const campusNames = new Set(
						users.map((u) => u.Campus).filter(Boolean),
					);
					const allTeamNames = new Set<string>();

					users.forEach((user) => {
						const teams = parseTeamNames(user.Associated_Teams);
						teams.forEach((team) => allTeamNames.add(team));
					});

					await seedCampuses(campusNames);
					await seedTeams(allTeamNames);

					// Now seed users
					for (const row of users) {
						const First_Name = row.First_Name?.trim() || "";
						const Middle_Name = row.Middle_Name?.trim() || "";
						const Last_Name = row.Last_Name?.trim() || "";
						const Email = row.Email?.trim() || "";
						const Phone = row.Phone?.trim() || "";
						const Campus = row.Campus?.trim() || "";
						const Role = row.Role?.trim() as keyof typeof ROLE;
						const Event_Category = row.Event_Category?.trim() || "";
						const Associated_Teams = row.Associated_Teams?.trim() ||
							"";

						// Validate role
						if (!Object.keys(ROLE).includes(Role)) {
							log.warn(
								`Invalid role ${Role} for user ${Email}, skipping...`,
							);
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

						// Generate password with current timestamp
						const password = generatePassword(
							prefix,
							First_Name,
							new Date().toISOString(),
						);
						const fullName =
							`${First_Name} ${Middle_Name} ${Last_Name}`
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

						// Parse event categories and teams
						const eventCategories = parseEventCategories(
							Event_Category,
						);
						const teamNames = parseTeamNames(Associated_Teams);

						// Hash the password before storing
						const hashedPassword = await hashPassword(password);

						// Store credentials for export
						userCredentials.push({
							name: fullName,
							email: Email,
							role: Role,
							password: password, // Plain text for admin reference
						});

						const user = await prisma.user.upsert({
							where: { p_email: Email },
							create: {
								uid: generateUID(prefix),
								p_email: Email,
								email: Email,
								name: fullName,
								phone: Phone || null,
								password: hashedPassword,
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

						// Assign event categories to user
						for (const category of eventCategories) {
							await prisma.userCategory.upsert({
								where: {
									userId_category: {
										userId: user.id,
										category: category,
									},
								},
								create: {
									userId: user.id,
									category: category,
								},
								update: {},
							});
						}

						// Assign teams to user
						for (const teamName of teamNames) {
							const team = await prisma.team.findUnique({
								where: { name: teamName },
								select: { id: true },
							});

							if (team) {
								await prisma.userTeam.upsert({
									where: {
										userId_teamId: {
											userId: user.id,
											teamId: team.id,
										},
									},
									create: {
										userId: user.id,
										teamId: team.id,
									},
									update: {},
								});
							}
						}

						log.info(
							`✓ User seeded: ${Email} (${Role}) - Password: ${password} - Teams: ${
								teamNames.join(", ") || "None"
							} - Categories: ${
								eventCategories.join(", ") || "None"
							}`,
						);
					}

					log.info(`✓ ${users.length} users processed successfully`);

					// Export user credentials to CSV
					exportCredentialsToCSV(
						userCredentials,
						credentialsFilePath,
					);

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
			log.warn(
				"⛌ Warning: events.csv file not found, skipping event seeding",
			);
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

					log.info(
						`✓ ${events.length} events processed successfully`,
					);
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
