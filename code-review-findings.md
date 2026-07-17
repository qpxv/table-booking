# Code Review Findings

Scope: full working tree (everything since the `create-next-app` scaffold commit — there's no
real "diff" to review here, it's effectively a new app). Reviewed directly, file by file, against
the Next.js 16 / React 19 docs in `node_modules/next/dist/docs/` per `AGENTS.md` — this repo is on
Next 16, which renamed Middleware → Proxy, made Turbopack the default builder, and changed a few
`redirect()` semantics since whatever version is in most people's training data. Every claim below
was checked against those docs, not assumed.

I also went through your `// review:` comments and answered each one inline in Section 1 — a
couple of them are actually not quite right per the current docs, worth reading before you act on
them.

---

## 1. Answers to your `// review:` comments

### `LoginForm.tsx:35` — "we can use redirect() here, nextjs changed it, redirect can now be used in client components too"

Partially right, but not for this call site. Per `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md`:

> `redirect` can be called in Client Components **during the rendering process but not in event handlers**. You can use the `useRouter` hook instead.

`router.push("/dashboard")` at `LoginForm.tsx:35` is inside `handleSubmit`, a form submit **event handler**, not render. `redirect()` would throw/no-op wrong there — `useRouter().push()` is the documented, correct tool for this exact case. Same applies to `AppShell.tsx:29` (`handleLogout`) and `BuchungCalendar.tsx:96,102` (`handleSubmit`/`handleStornieren`, both event handlers off dialog callbacks) — none of these should switch to `redirect()`. `redirect()` is already used correctly elsewhere in the app, e.g. `app/(app)/dashboard/page.tsx:13` and `app/(app)/layout.tsx:13`, where it *is* called during render in a Server Component.

One real opportunity: the login flow **could** move to a Server Action (see §3) and use `redirect()` there — in a Server Action, `redirect()` works and is the idiomatic choice. That's a different change than "swap `router.push` for `redirect` in the event handler," though.

### `BuchungCalendar.tsx:96,102` — "here redirect instead of router refresh"

Also not a straight swap — `redirect()` navigates to a *different* URL; `router.refresh()` re-fetches Server Component data for the **current** URL without navigating. These do different things. After creating/canceling a booking you stay on the same table's calendar page, you just want fresh data — `router.refresh()` is correct here. (If this action becomes a Server Action per §3, the equivalent would be `revalidatePath()`, not `redirect()`.)

### `BuchungDialog.tsx:73` — "why so many usestates??"

Fair, and the fix is exactly what you suggested elsewhere (`useTransition`): 6 `useState` calls (`start`, `ende`, `spiel`, `ausgewaehlteGaeste`, `error`, `pending`) where `error`+`pending` are pure Server Action call bookkeeping. See §3.

### `LoginForm.tsx:15` — "why do we have a setError state?"

To show the "Anmeldung fehlgeschlagen" `Alert` when `authClient.signIn.email` fails. Legitimate need, but it's exactly the kind of state `useActionState` gives you for free from a Server Action's return value, without a manual `useState` + manual `try/catch`-equivalent. See §3.

### `BuchungCalendar.tsx:72` — "why here a typecast? avoid typecasts at all costs"

Agreed, and worth enforcing consistently — the same `as unknown as "admin" | "user"` pattern appears twice in `actions/users.ts:38,56` for the exact same reason (library type mismatch). If typecasts are getting banned, that file needs the same treatment (e.g. a small mapper function `toBetterAuthRole(role: Role)` in one place instead of casting at every call site).

### `app/providers.tsx:18` / `LoginForm.tsx:38` / `login/page.tsx:6` / `~offline/page.tsx:10` — "what is `<Box>`/`<Typography>`? why do we have MUI *and* Tailwind?"

Yes, `Box`/`Typography`/`Dialog`/`DataGrid`/etc. are all `@mui/material` (see `package.json`: `@mui/material`, `@mui/x-data-grid`, `@mui/icons-material`). The app mixes two styling systems throughout: MUI's `sx`/component props for layout+theming, and Tailwind utility classes passed via `className` on top of MUI components (e.g. `BuchungDialog.tsx:124` `className="flex flex-col gap-4 !pt-2"` fighting MUI's own spacing with `!important`). `globals.css:1-2` even disables Tailwind's preflight specifically so it doesn't fight MUI's `CssBaseline`. This is a real architectural question worth resolving deliberately (pick one), not a review nitpick — see §4.

