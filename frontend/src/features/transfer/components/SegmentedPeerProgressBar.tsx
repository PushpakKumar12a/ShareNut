"use client";

import React, { useState } from "react";
import type { MeshPeerProgress } from "@/features/transfer/engine/engineTypes";
import { formatSpeed, formatSize } from "./transferUtils";

// ponytail: 8 handpicked distinct colors, wraps for 9+ peers
const PEER_COLORS = [
  "#d97706", // amber-600
  "#059669", // emerald-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#2563eb", // blue-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
  "#4f46e5", // indigo-600
];

interface Props {
  peers: MeshPeerProgress[];
  overallProgress: number;
  isWaiting?: boolean;
  isCompleted?: boolean;
  isPaused?: boolean;
  barHeight?: string;
}

export function SegmentedPeerProgressBar({
  peers,
  overallProgress,
  isWaiting = false,
  isCompleted = false,
  isPaused = false,
  barHeight = "h-3",
}: Props) {
  const [hoveredPeer, setHoveredPeer] = useState<string | null>(null);
  const activePeers = peers.filter((p) => !p.isSender);

  // Fallback: no peers or waiting — show single bar
  if (activePeers.length === 0 || isWaiting) {
    return (
      <div
        className={`w-full ${barHeight} rounded-full bg-slate-100 overflow-hidden border border-slate-200/60 p-0.5`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isCompleted
              ? "bg-emerald-500"
              : isWaiting
              ? "bg-amber-400 animate-pulse"
              : isPaused
              ? "bg-amber-400"
              : "bg-linear-to-r from-amber-500 to-amber-600 shadow-xs"
          }`}
          style={{ width: `${isWaiting ? 100 : Math.max(2, overallProgress)}%` }}
        />
      </div>
    );
  }

  // Each peer contributes equally to the bar width (1/N of total)
  // Within their segment, fill is their individual progress
  const segmentWidth = 100 / activePeers.length;

  return (
    <div className="relative">
      <div
        className={`w-full ${barHeight} rounded-full bg-slate-100 overflow-hidden border border-slate-200/60 p-0.5 flex`}
      >
        {activePeers.map((peer, idx) => {
          const color = PEER_COLORS[idx % PEER_COLORS.length];
          const fillPercent = Math.max(2, Math.min(100, peer.progress));
          const peerIsComplete = peer.progress >= 100;

          return (
            <div
              key={peer.peerId}
              className="relative h-full"
              style={{ width: `${segmentWidth}%` }}
              onMouseEnter={() => setHoveredPeer(peer.peerId)}
              onMouseLeave={() => setHoveredPeer(null)}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${fillPercent}%`,
                  backgroundColor: peerIsComplete ? "#10b981" : color,
                  borderRadius:
                    idx === 0 && activePeers.length === 1
                      ? "9999px"
                      : idx === 0
                      ? "9999px 0 0 9999px"
                      : idx === activePeers.length - 1
                      ? "0 9999px 9999px 0"
                      : "0",
                }}
              />
              {/* Segment divider */}
              {idx < activePeers.length - 1 && (
                <div className="absolute right-0 top-0 h-full w-px bg-white/60" />
              )}
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredPeer && (() => {
        const peerIdx = activePeers.findIndex((p) => p.peerId === hoveredPeer);
        const peer = activePeers[peerIdx];
        if (!peer) return null;
        const color = PEER_COLORS[peerIdx % PEER_COLORS.length];
        // Position tooltip roughly above the peer's segment center
        const leftPercent = (peerIdx + 0.5) * segmentWidth;

        return (
          <div
            className="absolute bottom-full mb-2 z-50 pointer-events-none"
            style={{
              left: `${Math.min(85, Math.max(15, leftPercent))}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-[11px] shadow-lg whitespace-nowrap space-y-0.5">
              <div className="flex items-center gap-2 font-bold">
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{peer.name}</span>
              </div>
              <div className="text-slate-300 font-mono">
                {Math.round(peer.progress)}% • {formatSize(peer.transferredBytes)} / {formatSize(peer.totalBytes)}
              </div>
              {peer.speedBytesPerSec > 0 && (
                <div className="text-amber-300 font-mono">
                  ↓ {formatSpeed(peer.speedBytesPerSec)}
                </div>
              )}
              <div className="text-slate-400 capitalize">{peer.status}</div>
            </div>
            {/* Tooltip arrow */}
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
            </div>
          </div>
        );
      })()}

      {/* Peer legend (compact, only when >1 peer) */}
      {activePeers.length > 1 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] font-mono text-slate-500">
          {activePeers.map((peer, idx) => (
            <span key={peer.peerId} className="flex items-center gap-1">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    peer.progress >= 100
                      ? "#10b981"
                      : PEER_COLORS[idx % PEER_COLORS.length],
                }}
              />
              <span className="truncate max-w-[100px]">{peer.name}</span>
              <span className="text-slate-400">{Math.round(peer.progress)}%</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
