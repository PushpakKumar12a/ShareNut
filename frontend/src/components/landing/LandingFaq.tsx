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
      "ShareNut streams files directly between web browsers using secure peer-to-peer connections. Your files go straight to the recipient without uploading to a cloud server.",
    badge: "Direct P2P",
  },
  {
    id: "no-account-needed",
    question: "Do I or the receiver need to create an account or install an app?",
    answer:
      "No. ShareNut works entirely in your browser with zero sign-ups, accounts, or app installations.",
    badge: "No Sign-Up",
  },
  {
    id: "unlimited-file-size",
    question: "Is there any limit on how large my files can be?",
    answer:
      "No. There are zero file size limits — transfer small documents or 50 GB+ videos freely without paywalls.",
    badge: "Unlimited",
  },
  {
    id: "is-it-safe",
    question: "Is it safe? Can anyone else see or intercept my files?",
    answer:
      "Yes. All transfers are end-to-end encrypted directly between devices. Nobody in between, including ShareNut, can view your files.",
    badge: "Encrypted",
  },
  {
    id: "why-faster",
    question: "Why is it faster than cloud services like Google Drive or WeTransfer?",
    answer:
      "The recipient downloads the file live as you send it, skipping the slow cloud upload step. On the same Wi-Fi, it transfers at full local network speed.",
    badge: "Fast",
  },
  {
    id: "cross-platform",
    question: "Can I send files between different devices, like an iPhone and a Windows PC?",
    answer:
      "Yes. It works across iPhone, Android, Mac, Windows, and Linux on any modern browser.",
    badge: "Cross-Platform",
  },
  {
    id: "qr-code-sharing",
    question: "How do I share files with my phone using the QR code?",
    answer:
      "Click the QR code button in the top bar, scan it with your phone's camera, and start sending files instantly.",
    badge: "QR Connect",
  },
  {
    id: "keep-tab-open",
    question: "Do both devices need to keep the browser tab open during the transfer?",
    answer:
      "Yes. Because data streams directly between devices in real time, keep both browser tabs open until the transfer reaches 100%.",
    badge: "Live Stream",
  },
  {
    id: "connection-drop",
    question: "What happens if my Wi-Fi drops or hiccups during a transfer?",
    answer:
      "ShareNut automatically resumes and re-sends only the missing pieces, so you never have to start over from scratch.",
    badge: "Auto-Resume",
  },
  {
    id: "group-sharing",
    question: "Can I share files with multiple friends or colleagues at the same time?",
    answer:
      "Yes. Anyone who joins your room code can receive the file simultaneously.",
    badge: "Group Sharing",
  },
  {
    id: "logs-and-history",
    question: "Does ShareNut keep a record or log of my file names or transfers?",
    answer:
      "Never. All room and transfer data is kept only in temporary memory and disappears the moment you close the tab.",
    badge: "Zero Logs",
  },
  {
    id: "is-it-free",
    question: "Is ShareNut completely free to use?",
    answer:
      "Yes, 100% free and open source with no ads, subscriptions, or hidden limits.",
    badge: "Free",
  },
];

export function LandingFaq() {
  const [expandedId, setExpandedId] = useState<string | null>("what-is-sharenut");

  const toggleItem = (id: string) => {
    setExpandedId((currentId) => (currentId === id ? null : id));
  };

  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 max-w-4xl mx-auto space-y-10">
      {/* Top Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          <span>Help &amp; Answers</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-heading">
          Frequently Asked Questions
        </h1>

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
                  ? "bg-white border-amber-300 shadow-xs ring-1 ring-amber-500/10"
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
                  <span className="inline-flex items-center self-start sm:self-auto text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded shrink-0">
                    {item.badge}
                  </span>
                </div>

                <div
                  className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isExpanded
                      ? "bg-amber-50 border-amber-200 text-amber-700 rotate-180"
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
      <div className="p-6 sm:p-8 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 space-y-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-2xs">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
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
            <Button className="w-full sm:w-auto h-10 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl gap-2 shadow-xs shadow-amber-600/20 cursor-pointer">
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
    </section>
  );
}
