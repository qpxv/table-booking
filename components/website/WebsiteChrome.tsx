import type { JSX } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function WebsiteChrome({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="dark flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
