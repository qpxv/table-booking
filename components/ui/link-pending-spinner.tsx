"use client";

import type { JSX } from "react";
import { useLinkStatus } from "next/link";
import { Spinner } from "./spinner";

// Must render as a descendant of the <Link> it reports on: next/link
// exposes pending state via context, not a prop. A click to an
// already-prefetched route resolves before loading.tsx's Suspense boundary
// ever gets a chance to show anything (there's nothing left to wait on), so
// that alone doesn't give feedback for every nav click. This fires on the
// actual pending transition regardless of prefetch/cache state.
export default function LinkPendingSpinner({ className }: { className?: string }): JSX.Element | null {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Spinner className={className} />;
}
