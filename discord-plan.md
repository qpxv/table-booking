# Discord Bot Plan (Tischbuchung + Spielersuche)

Status: brainstorm / not started. This is a design doc, not final.
No implementation yet: waiting on remaining open questions.

## Locked decisions

- HTTP Interactions endpoint (not a gateway bot).
- **German command names, English code** (handlers, functions, types). Slash
  commands are user-facing UI and the whole app is German.
- Commands: `/buchen`, `/tische <datum>`, `/buchungen`, `/absagen`,
  `/verbinden`, `/trennen`, `/spielersuche open|close|accept|decline`,
  `/event create|delete|join|leave`, `/getraenk add|remove`.
- Channel announcements: **yes**, and web-created events announce too (shared
  `announce()` helper called next to `notify()` in the services).
- Default booking duration: **3 hours** (`DEFAULT_BOOKING_DURATION_HOURS = 3`),
  overridable via an optional `dauer:` option on `/buchen`.
- All bot replies are **ephemeral** (visible only to the invoking user, not in
  channel history).
- New dependency `discord-interactions` approved.
- Spielersuche interest / time negotiation stays web-only in v1.

## Discord command options (how params work)

Discord has no `--flags`. Each parameter is a **named, typed option** rendered
as a form field: `/buchen datum:05.09. uhrzeit:18:00 spiel:40k`. Option types
we use: `string`, `integer`, `boolean`, `user` (native user picker). Options
can be required (listed first) or optional, can have fixed `choices` (dropdown)
or `autocomplete` (fed from our `Game` list), and can be grouped under
subcommands (`/spielersuche open`).


---

## 1. Goal

A Discord bot living **in this repo** that lets members of the club's Discord
server run slash commands to:

- book a table (`/buchen`) including adding other members, guests, and a game
- see table availability for a day
- see their own upcoming bookings
- cancel one or more of their bookings
- open / close a Spielersuche and accept / decline interest on their own searches
- link their Discord account to their app account (`/verbinden`)

The bot is a **thin adapter**. All booking / Spielersuche rules stay in the
existing `service/*` layer. The bot parses the interaction, resolves which app
`User` the Discord user is, calls the same service function the web UI calls,
and formats the result as a Discord message.

---

## 2. How Discord bots actually work (the relevant parts)

### Two runtime models

| Model | What it is | Fit here |
| --- | --- | --- |
| **Gateway bot** (discord.js) | long-running process holding a WebSocket to Discord | ❌ needs an always-on server, extra hosting, against the project's "no always-on connections" rule |
| **HTTP Interactions endpoint** | Discord POSTs each interaction to one HTTPS URL; you verify a signature and reply with JSON | ✅ one API route in this Next.js app, serverless, zero idle cost |

**Decision: HTTP Interactions endpoint.** One route: `app/api/discord/interactions/route.ts`.

Consequence: the bot can only do **slash commands** and **component
interactions** (buttons / selects / modals). It cannot passively read channel
messages. That is exactly the surface we need.

### Request handling requirements

1. **Signature verification.** Every request carries `X-Signature-Ed25519` and
   `X-Signature-Timestamp` headers. Verify against `DISCORD_PUBLIC_KEY` using
   the raw request body (`await req.text()` in the route handler, before any
   JSON parse). Reject with 401 on failure.
2. **PING.** Discord sends `type: 1` (PING) to validate the endpoint; reply
   `{ type: 1 }` (PONG).
3. **3-second rule.** The first response must be sent within 3s. For anything
   that does DB writes (transactions, advisory locks, push), reply immediately
   with a **deferred** response (`type: 5` for commands, `type: 6` for
   component callbacks), then do the real work and `PATCH` the message via
   `PATCH /webhooks/{APP_ID}/{token}/messages/@original`. Use Next.js
   `after()` so the deferred ACK flushes first and the work runs after the
   response (supported on Vercel Fluid Compute).
   Fast read-only commands (`/tische`, `/buchungen`) can answer directly.
4. **Ephemeral messages** use `flags: 64` so only the invoking user sees them.

### Component constraints that shape the UX

- **Slash command options** are typed at invocation time: `string`, `integer`,
  `boolean`, and importantly `user` (a real Discord user picker, one per
  option). Subcommands are supported (`/spielersuche open`, `/spielersuche
  close`).
