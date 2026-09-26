"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Network,
  Server,
  HardDrive,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
} from "lucide-react";

interface TechComponent {
  id: string;
  category: "Data Plane" | "Control Plane" | "Client Engine";
  name: string;
  role: string;
  description: string;
  spec: string;
  tag: string;
  icon: React.ElementType;
}

const TECH_STACK: TechComponent[] = [
  {
    id: "webrtc",
    category: "Data Plane",
    name: "WebRTC RTCDataChannel",
    role: "Zero-Server P2P Transport",
    description:
      "Direct SCTP binary streams running over DTLS 1.3 encryption. Bypasses cloud servers completely with automatic ICE NAT traversal (STUN/TURN).",
    spec: "RFC 8831 / RFC 8832",
    tag: "UDP / SCTP Direct",
    icon: Network,
  },
  {
    id: "fastapi",
    category: "Control Plane",
    name: "FastAPI Asynchronous Engine",
    role: "Signaling & Manifest Exchange",
    description:
      "High-throughput Python ASGI gateway that brokers SDP offer/answer exchanges and room pairing over persistent, low-latency WebSockets.",
    spec: "Python 3.12+ ASGI",
    tag: "Zero-Payload Relay",
    icon: Server,
  },
  {
    id: "in-memory",
    category: "Control Plane",
    name: "In-Memory Room Registry",
    role: "Zero-Database Session Routing",
    description:
      "Tracks active signaling rooms and connected peers directly in Python async memory. Ephemeral state automatically drops on disconnect with zero database overhead.",
    spec: "Pure In-Memory Registry",
    tag: "Zero External DB",
    icon: Layers,
  },
  {
    id: "opfs",
    category: "Client Engine",
    name: "OPFS Direct-to-Disk Streaming",
    role: "Zero-RAM Chunk Storage",
    description:
      "Streams verified 64 KB binary chunks directly into the browser's native Origin Private File System (OPFS) at exact byte offsets, eliminating heap RAM spikes even with 50 GB+ transfers.",
    spec: "W3C File System Access / OPFS",
    tag: "Direct-to-Disk",
    icon: HardDrive,
  },
  {
    id: "crypto",
    category: "Data Plane",
    name: "Web Crypto API (SHA-256)",
    role: "Bit-for-Bit Integrity Audit",
    description:
      "Hardware-accelerated cryptographic primitives execute client-side checksum validation on every chunk, ensuring 100% tamper-proof file delivery.",
    spec: "SubtleCrypto Native",
    tag: "256-Bit Root Digest",
    icon: Lock,
  },
  {
    id: "react-next",
    category: "Client Engine",
    name: "Zustand & Next.js 16",
    role: "Reactive Transfer Manager",
    description:
      "Deterministic client state machine orchestrating file chunking, transfer queues, backpressure throttling, and live throughput telemetry.",
    spec: "React 19 / Turbopack",
    tag: "Zustand State Engine",
    icon: Cpu,
  },
];

export function LandingTechStack() {
  const [filter, setFilter] = useState<"All" | "Data Plane" | "Control Plane" | "Client Engine">("All");

  const filteredItems =
    filter === "All" ? TECH_STACK : TECH_STACK.filter((item) => item.category === filter);

  return (
    <section id="tech-stack" className="px-4 sm:px-6 py-14 sm:py-20 border-t border-amber-900/10 bg-[#faf8f5] relative">
      <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-mono shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span>Engineering Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight font-heading">
            Decentralized Mesh Architecture
          </h1>
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
            Built from first principles with modern WebRTC specifications, lightweight in-memory signaling, and native browser cryptographic acceleration.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            {(["All", "Data Plane", "Control Plane", "Client Engine"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  filter === cat
                    ? "bg-amber-600 text-white shadow-xs shadow-amber-600/25 font-semibold"
                    : "bg-white text-stone-600 hover:text-stone-900 border border-amber-900/10 hover:bg-amber-50/50 hover:border-amber-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-6 rounded-2xl border border-amber-900/10 bg-white space-y-4 hover:border-amber-400/60 hover:shadow-md hover:shadow-amber-900/5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/70 text-amber-700 shadow-2xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-mono font-medium text-amber-800 bg-amber-50/80 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                      {item.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-stone-900 font-heading">
                      {item.name}
                    </h3>
                    <p className="text-xs text-amber-700 font-medium pt-0.5 font-mono">
                      {item.role}
                    </p>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-amber-900/5 flex items-center justify-between text-[11px] font-mono text-stone-500">
                  <span>{item.spec}</span>
                  <span className="font-semibold text-stone-800 bg-stone-50 px-2 py-0.5 rounded border border-stone-200/70">
                    {item.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architecture Data vs Control Plane Summary Banner */}
        <div className="rounded-2xl border border-amber-900/10 bg-white p-6 sm:p-7 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-600" />
                <span className="text-xs font-mono font-bold text-amber-800 uppercase tracking-wider">
                  Strict Architectural Separation
                </span>
              </div>
              <h4 className="text-lg font-bold text-stone-900 font-heading">
                Zero Data Touches the Server Infrastructure
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                The control plane (FastAPI in-memory engine) solely negotiates session tokens and SDP/ICE manifests over WebSockets. Once connected, 100% of the binary transfer flows directly peer-to-peer over DTLS-encrypted SCTP channels with zero database or intermediate storage.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5">
              <div className="flex items-center gap-2.5 text-xs font-mono text-emerald-900 bg-emerald-50/80 px-3.5 py-2 rounded-xl border border-emerald-200/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Control Plane: &lt; 2 KB In-Memory SDP</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-mono text-amber-950 bg-amber-50/80 px-3.5 py-2 rounded-xl border border-amber-200/80">
                <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Data Plane: Direct Hardware Pipe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
