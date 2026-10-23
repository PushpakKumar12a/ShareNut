import React from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col justify-between selection:bg-orange-100 selection:text-orange-900 relative">
      <LandingNav />
        <main className="flex-1">
          {children}
        </main>
      <LandingFooter />
    </div>
  );
}
