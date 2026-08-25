import type { JSX } from "react";
import Link from "next/link";
import { ArrowRight, Dice1, Dice2, Dice4, Dice5, Dice6 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO } from "@/lib/website-data";
import ImagePlaceholder from "@/components/website/ImagePlaceholder";

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
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              className="rounded-none p-5"
              render={
                <Link href={HERO.primaryCta.href}>{HERO.primaryCta.label}</Link>
              }
            />
            <Link
              href={HERO.secondaryCta.href}
              className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {HERO.secondaryCta.label}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <ImagePlaceholder
          label="Foto folgt"
          className="aspect-4/3"
          src="/website-images/dice-collection.jpeg"
          alt="Würfelsammlung des Dice-Bock e.V."
          priority
        />
      </div>
    </section>
  );
}
