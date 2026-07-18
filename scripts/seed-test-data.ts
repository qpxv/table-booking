// One-off/reusable seed script for populating the live DB with realistic
// test data. Run with: npx tsx scripts/seed-test-data.ts
//
// Deletes ALL Guest/BookingGuest rows, then creates 20 member accounts
// (password "00000000" for all, via the real auth system so hashing/
// account rows are correct), a shared pool of guests deliberately reused
// across members, and a spread of active bookings across the existing
// tables. Existing users/tables/bookings are left untouched.

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { calculateGuestPrice } from "../lib/pricing";
import { BookingStatus } from "../generated/prisma/enums";

const FIRST_NAMES = [
  "Anna", "Tobias", "Laura", "Felix", "Julia", "Max", "Lena", "Jonas",
  "Sophie", "Niklas", "Hannah", "Simon", "Lisa", "Fabian", "Marie", "Tim",
  "Sarah", "David", "Nina", "Paul", "Vanessa", "Lukas", "Katharina", "Jan",
];

const LAST_NAMES = [
  "Schmidt", "Müller", "Vogel", "Hartmann", "Wagner", "Becker", "Hoffmann",
  "Richter", "Klein", "Wolf", "Neumann", "Schwarz", "Zimmermann", "Krüger",
  "Lange", "Schröder", "Fischer", "Weber", "Meyer", "Bauer",
];

const GUEST_NAMES = [
  "Peter", "Sabine", "Michael", "Claudia", "Andreas", "Petra", "Stefan",
  "Monika", "Thomas", "Birgit", "Frank", "Ingrid", "Werner", "Ursula",
  "Klaus", "Renate", "Dieter", "Elke", "Uwe", "Karin", "Jürgen", "Heike",
  "Rainer", "Gisela", "Manfred", "Christa", "Helmut", "Brigitte", "Horst",
  "Marion", "Günther", "Erika", "Wolfgang", "Rosa", "Hans", "Edith",
  "Bernd", "Traudel", "Karl-Heinz", "Waltraud",
];

const GAMES = ["Skat", "Doppelkopf", "Schafkopf", "Poker", "Billard", "Darts", "Sonstiges"];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Email local-parts need plain ASCII — transliterate German umlauts/ß
// rather than dropping them, so "Müller" becomes "mueller", not "mller".
function toEmailSlug(value: string): string {
  return value
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .toLowerCase();
}

async function main() {
  console.log("Deleting existing BookingGuest + Guest rows...");
  const deletedBookingGuests = await prisma.bookingGuest.deleteMany({});
  const deletedGuests = await prisma.guest.deleteMany({});
  console.log(
    `  removed ${deletedBookingGuests.count} BookingGuest, ${deletedGuests.count} Guest rows`,
  );

  console.log("Creating 20 members...");
  const members: { id: string; name: string }[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < 20; i++) {
    let first: string, last: string, fullName: string;
    do {
      first = pick(FIRST_NAMES);
      last = pick(LAST_NAMES);
      fullName = `${first} ${last}`;
    } while (usedNames.has(fullName));
    usedNames.add(fullName);

    const memberId = `T${String(i + 1).padStart(2, "0")}`;
    const email = `${toEmailSlug(first)}.${toEmailSlug(last)}@example.com`;

    const result = await auth.api.createUser({
      body: {
        name: fullName,
        email,
        password: "00000000",
        data: { memberId },
      },
    });
    members.push({ id: result.user.id, name: fullName });
    console.log(`  ${fullName} <${email}> (memberId ${memberId})`);
  }

  console.log("Creating shared guest pool...");
  const guestPool = shuffle(GUEST_NAMES);
  const guestsByName = new Map<string, { id: string; name: string }>();
  for (const name of guestPool) {
    const owner = pick(members);
    const guest = await prisma.guest.create({ data: { name, userId: owner.id } });
    guestsByName.set(name, { id: guest.id, name });
  }

  // Deliberately overlapping picks across members — the same guest name
  // can and should be picked by more than one member, so the club-wide
  // dedup/visit-count fix from last turn actually gets exercised.
  const guestNamesByMember = new Map<string, string[]>();
  for (const member of members) {
    const count = 5 + Math.floor(Math.random() * 6); // 5-10
    guestNamesByMember.set(member.id, shuffle(guestPool).slice(0, count));
  }

  console.log("Creating bookings...");
  const tables = await prisma.table.findMany({ where: { active: true } });
  const bookedRangesByTable = new Map<string, { start: Date; end: Date }[]>();
  for (const table of tables) bookedRangesByTable.set(table.id, []);

  function overlaps(tableId: string, start: Date, end: Date): boolean {
    return bookedRangesByTable.get(tableId)!.some((b) => start < b.end && end > b.start);
  }

  const guestVisitCounts = new Map<string, number>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const TOTAL_DAYS = 21;

  let bookingsCreated = 0;
  for (const member of members) {
    const numBookings = 2 + Math.floor(Math.random() * 3); // 2-4 per member
    for (let b = 0; b < numBookings; b++) {
      let placed = false;
      for (let attempt = 0; attempt < 30 && !placed; attempt++) {
        const table = pick(tables);
        const dayOffset = Math.floor(Math.random() * TOTAL_DAYS);
        const hour = 8 + Math.floor(Math.random() * 13); // 08:00-20:xx start
        const minute = pick([0, 30]);
        const start = new Date(today);
        start.setDate(start.getDate() + dayOffset);
        start.setHours(hour, minute, 0, 0);
        const durationHours = 1 + Math.floor(Math.random() * 3); // 1-3h
        const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

        if (overlaps(table.id, start, end)) continue;

        const game = Math.random() < 0.8 ? pick(GAMES) : null;

        const booking = await prisma.booking.create({
          data: {
            tableId: table.id,
            userId: member.id,
            start,
            end,
            game,
            status: BookingStatus.ACTIVE,
          },
        });
        bookedRangesByTable.get(table.id)!.push({ start, end });

        const memberGuestNames = guestNamesByMember.get(member.id)!;
        const guestCount = Math.floor(Math.random() * 5); // 0-4
        const chosenGuestNames = shuffle(memberGuestNames).slice(0, guestCount);
        for (const guestName of chosenGuestNames) {
          const guest = guestsByName.get(guestName)!;
          const previousVisitCount = guestVisitCounts.get(guest.id) ?? 0;
          const price = calculateGuestPrice(previousVisitCount);
          await prisma.bookingGuest.create({
            data: { bookingId: booking.id, guestId: guest.id, price },
          });
          guestVisitCounts.set(guest.id, previousVisitCount + 1);
        }

        bookingsCreated++;
        placed = true;
      }
    }
  }

  console.log(
    `Done. ${members.length} members, ${guestPool.length} guests, ${bookingsCreated} bookings.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
