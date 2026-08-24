import type { JSX } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  label: string;
  className?: string;
}

export default function ImagePlaceholder({ label, className }: ImagePlaceholderProps): JSX.Element {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden border border-border bg-muted/60",
        className
      )}
    >
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
    </div>
  );
}
