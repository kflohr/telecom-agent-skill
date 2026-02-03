/*
  Warnings:

  - You are about to drop the column `startedAt` on the `CallLeg` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `SmsMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CallLeg" DROP COLUMN "startedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SmsMessage" DROP COLUMN "sentAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
