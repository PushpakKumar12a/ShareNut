"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface FaqEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  tag: string;
}

export const FAQ_DATA: FaqEntry[] = [
  {
    id: "what-is-sharenut",
    category: "General",
    question: "What is ShareNut and how does it work?",
    answer:
      "ShareNut streams files directly between web browsers using WebRTC peer-to-peer data channels. Your files travel straight to the recipient over encrypted local or internet connections without ever being uploaded to a cloud server.",
    tag: "Direct P2P",
  },
  {
    id: "no-account-needed",
    category: "General",
    question: "Do I or the receiver need to create an account or install an app?",
    answer:
      "No. ShareNut works entirely inside your existing web browser with zero sign-ups, accounts, passwords, or app installations required. Simply open the page and share the 5-letter room code or QR code.",
    tag: "Zero Sign-Up",
  },
  {
    id: "unlimited-file-size",
    category: "Storage & Files",
    question: "Is there any limit on how large my files can be?",
    answer:
      "No. There are zero artificial file size limits. Thanks to OPFS (Origin Private File System) direct-to-disk chunk streaming, you can transfer small photos or 50 GB+ raw videos without browser memory crashes or artificial paywalls.",
    tag: "Unlimited Size",
  },
  {
    id: "lan-turbo-explained",
    category: "Speed & Network",
    question: "How does LAN Turbo mode work when on the same Wi-Fi?",
    answer:
      "When both devices are on the same local Wi-Fi or Ethernet network, ShareNut automatically detects the shared subnet and routes data directly between their local IP addresses at full router wire speed, completely bypassing internet upload and download bottlenecks.",
    tag: "Gigabit Wire Speed",
  },
  {
    id: "security-encryption",
    category: "Security & Privacy",
    question: "Is it secure and private? Can anyone intercept my files?",
    answer:
      "Yes. All transfers are end-to-end encrypted with DTLS 1.3 (AES-GCM 256). Every 64 KB chunk is verified using cryptographic SHA-256 hashes. ShareNut servers only negotiate the initial connection and never see, store, or relay your file data.",
    tag: "DTLS 1.3 AES-GCM",
  },
  {
    id: "cross-platform-support",
    category: "General",
    question: "Can I transfer files between different devices and operating systems?",
    answer:
      "Yes. ShareNut works seamlessly across iPhone, iPad, Android, macOS, Windows, and Linux on any modern browser (Chrome, Safari, Firefox, Edge, Brave). You can connect instantly by scanning a QR code with your mobile camera.",
    tag: "Cross-Platform",
  },
  {
    id: "connection-drops",
    category: "Speed & Network",
    question: "What happens if a tab closes or the network disconnects during transfer?",
    answer:
      "Because WebRTC streams in real-time, closing the sender tab terminates the active data channel. ShareNut tracks chunk progress automatically, so when both peers reconnect to the same room, verified blocks are retained and only remaining missing blocks are streamed.",
    tag: "Resilient Chunking",
  },
  {
    id: "different-networks",
    category: "Speed & Network",
    question: "Does ShareNut work across different networks or over cellular data?",
    answer:
      "Yes. When peers are on different networks, ShareNut uses standard STUN protocols to automatically traverse NATs and firewalls, establishing direct encrypted UDP connections between the devices anywhere on the internet.",
    tag: "Global ICE Traversal",
  },
  {
    id: "disk-storage-cleanup",
    category: "Storage & Files",
    question: "Where are downloaded files stored on my device?",
    answer:
      "Incoming blocks are staged in the browser's high-speed Origin Private File System sandbox. When the transfer reaches 100% and passes SHA-256 checksum verification, the file is assembled and triggered as a standard browser download into your Downloads folder.",
    tag: "OPFS Direct I/O",
  },
  {
    id: "server-logs-data",
    category: "Security & Privacy",
    question: "What data does the ShareNut server see or log?",
    answer:
      "Exactly 0 bytes of your files ever touch the server. The signaling server operates entirely in volatile server memory, brokering lightweight ICE candidates (< 2 KB) during handshake. When you leave the room, the session state is instantly purged with zero database records.",
    tag: "Zero Server Logs",
  },
];

export function LandingFaq() {
  const featuredFaqs = FAQ_DATA.slice(0, 5);
  const [expandedId, setExpandedId] = useState<string | null>("what-is-sharenut");

  const toggleItem = (id: string) => {
    setExpandedId((currentId) => (currentId === id ? null : id));
  };

  return (
    <section id="faq" className="px-4 sm:px-6 py-16 sm:py-20 border-t border-orange-900/10 bg-[#faf8f5] relative scroll-mt-16">
      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-heading">
            Frequently Asked Questions
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Clear, simple answers to common questions about sharing files with ShareNut.
          </p>
        </div>

      <div className="space-y-3">
        {featuredFaqs.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <Card
              key={item.id}
              className={`transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? "bg-white border-orange-300 shadow-xs ring-1 ring-orange-500/10"
                  : "bg-white/90 border-slate-200/90 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <CardContent className="p-0">
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
                    <Badge variant="outline" className="text-[10px] font-mono text-orange-800 bg-orange-50 border-orange-200/80 self-start sm:self-auto shrink-0">
                      {item.tag}
                    </Badge>
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

                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-4.5 pt-1 border-t border-slate-100 animate-in fade-in duration-150">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-orange-200 bg-gradient-to-br from-orange-50/70 via-white to-orange-50/40 shadow-2xs">
        <CardContent className="p-6 sm:p-8 space-y-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
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
        </CardContent>
      </Card>
      </div>
    </section>
  );
}
