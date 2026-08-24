import type { JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import { Copyright, Dot } from "lucide-react";
import { WEBSITE_NAV_LINKS, FOOTER } from "@/lib/website-data";

export default function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-header-foreground/15 bg-header text-header-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:py-16">
        <div className="flex items-center gap-3">
          <Image
            src="/club-logo-dark.png"
            alt="Dice-Bock e.V."
            width={444}
            height={509}
            className="h-14 w-auto"
          />
          <span className="font-heading text-lg font-semibold">Dice-Bock e.V.</span>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold tracking-[0.2em] text-header-foreground/50 uppercase">
            {FOOTER.navLabel}
          </span>
          <nav className="flex flex-col gap-2 text-sm text-header-foreground/70">
            {WEBSITE_NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-header-foreground hover:underline">
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold tracking-[0.2em] text-header-foreground/50 uppercase">
            {FOOTER.communityLabel}
          </span>
          <nav className="flex flex-col gap-2 text-sm text-header-foreground/70">
            {FOOTER.communityLinks.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-header-foreground hover:underline">
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold tracking-[0.2em] text-header-foreground/50 uppercase">
            {FOOTER.legalLabel}
          </span>
          <nav className="flex flex-col gap-2 text-sm text-header-foreground/70">
            {FOOTER.legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-header-foreground hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 px-4 pt-4 pb-10 text-center text-xs text-header-foreground/60 sm:px-6">
        <Copyright className="size-3.5" />
        {currentYear} Dice-Bock e.V.
        <Dot className="size-1 opacity-0" />
        Alle Rechte vorbehalten.
      </div>
    </footer>
  );
}
