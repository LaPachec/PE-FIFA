ALTER TABLE "tournaments" ADD COLUMN "championParticipantId" TEXT;

CREATE INDEX "tournaments_championParticipantId_idx" ON "tournaments"("championParticipantId");
