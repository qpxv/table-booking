import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie, getCookieCache } from "better-auth/cookies";

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
const PUBLIC_ROUTES = new Set(["/login", "/impressum", "/datenschutz"]);
const REDIRECT_IF_AUTHENTICATED = new Set(["/login"]);

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && REDIRECT_IF_AUTHENTICATED.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/admin")) {
    const cache = await getCookieCache(request, {
      secret: process.env.BETTER_AUTH_SECRET,
    });

    if (cache?.user && (cache.user as { role?: string }).role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
