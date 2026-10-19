"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  badge: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-sharenut",
    question: "What is ShareNut and how does it work?",
    answer:
      "ShareNut streams files directly between web browsers using WebRTC peer-to-peer data channels. Your files travel straight to the recipient over encrypted local or internet connections without ever being uploaded to a cloud server.",
    badge: "Direct P2P",
  },
  {
    id: "no-account-needed",
    question: "Do I or the receiver need to create an account or install an app?",
    answer:
      "No. ShareNut works entirely inside your existing web browser with zero sign-ups, accounts, passwords, or app installations required.",
    badge: "Zero Sign-Up",
  },
  {
    id: "unlimited-file-size",
    question: "Is there any limit on how large my files can be?",
    answer:
      "No. There are zero file size limits. Thanks to OPFS direct-to-disk chunk streaming, you can transfer small photos or 50 GB+ videos without browser memory crashes or artificial paywalls.",
    badge: "Unlimited",
  },
  {
    id: "is-it-safe",
    question: "Is it secure and private? Can anyone intercept my files?",
    answer:
      "Yes. All transfers are end-to-end encrypted with DTLS 1.3 (AES-GCM 256). Every 64 KB chunk is verified using cryptographic SHA-256 hashes. ShareNut servers only negotiate the initial connection and never see or store your files.",
    badge: "DTLS 1.3",
  },
  {
    id: "cross-platform",
    question: "Can I transfer files between different devices and platforms?",
    answer:
      "Yes. ShareNut works seamlessly across iPhone, iPad, Android, Mac, Windows, and Linux on any modern browser. You can even connect instantly by scanning a QR code with your mobile camera.",
    badge: "Cross-Platform",
  },
];

export function LandingFaq() {
  const [expandedId, setExpandedId] = useState<string | null>("what-is-sharenut");

  const toggleItem = (id: string) => {
    setExpandedId((currentId) => (currentId === id ? null : id));
  };

  return (
    <section id="faq" className="px-4 sm:px-6 py-16 sm:py-20 border-t border-orange-900/10 bg-[#faf8f5] relative scroll-mt-14">
      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12">
        {/* Top Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-800 text-xs font-medium shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
            <span>Help &amp; Answers</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-heading">
            Frequently Asked Questions
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Clear, simple answers to common questions about sharing files with ShareNut.
          </p>
        </div>

      {/* Clean Accordion Questions List */}
      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? "bg-white border-orange-300 shadow-xs ring-1 ring-orange-500/10"
                  : "bg-white/90 border-slate-200/90 hover:border-slate-300 hover:bg-white"
              }`}
            >
              {/* Accordion Trigger */}
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isExpanded}
                className="w-full text-left px-4 sm:px-6 py-4.5 flex items-start sm:items-center justify-between gap-4 cursor-pointer focus:outline-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                    {item.question}
                  </span>
                  <span className="inline-flex items-center self-start sm:self-auto text-[10px] font-medium text-orange-800 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded shrink-0">
                    {item.badge}
                  </span>
                </div>

                <div
                  className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isExpanded
                      ? "bg-orange-50 border-orange-200 text-orange-700 rotate-180"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-4.5 pt-1 border-t border-slate-100 animate-in fade-in duration-150">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ready to Send Files Callout Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/70 via-white to-orange-50/40 space-y-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-2xs">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-800 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-orange-600" />
            <span>Ready to try it?</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-heading">
            Send a file to anyone in seconds
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Open the station, share your 5-letter room code or scan the QR code, and start transferring files directly between devices with zero sign-up.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-10 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl gap-2 shadow-xs shadow-orange-600/20 cursor-pointer">
              <span>Open ShareNut Station</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/about" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
            >
              <span>Our Story</span>
            </Button>
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}
