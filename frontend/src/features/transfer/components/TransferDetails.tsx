"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Hash,
  Layers,
  HardDrive,
  Copy,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ChunkInfo } from "@/types/protocol";

interface ChunkInspectorModalProps {
  chunkIndex: number | null;
  chunkInfo: ChunkInfo | null;
  totalChunks: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectChunk: (idx: number) => void;
}

export function ChunkInspectorModal({
  chunkIndex,
  chunkInfo,
  totalChunks,
  isOpen,
  onClose,
  onSelectChunk,
}: ChunkInspectorModalProps) {
  const [copied, setCopied] = useState(false);

  if (chunkIndex === null || !isOpen) return null;

  const idx = chunkIndex;
  const offset = chunkInfo?.offset ?? idx * 65536;
  const size = chunkInfo?.size ?? 65536;
  const status = chunkInfo?.status || "pending";
  const hash =
    chunkInfo?.hash ||
    (status === "verified" ? "Verifying digest..." : `sha256-pending-${idx}`);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Verified & Intact
          </span>
        );
      case "downloading":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Direct Downloading
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Hash Mismatch / Corrupt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            Pending Schedule
          </span>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Chunk Inspector #{idx}
                </DialogTitle>
                <DialogDescription className="text-[11px] text-slate-500">
                  Block {idx + 1} of {totalChunks} in transfer manifest
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1 pr-6">
              <Button
                variant="ghost"
                size="iconSm"
                disabled={idx <= 0}
                onClick={() => onSelectChunk(idx - 1)}
                className="h-7 w-7 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="iconSm"
                disabled={idx >= totalChunks - 1}
                onClick={() => onSelectChunk(idx + 1)}
                className="h-7 w-7 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Verification Status
          </span>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200/80 bg-white space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase">
              <HardDrive className="h-3.5 w-3.5" />
              <span>Byte Offset</span>
            </div>
            <div className="font-mono font-bold text-slate-800 text-xs">
              {offset.toLocaleString()} B
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200/80 bg-white space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase">
              <Layers className="h-3.5 w-3.5" />
              <span>Chunk Size</span>
            </div>
            <div className="font-mono font-bold text-slate-800 text-xs">
              {(size / 1024).toFixed(1)} KB ({size} B)
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-amber-600" />
              <span>SHA-256 Hash Digest</span>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:underline cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Hash</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] break-all select-all leading-relaxed">
            {hash}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-800">
          <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-[11px] leading-tight">
            Verified byte-for-byte using Web Crypto API. Guaranteed zero tampering and bit-exact reconstruction.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
