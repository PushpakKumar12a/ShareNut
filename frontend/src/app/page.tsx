"use client";

import React from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingTechStack } from "@/components/landing/LandingTechStack";
import { LandingSecurity } from "@/components/landing/LandingSecurity";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col justify-between selection:bg-orange-100 selection:text-orange-900 relative">
      <LandingNav />
      <LandingHero />
      <LandingHowItWorks />
      <LandingTechStack />
      <LandingSecurity />
      <LandingFaq />
      <LandingFooter />
    </div>
  );
}
