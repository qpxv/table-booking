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

## PWA / mobile touch behavior

- **No overscroll bounce.** `app/globals.css`'s `@layer base` sets
  `overscroll-behavior-y: none` on `html, body`. Installed PWAs
  (`display: "standalone"` in `app/manifest.ts`) have no browser chrome to
  reveal on overscroll, so without this, dragging past the top/bottom of a
  page rubber-banded into blank canvas instead of just stopping — looked
  broken since there was nothing behind it to slide into view.
- **Edge-swipe-to-open the mobile drawer**: `MobileNav.tsx`'s
  `EdgeSwipeToOpen` renders nothing, just attaches passive
  `touchstart`/`touchmove`/`touchend` listeners on `window` for as long as
  it's mounted (always, on every authenticated page via `AppShell` →
  `MobileNav`). A touch starting within 24px of the right screen edge
  (`EDGE_ZONE_PX`) that then drags left past 50px (`OPEN_THRESHOLD_PX`),
  more horizontally than vertically, opens the drawer. No `preventDefault`
  anywhere, so it never fights normal vertical scrolling. Matches the
  `Sidebar`'s existing `side="right"` slide-in direction. No gesture
  library added — hand-rolled touch events, consistent with the
  `selectLongPressDelay` tuning below. Swipe-to-close was deliberately
  left out (backdrop-tap/X/nav-link already close it).
