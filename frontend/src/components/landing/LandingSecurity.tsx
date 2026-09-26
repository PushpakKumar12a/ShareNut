"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  ServerOff,
  Fingerprint,
  Wifi,
  Cloud,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecurityPillar {
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}

const SECURITY_PILLARS: SecurityPillar[] = [
  {
    title: "DTLS 1.3 Encryption",
    badge: "Hardware Ciphers",
    description:
      "All WebRTC data channels enforce DTLS 1.3 (AES-GCM 256) at the transport layer. ISPs, Wi-Fi operators, or network relays cannot decrypt in-flight data.",
    icon: Lock,
  },
  {
    title: "Zero-Knowledge Relay",
    badge: "0 Bytes Stored",
    description:
      "The signaling server only exchanges lightweight ICE candidate manifests (< 2 KB). File payloads flow directly between browsers and never touch cloud disks.",
    icon: ServerOff,
  },
  {
    title: "SHA-256 Block Fingerprinting",
    badge: "Bit-for-Bit Audit",
    description:
      "Every 64 KB chunk is verified against its cryptographic SHA-256 root hash in real time using the native Web Crypto API. Corrupt chunks are re-requested instantly.",
    icon: Fingerprint,
  },
  {
    title: "Air-Gapped LAN Support",
    badge: "Gigabit Local Route",
    description:
      "When both devices share the same local network, transfers route directly over LAN at full hardware speed without ever traversing the public Internet.",
    icon: Wifi,
  },
];

const COMPARISON_POINTS = [
  {
    feature: "Data Storage",
    cloud: "Stored on centralized 3rd-party servers & S3 buckets",
    p2p: "100% in-browser memory — 0 bytes retained on servers",
  },
  {
    feature: "File Size Limits",
    cloud: "Artificially capped (2 GB / 5 GB) behind paywalls",
    p2p: "Completely unlimited — transfer 100 GB+ without limits",
  },
  {
    feature: "Transfer Latency",
    cloud: "Double-hop: Sender uploads to cloud, then receiver downloads",
    p2p: "Zero-hop: Receiver streams simultaneously as sender drops",
  },
  {
    feature: "Privacy & Access",
    cloud: "Corporate servers can inspect, log, or index files",
    p2p: "Direct DTLS 1.3 encryption — only connected devices hold keys",
  },
  {
    feature: "Accounts & Tracking",
    cloud: "Requires registration, emails, passwords & session tracking",
    p2p: "Zero sign-in required — instant anonymous ephemeral rooms",
  },
];

export function LandingSecurity() {
  return (
    <section id="security" className="px-4 sm:px-6 py-16 sm:py-20 max-w-6xl mx-auto space-y-16">
      {/* Top Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
          <span>Zero-Knowledge Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-heading leading-tight">
          Security by Design, <span className="text-amber-600">Not by Promise</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Most cloud file transfer services ask you to trust their servers. ShareNut eliminates the server from the data path entirely with direct device-to-device streaming.
        </p>
      </div>

      {/* 4 Pillars Grid (Clean, readable warm cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {SECURITY_PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-xs group"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-700 flex items-center justify-center shadow-2xs group-hover:bg-amber-100/80 group-hover:scale-105 transition-all">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50/80 px-2.5 py-0.5 rounded-full border border-amber-200/70">
                    {pillar.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    {pillar.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison: Side-by-Side Dual Spec Cards */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <span>Direct Comparison</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading tracking-tight">
            Centralized Cloud vs. ShareNut P2P Mesh
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Compare how standard cloud drives handle your files compared to ShareNut&apos;s direct browser-to-browser WebRTC pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Card: Traditional Cloud */}
          <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 sm:p-7 space-y-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-heading">
                      Traditional Cloud Drives
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Google Drive, WeTransfer, Dropbox
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 rounded-full">
                  Centralized
                </span>
              </div>

              <div className="space-y-3.5">
                {COMPARISON_POINTS.map((item) => (
                  <div key={item.feature} className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {item.feature}
                    </span>
                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="h-4 w-4 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                      <span>{item.cloud}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
              Summary: Requires storing plain files on remote corporate disks with bandwidth &amp; size paywalls.
            </div>
          </div>

          {/* Right Card: ShareNut Mesh (Highlighted Amber Theme) */}
          <div className="rounded-2xl border-2 border-amber-500 bg-white p-6 sm:p-7 space-y-6 flex flex-col justify-between shadow-md ring-4 ring-amber-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between pb-3.5 border-b border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/90 p-1.5 shadow-2xs">
                    <Image
                      src="/sharenut-logo.png"
                      alt="ShareNut Logo"
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-heading">
                      ShareNut P2P Mesh
                    </h3>
                    <p className="text-[11px] text-amber-700 font-medium">
                      Direct Hardware-to-Hardware Pipeline
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                  Zero-Knowledge
                </span>
              </div>

              <div className="space-y-3.5">
                {COMPARISON_POINTS.map((item) => (
                  <div key={item.feature} className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-900/60 uppercase tracking-wider block">
                      {item.feature}
                    </span>
                    <div className="flex items-start gap-2.5 text-xs text-slate-800 font-medium">
                      <div className="h-4 w-4 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                      <span>{item.p2p}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-amber-100/80 flex items-center justify-between text-[11px] text-emerald-700 font-semibold relative z-10">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Direct SCTP DataChannel
              </span>
              <span>100% Encrypted &amp; Private</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Card */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/60 p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/25 mx-auto">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <div className="space-y-1.5 max-w-lg mx-auto">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
            Experience Zero-Knowledge Sharing
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            No accounts, no email required, no cloud relays. Send unlimited files directly between your devices right now.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/dashboard">
            <Button className="h-10 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm shadow-amber-600/20 gap-2 cursor-pointer transition-all active:scale-95">
              <span>Launch Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
