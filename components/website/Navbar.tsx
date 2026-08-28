"use client";

import { useState, type JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { WEBSITE_NAV_LINKS } from "@/lib/website-data";

export default function Navbar({ isAuthenticated }: { isAuthenticated: boolean }): JSX.Element {
  const [open, setOpen] = useState(false);
  const ctaHref = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN;
  const ctaLabel = isAuthenticated ? "App öffnen" : "Anmelden";

  return (
    <header className="sticky top-0 z-50 border-b border-header-foreground/10 bg-header text-header-foreground">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr] items-center gap-4 px-4 sm:px-6 md:grid-cols-[auto_1fr_auto]">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/club-logo-dark.png"
            alt="Dice-Bock e.V."
            width={444}
            height={509}
            priority
            className="h-9 w-auto"
          />
          <span className="truncate font-heading text-lg font-semibold">
            Dice-Bock e.V.
          </span>
        </Link>

        <nav className="hidden items-center justify-center gap-1 md:flex">
          {WEBSITE_NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              nativeButton={false}
              className="rounded-none text-header-foreground hover:bg-header-foreground/50 hover:text-header-foreground"
              render={<a href={link.href}>{link.label}</a>}
            />
          ))}
        </nav>

        <div className="flex items-center justify-end gap-3 md:gap-4">
          <Button
            variant="secondary"
            nativeButton={false}
            className="rounded-none"
            render={<Link href={ctaHref}>{ctaLabel}</Link>}
          />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center text-header-foreground md:hidden"
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={open}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex origin-top animate-in flex-col gap-1 border-t border-header-foreground/10 bg-header px-4 pb-1 duration-200 fade-in slide-in-from-top-2 md:hidden">
          {WEBSITE_NAV_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              nativeButton={false}
              className="mt-1 w-full justify-start rounded-none text-header-foreground hover:bg-header-foreground/50 hover:text-header-foreground"
              render={
                <a href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              }
            />
          ))}
        </nav>
      )}
    </header>
  );
}
