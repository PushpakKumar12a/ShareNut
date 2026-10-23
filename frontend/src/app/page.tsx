import React from "react";
import LandingLayout from "@/components/layout/LandingLayout";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingTechStack } from "@/components/landing/LandingTechStack";
import { LandingSecurity } from "@/components/landing/LandingSecurity";
import { LandingFaq } from "@/components/landing/LandingFaq";

export default function LandingPage() {
  return (
    <LandingLayout>
      <LandingHero />
      <LandingHowItWorks />
      <LandingTechStack />
      <LandingSecurity />
      <LandingFaq />
    </LandingLayout>
  );
}
