import type { JSX } from "react";
import WebsiteChrome from "@/components/website/WebsiteChrome";
import Hero from "@/components/website/Hero";
import AboutSection from "@/components/website/AboutSection";
import FeaturesSection from "@/components/website/FeaturesSection";
import HowItWorksSection from "@/components/website/HowItWorksSection";
import ContactSection from "@/components/website/ContactSection";

// A visitor with a valid session cookie never actually reaches this
// component: proxy.ts redirects "/" straight to /dashboard at the edge
// before render, the same way it already does for /login.
export default function Home(): JSX.Element {
  return (
    <WebsiteChrome>
      <Hero />
      <FeaturesSection />
      <AboutSection />
      <HowItWorksSection />
      <ContactSection />
    </WebsiteChrome>
  );
}
