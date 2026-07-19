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
- **Every booking tracks participants — not just Mehrfachbuchung tables.**
  `BookingParticipant` (`bookingId`, `userId`, unique per pair) started as a
  Mehrfachbuchung-only concept but is now universal: `createBooking` always
  inserts the creator as a participant (no more
  `if (table.allowMultipleBookings)` gate on that insert), so participant
  counts/join-leave work the same everywhere and never need "+1 for the
  creator" special-casing. `joinBooking`/`leaveBooking` work on any active
  booking now (the old `!table.allowMultipleBookings` rejection in
  `joinBooking` is gone) — **except the creator can never leave their own
  event**: `leaveBooking` rejects with a dedicated message when
  `booking.userId === session.user.id`, and `BookingJoinDialog` hides the
  Mitmachen/Verlassen button entirely for the creator (only Bearbeiten +
  Schließen).
- **"Mehrfachbuchung" (shared/community) tables** now specifically mean
  "this table allows multiple *concurrent* bookings" — `Table.allowMultipleBookings`,
  toggled inline in Tischverwaltung's table list next to "Aktiv"
  (`columns.tsx` + `TableManager.tsx`'s `handleToggleMultiple`, calling
  `actions/tables.ts`'s `setTableAllowMultipleBookings`, a copy of
  `setTableActive`'s pattern) — deliberately not part of `TableFormDialog`'s
  form, same as `active` never was. The overlap check in
  `createBooking`/`updateBooking` (`prisma.booking.findFirst` for a
  conflicting active booking) is now wrapped in
  `if (!table.allowMultipleBookings)` — shared tables skip it entirely, so
  several different events/creators/groups can book the same table at
  overlapping times. `selectOverlap` on the `<FullCalendar>` in
  `BookingCalendar.tsx` mirrors this (`tableAllowsMultiple` instead of a
  hardcoded `false`) so a member can even drag-select a new range over an
  existing event on a shared table. `listTablesWithUpcomingWeekCounts`
  (used by `/tische`'s cards) still returns a single
  `nextEvent: { start, end, participantCount } | null` (the soonest
  upcoming one) for shared tables instead of the usual weekly booking count
  — it doesn't attempt to summarize multiple concurrent events, out of
  scope for now.
- **Creating/editing any booking can pre-add members, not just guests.**
  `BookingDialog` has a "Mitglieder" field (`MemberMultiCombobox`, new
  component — same non-Popover dropdown pattern as `GuestMultiCombobox`,
  minus the "create new" branch since members are a fixed roster, not
  creatable ad hoc) shown unconditionally on every table, alongside the
  Gäste picker (normal tables only). Submits `participantUserIds` to
  `createBooking`/`updateBooking`, which validate each id exists then
  create/reconcile `BookingParticipant` rows exactly like guests already
  are reconciled (upsert the kept set — the creator is always force-kept
  regardless of what was submitted — then `deleteMany` whatever's left out).
  Omitted entirely on a drag/resize reschedule, same as guests, so a plain
  move never touches participants. `knownMembers` comes from
  `actions/users.ts`'s new `listMembers()` — deliberately **not**
  `listUsers()`, which is admin-gated and goes through the better-auth admin
  API; this picker is used by every member, so it needed a plain
  session-agnostic Prisma loader instead.
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
- **Dashboard shows joined events too, plus who else is coming — on every
  table now, not just shared ones.** `app/(app)/dashboard/page.tsx`'s
  upcoming-bookings query filters on
  `OR: [{ userId }, { participants: { some: { userId } } }]`, since a
  booking a member only joined (or was added to) never touches
  `Booking.userId`. Every card lists other participants ("Mit: ...",
  filtering the current user out of `booking.participants`) — this used to
  be gated to `allowMultipleBookings` bookings only, but since every booking
  tracks participants now, the gate was removed; it just naturally shows
  nothing when there's nobody else. The Spiel line's
  `!booking.table.allowMultipleBookings` gate is unrelated and unchanged —
  shared tables still never have a Spiel.
- **Gasthistorie (`/gasthistorie`) is a live query, not a log table.** It
  reads directly off existing `BookingGuest` rows (which already are the
  historical record — `price` frozen at creation) joined with `guest`,
  `booking.table`, and `booking.user`, so editing a booking's guests at any
  time is reflected immediately, nothing is cached/duplicated.
  `actions/guestHistory.ts`'s `listGuestHistory()` scopes by role: admins
  get every `BookingGuest` (`status: ACTIVE`), everyone else only rows
  where `booking.userId === session.user.id` (guests *they* brought) — same
  scoping precedent as `listGuestsGroupedByBringer`. `BookingGuest.paid`
  (new column) is the payment checkbox; `setBookingGuestPaid` permission =
  admin OR the booking's creator (loads `booking.userId` first to check,
  same owner-or-admin shape as `canEditBooking`). "Erster Besuch" vs a euro
  amount in the Preis column is just `price === 0` — `calculateGuestPrice`
  already guarantees a first visit prices at exactly 0.
- **SEPA payment QR codes are a real EPC069-12 payload, not a "link".**
  Looked this up properly before building it: an EPC/GiroCode QR is a fixed
  11-line text payload (service tag, version, charset, IBAN, beneficiary
  name, amount, reference, etc. — see `lib/sepaQr.ts`'s `buildEpcPayload`
  for the exact field order/codes, verified against the EPC's own spec
  cross-referenced across multiple independent sources) rendered as a QR
  *image* for a banking app's camera to scan — there's no SEPA equivalent
  of a clickable payment URL. `qrcode`'s `toDataURL()` renders it
  server-side in `actions/guestHistory.ts`'s `getGuestPaymentReference`.
  Lazy: only generated when `PaymentDialog` actually opens, never for every
  row up front.
- **The raw IBAN *does* cross the wire for "Bezahlungsdetails kopieren"
  — deliberately, this is a reversal from the QR path above.**
  `getGuestPaymentReference` also returns a `paymentDetailsText` block
  (IBAN/Empfänger/Betrag/Verwendungszweck, IBAN line cleanly omitted when
  there isn't one) so a member who'd rather send a manual transfer request
  over WhatsApp than deal with a QR code can just copy/paste it — the whole
  point of the button is letting the viewer read the IBAN. No new exposure
  beyond what the page already grants: the caller is always either the
  bringing member themselves or an admin already trusted with everyone's
  payment data here. `PaymentDialog`'s preview is a literal `<pre>` of
  `paymentDetailsText` — never a summary — so what's shown is guaranteed to
  match what "Bezahlungsdetails kopieren" actually copies.
- **Bank-app QR-scanning help accordion, logos downloaded locally, not
  hotlinked.** Below the QR in `PaymentDialog.tsx`, a collapsed-by-default
  `Accordion` ("Wie kann ich einen QR-Code scannen?") lists buttons for
  Sparkasse, Postbank, Commerzbank, ING, Deutsche Bank, DKB, N26, and
  Volksbank/VR-Banking, each linking to that bank's own real help page on
  scanning a GiroCode/EPC QR (verified to actually resolve, not guessed —
  official pages where the bank has a clear one, `girocodegenerator.com`'s
  consistent per-bank guides as fallback otherwise). Revolut was
  deliberately left out — couldn't confirm its app supports scanning a
  standard GiroCode the way German bank apps do. Logos live as **rasterized
  PNGs** in `public/bank-logos/*.png` (sourced from Wikimedia Commons SVGs,
  plus one clean vector-logo site for Postbank's current mark — this app has
  no other precedent for embedding third-party assets, everything else like
  the club logo is local), rendered via a plain `<img>` (`eslint-disable`d
  for `@next/next/no-img-element`, same as the QR image in this file), sized
  with a fixed `h-6 w-11 object-contain` box.
  - **Icon-only, not the wordmark.** Several of these banks' most findable
    official assets are the full wordmark (bank name spelled out) rather
    than a standalone icon. Where the wordmark and icon were genuinely
    separate paths/groups in the same source SVG (Commerzbank's "ribbon",
    Postbank's blue/red "swoosh" — colors corrected to the club's specified
    `#0A3274`/`#DA0013`, DKB's tagline vs. the DKB mark), the icon was
    extracted by hand: identify the paths belonging to just the icon by
    their distinct coordinate range, keep only those (and their gradient
    `<defs>` if any), drop the text paths, crop the `viewBox` to that
    region's bounding box. Deutsche Bank already has a standalone "logo
    without wordmark" file on Commons, no extraction needed. ING and N26 were
    left as their official wordmark — their brand genuinely *is* the short
    wordmark, no separate icon exists.
  - **Why PNG and not SVG.** Tried SVG first (sized via `next/image`, then
    via a plain `<img>` with `h-6 w-auto`) — both looked right in a
    headless-Chromium screenshot of a static-HTML mimic, but the *real* app
    kept rendering ING/DKB/N26 much bigger than the other five. Reproduced it
    directly (not just trusting the mimic): bordering each `<img>` showed the
    CSS box itself was sized correctly, but `object-fit: contain` wasn't
    scaling those three SVGs' *content* down to fit it, while it worked fine
    for the other five. Checked several hypotheses for what made those three
    different (ING's intrinsic width/height are in `mm`; N26 has no
    width/height at all, only `viewBox`; DKB's original file had a DOCTYPE)
    — none is a single common thread across all three, so this reads as a
    genuine, not-fully-diagnosed SVG-intrinsic-size/`object-fit` edge case
    rather than one fixable misconfiguration. Rasterizing sidesteps it
    entirely: a bitmap's natural size is unambiguous, so `object-fit` behaves
    identically for all eight. Rasterized via Puppeteer driving the sandbox's
    existing `/usr/bin/chromium` (`executablePath`, since Puppeteer's own
    Chromium download needs a postinstall script this sandbox blocks by
    default) — not ImageMagick's `convert`, whose built-in SVG delegate
    doesn't support the `xlink:href`-linked radial gradients in the
    Commerzbank icon and silently rendered it flat grayscale.
  - No visible bank-name text next to the logo was tried once (`sr-only`,
    for a brief window) but reverted — with clean icon-only marks in place,
    a visible label reads fine and isn't the "duplicate wordmark" problem
    that prompted removing it originally.
  - Verified all of this visually rather than guessing — this sandbox has
    `chromium --headless --screenshot`, which produces a real screenshot
    Claude can read as an image, so "does this actually look right" doesn't
    have to stay a guess for long, even without a live browser.
- **IBAN lives in a dedicated "Zahlungsdetails" settings tab, self-service
  only.** `User.iban` is registered as a `better-auth` `additionalFields`
  entry in `lib/auth.ts` (`input: true`, same mechanism `memberId` already
  used admin-side) and set via `authClient.updateUser({ iban })` from
  `SettingsDialog.tsx`'s `PaymentForm` — needed adding
  `inferAdditionalFields<typeof auth>()` to `lib/auth-client.ts`'s plugins
  for the client call to type-check at all (confirmed by reading
  `better-auth`'s own source, not assumed: `input: true` additionalFields
  *are* accepted through the self-service `update-user` endpoint, filtered
  via `parseUserInput`). Validated with a real ISO 13616 MOD-97 checksum in
  `lib/iban.ts`, not just a shape regex — this feeds real bank transfers.
  Admins never see or edit another member's IBAN anywhere.
- **Admins can always open the payment dialog, even with no IBAN on file.**
  `Zahlung` in Gasthistorie's Aktionen column is normally disabled unless
  `row.hasIban`, but `!isAdmin && !row.hasIban` is the actual gate — an
  admin can always open it (e.g. to help a member who's having trouble),
  and `PaymentDialog` shows an explicit "kein SEPA-QR-Code verfügbar" note
  in place of the QR when the bringing member genuinely has no IBAN, rather
  than silently showing nothing.

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
- **Every event: anyone can join/leave, only creator/admin can
  reschedule/cancel.** In `BookingCalendar.tsx`, clicking *any* event, on
  *any* table, always opens `BookingJoinDialog` now (this used to be
  Mehrfachbuchung-only, with normal tables instead either opening the edit
  dialog directly for the owner/admin or doing nothing for anyone else — that
  branching is gone; `handleEventClick` unconditionally sets
  `{ mode: "join", booking }`). The dialog shows Mitglieder badges, then
  Gäste badges underneath (only rendered when non-empty — naturally empty
  for shared tables). A "Bearbeiten" button, shown only when
  `booking.userId === currentUserId || isAdmin`, swaps to the normal
  `BookingDialog` edit mode for reschedule/cancel — `canEditBooking`'s
  existing owner-or-admin rule still gates that path, this is purely an
  extra join/leave layer in front of it. Drag/resize (`editable`) on the
  calendar itself is unchanged: still creator/admin only — moving the whole
  event's time is not something a joining member should be able to do.

## Test data

`npx tsx scripts/seed-test-data.ts` wipes all `Guest`/`BookingGuest` rows
and (re)generates 20 member accounts (password `00000000`,
`@example.com` emails) with a shared, deliberately-overlapping guest pool
and a spread of active bookings across the existing tables. Leaves real
users/tables/bookings alone. Safe to rerun.
