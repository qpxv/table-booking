import { Suspense, type JSX } from "react";
import GuestHistoryContent from "@/components/guest-history/GuestHistoryContent";
import GuestHistorySkeleton from "@/components/guest-history/GuestHistorySkeleton";

export default function GuestHistoryPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Gasthistorie</h1>
      <Suspense fallback={<GuestHistorySkeleton />}>
        <GuestHistoryContent />
      </Suspense>
    </div>
  );
}
