import type { JSX } from "react";
import { Spinner } from "@/components/ui/spinner";

// Next.js wraps the (app) layout's `children` slot in a Suspense boundary
// using this file, for every route nested under (app). AppShell (header,
// nav) stays mounted and interactive; only the content area swaps to this
// fallback while the next page's data is still loading, so navigating
// between nav items shows feedback immediately instead of appearing frozen.
export default function AppLoading(): JSX.Element {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  );
}
