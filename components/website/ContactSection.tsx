import type { ComponentType, JSX, SVGProps } from "react";
import Link from "next/link";
import { Dice1, Dice2, Dice4, Dice5, Dice6, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT } from "@/lib/website-data";
import { cn } from "@/lib/utils";
import WhatsAppIcon from "@/components/website/WhatsAppIcon";
import DiscordIcon from "@/components/website/DiscordIcon";

const CHANNEL_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  WhatsApp: WhatsAppIcon,
  Discord: DiscordIcon,
};

const CHANNEL_HOVER_CLASSES: Record<string, string> = {
  WhatsApp: "hover:text-[#25D366]",
  Discord: "hover:text-[#5865F2]",
};

export default function ContactSection(): JSX.Element {
  const primaryEmail = CONTACT.board[0].email;

  return (
    <section id="kontakt" className="relative flex min-h-[30rem] items-center overflow-hidden bg-header text-header-foreground">
      <div className="pointer-events-none absolute inset-0">
        <Dice4 className="absolute top-[8%] left-[6%] size-24 rotate-[-10deg] text-header-foreground/10 sm:size-32" />
        <Dice2 className="absolute bottom-[12%] left-[16%] size-20 rotate-[16deg] text-secondary/15 sm:size-24" />
        <Dice6 className="absolute top-[14%] right-[10%] size-28 rotate-[12deg] text-header-foreground/10 sm:size-36" />
        <Dice1 className="absolute right-[22%] bottom-[8%] size-16 rotate-[-8deg] text-secondary/15 sm:size-20" />
        <Dice5 className="absolute top-[55%] right-[4%] size-20 rotate-[6deg] text-header-foreground/10 sm:size-24" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div>
          <span className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
            {CONTACT.eyebrow}
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-semibold sm:text-4xl">
            {CONTACT.heading}
          </h2>
          <p className="mt-4 max-w-md text-pretty text-header-foreground/70">{CONTACT.description}</p>

          <div className="mt-8 inline-flex flex-col items-start gap-4">
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              className="rounded-none px-6"
              render={<Link href={`mailto:${primaryEmail}`}>E-Mail schreiben</Link>}
            />

            <div className="flex flex-col gap-4 pl-2">
              {CONTACT.channels.map((channel) => {
                const Icon = CHANNEL_ICONS[channel.icon];
                return (
                  <a
                    key={channel.label}
                    href={channel.href}
                    className={cn(
                      "flex items-center gap-2 text-sm text-header-foreground/70 transition-colors",
                      CHANNEL_HOVER_CLASSES[channel.icon]
                    )}
                  >
                    <Icon className="size-4" />
                    {channel.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-header-foreground/15 border border-header-foreground/15">
          {CONTACT.board.map((member) => (
            <a
              key={member.email}
              href={`mailto:${member.email}`}
              className="group relative flex items-center gap-4 bg-header p-6 transition-colors hover:bg-[color-mix(in_oklch,var(--header),var(--header-foreground)_8%)]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center bg-secondary text-secondary-foreground">
                <Mail className="size-6" />
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-[0.15em] text-header-foreground/60 uppercase">
                  {member.role}
                </span>
                <span className="font-heading text-lg font-semibold">{member.name}</span>
                <span className="text-sm text-secondary group-hover:underline">{member.email}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
