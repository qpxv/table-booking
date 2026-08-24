import type { JSX } from "react";
import { ABOUT } from "@/lib/website-data";
import ImagePlaceholder from "@/components/website/ImagePlaceholder";

export default function AboutSection(): JSX.Element {
  return (
    <section id="ueber-uns" className="border-b border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div>
          <span className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
            {ABOUT.eyebrow}
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-semibold text-foreground sm:text-4xl">
            {ABOUT.heading}
          </h2>
          <div className="mt-6 flex flex-col gap-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {ABOUT.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <ImagePlaceholder label="Foto folgt" className="aspect-4/3" />
      </div>
    </section>
  );
}
