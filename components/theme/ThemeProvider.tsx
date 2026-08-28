"use client";

import type { JSX } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// App-wide light/dark theming. The public website opts out by forcing its
// own `dark` class on WebsiteChrome, so it stays dark regardless of the
// value set here.
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