- **Modals contain text inputs only.** No user picker, no select menu inside a
  modal (Discord limitation). So "pop a dialog where they pick members" is
  **not** a modal.
- **Messages** can carry `button`, `string select`, and **`user select`
  (type 5)** components. This is where the rich pickers live.

**Design pivot from the initial idea:** instead of a modal, `/buchen` responds
with an **ephemeral message** containing the pickers (member user-select, game
string-select, table select, confirm button). Same effect, native components,
no modal limitation. Free-text guests come in as a command option string.

---

## 3. How it fits this codebase

```
app/api/discord/interactions/route.ts   # verify signature, route by interaction type + name
lib/discord/
  verify.ts            # Ed25519 signature check (discord-interactions verifyKey)
  rest.ts              # fetch wrapper for Discord REST (bot token), followup PATCH/POST
  responses.ts         # helpers to build interaction responses (message, deferred, ephemeral, error)
  commands.ts          # command definitions (the JSON registered with Discord)
  parse-datetime.ts    # "05.09. 18:00" / "2026-09-05 18:00" -> Berlin -> UTC Date
  handlers/
    buchen.ts
    tische.ts
    buchungen.ts
    absagen.ts
    spielersuche.ts
    verbinden.ts
lib/discord-types.ts    # shared TS types (interaction payload shapes we use, Actor)
service/booking-service/booking.ts        # REUSED (see actor refactor, section 6)
service/player-search-service/player-search.ts  # REUSED (actor refactor)
lib/queries/*                             # REUSED for reads
scripts/register-discord-commands.ts      # one-off tsx script: PUT command list to Discord
```

Reads still flow through `lib/queries/*`. Writes still flow through
`service/*`. The Discord route is just another caller.

### New dependency

- **`discord-interactions`** (tiny, official): provides `verifyKey` and the
  interaction type / response type enums. Everything else (REST calls, command
  registration) is plain `fetch`, no `discord.js`, no `@discordjs/rest`.

### Env vars (all secrets, `.env` + Vercel)

```
DISCORD_APP_ID
DISCORD_PUBLIC_KEY
DISCORD_BOT_TOKEN
DISCORD_GUILD_ID        # the club server; used for guild-scoped command registration + request allow-check
DISCORD_ANNOUNCE_CHANNEL_ID   # optional, phase 7
```

Add the missing ones to `.env.example`.

---

## 4. Identity linking

A Discord user id means nothing to the app. Need a stored mapping.

### Schema change

```prisma
model User {
  // ...
  discordUserId   String? @unique   // Discord snowflake
  discordUsername String?            // cached handle for display in menus, non-authoritative
}
```

One migration.

### `/verbinden` flow

1. Member runs `/verbinden` in Discord.
2. Bot creates a short-lived, single-use token. Reuse the existing
   `Verification` table (`identifier = "discord-link"`, `value = <token>:<discordUserId>:<discordUsername>`, `expiresAt = now + 10 min`) so no
   extra model is needed.
3. Bot replies **ephemerally** with a link:
   `https://<app>/einstellungen/discord/verbinden?token=<token>`
4. That page (authenticated, so we know the logged-in `User`) shows a confirm
   button. Confirm calls a new server action `linkDiscordAccount(token)` which:
   - validates + consumes the token
   - checks no other `User` already has that `discordUserId`
   - sets `discordUserId` / `discordUsername` on the session user
   - deletes the verification row
5. `/trennen` in Discord (or an "Verbindung trennen" button in settings) clears
   the fields.

### Settings UI

New "Discord" section in Einstellungen: shows linked handle + unlink button, or
a short "So verbindest du Discord" hint.

### Resolving the actor on every command

`getMemberForInteraction(interaction)`:

- pull the Discord user id (`interaction.member.user.id` in a guild)
- `prisma.user.findUnique({ where: { discordUserId } })`
- not found -> ephemeral reply: "Dein Discord-Account ist noch nicht verbunden.
  Nutze `/verbinden`." and stop.

Members added to a booking via the user-select must **also** be linked; unlinked
picks are reported back ("nicht verbunden, übersprungen: @x").

---

## 5. Command set (naming open for discussion)

Initial names were flagged as unintuitive. Proposal:

