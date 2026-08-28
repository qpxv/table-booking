import { Sun, Moon, Monitor, type LucideIcon } from "lucide-react";

export interface ThemeOption {
  value: "light" | "dark" | "system";
  label: string;
  icon: LucideIcon;
}

// Single source for both the desktop dropdown submenu and the mobile
// sidebar theme controls.
export const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Hell", icon: Sun },
  { value: "dark", label: "Dunkel", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];
