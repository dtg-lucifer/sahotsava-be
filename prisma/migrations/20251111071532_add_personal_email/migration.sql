/*
  Warnings:

  - A unique constraint covering the columns `[p_email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `p_email` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "p_email" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_p_email_key" ON "users"("p_email");
