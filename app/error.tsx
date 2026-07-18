"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("error boundary caught", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Ein Fehler ist aufgetreten
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Etwas ist schiefgelaufen. Bitte versuche es erneut oder kehre zum Dashboard zurück.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          <RotateCcw />
          Erneut versuchen
        </Button>
        <Button nativeButton={false} render={<Link href="/dashboard">Zum Dashboard</Link>} />
      </div>
    </div>
  );
}
