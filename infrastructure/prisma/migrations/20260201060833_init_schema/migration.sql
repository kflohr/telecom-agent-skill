/*
  Warnings:

  - Added the required column `updatedAt` to the `CallLeg` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `state` on the `CallLeg` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `state` on the `Conference` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `conferenceId` to the `Participant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SmsMessage` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `direction` on the `SmsMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `SmsMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CallState" AS ENUM ('initiated', 'ringing', 'in_progress', 'completed', 'busy', 'no_answer', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('queued', 'sending', 'sent', 'delivered', 'undelivered', 'failed', 'received');

-- CreateEnum
CREATE TYPE "SmsDirection" AS ENUM ('inbound', 'outbound', 'outbound_api', 'outbound_reply');

-- CreateEnum
CREATE TYPE "ConferenceState" AS ENUM ('created', 'in_progress', 'completed');

-- AlterEnum
ALTER TYPE "ActorSource" ADD VALUE 'system';

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_conferenceSid_fkey";

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "decidedBy" TEXT,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "CallLeg" ADD COLUMN     "rawLastEvent" JSONB,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "callSid" DROP NOT NULL,
DROP COLUMN "state",
ADD COLUMN     "state" "CallState" NOT NULL;

-- AlterTable
ALTER TABLE "Conference" ALTER COLUMN "conferenceSid" DROP NOT NULL,
DROP COLUMN "state",
ADD COLUMN     "state" "ConferenceState" NOT NULL;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "conferenceId" TEXT NOT NULL,
ALTER COLUMN "conferenceSid" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SmsMessage" ADD COLUMN     "bodyHash" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "rawLastEvent" JSONB,
ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "messageSid" DROP NOT NULL,
DROP COLUMN "direction",
ADD COLUMN     "direction" "SmsDirection" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SmsStatus" NOT NULL;

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "provider" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventKey_key" ON "WebhookEvent"("eventKey");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
