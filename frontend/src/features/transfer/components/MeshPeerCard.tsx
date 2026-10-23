"use client";

import React from "react";
import {
  Laptop,
  Smartphone,
  Monitor,
  CheckCircle2,
  ArrowDown,
  Clock,
  Wifi,
  HardDrive,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  formatSize,
  formatSpeed,
} from "@/features/transfer/components/transferUtils";
import type { MeshPeerProgress } from "@/features/transfer/engine/engineTypes";

export interface MeshPeerCardProps {
  peer: MeshPeerProgress;
  className?: string;
}

const getDeviceIcon = (model?: string) => {
  const normalized = (model || "").toLowerCase();
  if (normalized.includes("mobile") || normalized.includes("phone") || normalized.includes("android") || normalized.includes("ios")) {
    return <Smartphone className="h-4 w-4" />;
  }
  if (normalized.includes("mac") || normalized.includes("laptop")) {
    return <Laptop className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
};

export function MeshPeerCard({ peer, className = "" }: MeshPeerCardProps) {
  const isCompleted = peer.status === "completed" || peer.progress >= 100;
  const isTransferring = peer.status === "transferring";
  const isPaused = peer.status === "paused";

  const initials = peer.name
    ? peer.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "PE"
    : "PE";

  return (
    <Card
      className={cn(
        "rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50/90 transition-all",
        className
      )}
    >
      <CardContent className="p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 font-mono text-[11px] font-bold text-slate-700 shadow-2xs">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {peer.name}
                </span>
                {peer.deviceModel && (
                  <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white">
                    {getDeviceIcon(peer.deviceModel)}
                    <span className="truncate max-w-[120px]">{peer.deviceModel}</span>
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                <span className="flex items-center gap-1 text-slate-600">
                  <Wifi className="h-3 w-3 text-emerald-600" />
                  <span>Direct P2P</span>
                </span>
                <span>•</span>
                <span className="text-slate-500">{peer.latencyMs}ms latency</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {isCompleted ? (
              <Badge variant="completed" className="gap-1.5 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Complete</span>
              </Badge>
            ) : isTransferring ? (
              <Badge variant="downloading" className="gap-1.5 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span>Downloading</span>
              </Badge>
            ) : isPaused ? (
              <Badge variant="paused" className="gap-1.5">
                <Clock className="h-3 w-3 text-slate-500" />
                <span>Paused</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 text-slate-600 font-semibold text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Connected</span>
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-slate-500 font-medium">
              {formatSize(peer.transferredBytes)} / {formatSize(peer.totalBytes)}
            </span>
            <span className="font-bold text-slate-800">
              {peer.progress}%
            </span>
          </div>

          <Progress
            value={peer.progress}
            className="h-2 bg-slate-200/80"
            indicatorClassName={
              isCompleted
                ? "bg-emerald-500"
                : isTransferring
                ? "bg-linear-to-r from-orange-500 to-orange-600"
                : "bg-slate-400"
            }
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-0.5 border-t border-slate-200/60">
          <div className="flex items-center gap-1 text-slate-600">
            <HardDrive className="h-3 w-3 text-slate-400" />
            <span>
              {peer.chunksDownloaded} / {peer.totalChunks} chunks
            </span>
          </div>

          {peer.speedBytesPerSec > 0 && (
            <div className="flex items-center gap-1 text-orange-700 font-semibold">
              <ArrowDown className="h-3 w-3" />
              <span>{formatSpeed(peer.speedBytesPerSec)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
