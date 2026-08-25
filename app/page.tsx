import type { JSX } from "react";
import WebsiteChrome from "@/components/website/WebsiteChrome";
import Hero from "@/components/website/Hero";
import AboutSection from "@/components/website/AboutSection";
import FeaturesSection from "@/components/website/FeaturesSection";
import TestimonialsSection from "@/components/website/TestimonialsSection";
import HowItWorksSection from "@/components/website/HowItWorksSection";
import ContactSection from "@/components/website/ContactSection";

// Nobody actually reaches this component right now: proxy.ts redirects "/"
// straight to /dashboard for a logged-in visitor, and to /login for
// everyone else, while the site is still in development.
export default function Home(): JSX.Element {
  return (
    <WebsiteChrome>
      <Hero />
      <FeaturesSection />
      <TestimonialsSection />
      <AboutSection />
      <HowItWorksSection />
      <ContactSection />
    </WebsiteChrome>
  );
}
