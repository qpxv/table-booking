import type { JSX } from "react";
import { Mail } from "lucide-react";
import { CONTACT } from "@/lib/website-data";

export default function ContactSection(): JSX.Element {
  return (
    <section id="kontakt" className="bg-header text-header-foreground">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <span className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
          {CONTACT.eyebrow}
        </span>
        <h2 className="mt-3 max-w-xl text-balance font-heading text-3xl font-semibold sm:text-4xl">
          {CONTACT.heading}
        </h2>
        <p className="mt-4 max-w-md text-pretty text-header-foreground/70">{CONTACT.description}</p>

        <div className="mt-10 grid gap-px overflow-hidden border border-header-foreground/15 bg-header-foreground/15 sm:grid-cols-2 lg:max-w-2xl">
          {CONTACT.board.map((member) => (
            <a
              key={member.email}
              href={`mailto:${member.email}`}
              className="group flex flex-col gap-2 border-l-4 border-l-secondary bg-header p-6 transition-colors hover:bg-header-foreground/5"
            >
              <span className="text-xs font-semibold tracking-[0.15em] text-header-foreground/60 uppercase">
                {member.role}
              </span>
              <span className="font-heading text-lg font-semibold">{member.name}</span>
              <span className="flex items-center gap-2 text-sm text-secondary group-hover:underline">
                <Mail className="size-4" />
                {member.email}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
