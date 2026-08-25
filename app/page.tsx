import type { JSX } from "react";
import WebsiteChrome from "@/components/website/WebsiteChrome";
import Hero from "@/components/website/Hero";
import AboutSection from "@/components/website/AboutSection";
import FeaturesSection from "@/components/website/FeaturesSection";
import TestimonialsSection from "@/components/website/TestimonialsSection";
import HowItWorksSection from "@/components/website/HowItWorksSection";
import ContactSection from "@/components/website/ContactSection";

// Only a logged-in visitor ever reaches this component while the site is
// still in development: proxy.ts redirects "/" to /login for everyone else.
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
