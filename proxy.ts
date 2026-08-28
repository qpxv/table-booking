import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { PUBLIC_ROUTES, REDIRECT_IF_AUTHENTICATED_ROUTES, ROUTES } from "@/lib/constants";

// Next.js 16: "Proxy" (formerly Middleware), running on the Node.js runtime
// (Fluid Compute), not Edge — so a real DB-backed session check here is
// fine. Deliberately NOT using better-auth's cookie cache (getCookieCache)
// or session.cookieCache: a cached cookie can go stale (expire, or miss a
// revoke) while looking identical to a real logged-out state, which bounced
// people to /login even though their session was still valid. Checking
// auth.api.getSession() directly is the same real-time check used
// everywhere else in the app (lib/session.ts), so proxy and the rest of the
// app can never disagree about whether a session is valid.
// Reachable without a session cookie at all: /login itself, plus the two
// legal pages linked from the landing page's footer. The landing page ("/")
// is intentionally NOT public while the site is still in development — it
// now requires a login like the rest of the app, but (unlike /login) it
// stays visible to an already-logged-in visitor instead of bouncing them
// to /dashboard, since it's still a real page people should be able to see.
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  const session = await auth.api.getSession({ headers: request.headers });
  const isAuthenticated = Boolean(session);

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  if (isAuthenticated && REDIRECT_IF_AUTHENTICATED_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  // The landing page renders its own chrome outside app/(app), so it would
  // slip past the forced password change shown by (app)/layout.tsx. Bounce a
  // member still on an admin-provisioned password to /dashboard, where the
  // gate is.
  if (
    session &&
    pathname === ROUTES.HOME &&
    (session.user as { mustChangePassword?: boolean }).mustChangePassword
  ) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  if (session && pathname.startsWith("/admin")) {
    if ((session.user as { role?: string }).role !== "admin") {
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
