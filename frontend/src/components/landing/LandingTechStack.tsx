"use client";

import React from "react";
import {
  Network,
  Server,
  HardDrive,
  Wifi,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface ArchPillar {
  id: string;
  category: "Data Plane" | "Control Plane" | "Client Engine" | "Security";
  name: string;
  role: string;
  description: string;
  spec: string;
  tag: string;
  icon: React.ElementType;
}

export const ARCH_PILLARS: ArchPillar[] = [
  {
    id: "webrtc",
    category: "Data Plane",
    name: "WebRTC RTCDataChannel",
    role: "Zero-Server P2P Transport",
    description:
      "Direct SCTP binary streams running over DTLS 1.3 encryption. Transfers flow straight between browsers with automatic ICE NAT traversal via STUN/TURN.",
    spec: "RFC 8831 / RFC 8832",
    tag: "UDP / SCTP Direct",
    icon: Network,
  },
  {
    id: "fastapi",
    category: "Control Plane",
    name: "FastAPI Signaling Engine",
    role: "Ephemeral Session Broker",
    description:
      "High-throughput asynchronous ASGI gateway brokering SDP offer/answer exchanges and ICE candidate trickle over low-latency WebSockets.",
    spec: "Python 3.12+ ASGI",
    tag: "Zero-Payload Relay",
    icon: Server,
  },
  {
    id: "opfs",
    category: "Client Engine",
    name: "OPFS Direct-to-Disk Storage",
    role: "Zero-Heap Chunk Streaming",
    description:
      "Origin Private File System writes 64 KB binary chunks directly into local device storage from dedicated Web Worker threads, bypassing browser heap memory limits.",
    spec: "W3C File System Standard",
    tag: "Unlimited File Size",
    icon: HardDrive,
  },
  {
    id: "lan-turbo",
    category: "Data Plane",
    name: "LAN Turbo Route Detection",
    role: "Local Network Wire-Speed",
    description:
      "Subnet route analyzer automatically identifies when two peers share the same local Wi-Fi or Ethernet switch, achieving maximum LAN bandwidth.",
    spec: "Local Subnet Discovery",
    tag: "Sub-1ms Latency",
    icon: Wifi,
  },
  {
    id: "crypto",
    category: "Security",
    name: "DTLS 1.3 Hardware Ciphers",
    role: "End-to-End Transport Encryption",
    description:
      "Transport-level AES-GCM-256 ciphers negotiated directly between client endpoints. Network relays, ISPs, and Wi-Fi routers cannot decrypt payload bytes.",
    spec: "RFC 8446 (TLS 1.3)",
    tag: "Zero-Knowledge",
    icon: Lock,
  },
  {
    id: "integrity",
    category: "Security",
    name: "Per-Chunk SHA-256 Verification",
    role: "Cryptographic Block Integrity",
    description:
      "Each 64 KB chunk carries a cryptographic SHA-256 hash verified by the receiver Web Worker before persisting to disk. Damaged chunks are rejected and re-requested.",
    spec: "FIPS 180-4 SHA-256",
    tag: "Bit-Perfect Assembly",
    icon: ShieldCheck,
  },
];

export function LandingTechStack() {
  return (
    <section id="architecture" className="px-4 sm:px-6 py-14 sm:py-20 border-t border-orange-900/10 bg-[#faf8f5] relative scroll-mt-16">
      <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight font-heading">
            Decentralized Mesh Architecture
          </h2>
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
            Built from first principles with modern WebRTC specifications, lightweight in-memory signaling, and native browser cryptographic acceleration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ARCH_PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="border-orange-900/10 bg-white hover:border-orange-400/60 hover:shadow-md hover:shadow-orange-900/5 transition-all flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-4 flex flex-col justify-between flex-1">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 border border-orange-200/70 text-orange-700 shadow-2xs">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="downloading" className="font-mono text-[11px]">
                        {item.category}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-stone-900 font-heading">
                        {item.name}
                      </h3>
                      <p className="text-xs text-orange-700 font-medium pt-0.5 font-mono">
                        {item.role}
                      </p>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-orange-900/5 flex items-center justify-between text-[11px] font-mono text-stone-500">
                    <span>{item.spec}</span>
                    <Badge variant="outline" className="font-mono text-[10px] text-stone-800">
                      {item.tag}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