### `dashboard/page.tsx:19`, `layout.tsx:15`, `AppShell.tsx:25` — "put magic strings in constants.ts"

Agreed, and it's bigger than a style nit: `"AKTIV"`/`"STORNIERT"` and `"ADMIN"`/`"MEMBER"` are already real Prisma enums (`prisma/schema.prisma:10-18`, `BuchungStatus`, `Role`). Import `BuchungStatus.AKTIV` / `Role.ADMIN` from `@/generated/prisma/client` instead of re-typing the string literals — that also makes `session.user.role === "ADMIN"` typo-proof (see finding in §2).

### `BuchungCalendar.tsx:99` — "why german name here? why not handleAbort"

Real inconsistency: the file mixes German domain vocabulary (`handleStornieren`, `Buchung`, `Tisch`) with an English handler name expectation. Given the whole codebase is German-first (see §5), `handleStornieren` is at least *internally* consistent — the actual problem is the codebase's language policy isn't decided at all, so every name is a coin flip. Pick one language for code (see §5); don't rename this one function in isolation.

---

## 2. Correctness bugs

### 🔴 Double-booking race condition — `actions/buchungen.ts`

`createBuchung` (line 47-98) wraps the overlap check and the insert in `prisma.$transaction`, but no isolation level is set, so Prisma/Postgres defaults to `READ COMMITTED`. Under `READ COMMITTED`, two concurrent requests booking the same table for overlapping times can **both** run the `findFirst` overlap check before either commits its `create` — neither sees the other's uncommitted row, both pass the check, both insert. The `@@index([tischId, start, ende])` in `schema.prisma:120` speeds up the check but does nothing to prevent the race; there's no unique/exclusion constraint backing it.

`updateBuchung` (line 106-139) is worse: the overlap check (`prisma.buchung.findFirst`, line 117) and the `prisma.buchung.update` (line 130) aren't even wrapped in a transaction together — two fully independent round-trips with no atomicity at all.

For a table-booking app, "two members book the same table for the same night" is exactly the bug this validation exists to prevent, and it's currently only prevented under low concurrency. Fix options: run the transaction at `Serializable`/`RepeatableRead` isolation and retry on conflict, or add a Postgres exclusion constraint (`EXCLUDE USING gist` on `tischId` + `tsrange(start, ende)`) as the actual source of truth, with the app-level check staying only as a fast-path/UX check.

### 🟡 `session.user.role ?? "MEMBER"` string fallback — `app/(app)/layout.tsx:17`

`role` comes from `better-auth`'s `admin` plugin, typed loosely as `string`. The fallback `"MEMBER"` is a bare string, not the Prisma `Role.MEMBER` enum — if the enum ever gains a third value, or `"MEMBER"` gets a typo here (it's duplicated as a literal in at least 3 places, see §1), nothing at the type level catches it. `AppShell.tsx:25` then does `user.role === "ADMIN"` — another untyped string comparison. This is your own `// review` comment (constants.ts) but the actual fix is stronger than a constants file: import the generated `Role` enum.

---

## 3. "Everything is client-side" / `useState` sprawl

You're right that the interactive surface is client-heavy, but it's worth being precise about *where*: of 20 `.tsx` files under `app/`+`components/`, **9 are `"use client"`** — and every single page (`dashboard/page.tsx`, `tische/page.tsx`, `tische/[tischId]/page.tsx`, `admin/tische/page.tsx`, `admin/users/page.tsx`, `admin/layout.tsx`, `app/layout.tsx`) is already a Server Component doing its data fetching with `await prisma...` / `await listX()` directly — that part follows the App Router model correctly. The client-side concentration is entirely in the interactive leaf components:

| File | `useState` count |
|---|---|
| `components/users/UserFormDialog.tsx` | 7 |
| `components/booking/BuchungDialog.tsx` | 7 |
| `components/tische/TischFormDialog.tsx` | 5 |
| `app/(auth)/login/LoginForm.tsx` | 5 |
| `components/users/UserManager.tsx` | 3 |
| `components/tische/TischManager.tsx` | 3 |
| `components/booking/BuchungCalendar.tsx` | 2 |

