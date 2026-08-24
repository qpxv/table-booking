import type { JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import { WEBSITE_NAV_LINKS, FOOTER } from "@/lib/website-data";

export default function Footer(): JSX.Element {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/club-logo-light.png"
            alt="Dice-Bock e.V."
            width={444}
            height={509}
            className="h-8 w-auto"
          />
          <span className="font-heading text-base font-semibold text-foreground">Dice-Bock e.V.</span>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {WEBSITE_NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
          {FOOTER.legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        {FOOTER.tagline}
      </div>
    </footer>
  );
}
