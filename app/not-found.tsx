import type { JSX } from "react";
import Link from "next/link";
import ClubLogo from "@/components/layout/ClubLogo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default function NotFound(): JSX.Element {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <ClubLogo alt="Dice-Bock e.V." priority className="h-24 w-auto" />
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          404 – Seite nicht gefunden
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Diese Seite existiert nicht oder wurde verschoben.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href={ROUTES.DASHBOARD}>Zurück zum Dashboard</Link>} />
    </div>
  );
}
