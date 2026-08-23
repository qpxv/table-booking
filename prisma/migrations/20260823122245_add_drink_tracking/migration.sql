-- CreateTable
CREATE TABLE "DrinkMonthlyBudget" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "initialCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrinkMonthlyBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrinkTally" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DrinkTally_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DrinkMonthlyBudget_year_month_key" ON "DrinkMonthlyBudget"("year", "month");

-- CreateIndex
CREATE INDEX "DrinkTally_year_month_idx" ON "DrinkTally"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "DrinkTally_userId_year_month_key" ON "DrinkTally"("userId", "year", "month");

-- AddForeignKey
ALTER TABLE "DrinkTally" ADD CONSTRAINT "DrinkTally_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
