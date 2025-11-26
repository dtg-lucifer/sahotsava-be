-- CreateEnum
CREATE TYPE "ROLE" AS ENUM ('SUPER_ADMIN', 'DOMAIN_LEAD', 'CAMPUS_AMBASSADOR', 'CHECKIN_CREW');

-- CreateEnum
CREATE TYPE "REGISTRATION_STATUS" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TICKET_STATUS" AS ENUM ('ISSUED', 'USED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "uid" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password" VARCHAR(255) NOT NULL,
    "role" "ROLE" NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" VARCHAR(255),
    "reset_token" VARCHAR(255),
    "reset_token_expires_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "campusId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "uid" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "max_ambassadors" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "thumb_url" VARCHAR(500) NOT NULL,
    "max_registrations" INTEGER,
    "domain_lead_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "p_name" VARCHAR(255) NOT NULL,
    "p_email" VARCHAR(255) NOT NULL,
    "p_phone" VARCHAR(20),
    "caId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "REGISTRATION_STATUS" NOT NULL DEFAULT 'PENDING',
    "acceptedById" TEXT,
    "rejectedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("caId","eventId","p_email")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "uid" VARCHAR(50) NOT NULL,
    "p_name" VARCHAR(255) NOT NULL,
    "p_email" VARCHAR(255) NOT NULL,
    "p_phone" VARCHAR(20),
    "status" "TICKET_STATUS" NOT NULL DEFAULT 'ISSUED',
    "eventId" TEXT NOT NULL,
    "issuedByDomainLeadId" TEXT NOT NULL,
    "checked_in_at" TIMESTAMP(3),
    "checkedInById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uid_key" ON "users"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_verification_token_key" ON "users"("verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_token_key" ON "users"("reset_token");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_is_verified_idx" ON "users"("role", "is_verified");

-- CreateIndex
CREATE INDEX "users_campusId_idx" ON "users"("campusId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "campuses_uid_key" ON "campuses"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "campuses_name_key" ON "campuses"("name");

-- CreateIndex
CREATE INDEX "campuses_name_idx" ON "campuses"("name");

-- CreateIndex
CREATE INDEX "campuses_uid_idx" ON "campuses"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events_domain_lead_id_key" ON "events"("domain_lead_id");

-- CreateIndex
CREATE INDEX "events_domain_lead_id_idx" ON "events"("domain_lead_id");

-- CreateIndex
CREATE INDEX "events_slug_idx" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt");

-- CreateIndex
CREATE INDEX "registrations_eventId_idx" ON "registrations"("eventId");

-- CreateIndex
CREATE INDEX "registrations_caId_idx" ON "registrations"("caId");

-- CreateIndex
CREATE INDEX "registrations_status_eventId_idx" ON "registrations"("status", "eventId");

-- CreateIndex
CREATE INDEX "registrations_p_email_idx" ON "registrations"("p_email");

-- CreateIndex
CREATE INDEX "registrations_acceptedById_idx" ON "registrations"("acceptedById");

-- CreateIndex
CREATE INDEX "registrations_rejectedById_idx" ON "registrations"("rejectedById");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_uid_key" ON "tickets"("uid");

-- CreateIndex
CREATE INDEX "tickets_uid_idx" ON "tickets"("uid");

-- CreateIndex
CREATE INDEX "tickets_eventId_idx" ON "tickets"("eventId");

-- CreateIndex
CREATE INDEX "tickets_p_email_idx" ON "tickets"("p_email");

-- CreateIndex
CREATE INDEX "tickets_eventId_createdAt_idx" ON "tickets"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "tickets_issuedByDomainLeadId_idx" ON "tickets"("issuedByDomainLeadId");

-- CreateIndex
CREATE INDEX "tickets_status_eventId_idx" ON "tickets"("status", "eventId");

-- CreateIndex
CREATE INDEX "tickets_checkedInById_idx" ON "tickets"("checkedInById");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_domain_lead_id_fkey" FOREIGN KEY ("domain_lead_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_caId_fkey" FOREIGN KEY ("caId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_issuedByDomainLeadId_fkey" FOREIGN KEY ("issuedByDomainLeadId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
