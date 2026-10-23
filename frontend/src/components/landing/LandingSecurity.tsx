"use client";

import Image from "next/image";
import {
  Cloud,
  Check,
  X,
  Lock,
  ServerOff,
  Fingerprint,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface SecurityPillar {
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}

export const SECURITY_PILLARS: SecurityPillar[] = [
  {
    title: "DTLS 1.3 Transport Encryption",
    badge: "Hardware Ciphers",
    description:
      "All WebRTC data channels enforce DTLS 1.3 (AES-GCM 256) at the transport layer. ISPs, public Wi-Fi operators, or intermediate network relays cannot decrypt in-flight data.",
    icon: Lock,
  },
  {
    title: "Zero-Knowledge Relay",
    badge: "0 Bytes Stored",
    description:
      "The signaling server only exchanges lightweight ICE candidate manifests (< 2 KB). File payloads flow directly between browsers and never touch cloud disks or databases.",
    icon: ServerOff,
  },
  {
    title: "SHA-256 Block Fingerprinting",
    badge: "Cryptographic Hash",
    description:
      "Incoming 64 KB chunks are individually verified against their SHA-256 hash in a background Web Worker before being written to disk, preventing tampering or bit-rot.",
    icon: Fingerprint,
  },
  {
    title: "LAN Subnet Boundary Isolation",
    badge: "Air-Gapped LAN",
    description:
      "When two devices share the same local network, transfers remain inside your physical router boundary without transiting the public internet or external gateways.",
    icon: Wifi,
  },
];

export const COMPARISON_POINTS = [
  {
    feature: "Data Storage Location",
    cloud: "Stored on remote corporate hard drives & data centers",
    p2p: "0 bytes stored — streams directly memory-to-disk between peers",
  },
  {
    feature: "Encryption Key Ownership",
    cloud: "Server holds decryption keys (accessible by vendor / subpoena)",
    p2p: "Ephemeral client-side DTLS 1.3 keys generated only in browser RAM",
  },
  {
    feature: "File Size Restrictions",
    cloud: "Strict upload caps (usually 2 GB–10 GB) with paywalls",
    p2p: "Unlimited file size — bounded only by your local physical drive",
  },
  {
    feature: "Data Path & Routing",
    cloud: "Uploaded to overseas cloud server, then re-downloaded",
    p2p: "Direct peer-to-peer pipe over local Wi-Fi or direct UDP stream",
  },
  {
    feature: "Privacy & User Accounts",
    cloud: "Mandatory email registration, profile tracking, and telemetry",
    p2p: "Zero accounts, zero tracking cookies, zero persistent databases",
  },
];

export function LandingSecurity() {
  return (
    <section id="security" className="px-4 sm:px-6 py-16 sm:py-20 border-t border-orange-900/10 bg-white relative scroll-mt-16">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-heading leading-tight">
            Security by Design, <span className="text-orange-600">Not by Promise</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Most cloud file transfer services ask you to trust their servers. ShareNut eliminates the server from the data path entirely with direct device-to-device streaming.
          </p>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {SECURITY_PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Card
              key={pillar.title}
              className="border-slate-200/80 bg-white hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs group"
            >
              <CardContent className="p-5 sm:p-6 space-y-3.5 flex flex-col justify-between flex-1">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-200/70 text-orange-700 flex items-center justify-center shadow-2xs group-hover:bg-orange-100/80 group-hover:scale-105 transition-all">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="downloading" className="font-mono text-[10px]">
                    {pillar.badge}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    {pillar.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-3 py-1 font-semibold text-xs">
            <span>Direct Comparison</span>
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading tracking-tight">
            Centralized Cloud vs. ShareNut P2P Mesh
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Compare how standard cloud drives handle your files compared to ShareNut&apos;s direct browser-to-browser WebRTC pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <Card className="border-slate-200/90 bg-white/90 shadow-xs flex flex-col justify-between">
            <CardContent className="p-6 sm:p-7 space-y-6 flex flex-col justify-between flex-1">
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
                  <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-semibold text-[11px]">
                    Centralized
                  </Badge>
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
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500 bg-white shadow-md ring-4 ring-orange-500/5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

            <CardContent className="p-6 sm:p-7 space-y-6 flex flex-col justify-between flex-1 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 border border-orange-200/90 p-1.5 shadow-2xs">
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
                      <p className="text-[11px] text-orange-700 font-medium">
                        Direct Hardware-to-Hardware Pipeline
                      </p>
                    </div>
                  </div>
                  <Badge variant="completed" className="font-semibold text-[11px]">
                    Zero-Knowledge
                  </Badge>
                </div>

                <div className="space-y-3.5">
                  {COMPARISON_POINTS.map((item) => (
                    <div key={item.feature} className="space-y-1">
                      <span className="text-[11px] font-bold text-orange-900/60 uppercase tracking-wider block">
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

              <div className="pt-4 border-t border-orange-100/80 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Direct SCTP DataChannel
                </span>
                <span>100% Encrypted &amp; Private</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </section>
  );
}
