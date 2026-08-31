-- PlayerSearch: allow an open ("flexibel") time, add the 14-day stale check.
ALTER TABLE "PlayerSearch"
  ADD COLUMN "confirmedActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "staleNotifiedAt" TIMESTAMP(3),
  ALTER COLUMN "start" DROP NOT NULL,
  ALTER COLUMN "end" DROP NOT NULL;

-- Existing searches were all created before the stale check existed; treat
-- them as freshly confirmed so the cron does not nag on day one.
UPDATE "PlayerSearch" SET "confirmedActiveAt" = "createdAt";

-- PlayerSearchInterest: carry the running time negotiation. Add nullable,
-- backfill from the parent search (every search today has a fixed window;
-- registering interest is the responder's move, so they are the proposer and
-- the creator is on the clock), then enforce NOT NULL.
ALTER TABLE "PlayerSearchInterest"
  ADD COLUMN "proposedStart" TIMESTAMP(3),
  ADD COLUMN "proposedEnd" TIMESTAMP(3),
  ADD COLUMN "proposedById" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "PlayerSearchInterest" AS i
SET "proposedStart" = s."start",
    "proposedEnd" = s."end",
    "proposedById" = i."responderId",
    "updatedAt" = i."createdAt"
FROM "PlayerSearch" AS s
WHERE i."searchId" = s."id";

ALTER TABLE "PlayerSearchInterest"
  ALTER COLUMN "proposedStart" SET NOT NULL,
  ALTER COLUMN "proposedEnd" SET NOT NULL,
  ALTER COLUMN "proposedById" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "PlayerSearchInterest" ADD CONSTRAINT "PlayerSearchInterest_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
