"use client";

import { Suspense, type JSX, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

// React never re-shows a Suspense boundary's fallback for a later
// transition once it has already revealed real content once -- that's how
// startTransition avoids flicker on updates. Every App Router navigation
// runs inside a transition, so a single shared boundary (e.g. a plain
// loading.tsx) only ever shows its fallback on the very first navigation
// into it, then silently keeps the old page frozen on screen for every
// navigation after that, no matter how slow the next page is.
//
// Keying the boundary by the current pathname forces React to treat every
// route change as a brand new boundary instance instead of an update to
// the existing one, so the fallback reliably shows on every single
// navigation -- one consistent loading behavior everywhere, not just the
// first click of the session.
export default function RouteTransition({ children }: { children: ReactNode }): JSX.Element {
  const pathname = usePathname();
  return (
    <Suspense
      key={pathname}
      fallback={
        <div className="flex flex-1 items-center justify-center py-24">
          <Spinner className="size-8 text-muted-foreground" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
