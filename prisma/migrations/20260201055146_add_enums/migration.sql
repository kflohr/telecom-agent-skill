/*
  Warnings:

  - Changed the type of `status` on the `Approval` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `actorSource` on the `Approval` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `actorSource` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActorSource" AS ENUM ('api', 'cli', 'telegram', 'openclaw');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'denied');

-- AlterTable
ALTER TABLE "Approval" DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL,
DROP COLUMN "actorSource",
ADD COLUMN     "actorSource" "ActorSource" NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "actorSource",
ADD COLUMN     "actorSource" "ActorSource" NOT NULL;

-- CreateTable
CREATE TABLE "AgentState" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentTask" TEXT,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL,
    "label" TEXT,

    CONSTRAINT "AgentState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentState_workspaceId_key" ON "AgentState"("workspaceId");
