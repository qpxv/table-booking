import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
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
          404 – Seite nicht gefunden
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Diese Seite existiert nicht oder wurde verschoben.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/dashboard">Zurück zum Dashboard</Link>} />
    </div>
  );
}
