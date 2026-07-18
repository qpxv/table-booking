<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# App-specific conventions

This app is **Dice-Bock e.V.**, a table-booking app for a small German
board/dice-game club. Branding: ink black (`#18140f`) + "Bock-Rot"
(`#8b2331`), Fraunces for headings (`--font-heading`), Work Sans for
body/UI text. Logo assets live in `public/club-logo-*.png` (light/dark
variants — the dark one is knocked out to cream since the mark is
mostly black and would vanish on the ink header bar).

## Server actions always return `ActionResult`

Every action in `actions/*.ts` returns
`{ success: boolean; message: string }` (`types/action-result.ts`) —
never `throw` for expected/validation failures (not found, unauthorized,
invalid input), only for genuinely unexpected errors, which get caught,
logged with `console.error("error in <fnName>", err)`, and turned into a
generic `"Ein Fehler ist aufgetreten."` (never leak `err.message` to the
client). Callers `toast.success(result.message)` /
`toast.error(result.message)` directly — the message *is* the UI copy.
Exception: plain data-loader functions (`listUsers`, `listGuests`, etc.)
still throw normally since they aren't wrapped in this pattern.

## UI conventions established this session

- **Dialogs**: only rendered by the parent while open (no internal
  `open` prop), take an `onClose: () => void`. Every submit button shows
  `components/ui/spinner.tsx`'s `<Spinner />` in place of its icon while
  `pending` (via `useTransition`).
- **Destructive confirmations** go through
  `components/shared/ConfirmDeleteDialog.tsx` (`mode: "table" | "user" | "booking"`)
  — never `window.confirm()`.
- **Combobox-style type-to-search inputs** (`GameCombobox`,
  `GuestMultiCombobox`) deliberately do *not* use
  `Popover`/`PopoverTrigger`. Base UI's `PopoverTrigger` ties "being the
  trigger" to "being exempt from outside-press dismissal" — an input that
  needs to open on focus/typing rather than a single click fights that
  and flickers open/closed. They're plain `relative` + absolutely
  positioned dropdowns instead, dismissed via a manual
  `pointerdown`-outside-the-container check.
- Icons (lucide-react) on every actions-menu item and dialog submit/cancel
  button (Pencil/Trash2/KeyRound/Save/X/etc.) — keep new ones consistent.
- Mobile: use `min-h-dvh`, not `min-h-screen` (the latter causes phantom
  scroll on mobile Safari, since `100vh` includes the area behind the
  collapsible address bar).
- **Mobile nav** (`components/layout/MobileNav.tsx`) uses shadcn's
  `Sidebar` in mobile-only capacity — desktop keeps `AppShell.tsx`'s
  original inline-nav-+-`UserMenu` header untouched. `Sidebar` has no
  "become a horizontal top bar" mode, so this isn't a unification, just
  the existing header's mobile hamburger replaced with a proper drawer
  (nav links + account actions). It works as mobile-only for free:
  `SidebarProvider`'s `open` (desktop) and `openMobile` (mobile) are
  independent, and the only trigger rendered is `md:hidden`, so `open`
  is never touched and stays at its (explicitly set) `defaultOpen={false}`
  — no CSS overrides on the vendored component needed. **Gotcha**: don't
  put dialog-open state (e.g. `SettingsDialog`'s) inside a component
  that lives inside the `Sidebar`'s own Sheet subtree — closing the
  drawer unmounts that subtree, so if the same click both closes the
  drawer and opens a dialog, the dialog's state has to live in the
  parent that persists (`MobileNav` itself), not in the footer component
  that's about to be unmounted.

## Data model notes

- **Guests are club-wide, not per-member.** `Guest` rows have a `userId`
  (whoever happened to create them) but that's not an ownership boundary
  — `actions/guests.ts`'s `listGuests()` returns *all* guests, and
  `createBooking`/`updateBooking` in `actions/bookings.ts` look up an
  existing guest by name (case-insensitive) club-wide before creating a
  new row. This matters because the club is one social circle — the same
  real person is often brought by different members, and treating guests
  as per-member previously caused duplicate records with fragmented
  visit-count/pricing history. `listGuestsGroupedByBringer()` derives
  "who brought this guest" from actual `BookingGuest`→`Booking.userId`
  history, not `Guest.userId`.
- **Hidden dev/test account**: set `DEV_ACCOUNT_EMAIL` in `.env` to hide
  that one admin account from Benutzerverwaltung (`lib/permissions.ts`'s
  `isHiddenAccount`) — a no-op if unset. `deleteUser` also refuses to
  delete it even via a direct call.
- **FullCalendar touch tuning**: `selectLongPressDelay` on the
  `<FullCalendar>` in `BookingCalendar.tsx` is intentionally 300 (not the
  1000ms default, not 0) — enough for a deliberate press-and-drag to
  register on mobile without hijacking normal page-scroll swipes. Don't
  "fix" this back to a round number without rereading why.

## Permissions

- **Admins can edit/cancel any booking, not just their own.**
  `lib/permissions.ts`'s `canEditBooking` already allowed this
  server-side; the fix was purely in `BookingCalendar.tsx`, which now
  takes an `isAdmin` prop and uses `isOwn || isAdmin` for both the
  `editable` (drag/resize) flag and the event-click-to-open-dialog gate.
  Once the dialog can open at all for an admin, `updateBooking`/
  `cancelBooking` already do the right permission check — no other
  changes needed.
- **Deleting a guest is club-wide, on purpose.** Since guests aren't
  per-member (see above), `actions/guests.ts`'s `deleteGuest(guestId)`
  removes the shared `Guest` row entirely — the small "x" on a guest
  badge in Benutzerverwaltung's "Gäste" column doesn't just detach that
  guest from the row it was clicked on, it deletes them for every member
  who has them. Deletes `BookingGuest` rows for that guest first (the FK
  is `RESTRICT`), then the `Guest` row, in a transaction. Confirmed via
  `ConfirmDeleteDialog`'s `"guest"` mode, whose description explicitly
  says so, since this is a broader blast radius than a normal delete.

## Test data

`npx tsx scripts/seed-test-data.ts` wipes all `Guest`/`BookingGuest` rows
and (re)generates 20 member accounts (password `00000000`,
`@example.com` emails) with a shared, deliberately-overlapping guest pool
and a spread of active bookings across the existing tables. Leaves real
users/tables/bookings alone. Safe to rerun.
