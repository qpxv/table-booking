// One-off: stamp PlayerSearch.tableAvailable on every still-open search after
// the column was added. New/changed bookings keep it current from then on.
//
//   npx tsx scripts/backfill-player-search-availability.ts
//
// The availability check is inlined here (rather than imported from
// lib/queries/player-search-availability.ts) because that module is
// "server-only" and cannot be pulled into a plain node script.

import { prisma } from "../lib/prisma";

async function isWindowAutoBookable(start: Date, end: Date): Promise<boolean> {
  const freeTable = await prisma.table.findFirst({
    where: {
      active: true,
      allowMultipleBookings: false,
      autoBookingPriority: { not: null },
      bookings: { none: { start: { lt: end }, end: { gt: start } } },
    },
    select: { id: true },
  });
  return freeTable !== null;
}

async function main(): Promise<void> {
  const searches = await prisma.playerSearch.findMany({
    where: { end: { gte: new Date() } },
    select: { id: true, start: true, end: true, tableAvailable: true },
  });

  let updated = 0;
  for (const search of searches) {
    if (search.start === null || search.end === null) continue; // flexible: no window
    const tableAvailable = await isWindowAutoBookable(search.start, search.end);
    if (tableAvailable === search.tableAvailable) continue;
    await prisma.playerSearch.update({
      where: { id: search.id },
      data: { tableAvailable },
    });
    updated += 1;
    console.log(`${search.id}: tableAvailable -> ${tableAvailable}`);
  }

  console.log(`done, ${updated}/${searches.length} updated`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