- **Base UI auto-focuses the first focusable element in a popup on
  open.** Confirmed by reading
  `node_modules/@base-ui/react/utils/popups/popupStoreUtils.js`
  (`createDefaultInitialFocus`): unless the open was triggered through a
  real Base UI `Trigger` touch interaction (ours isn't — `Sheet` in
  `components/ui/sidebar.tsx` is state-driven off `openMobile`, for both
  the hamburger tap and the edge-swipe above), it focuses the first
  focusable descendant of the popup. That's the club-logo `<Link>` in
  `MobileNav.tsx`'s `SidebarHeader`, which — unlike every other
  interactive element in `sidebar.tsx` — had no focus-ring styling, so it
  showed the browser's bare native outline every time the drawer opened.
  Fixed with `outline-hidden` on that `Link` (no replacement ring — this
  one's reached by touch/gesture, not tabbed to, so an app-styled
  focus-visible ring wasn't wanted here, unlike the rest of the sidebar).

## Error handling / dialog UI

- **`app/error.tsx`** is the app's error boundary — catches unexpected
  exceptions anywhere under it with a branded page (club logo, heading,
  a single "Zurück zum Dashboard" button — no retry button, since a
  retry rarely helps and it kept things simpler) instead of Next's
  default one. It's not a route you navigate to; Next mounts it
  automatically when a Server/Client Component throws during render. In
  dev mode Next's own red overlay shows on top of it — dismiss the
  overlay (X) to see the boundary underneath, or build for production to
  see it exactly as a real user would.
- **`app/not-found.tsx`** is the same visual treatment (logo, heading,
  "Zurück zum Dashboard") but with actual 404 copy — this one *is*
  reachable directly, by visiting any unmatched route or via `notFound()`.
  Keep the two visually in sync if either's styling changes; they're
  meant to read as the same "something's not right" family, just with
  different headings/copy.
- **Tabbed dialogs that shouldn't jump size when switching tabs**
  (`SettingsDialog.tsx`'s "Persönliche Daten"/"Passwort ändern"): don't
  conditionally render one tab's content at a time — keep all tab
  panels mounted, stacked in the same CSS grid cell
  (`col-start-1 row-start-1` on each, `invisible` on the inactive ones).
  Grid sizing accounts for every item in a cell regardless of
  visibility, so the container's height is always driven by the
  tallest tab, and switching tabs never resizes the dialog. Cheaper and
  more robust than hardcoding a min-height, since it adapts automatically
  if a tab's content changes later.
- **`components/ui/button.tsx` uses `transition`, not `transition-all`.**
  `transition-all` compiles to `transition-property: all`, which includes
  `visibility` — and per the CSS Transitions spec, a `visibility`
  transition whose end value is `hidden` keeps the element rendered as
  visible for the *entire* transition duration, flipping to hidden only
  at 100%. That collided with the tabbed-dialog pattern above: switching
  tabs sets `invisible` on the inactive panel, which the submit `Button`
  inside it inherits, so with `transition-all` the old tab's button stayed
  visibly on screen for the full 150ms default duration after the rest of
  the form had already vanished. Tailwind's bare `transition` utility uses
  a curated property list (color, background-color, border-color,
  opacity, box-shadow, transform, etc.) that still covers every real
  button transition but excludes `visibility` — confirmed by compiling
  both utilities through the project's actual `@tailwindcss/postcss`
  pipeline. Don't reintroduce `transition-all` on `Button` without
  rereading this.

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
- **"Spiel" suggestions are admin-managed, but the field itself stays free
  text.** `Game` (Spielverwaltung, `/admin/spiele`) is a standalone model
  with **no relation to `Booking`** — `Booking.game` is still just a plain
  string, exactly as before. `GameCombobox` takes a `games` prop (from
  `actions/games.ts`'s `listGames()`) purely to drive its autocomplete
  suggestions; typing a one-off value that isn't in the managed list is
  still saved as-is. This means renaming/deleting a game in Spielverwaltung
  never touches historical bookings — deliberately simpler than the
  Guest/BookingGuest relation above, since there's no per-booking data (like
  price/visit count) that needs a real foreign key here. `actions/games.ts`
  mirrors `actions/tables.ts`'s plain CRUD pattern (own `requireAdmin()`,
  `ActionResult` returns) minus the `active`/`allowMultipleBookings` toggle
  logic — Spielverwaltung is just name + create/edit/delete, no switch
  column needed since deleting a `Game` is always non-destructive.
- **Hidden dev/test account**: set `DEV_ACCOUNT_EMAIL` in `.env` to hide
  that one admin account from Benutzerverwaltung (`lib/permissions.ts`'s
  `isHiddenAccount`) — a no-op if unset. `deleteUser` also refuses to
  delete it even via a direct call.
- **FullCalendar touch tuning**: `selectLongPressDelay` on the
  `<FullCalendar>` in `BookingCalendar.tsx` is intentionally 300 (not the
  1000ms default, not 0) — enough for a deliberate press-and-drag to
  register on mobile without hijacking normal page-scroll swipes. Don't
  "fix" this back to a round number without rereading why.
- **"Mehrfachbuchung" (shared/community) tables.** `Table.allowMultipleBookings`
  turns a table's booking slot from "one member owns it exclusively" into
  "one event, many members join it." Toggled inline in Tischverwaltung's
  table list, right next to the "Aktiv" switch (`columns.tsx` +
  `TableManager.tsx`'s `handleToggleMultiple`, calling
  `actions/tables.ts`'s `setTableAllowMultipleBookings` — a straight copy of
  `setTableActive`'s pattern) — it is deliberately **not** part of
  `TableFormDialog`'s create/edit form, same as `active` never was. A
  `Booking` on such a table is still a single row (start/end/game, one
  creator `userId`) — what changes is `BookingParticipant`, a join table
  (`bookingId`, `userId`, unique per pair) recording who's signed up. The
  creator is inserted as a participant too at creation time (`createBooking`
  in `actions/bookings.ts`), so participant counts are always just
  `participants.length` — no "+1 for the creator" special-casing anywhere.
  `joinBooking`/`leaveBooking` add/remove the caller's own row; leaving
  never deletes the booking itself (the creator cancels via the normal edit
  dialog's "Stornieren" instead). No change was needed to the overlap check
  in `createBooking`/`updateBooking` — joining adds a `BookingParticipant`
  to the *existing* booking, it never creates a second overlapping one, so
  one event per time range per table still holds.
  `listTablesWithUpcomingWeekCounts` (used by `/tische`'s cards) returns a
  `nextEvent: { start, end, participantCount } | null` for shared tables
  instead of the usual weekly booking count.
- **Shared tables never take guests or a Spiel.** Members-only signup, no
  per-event game — both v1 scope decisions, not just UI nicities.
  `BookingDialog` hides the entire Gäste combobox + Gastkosten section, and
  the Spiel field, whenever its `tableAllowsMultiple` prop is true. Enforced
  server-side too, not just by hiding the fields: in `actions/bookings.ts`,
  `createBooking` forces the guest list to `[]` and `game` to `null`, and
  `updateBooking` forces `data.guests` to `undefined` (same code path as a
  drag/resize reschedule, which also omits guests) and `game` to `null`,
  whenever `table.allowMultipleBookings`/`booking.table.allowMultipleBookings`
  is true — so neither can ever be set on a shared table's booking
  regardless of what a client sends. `listTablesWithUpcomingWeekCounts`'s
  `nextEvent` and the dashboard's per-booking Spiel line are both gated the
  same way (never shown for shared-table bookings, since the value is
  always null there now).
- **Dashboard shows joined events too, plus who else is coming.**
  `app/(app)/dashboard/page.tsx`'s upcoming-bookings query used to filter on
  `booking.userId === session.user.id` only, which missed shared-table
  events a member *joined* but didn't create (joining only adds a
  `BookingParticipant` row, it doesn't touch `Booking.userId`). Fixed with
  an `OR: [{ userId }, { participants: { some: { userId } } }]` clause. Each
  card also lists other signed-up members ("Mit: ...") for
  `allowMultipleBookings` bookings, filtering the current user out of
  `booking.participants` — normal (non-shared) bookings don't show this
  line at all.

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
- **Shared-table events: anyone can join/leave, only creator/admin can
  reschedule/cancel.** In `BookingCalendar.tsx`, clicking an event on a
  `allowMultipleBookings` table always opens `BookingJoinDialog` (any
  authenticated member — no `isOwn`/`isAdmin` gate, unlike normal tables),
  which offers Mitmachen/Verlassen (`joinBooking`/`leaveBooking`). A
  "Bearbeiten" button, shown only when `booking.userId === currentUserId ||
  isAdmin`, swaps to the normal `BookingDialog` edit mode for
  reschedule/cancel — `canEditBooking`'s existing owner-or-admin rule still
  gates that path, this is purely an extra join/leave layer in front of it.
  Drag/resize (`editable`) on the calendar itself is unchanged: still
  creator/admin only, regardless of `allowMultipleBookings` — moving the
  whole event's time is not something a joining member should be able to do.

## Test data

`npx tsx scripts/seed-test-data.ts` wipes all `Guest`/`BookingGuest` rows
and (re)generates 20 member accounts (password `00000000`,
`@example.com` emails) with a shared, deliberately-overlapping guest pool
and a spread of active bookings across the existing tables. Leaves real
users/tables/bookings alone. Safe to rerun.
