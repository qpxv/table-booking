import type { JSX } from "react";
import Link from "next/link";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO } from "@/lib/website-data";

export default function Hero(): JSX.Element {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden border-b border-border bg-background">
      <div className="pointer-events-none absolute inset-0">
        <Dice6 className="absolute top-[6%] left-[4%] size-28 rotate-[-15deg] text-muted-foreground/10 sm:size-36" />
        <Dice2 className="absolute top-[62%] left-[10%] size-24 rotate-[10deg] text-secondary/15 sm:size-32" />
        <Dice4 className="absolute top-[10%] left-[46%] size-20 rotate-[20deg] text-muted-foreground/10 sm:size-28" />
        <Dice5 className="absolute bottom-[8%] left-[38%] size-32 rotate-[-8deg] text-secondary/15 sm:size-40" />
        <Dice1 className="absolute top-[70%] right-[6%] size-24 rotate-[14deg] text-muted-foreground/10 sm:size-32" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-balance font-heading text-4xl leading-[1.05] font-semibold text-foreground sm:text-5xl lg:text-6xl">
            {HERO.headline}
          </h1>
          <p className="max-w-md text-pretty text-base text-muted-foreground sm:text-lg">
            {HERO.subheadline}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              className="rounded-none p-6"
              render={
                <Link href={HERO.primaryCta.href}>{HERO.primaryCta.label}</Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              className="rounded-none p-6"
              render={
                <Link href={HERO.secondaryCta.href}>
                  {HERO.secondaryCta.label}
                </Link>
              }
            />
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

// Placeholder visual until a real club photo (location or a game night in
// progress) replaces it — kept as a self-contained decorative block so
// swapping it for a next/image later is a one-component change.
function HeroVisual(): JSX.Element {
  return (
    <div className="relative aspect-4/3 overflow-hidden border border-border bg-primary text-primary-foreground">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(currentColor 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/25 via-transparent to-transparent" />

      <Dice6 className="absolute top-[12%] left-[10%] size-16 rotate-[-12deg] text-primary-foreground/90 sm:size-20" />
      <Dice3 className="absolute top-[8%] right-[14%] size-10 rotate-[18deg] text-secondary sm:size-12" />
      <Dice1 className="absolute bottom-[16%] left-[18%] size-12 rotate-[8deg] text-primary-foreground/70 sm:size-14" />
      <Dice5 className="absolute right-[10%] bottom-[10%] size-20 rotate-[-6deg] text-primary-foreground sm:size-24" />
    </div>
  );
}
