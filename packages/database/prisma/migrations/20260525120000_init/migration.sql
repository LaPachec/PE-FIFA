-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('LEAGUE', 'KNOCKOUT', 'LEAGUE_KNOCKOUT');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'KNOCKOUT_STAGE', 'FINISHED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('ACTIVE', 'ELIMINATED', 'CHAMPION');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'FINISHED');

-- CreateEnum
CREATE TYPE "MatchPhase" AS ENUM ('LEAGUE', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "format" "TournamentFormat" NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "isTwoLegged" BOOLEAN NOT NULL DEFAULT false,
    "qualifiedCount" INTEGER,
    "hasThirdPlaceMatch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "teamName" TEXT,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "phase" "MatchPhase" NOT NULL,
    "round" INTEGER,
    "homeParticipantId" TEXT,
    "awayParticipantId" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "homePenaltyScore" INTEGER,
    "awayPenaltyScore" INTEGER,
    "winnerParticipantId" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "matchOrder" INTEGER NOT NULL,
    "nextMatchId" TEXT,
    "nextMatchSlot" TEXT,
    "playedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");

-- CreateIndex
CREATE INDEX "tournaments_ownerId_idx" ON "tournaments"("ownerId");

-- CreateIndex
CREATE INDEX "participants_tournamentId_idx" ON "participants"("tournamentId");

-- CreateIndex
CREATE INDEX "matches_tournamentId_idx" ON "matches"("tournamentId");

-- CreateIndex
CREATE INDEX "matches_homeParticipantId_idx" ON "matches"("homeParticipantId");

-- CreateIndex
CREATE INDEX "matches_awayParticipantId_idx" ON "matches"("awayParticipantId");

-- CreateIndex
CREATE INDEX "matches_winnerParticipantId_idx" ON "matches"("winnerParticipantId");

-- CreateIndex
CREATE INDEX "matches_nextMatchId_idx" ON "matches"("nextMatchId");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeParticipantId_fkey" FOREIGN KEY ("homeParticipantId") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayParticipantId_fkey" FOREIGN KEY ("awayParticipantId") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winnerParticipantId_fkey" FOREIGN KEY ("winnerParticipantId") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
