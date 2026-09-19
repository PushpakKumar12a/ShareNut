"use client";

import React from "react";
import { Network, Radio } from "lucide-react";
import type { PeerMeshItem } from "./MeshPanel";

interface ConnectedDevicesCardProps {
  meshPeers?: PeerMeshItem[];
  className?: string;
}

export function ConnectedDevicesCard({
  meshPeers = [],
  className = "",
}: ConnectedDevicesCardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3.5 h-full flex flex-col justify-between ${className}`}
    >
      <div className="space-y-3.5">

        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 shadow-2xs">
              <Network className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Connected Devices ({meshPeers.length})
            </span>
          </div>

          {meshPeers.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200/60 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 font-semibold text-[10px] border border-slate-200/60">
              <span>0 Online</span>
            </span>
          )}
        </div>

        {meshPeers.length === 0 ? (
          <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 text-center space-y-2">
            <Radio className="h-5 w-5 text-slate-300 mx-auto animate-pulse" />
            <p className="text-xs font-bold text-slate-700">No devices connected</p>
            <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
              Scan the QR code or enter a peer code above to start streaming.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {meshPeers.map((peer) => (
              <div
                key={peer.rawPeerId || peer.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-700 shadow-2xs">
                    {peer.isSelf ? "YO" : peer.id.replace("#", "").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 font-mono truncate max-w-[110px]">
                        {peer.isSelf ? "Yours" : peer.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                      <span className="text-amber-700 font-semibold">{peer.speed}</span>
                      <span>•</span>
                      <span className="text-emerald-600">{peer.latency}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-600">Connected</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
