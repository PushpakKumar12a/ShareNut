"use client";

import React, { useState } from "react";
import {
  Laptop,
  Smartphone,
  Server,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePeerStore } from "@/features/mesh/peerStore";
import { useEngineState } from "@/features/transfer/engine/EngineContext";
import { ShareSessionDialog } from "@/features/sharing/ShareDialog";
import { useModalStore } from "@/features/ui/modalStore";
import { cn, extractPeerShortId } from "@/lib/utils";

interface DeviceItem {
  id: string;
  name: string;
  shortId: string;
  latency: number;
  transport: string;
  isLocal: boolean;
}

const PAGE_SIZE = 6;

export default function DevicesPage() {
  const { user: currentUser, device: currentDevice } = usePeerStore();
  const engineState = useEngineState();
  const isShareOpen = useModalStore((state) => state.isShareOpen);
  const openShare = useModalStore((state) => state.openShare);
  const closeShare = useModalStore((state) => state.closeShare);
  const [currentPage, setCurrentPage] = useState(1);
  const getDeviceIcon = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("phone") || n.includes("mobile") || n.includes("android") || n.includes("ios") || n.includes("iphone")) {
      return <Smartphone className="h-4 w-4 text-slate-600" />;
    }
    if (n.includes("server") || n.includes("node") || n.includes("cloud")) {
      return <Server className="h-4 w-4 text-slate-600" />;
    }
    return <Laptop className="h-4 w-4 text-slate-600" />;
  };
  const remotePeers = Array.from(engineState.peers.values());
  const allDevices: DeviceItem[] = [
    {
      id: engineState.localPeerId || "local",
      name: `Yours (${currentDevice?.device_name || "Browser"})`,
      shortId: extractPeerShortId(currentUser?.username, engineState.localPeerId),
      latency: 0,
      transport: "Direct SCTP",
      isLocal: true,
    },
    ...remotePeers.map((peer) => {
      const shortId = extractPeerShortId(peer.metadata.username, peer.metadata.peer_id);
      return {
        id: peer.metadata.peer_id,
        name: peer.metadata.device_name || `Node #${shortId}`,
        shortId,
        latency: peer.latencyMs ?? (peer.connectionState === "connected" ? 1 : 0),
        transport: "WebRTC Direct",
        isLocal: false,
      };
    }),
  ];

  const totalDevices = allDevices.length;
  const totalPages = Math.max(1, Math.ceil(totalDevices / PAGE_SIZE));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * PAGE_SIZE;
  const currentDevices = allDevices.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col antialiased">
      <AppNavbar />

      <main className="flex-1 w-full max-w-3xl mx-auto p-3 sm:p-5 space-y-3 pb-12">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
              Connected Devices
            </h1>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Room <span className="font-mono font-bold text-orange-700">{engineState.sessionCode || "ACTIVE"}</span>
              <span className="hidden sm:inline"> • Direct WebRTC network</span>
            </p>
          </div>
        </div>

        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <CardHeader className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/60 space-y-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span>Connected</span>
              <Badge variant="outline" className="px-1.5 py-0.2 text-[10px] font-mono bg-slate-200/70 text-slate-700 border-slate-300/60">
                {totalDevices}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {currentDevices.map((device) => (
                <div
                  key={device.id}
                  className={cn(
                    "px-3.5 py-2.5 sm:px-4 flex items-center justify-between gap-2.5 transition-colors",
                    device.isLocal ? "bg-orange-50/30" : "hover:bg-slate-50/60"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border",
                        device.isLocal
                          ? "bg-orange-50 border-orange-200 text-orange-700"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      )}
                    >
                      {getDeviceIcon(device.name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {device.name}
                        </span>
                        {device.isLocal && (
                          <Badge className="text-[8px] font-black uppercase text-orange-800 bg-orange-100 hover:bg-orange-100 px-1 py-0.2 rounded border-orange-200 shrink-0">
                            YOU
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>#{device.shortId}</span>
                        <span>•</span>
                        <span>{device.transport}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">{device.latency}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <Badge variant="completed" className="gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Connected</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {remotePeers.length === 0 && (
              <div className="p-3.5 sm:p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-700 text-xs">
                    Waiting for peers to connect
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Open phone camera and scan Dashboard QR code or share code{" "}
                    <span className="font-mono font-bold text-slate-600">
                      {engineState.sessionCode || "ACTIVE"}
                    </span>
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openShare(engineState.sessionCode || undefined)}
                  className="h-7 text-xs font-semibold px-2.5 rounded-lg border-slate-200 bg-white shadow-2xs gap-1 cursor-pointer text-slate-700 hover:text-slate-900"
                >
                  <QrCode className="h-3 w-3 text-orange-700" />
                  <span>Open QR</span>
                </Button>
              </div>
            )}

            <div className="px-3.5 py-2 sm:px-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">
                {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, totalDevices)} of {totalDevices}
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={validPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2.5 text-xs font-semibold rounded-lg text-slate-700 disabled:opacity-40 cursor-pointer shadow-2xs border-slate-200"
                >
                  <ChevronLeft className="h-3 w-3 mr-0.5" />
                  <span>Prev</span>
                </Button>

                <span className="font-mono text-xs font-bold text-slate-700 px-1">
                  {validPage}/{totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={validPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2.5 text-xs font-semibold rounded-lg text-slate-700 disabled:opacity-40 cursor-pointer shadow-2xs border-slate-200"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>

      <ShareSessionDialog
        sessionCode={engineState.sessionCode || ""}
        isOpen={isShareOpen}
        onClose={closeShare}
      />
    </div>
  );
}
