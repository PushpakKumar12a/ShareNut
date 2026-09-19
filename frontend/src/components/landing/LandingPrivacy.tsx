"use client";

import React from "react";
import Link from "next/link";
import {
  ServerOff,
  EyeOff,
  Lock,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PRIVACY_POINTS = [
  {
    icon: ServerOff,
    title: "Zero Server Storage",
    description:
      "Files stream directly from your browser to your recipient's browser. Exactly 0 bytes of your files are ever stored or cached on our servers.",
  },
  {
    icon: EyeOff,
    title: "No Accounts or Tracking",
    description:
      "You don't need to sign up, provide an email, or log in. We use zero tracking cookies, advertising pixels, or analytics trackers.",
  },
  {
    icon: Lock,
    title: "End-to-End Encrypted",
    description:
      "All transfers are automatically encrypted directly between connected devices. Nobody in the middle — not your ISP, Wi-Fi provider, or ShareNut — can see your files.",
  },
  {
    icon: RotateCcw,
    title: "Zero Persistent Logs",
    description:
      "Our server only helps browsers find each other to connect. Temporary connection data exists solely in volatile memory and is instantly erased when you close the tab.",
  },
];

export function LandingPrivacy() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          <span>Privacy Policy</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
          Privacy Policy
        </h1>
        <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          We don&apos;t collect, store, track, or sell your data. Here is everything you need to know in plain English.
        </p>
      </div>

      {/* 4 Simple Points */}
      <div className="space-y-4">
        {PRIVACY_POINTS.map((point) => {
          const Icon = point.icon;

          return (
            <div
              key={point.title}
              className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white/90 shadow-2xs flex items-start gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                  {point.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {point.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Open Source Assurance */}
      <div className="text-center space-y-4 pt-2">
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          ShareNut is 100% open source. Anyone can inspect and verify our code on GitHub to confirm our privacy commitments.
        </p>

        <div>
          <Link href="/dashboard">
            <Button className="h-10 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl gap-2 shadow-xs shadow-amber-600/20 cursor-pointer">
              <span>Open ShareNut Station</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
