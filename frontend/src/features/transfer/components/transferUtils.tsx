"use client";

import React from "react";
import {
  FileText,
  Film,
  Package,
  HardDrive,
} from "lucide-react";
import type { ActiveFileTransfer } from "@/types/protocol";

export interface TransfersTableProps {
  activeFiles?: ActiveFileTransfer[];
  totalPeersCount?: number;
  sessionCode?: string;
  onCancelTransfer?: (fileId: string) => void;
  onResumeTransfer?: (fileId: string) => void;
  onPauseTransfer?: (fileId: string) => void;
  onViewAll?: () => void;
}

export const formatSpeed = (bps: number) => {
  if (bps <= 0) return "0 KB/s";
  if (bps >= 1024 * 1024) {
    return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  return `${(bps / 1024).toFixed(1)} KB/s`;
};

export const formatSize = (bytes: number) => {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
};

export const formatEta = (seconds: number) => {
  if (seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

export const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["mkv", "mp4", "avi", "mov", "webm"].includes(ext)) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-2xs shrink-0">
        <Film className="h-4 w-4 fill-white" />
      </div>
    );
  }
  if (["zip", "tar", "gz", "7z", "rar"].includes(ext)) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white shadow-2xs shrink-0">
        <Package className="h-4 w-4" />
      </div>
    );
  }
  if (["iso", "img", "dmg"].includes(ext)) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-700 text-white shadow-2xs shrink-0">
        <HardDrive className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white shadow-2xs shrink-0">
      <FileText className="h-4 w-4" />
    </div>
  );
};
