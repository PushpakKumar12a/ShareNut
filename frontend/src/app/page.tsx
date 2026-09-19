"use client";

import React from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900 relative">
      <LandingNav />
      <LandingHero />
      <LandingHowItWorks />
      <LandingFooter />
    </div>
  );
}