In every one of the four form-dialog files, the same shape repeats: 1 `useState` per field + `error` + `pending`, then a hand-rolled `try { await onSubmit(...) } catch { setError(...) } finally { setPending(false) }`. That's exactly what `useActionState` (wrapping a Server Action directly, not a client-side `onSubmit` prop drilled down from the parent) replaces — `pending`, `error`, and the try/catch/finally all come from the hook, and the field values can move to native uncontrolled `<input name="...">` + `FormData` instead of one `useState` per field, which is the pattern shown in `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`. `TischFormDialog` and `UserFormDialog` don't even need `onSubmit`/`onClose` prop-drilled from `TischManager`/`UserManager` — they could call `createTisch`/`updateTisch` etc. directly as the form's `action`.

This wouldn't eliminate client components (`Dialog`/`Autocomplete`/`DataGrid` genuinely need interactivity and browser state), but it would cut the `useState` count in these 4 files from 27 combined down to roughly 4-6 (just the genuinely UI-only state like which `Autocomplete` option is selected), and delete four near-identical error/pending plumbing blocks.

---

## 4. MUI + Tailwind both present, fighting each other

Every single component in `components/` and every page uses `@mui/material` primitives (`Box`, `Typography`, `Dialog`, `TextField`, `Autocomplete`, `AppBar`) styled via MUI's system, *and* Tailwind utility classes on top via `className`, frequently with `!important` overrides to win against MUI's own styles (`BuchungDialog.tsx:124,215,223`, `AppShell.tsx:37`). `globals.css:1-2` explicitly drops Tailwind's preflight layer to avoid conflicting with MUI's `CssBaseline`. This isn't wrong, exactly — it's a documented, workable pattern (MUI even ships `@mui/material-nextjs` for App Router SSR support, which is in use in `providers.tsx`) — but running two independent styling systems doubles the CSS shipped, doubles the mental model a new contributor needs, and every `!` override is a sign the two systems disagree about something. Worth an explicit decision (MUI-only with `sx`, or Tailwind-only with a headless component lib) rather than accretion.

---

## 5. Comment/identifier language is inconsistent, not just "German instead of English"

The bigger issue isn't that comments are in German — it's that the codebase has no consistent policy, so English and German are randomly mixed within the same files:

- **German comments + German domain names** (`Buchung`, `Tisch`, `Gast`, `stornieren`): `actions/buchungen.ts`, `actions/users.ts`, `components/booking/BuchungDialog.tsx`, `components/tische/TischFormDialog.tsx`, `components/users/UserFormDialog.tsx`, `components/tische/TischManager.tsx`, `components/users/UserManager.tsx`, `lib/pricing.ts`, `lib/auth.ts`, `app/manifest.ts`, `app/(app)/admin/layout.tsx`, `app/(app)/tische/page.tsx`, `app/~offline/page.tsx`, `app/layout.tsx` (via `lang="de"`, which is correct/intentional — the *UI* is German for German club members, that's fine).
- **English comments**: `proxy.ts`, `lib/prisma.ts`, `lib/datetime.ts` (mostly), `lib/theme.ts` (mostly).

So a contributor reading `lib/prisma.ts` gets English, then opens `actions/buchungen.ts` right next to it and gets German — there's no signal for which to expect where. Given the domain model, UI strings, and most identifiers (`Buchung`, `Tisch`, `Gast`, `mitgliedId`) are already German and that's a reasonable choice for a German club's internal tool, the fix is more likely "standardize the whole codebase on German for domain code, English only for framework/infra glue like `lib/prisma.ts`" (or the reverse) — not a blanket English-only rule that would fight the domain vocabulary everywhere.

---

## 6. Dead code

`lib/permissions.ts:16-22` — `canManageGast` is exported but never imported or called anywhere in the codebase (`grep -rn "canManageGast"` only finds its own definition). `findOrCreateGast` in `actions/gaeste.ts` scopes to `session.user.id` directly instead, so `canManageGast` looks like it was written for a call site that either got refactored away or was never built. Either wire it in where a guest-ownership check is actually needed, or delete it.

---

## 7. Minor / build config

`next.config.ts:5` sets `turbopack: {}`, but `package.json`'s `build` script is `next build --webpack` (line 6). Per the Next 16 upgrade guide, Turbopack is the default builder for both `next dev` and `next build` as of v16, and the `turbopack` config key only takes effect for Turbopack builds — so this project's *production build* silently ignores that config block and runs on Webpack instead, while `next dev` presumably uses Turbopack by default (no `--webpack` there). If Webpack was opted into deliberately (e.g. a dependency isn't Turbopack-compatible yet), it's worth a comment saying which one and why, and the unused `turbopack: {}` block should either get real config or be removed.