| Purpose | Initial | Proposed | Notes |
| --- | --- | --- | --- |
| Book a table | `/buchen` | `/buchen` | keep |
| Table availability for a day | `/frei` | `/tische <datum>` | "which tables are free/booked that day" |
| My upcoming bookings | `/meine` | `/buchungen` | list only, no args |
| Cancel bookings | `/absagen` | `/absagen` | keep; opens a multi-select of your bookings |
| Link account | `/verbinden` | `/verbinden` | keep |
| Unlink account | - | `/trennen` | |
| Spielersuche | `/spielersuche open\|close\|accept\|decline` | `/spielersuche <sub>` | Discord subcommands |

(Bikeshed candidates: `/tische` vs `/verfuegbarkeit` vs `/frei`; `/buchungen`
vs `/meinebuchungen`. Decide before registering.)

### `/buchen`

Options (typed at invocation):

- `datum` (string, required) e.g. `05.09.` or `2026-09-05`
- `uhrzeit` (string, required) e.g. `18:00`
- `dauer` (string, optional) e.g. `4h` / `2:30`; default
  `DEFAULT_BOOKING_DURATION_HOURS = 3` (new constant, no default exists today
  since the web form uses explicit start+end)
- `spiel` (string, optional, autocomplete from `Game` list)
- `gaeste` (string, optional) comma-separated guest names

Flow:

1. Parse `datum`+`uhrzeit`+`dauer` -> `start`/`end` (Berlin -> UTC). On parse
   failure, ephemeral error with the accepted formats.
2. Reply **ephemerally** with a message containing:
   - **user select** "Mitglieder hinzufügen" (optional, multi)
   - **string select** "Tisch" listing tables **free for that window**
     (computed like `isWindowAutoBookable` but returning the list), plus the
     shared/Mehrfachbuchung tables
   - a summary line (date, time, game, guests parsed from the option)
   - **"Buchen" button** (custom_id carries the parsed window + game + guests,
     e.g. `buchen_confirm:<base64 state>`; or stash state in a row keyed by
     interaction id, like the RPS example's `activeGames` but in Postgres /
     a short-lived `Verification`-style row. Prefer encoding in custom_id if it
     fits the 100-char limit, else a `DiscordPendingAction` table.)
3. On "Buchen": defer (type 6), resolve actor, map selected Discord users ->
   member ids (skip unlinked, collect names), map `gaeste` -> `{ newName }`,
   call `createBooking(tableId, { start, end, game, guests, participantUserIds }, actor)`.
4. PATCH the ephemeral message with the `ServiceResult.message`
   ("Buchung erstellt." / "Tisch ist in diesem Zeitraum belegt." etc.), plus
   any skipped-unlinked note.

Shared ("Mehrfachbuchung") tables: `createBooking` already forces guests to
`[]` and `game` to `null` for them, so nothing special needed on the bot side.

### `/tische <datum>`

Read-only, answer directly. `listTables()` + bookings for that Berlin day ->
per table: "frei" or list of booked windows + who booked. One ephemeral (or
public) embed-style message.

### `/buchungen`

Read-only. `fetchUpcomingBookingsForUser(actor.id)` -> ephemeral list: table,
date/time, game, participant count, booking id hidden (shown only in
`/absagen`).

### `/absagen`

1. Fetch actor's upcoming bookings (only ones they own -> `canEditBooking`
   allows owner or admin; keep it to owned for clarity, admins can use the web
   app).
2. Reply ephemerally with a **multi-select string menu** (label =
   `Tisch 2 - Fr 05.09. 18:00`, value = bookingId, `max_values` = count) plus
   an "Absagen" button.
3. On confirm: defer, loop `cancelBooking(id, actor)` for each selected,
   PATCH with a summary ("2 Buchungen abgesagt." / per-item errors).

### `/spielersuche <sub>`

- **`open`**: options `system` (string, required, autocomplete from `Game`),
  `matchtyp` (string, optional, free text -> `matchType`), `zeit` (string,
  optional; if omitted -> flexible search). Maps to
  `createPlayerSearch({ fixedTime: !!zeit, start, end, system, matchType }, actor)`.
  (`zeit` needs a duration too for `end`; reuse the `dauer` default. Flexible
  if no `zeit`.)
- **`close`**: ephemeral select of the actor's open searches ->
  `deletePlayerSearch(id, actor)` per selection.
