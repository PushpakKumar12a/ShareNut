"use client";

import React, { useState, useEffect } from "react";
import { Network, Users, HelpCircle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface PeerMeshItem {
  id: string;
  rawPeerId?: string;
  role?: string;
  speed: string;
  latency: string;
  isOnline: boolean;
  isSelf?: boolean;
}

interface ConnectedMeshPanelProps {
  meshPeers?: PeerMeshItem[];
  sessionCode?: string;
  shareUrl?: string;
  onJoinSession?: (code: string) => void;
}

function MeshQRCodeDisplay({ value }: { value: string }) {
  const [QRComponent, setQRComponent] = useState<any>(null);

  useEffect(() => {
    import("qrcode.react").then((mod) => {
      setQRComponent(() => mod.QRCodeSVG);
    });
  }, []);

  if (!QRComponent) {
    return (
      <div className="h-[105px] w-[105px] flex items-center justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <QRComponent
      value={value}
      size={105}
      level="M"
      bgColor="#ffffff"
      fgColor="#0f172a"
    />
  );
}

export function ConnectedMeshPanel({
  meshPeers = [],
  sessionCode,
  shareUrl,
  onJoinSession,
}: ConnectedMeshPanelProps) {
  const peers = meshPeers;
  const [peerCode, setPeerCode] = useState("");
  const [lanIp, setLanIp] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    fetch("/api/v1/network/info")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { lan_ip?: string } | null) => {
        if (data?.lan_ip && data.lan_ip !== "127.0.0.1") {
          setLanIp(data.lan_ip);
        }
      })
      .catch(() => {});
  }, []);

  const computeShareUrl = () => {
    if (shareUrl) return shareUrl;
    if (typeof window === "undefined") return "";

    const code = sessionCode?.toUpperCase() || "NUT-ROOM1";
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    let host = window.location.host;
    if (isLocalhost && lanIp) {
      host = `${lanIp}:${window.location.port || "3000"}`;
    }

    const protocol = window.location.protocol;
    return `${protocol}//${host}/dashboard?session=${code}&autodownload=1`;
  };

  const effectiveShareUrl = computeShareUrl();

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = peerCode.trim().toUpperCase();
    if (code && onJoinSession) {
      onJoinSession(code);
      setPeerCode("");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs space-y-2.5 h-full flex flex-col justify-between">

      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 leading-tight">
              CONNECTED DEVICES ({peers.length})
            </h3>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200/80 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>LAN / Router Mode</span>
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center py-0.5">
        <div className="flex flex-col md:grid md:grid-cols-[auto_auto_1fr] items-center gap-3 sm:gap-4 w-full">

          <div className="flex flex-col items-center justify-center bg-[#faf8f5] border border-slate-100/90 rounded-xl p-2.5 sm:p-3 shrink-0">
            <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-2xs flex items-center justify-center">
              <MeshQRCodeDisplay value={effectiveShareUrl} />
            </div>
            <span className="text-[11px] font-medium text-slate-500 mt-1.5 text-center">
              Scan this QR code
            </span>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center relative self-stretch px-0.5">
            <div className="absolute inset-y-1 w-px bg-slate-200" />
            <div className="relative z-10 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-2xs">
              OR
            </div>
          </div>

          <div className="flex md:hidden items-center justify-center relative my-0.5 w-full">
            <div className="absolute inset-x-0 h-px bg-slate-200" />
            <span className="relative z-10 bg-white px-2.5 text-[10px] font-bold text-slate-400 border border-slate-200 rounded-full py-0.5">
              OR
            </span>
          </div>

          <div className="flex flex-col items-center justify-center text-center px-1 w-full">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Connect to a peer
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 mb-2.5 leading-snug max-w-[260px]">
              Scan a QR code or enter a peer code to start WebRTC streaming.
            </p>

            <form onSubmit={handleConnectSubmit} className="w-full space-y-2">
              <div className="relative w-full">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 rotate-45" />
                <Input
                  type="text"
                  value={peerCode}
                  onChange={(e) => setPeerCode(e.target.value.toUpperCase())}
                  placeholder="Enter peer code (e.g. NUT-XXXX)"
                  className="pl-9 h-9 text-xs bg-white rounded-lg border-slate-200 placeholder:text-slate-400 focus-visible:ring-emerald-500 font-medium"
                />
              </div>
              <Button
                type="submit"
                disabled={!peerCode.trim()}
                className="w-full h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Connect
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1.5 border-t border-slate-100">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#faf8f5] border border-slate-100 flex-1 w-full text-slate-500">
          <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="text-[11px]">
            Make sure the other device is online and in the same room.
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowHowItWorks(true)}
          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50/80 hover:bg-amber-100 text-amber-700 border border-amber-200/80 font-semibold text-[11px] transition-colors shrink-0 cursor-pointer w-full sm:w-auto"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>How it works?</span>
        </button>
      </div>

      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <HelpCircle className="h-5 w-5 text-amber-700" />
              How P2P Direct Transfer Works
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              ShareNut uses local peer-to-peer WebRTC connections with zero cloud relays.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-slate-600">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-xs">1</span>
              <div>
                <p className="font-semibold text-slate-800">Same Wi-Fi or LAN</p>
                <p className="text-slate-500 mt-0.5">Ensure all devices are connected to the same local router or Wi-Fi hotspot.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">2</span>
              <div>
                <p className="font-semibold text-slate-800">Scan QR Code or Enter Peer Code</p>
                <p className="text-slate-500 mt-0.5">Point your mobile camera at the QR code, or type the peer code (e.g. NUT-XXXX) on the other device.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">3</span>
              <div>
                <p className="font-semibold text-slate-800">Direct High-Speed WebRTC Streaming</p>
                <p className="text-slate-500 mt-0.5">Files stream directly between devices at up to full router bandwidth with end-to-end encryption.</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowHowItWorks(false)}
            className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-10 cursor-pointer"
          >
            Got it, thanks!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const ConnectedMeshMeshPanel = ConnectedMeshPanel;
export const ConnectedMeshPeersPanel = ConnectedMeshPanel;