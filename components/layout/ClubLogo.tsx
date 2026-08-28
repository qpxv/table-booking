import type { JSX } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// club-logo-light.png is the variant meant for light surfaces, -dark.png for
// dark surfaces. On a surface that follows the theme (login, error pages,
// mobile sidebar), swap the two via the `dark` variant. Surfaces that are
// always dark (app header, website) keep referencing -dark.png directly.
export default function ClubLogo({
  className,
  priority = false,
  alt = "",
}: {
  className?: string;
  priority?: boolean;
  alt?: string;
}): JSX.Element {
  return (
    <>
      <Image
        src="/club-logo-light.png"
        alt={alt}
        width={444}
        height={509}
        priority={priority}
        className={cn("dark:hidden", className)}
      />
      <Image
        src="/club-logo-dark.png"
        alt={alt}
        aria-hidden={alt === "" ? true : undefined}
        width={444}
        height={509}
        priority={priority}
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}