- **`accept` / `decline`**: ephemeral select of **pending interests on the
  actor's searches** where it is the actor's move (label = responder name +
  proposed window + system). Selecting one calls
  `acceptPlayerSearchInterest(interestId, actor)` /
  `declinePlayerSearchInterest(interestId, actor)`.
- The initial idea of passing "the Discord username of the account who did the
  Spielersuche" is replaced by this menu: the bot never needs the responder to
  be linked, it just shows the stored `User.name`. (If we later want to
  @mention them, that needs the responder linked; optional.)

### `/event <sub>`

Backed by `service/event-service`. Permissions mirror the web app:

- **`create`**: **admin only** (`requireAdmin` today). Options: `titel`
  (required), `start` (required), `dauer` / `ende` (optional, no default: some
  events have no end), `ort` (optional), `beschreibung` (optional). Calls
  `createEvent(values, actor)`. Non-admin linked member -> ephemeral "nur
  Admins".
- **`delete`**: admin only. Ephemeral select of upcoming events ->
  `deleteEvent(id, actor)`.
- **`join` / `leave`**: any linked member. Ephemeral select of upcoming events
  -> `joinEvent(id, actor)` / `leaveEvent(id, actor)`.

`createEvent` / `updateEvent` / `deleteEvent` also need the actor refactor
(section 6): they call `getSession()` twice (`requireAdmin` + the `session`
for `createdById` / notify filtering).

### `/getraenk <sub>`

