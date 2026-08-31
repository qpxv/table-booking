import * as React from "react"

const MOBILE_BREAKPOINT = 768

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

function getSnapshot(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}

// Like useIsMobile, but `undefined` on the server / before the first client
// read, so callers that must not render (or lazy-load) the wrong layout can
// wait for a real value instead of treating "unknown" as desktop.
export function useIsMobileResolved(): boolean | undefined {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => undefined)
}
