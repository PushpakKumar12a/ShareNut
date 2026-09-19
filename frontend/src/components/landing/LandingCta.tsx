"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="px-4 sm:px-6 py-20 relative">
      <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 sm:p-14 text-center space-y-6 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Ready to Transfer?</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
          Start Streaming Files Right Now
        </h2>
        <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          No signups. No subscriptions. No cloud storage limits. Drop files directly on the home page or open the station dashboard to connect in seconds.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-11 px-8 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm gap-2 shadow-xs cursor-pointer">
              Launch Station Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
