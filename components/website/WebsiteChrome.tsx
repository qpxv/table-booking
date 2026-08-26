import type { JSX } from "react";
import { getSession } from "@/lib/session";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default async function WebsiteChrome({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const session = await getSession();

  return (
    <div className="dark flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar isAuthenticated={!!session} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
