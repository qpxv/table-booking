"use client";

import { useEffect, type JSX } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error("error boundary caught", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <Image
        src="/club-logo-light.png"
        alt="Dice-Bock e.V."
        width={444}
        height={509}
        priority
        className="h-24 w-auto"
      />
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Ein Fehler ist aufgetreten
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Etwas ist schiefgelaufen. Bitte kehre zum Dashboard zurück.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href={ROUTES.DASHBOARD}>Zurück zum Dashboard</Link>} />
    </div>
  );
}
