import type { JSX } from "react";
import { checkSession } from "@/lib/session";
import DiscordLinkConfirm from "./DiscordLinkConfirm";

export default async function DiscordVerbindenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<JSX.Element> {
  await checkSession();
  const { token } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold">Discord verbinden</h1>
        <p className="text-sm text-muted-foreground">
          Bestätige, um deinen Discord-Account mit deinem Dice-Bock-Konto zu verknüpfen.
        </p>
      </div>
      <DiscordLinkConfirm token={token ?? null} />
    </div>
  );
}
