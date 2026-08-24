import type { JSX } from "react";
import WebsiteChrome from "@/components/website/WebsiteChrome";

export default function ImpressumPage(): JSX.Element {
  return (
    <WebsiteChrome>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">Impressum</h1>
        <p className="mt-6 text-muted-foreground">
          Der Impressumstext wird in Kürze ergänzt.
        </p>
      </div>
    </WebsiteChrome>
  );
}
