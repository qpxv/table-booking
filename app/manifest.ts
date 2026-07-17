import type { MetadataRoute } from "next";
import { COLORS } from "@/lib/theme";

// PLACEHOLDER — name, icons, and colors will be replaced once the logo/hex codes exist.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vereins-Tischbuchung",
    short_name: "Tischbuchung",
    description: "Tischbuchungsapp für den Verein",
    start_url: "/",
    display: "standalone",
    background_color: COLORS.background,
    theme_color: COLORS.primary,
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
