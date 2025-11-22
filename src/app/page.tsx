import FeaturesSection from "@/components/features-section";
import { Footer2 } from "@/components/footer-section";
import HeroSection from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import IntegrationsSection from "@/components/integration-section";
import PricingSection from "@/components/pricing-section";
import { StatsSection } from "@/components/stats-section";
import { TextRevealSection } from "@/components/text-reveal-section";
import TestimonialsSection from "@/components/testimonials-section";
import FAQSection from "@/components/faq-section";
import AdvancedFeaturesSection from "@/components/advanced-features-section";
import CTASection from "@/components/cta-section";
import TrustSection from "@/components/trust-section";
import Image from "next/image";

export default function Home() {
  return (
    <main className="w-full">
      <HeroSection />
      <TrustSection />
      <FeaturesSection />
      <StatsSection />
      <AdvancedFeaturesSection />
      <TextRevealSection />
      <HowItWorks />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <IntegrationsSection />
      <FAQSection />
      <Footer2 />
    </main>
  );
}