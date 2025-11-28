-- CreateEnum
CREATE TYPE "EVENT_CATEGORY" AS ENUM ('ALL_ACCESS', 'FASHION_EVENTS', 'DANCING_EVENTS', 'DRAMA_EVENTS', 'LITERARY_EVENTS', 'PHOTOGRAPHY_EVENTS', 'MOVIE_EVENTS', 'ART_EVENTS', 'MUSIC_EVENTS', 'DESIGNING_EVENTS');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "uid" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_teams" (
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_teams_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateTable
CREATE TABLE "user_categories" (
    "userId" TEXT NOT NULL,
    "category" "EVENT_CATEGORY" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_categories_pkey" PRIMARY KEY ("userId","category")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_uid_key" ON "teams"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE INDEX "teams_name_idx" ON "teams"("name");

-- CreateIndex
CREATE INDEX "teams_uid_idx" ON "teams"("uid");

-- CreateIndex
CREATE INDEX "user_teams_userId_idx" ON "user_teams"("userId");

-- CreateIndex
CREATE INDEX "user_teams_teamId_idx" ON "user_teams"("teamId");

-- CreateIndex
CREATE INDEX "user_categories_userId_idx" ON "user_categories"("userId");

-- CreateIndex
CREATE INDEX "user_categories_category_idx" ON "user_categories"("category");

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
