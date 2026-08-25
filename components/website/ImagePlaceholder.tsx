import type { JSX } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  label: string;
  className?: string;
  src?: string;
  alt?: string;
  priority?: boolean;
}

export default function ImagePlaceholder({
  label,
  className,
  src,
  alt,
  priority,
}: ImagePlaceholderProps): JSX.Element {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden border border-border bg-muted/60",
        className
      )}
    >
      {src ? (
        <>
          <Image src={src} alt={alt ?? ""} fill priority={priority} className="object-cover" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, transparent 55%, var(--background) 115%)",
            }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0 text-muted-foreground opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.5px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-xs font-medium tracking-wide">{label}</span>
          </div>
        </>
      )}

      <Image
        src="/club-logo-dark.png"
        alt=""
        aria-hidden="true"
        width={444}
        height={509}
        className="absolute right-4 bottom-4 h-8 w-auto sm:h-10"
      />
    </div>
  );
}
