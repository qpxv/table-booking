-- CreateTable
CREATE TABLE "DiscordPendingAction" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscordPendingAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscordPendingAction_createdAt_idx" ON "DiscordPendingAction"("createdAt");
