-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN "inviteCode" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "maxParticipants" INTEGER;
ALTER TABLE "tournaments" ADD COLUMN "inviteEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_inviteCode_key" ON "tournaments"("inviteCode");
