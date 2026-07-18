import type { MetadataRoute } from "next";
import { COLORS } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dice-Bock e.V.",
    short_name: "Dice-Bock",
    description: "Tischbuchungsapp für den Dice-Bock e.V.",
    start_url: "/",
    display: "standalone",
    background_color: COLORS.background,
    theme_color: COLORS.primary,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
