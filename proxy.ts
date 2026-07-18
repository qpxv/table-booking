import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie, getCookieCache } from "better-auth/cookies";

// Next.js 16: "Proxy" (formerly Middleware). Only optimistic checks against
// the session cookie here — no DB access (see the Next.js auth guide). The
// real, authoritative authorization happens in lib/permissions.ts inside
// every Server Action.
const PUBLIC_ROUTES = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && isPublicRoute) {
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
  // and the post-login redirect to /dashboard is a soft client-side nav —
  // it never gives the browser a second, authenticated shot at fetching
  // them. Redirecting sw.js to /login's HTML breaks service worker
  // registration outright, which is why the install icon never appeared.
  matcher: [
    "/((?!api|_next/static|_next/image|icons|manifest\\.webmanifest|sw\\.js|workbox-.*\\.js|.*\\.(?:svg|png|ico)$).*)",
  ],
};