Backed by `adjustDrinkCount(delta)` (member self-service "ich hab was
getrunken" counter for the current Berlin month, clamped at 0).

- **`add`** -> `adjustDrinkCount(1, actor)`
- **`remove`** -> `adjustDrinkCount(-1, actor)`

No args. Ephemeral reply with the new count for the month. `adjustDrinkCount`
needs the actor refactor. `setDrinkBudget` (admin stock management) stays
web-only. Name is `getraenk` not `getränk`: Discord command names must be
lowercase and an umlaut there is asking for trouble.

Note: `respondToPlayerSearch` / `counterPlayerSearchInterest` (registering
  interest in **someone else's** search, time negotiation) are **out of scope
  for v1** on Discord: they need time-picker back-and-forth that is clumsy in
  chat. Keep those web-only for now.

---

## 6. Actor refactor (architecture decision)

**Context.** Every `service/*` mutation currently starts with
`const session = await getSession()` (cookie/header based). A Discord
interaction has no cookie session, so the services can't be called as-is.

**Options considered.**

1. **Discord-specific service layer** re-implementing booking/search mutations
   against Prisma directly. ❌ duplicates the advisory-lock / overlap /
   pricing / notify logic; two code paths drift.
2. **Thread an explicit `actor` param** through the service functions,
   defaulting to the session. ✅ one stable interface, both callers share it,
   testable.
3. **AsyncLocalStorage actor override.** `getSession` stays; a
   `runAsActor(actor, fn)` sets an ALS value that a new `resolveActor()`
   checks first. Less signature churn, but more implicit / magic.

**Decision: option 2.**

```ts
// lib/actor.ts
export interface Actor { id: string; name: string; role: string }

export async function resolveActor(explicit?: Actor): Promise<Actor | null> {
  if (explicit) return explicit;
  const session = await getSession();
  if (!session) return null;
  return { id: session.user.id, name: session.user.name, role: session.user.role };
}

export function actorIsAdmin(actor: Actor): boolean {
  return actor.role === ROLES.ADMIN;
}
```

Change in each mutation (`booking.ts`: create/update/cancel/join/leave;
all of `player-search.ts`; `event-service`: create/update/delete/join/leave;
`drink-service`: `adjustDrinkCount`): add a
trailing `actor?: Actor` param, replace
`const session = await getSession(); if (!session) ...` with
`const actor = await resolveActor(explicitActor); if (!actor) ...`, and swap
`session.user.id` -> `actor.id`, `session.user.name` -> `actor.name`,
`isAdmin(session)` -> `actorIsAdmin(actor)`. `canEditBooking` gets an
actor-shaped overload (it only reads `.user.id` / role today).

Purely mechanical, ~11 call sites, no behaviour change for the web (param
omitted -> falls back to session). Web callers untouched.

---

## 7. Security checklist

- Verify Ed25519 signature on **every** request against `DISCORD_PUBLIC_KEY`,
  using the raw body. 401 on mismatch.
- Reject interactions whose `guild_id !== DISCORD_GUILD_ID` (guild-install
  only; no DM / other-server use).
- Never trust Discord-supplied names/ids for authorization. Identity is always
  `discordUserId -> User` via our own table.
- `/verbinden` token: single-use, 10-min TTL, bound to the Discord user id it
  was issued for; the web confirm step still requires an authenticated session.
- Guard against one app account being linked to two Discord users and vice
  versa (`@unique` + explicit check).
- Bot token, public key, app id: env only, never logged. Don't log full
  interaction payloads at info level.
- Command registration script requires the bot token; run locally / CI only.
- Rate/abuse: Discord itself rate-limits slash commands per user; the service
  layer's advisory locks handle booking races. No extra needed for v1.

---

## 8. Command registration

`scripts/register-discord-commands.ts` (run with `tsx`, like `scripts/*`):

```
PUT https://discord.com/api/v10/applications/{APP_ID}/guilds/{GUILD_ID}/commands
Authorization: Bot {DISCORD_BOT_TOKEN}
body: ALL_COMMANDS  (from lib/discord/commands.ts)
```

Guild-scoped commands update **instantly** (global ones take up to 1h), which
is what we want for a single club server anyway. Add an npm script
`"discord:register": "tsx scripts/register-discord-commands.ts"`.

---

## 9. Rollout phases

- **Phase 0 - Discord setup.** Create app in the Discord developer portal,
  enable Guild Install with `applications.commands` + `bot` (Send Messages)
  scopes, install to the club server, grab app id / public key / bot token,
  create a private `#bot-test` channel. Fill `.env`.
- **Phase 1 - Linking.** Schema migration (`discordUserId` / `discordUsername`),
  `/verbinden` + `/trennen`, `linkDiscordAccount` / `unlinkDiscordAccount`
  server actions, settings UI section. (Also stands up the interactions route +
  signature verify + command registration script as its foundation.)
- **Phase 2 - Actor refactor.** `lib/actor.ts`, thread `actor` through
  `booking.ts` and `player-search.ts`. No new features, web unchanged.
- **Phase 3 - `/buchen`.** The member/table/game selection message + confirm.
- **Phase 4 - `/tische`, `/buchungen`, `/absagen`.**
- **Phase 5 - `/spielersuche open|close|accept|decline`.**
- **Phase 6 - `/event` + `/getraenk`.**
- **Phase 7 - Channel announcements.** `lib/discord/announce.ts` exporting
  `announce(text)` that `POST`s to a channel via the bot token, try/catch,
  fire-and-forget through `after()`. Called **next to the existing `notify()`
  calls** in the services (create booking, cancel booking, accept
  Spielersuche, create/delete event, ...), so both web- and Discord-triggered
  actions announce. Architecture note: this makes the service layer aware of
  Discord. Acceptable at ~6 call sites that already have `notify()`; if it
  spreads, promote to a single notification dispatch that both web-push and
  Discord subscribe to, instead of two inline calls everywhere.

  **Announce:** new booking, cancelled booking, Spielersuche opened,
  Spielersuche booked, event created, event deleted.
  **Do not announce:** drink counter changes, join/leave on bookings or events.

Each phase: `tsc --noEmit` + lint clean before moving on. Test in `#bot-test`
first.

---

## 10. Open questions

1. **Which channel(s)?** (Blocked: to be discussed with the client.) One
   channel for all announcements, or split (bookings vs events vs a
   stats/digest channel)? Need the channel id(s) once decided. Also: is a
   **weekly cron digest** wanted on top of the per-event posts (bookings this
   week, open Spielersuchen, upcoming events)?

### Resolved

- Command names: `/tische <datum>`, `/buchungen`. (was `/frei`, `/meine`)
- Default duration: 3h, optional `dauer:` override.
- Output: ephemeral everywhere.
- Language: German command names, English code.
- Spielersuche interest/negotiation: out of scope for v1.
- Announcements fire for both web- and Discord-created actions.
- Added `/event create|delete|join|leave` (create/delete admin-only, mirroring
  the web app) and `/getraenk add|remove`.
- `/buchen` confirm-button state: encode in the button `custom_id` (100-char
  limit); fall back to a small `DiscordPendingAction` table only if it doesn't
  fit. (This was open question 2: a button click is a fresh request with no
  memory of the `/buchen` you typed, so the parsed date/table/game has to be
  stashed somewhere between the two.)
