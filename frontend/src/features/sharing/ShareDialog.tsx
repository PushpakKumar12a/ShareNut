"use client";

import React, { useState, useEffect } from "react";
import { QrCode, Copy, Check, Share2, Smartphone, Wifi } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { get } from "@/services/api";

interface ShareSessionDialogProps {
  sessionCode: string;
  isOpen: boolean;
  onClose: () => void;
}

function QRCodeDisplay({ value }: { value: string }) {

  const [QRComponent, setQRComponent] = useState<any>(null);

  useEffect(() => {
    import("qrcode.react").then((mod) => {
      setQRComponent(() => mod.QRCodeSVG);
    });
  }, []);

  if (!QRComponent) {
    return (
      <div className="h-[135px] w-[135px] flex items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <QRComponent
      value={value}
      size={135}
      level="M"
      bgColor="#ffffff"
      fgColor="#0f172a"
    />
  );
}

export function ShareSessionDialog({
  sessionCode,
  isOpen,
  onClose,
}: ShareSessionDialogProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lanIp, setLanIp] = useState<string | null>(null);
  const [useLanIp, setUseLanIp] = useState(true);

  useEffect(() => {
    if (isOpen) {
      get<{ lan_ip: string }>("/v1/network/info")
        .then((res) => {
          if (res?.lan_ip && res.lan_ip !== "127.0.0.1") {
            setLanIp(res.lan_ip);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const computeShareUrl = () => {
    if (typeof window === "undefined" || !sessionCode) return "";

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    let host = window.location.host;
    if (isLocalhost && lanIp && useLanIp) {
      host = `${lanIp}:${window.location.port || "3000"}`;
    }

    const protocol = window.location.protocol;
    return `${protocol}//${host}/dashboard?session=${sessionCode.toUpperCase()}&autodownload=1`;
  };

  const shareUrl = computeShareUrl();

  const copyText = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  };

  const handleCopyCode = () => {
    copyText(sessionCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    copyText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[340px] p-4 sm:p-5 gap-3 rounded-2xl">
        <DialogHeader className="pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900 leading-tight">
                Scan with Camera to Connect
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500 leading-tight">
                Point phone camera to join room and download files.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200/80 gap-2">
          <div className="p-2 rounded-xl bg-white shadow-2xs border border-slate-200/60">
            {shareUrl ? (
              <QRCodeDisplay value={shareUrl} />
            ) : (
              <div className="h-[135px] w-[135px] flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between w-full px-1 text-[11px] font-medium text-slate-600">
            <div className="flex items-center gap-1 text-slate-600">
              <Smartphone className="h-3 w-3 text-amber-700" />
              <span className="text-[10px] text-slate-500">Scan with camera</span>
            </div>

            {lanIp && (
              <button
                type="button"
                onClick={() => setUseLanIp(!useLanIp)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200/60 transition-colors cursor-pointer"
                title="Click to toggle LAN IP vs localhost"
              >
                <Wifi className="h-2.5 w-2.5" />
                <span>{useLanIp ? lanIp : "localhost"}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Room:
            </span>
            <span className="font-mono text-xs sm:text-sm font-extrabold text-amber-700 tracking-wider">
              {sessionCode}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="h-6.5 text-[10px] font-semibold gap-1 px-2 rounded-md border-slate-200 cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-slate-600" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>

        <Button
          onClick={handleCopyLink}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl h-8.5 gap-1.5 text-xs cursor-pointer shadow-sm shadow-amber-500/20"
        >
          {copiedLink ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Link Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              <span>Copy Direct Mobile Share Link</span>
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
