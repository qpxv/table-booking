import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCookieCache } from "better-auth/cookies";
import { PUBLIC_ROUTES, REDIRECT_IF_AUTHENTICATED_ROUTES, ROUTES } from "@/lib/constants";

// Next.js 16: "Proxy" (formerly Middleware). Only optimistic checks against
// the session cookie here: no DB access (see the Next.js auth guide). The
// real, authoritative authorization happens in lib/permissions.ts inside
// every Server Action.
// Reachable without a session cookie at all: /login itself, plus the two
// legal pages linked from the landing page's footer. The landing page ("/")
// is intentionally NOT public while the site is still in development — it
// now requires a login like the rest of the app, but (unlike /login) it
// stays visible to an already-logged-in visitor instead of bouncing them
// to /dashboard, since it's still a real page people should be able to see.
//
// We read the signed cookie cache (getCookieCache) rather than just
// checking whether a session cookie exists (getSessionCookie). A stale
// cookie (expired/revoked session, deleted user) still "exists" but no
// longer decodes to a valid cache entry. Treating mere presence as
// "authenticated" caused an infinite redirect loop: /login would bounce to
// /dashboard because the cookie existed, the (app) layout's checkSession()
// would then find no real session and bounce back to /login, and the cycle
// repeated forever until the browser gave up with a "too many redirects"
// crash. Validating against the cache instead breaks that loop.
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  const cache = await getCookieCache(request, {
    secret: process.env.BETTER_AUTH_SECRET,
  });
  const isAuthenticated = Boolean(cache?.user);

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  if (isAuthenticated && REDIRECT_IF_AUTHENTICATED_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  if (isAuthenticated && pathname.startsWith("/admin")) {
    if ((cache?.user as { role?: string }).role !== "admin") {
      return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // PWA assets (manifest, service worker, its workbox runtime chunk) must
  // stay reachable unauthenticated: they're fetched by the browser off the
  // very first page load (often /login, before any session cookie exists),
  // and the post-login redirect to /dashboard is a soft client-side nav:
  // it never gives the browser a second, authenticated shot at fetching
  // them. Redirecting sw.js to /login's HTML breaks service worker
  // registration outright, which is why the install icon never appeared.
  matcher: [
    "/((?!api|_next/static|_next/image|icons|manifest\\.webmanifest|sw\\.js|workbox-.*\\.js|.*\\.(?:svg|png|jpe?g|webp|gif|ico)$).*)",
  ],
};
