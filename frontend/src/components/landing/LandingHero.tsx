"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Network,
  Infinity as InfinityIcon,
  Zap,
  Wifi,
  ShieldCheck,
  Loader2,
  FolderUp,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function generateSessionCode(): string {
  return "NUT-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export function LandingHero() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedFileCount, setSelectedFileCount] = useState<number>(0);
  const [sessionRoomCode, setSessionRoomCode] = useState<string>("");

  useEffect(() => {
    setSessionRoomCode(generateSessionCode());
  }, []);

  const handleFilesSelected = (files: File[]) => {
    if (!files || files.length === 0) return;

    setSelectedFileCount(files.length);
    setIsRedirecting(true);

    const roomCode = sessionRoomCode || generateSessionCode();

    if (typeof window !== "undefined") {
      const targetWindow = window as unknown as Record<string, unknown>;
      targetWindow["shareNutStagedFiles"] = files;
      sessionStorage.setItem("ShareNut_active_session_code", roomCode);
    }

    setTimeout(() => {
      router.push(`/dashboard?session=${roomCode}`);
    }, 150);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-16">
      <input type="file" ref={fileInputRef} onChange={handleFileInputChange} multiple className="hidden" />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
      />
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Pitch / Features */}
        <div className="order-1 flex flex-col justify-center lg:order-2 lg:col-span-7 lg:pl-4">
          {/* Heading */}
          <div className="space-y-4">
            <h1 className="font-heading text-[38px] font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Share files directly from{" "}
              <span className="text-amber-600">your device</span> to anywhere
            </h1>

            <p className="max-w-xl text-[15px] leading-6 text-slate-600 sm:text-base lg:text-lg">
              Send files of any size directly from your device without ever storing anything online.
            </p>
          </div>

          {/* Features */}
          <div className="mt-9 grid grid-cols-1 gap-y-5 sm:mt-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4">
            <div className="flex min-h-6 items-center gap-4">
              <InfinityIcon className="h-[22px] w-[22px] shrink-0 text-slate-700" />
              <span className="text-[18px] font-medium leading-6 text-slate-800">No file size limit</span>
            </div>

            <div className="flex min-h-6 items-center gap-4">
              <Zap className="h-[22px] w-[22px] shrink-0 text-slate-700" />
              <span className="text-[18px] font-medium leading-6 text-slate-800">Blazingly fast</span>
            </div>

            <div className="flex min-h-6 items-center gap-4">
              <ArrowLeftRight className="h-[22px] w-[22px] shrink-0 text-slate-700" />
              <span className="text-[18px] font-medium leading-6 text-slate-800">Peer-to-peer</span>
            </div>

            <div className="flex min-h-6 items-center gap-4">
              <ShieldCheck className="h-[22px] w-[22px] shrink-0 text-slate-700" />
              <span className="text-[18px] font-medium leading-6 text-slate-800">End-to-end encrypted</span>
            </div>

            <div className="flex min-h-6 items-center gap-4">
              <Network className="h-[22px] w-[22px] shrink-0 text-slate-700" />
              <span className="text-[18px] font-medium leading-6 text-slate-800">Multi Device Support</span>
            </div>

            <div className="flex min-h-6 items-center gap-4">
              <Wifi className="h-[22px] w-[22px] shrink-0 text-slate-700" />
              <span className="text-[18px] font-medium leading-6 text-slate-800">LAN &amp; Web support</span>
            </div>
          </div>

          {/* Mobile Select Files */}
          <div className="mt-8 lg:hidden">
            <Button onClick={() => fileInputRef.current?.click()} className="h-11 w-full rounded-md bg-amber-600 px-5 text-sm font-medium text-white shadow-xs shadow-amber-600/20 transition-colors hover:bg-amber-700">
              <Upload className="h-4 w-4" />
              <span>Select Files</span>
            </Button>
          </div>

          {/* Technical Specs */}
          <div className="mt-8 border-t border-slate-200 pt-5 sm:mt-7">
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 font-mono text-[10px] leading-4 text-slate-500 sm:justify-start sm:text-xs">
              <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium text-slate-700">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                Direct Browser-to-Browser Pipe
              </span>

              <span className="shrink-0 text-slate-300">•</span>

              <span className="whitespace-nowrap">WebRTC SCTP</span>

              <span className="shrink-0 text-slate-300">•</span>

              <span className="whitespace-nowrap">DTLS 1.3</span>

              <span className="shrink-0 text-slate-300">•</span>

              <span className="whitespace-nowrap">SHA-256</span>
            </div>
          </div>
        </div>

        {/* Desktop Uploader */}
        <div className="order-2 hidden lg:order-1 lg:col-span-5 lg:block">
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`flex min-h-[360px] flex-1 flex-col items-center justify-between rounded-2xl border-2 border-dashed bg-white p-8 text-center shadow-xs transition-all ${isDragging ? "border-amber-500 bg-amber-50/40" : "border-stone-300 hover:border-amber-400"}`}>
            {isRedirecting ? (
              <div className="my-auto flex flex-col items-center justify-center space-y-3 py-12">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    Staging {selectedFileCount} file{selectedFileCount > 1 ? "s" : ""}...
                  </h3>

                  <p className="text-xs text-slate-500">
                    Opening room{" "}
                    <span className="font-mono font-bold text-slate-900">{sessionRoomCode}</span>{" "}
                    and queuing transfer
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="my-auto space-y-4 py-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700">
                    <Upload className="h-6 w-6" />
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-slate-900">
                      {isDragging ? "Release files to upload" : "Drop files to start transfer"}
                    </h2>

                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-600">
                      Select files or folders to automatically create a private room and queue your transfer.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2.5 pt-2">
                    <Button onClick={() => fileInputRef.current?.click()} className="h-9 rounded-md bg-amber-600 px-5 text-xs font-medium text-white shadow-xs shadow-amber-600/20 transition-colors hover:bg-amber-700">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Select Files</span>
                    </Button>

                    <Button onClick={() => folderInputRef.current?.click()} variant="outline" className="h-9 rounded-md border-slate-300 bg-white px-4 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
                      <FolderUp className="h-3.5 w-3.5 text-slate-500" />
                      <span>Select Folder</span>
                    </Button>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-3 font-mono text-[11px] text-slate-500">
                  <span>Unlimited size</span>
                  <span>•</span>
                  <span>64 KB SHA-256</span>
                  <span>•</span>
                  <span>Direct SCTP</span>
                  <span>•</span>
                  <span>LAN Turbo</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}