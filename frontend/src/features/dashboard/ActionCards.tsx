"use client";

import React, { useRef, useState } from "react";
import { Upload, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopTransferActionCardsProps {
  sessionCode?: string;
  onSelectFiles: (files: File[]) => void;
  onJoinSession: (code: string) => void;
  onOpenQrScanner?: () => void;
  activeFileId?: string;
  disabled?: boolean;
}

export function TopTransferActionCards({
  sessionCode,
  onSelectFiles,
  disabled = false,
}: TopTransferActionCardsProps) {
  void sessionCode;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files.length > 0) {
      onSelectFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onSelectFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed transition-all duration-200 p-4 sm:p-5 shadow-xs flex flex-col items-center justify-between text-center ${
          isDragging
            ? "border-amber-500 bg-amber-50/50 scale-[1.01]"
            : "border-amber-300/80 hover:border-amber-400 bg-white"
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2 my-auto">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-xs">
            <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Send &amp; Share Files
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 max-w-[240px]">
              Drag &amp; drop files or browse device to stream directly to peers
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="font-semibold rounded-lg h-9 px-6 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs shadow-amber-600/20 cursor-pointer active:scale-95 transition-all gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Transfer File</span>
            </Button>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 text-[10px] font-medium pt-2 mt-2 border-t border-slate-100 w-full justify-center text-slate-400">
          <Zap className="h-3 w-3 text-amber-500" />
          <span>Unlimited file size • 64 KB SHA-256 Slicing</span>
        </div>
      </div>
    </>
  );
}
