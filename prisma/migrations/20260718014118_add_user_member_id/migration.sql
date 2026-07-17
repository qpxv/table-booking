-- AlterTable
ALTER TABLE "user" ADD COLUMN     "memberId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_memberId_key" ON "user"("memberId");
