-- CreateTable
CREATE TABLE "PlayerSearchInterest" (
    "id" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "searchId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,

    CONSTRAINT "PlayerSearchInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerSearchInterest_searchId_idx" ON "PlayerSearchInterest"("searchId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSearchInterest_searchId_responderId_key" ON "PlayerSearchInterest"("searchId", "responderId");

-- AddForeignKey
ALTER TABLE "PlayerSearchInterest" ADD CONSTRAINT "PlayerSearchInterest_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "PlayerSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSearchInterest" ADD CONSTRAINT "PlayerSearchInterest_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
