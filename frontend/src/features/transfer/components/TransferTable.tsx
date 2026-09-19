"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Trash2,
  Clock,
  Activity,
  HardDrive,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type TransfersTableProps,
  formatSpeed,
  formatSize,
  formatEta,
  getFileIcon,
} from "./transferUtils";

export type { TransfersTableProps } from "./transferUtils";
export { OngoingTransfersTable } from "./OngoingTransfersTable";

export function TransferActivityHub({
  activeFiles = [],
  totalPeersCount = 1,
  sessionCode = "",
  onCancelTransfer,
  onResumeTransfer,
  onPauseTransfer,
}: TransfersTableProps) {
  const currentSession =
    sessionCode ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("ShareNut_active_session_code") || ""
      : "");
  const sessionQuery = currentSession ? `?session=${currentSession}` : "";

  const ongoingFiles = activeFiles.filter((f) => f.status !== "completed" && f.status !== "cancelled");
  const completedFiles = activeFiles.filter((f) => f.status === "completed");
  const allFiles = activeFiles.filter((f) => f.status !== "cancelled");

  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const prevOngoingCountRef = React.useRef(ongoingFiles.length);

  React.useEffect(() => {
    if (prevOngoingCountRef.current === 0 && ongoingFiles.length > 0) {
      setActiveTab("active");
    }
    prevOngoingCountRef.current = ongoingFiles.length;
  }, [ongoingFiles.length]);

  const displayFiles = activeTab === "all" ? allFiles : activeTab === "active" ? ongoingFiles : completedFiles;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Transfer Activity
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Real-time file streaming and session history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100/90 border border-slate-200/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>All</span>
              <span className="text-[10px] text-slate-400 font-mono">({allFiles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Active</span>
              {ongoingFiles.length > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
              )}
              <span className="text-[10px] text-slate-400 font-mono">({ongoingFiles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === "completed"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Completed</span>
              <span className="text-[10px] text-slate-400 font-mono">({completedFiles.length})</span>
            </button>
          </div>
        </div>
      </div>

      {displayFiles.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto shadow-2xs">
                <HardDrive className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-700">No transfers in this session yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Select files in the card above or scan the session QR code to start streaming directly between devices.
              </p>
            </div>
          ) : (
            <div className="space-y-5">

          {(activeTab === "all" || activeTab === "active") && (() => {
            const activeDisplay = activeTab === "all" ? ongoingFiles : displayFiles.filter((f) => f.status !== "completed");
            if (activeDisplay.length === 0 && activeTab === "active") {
              return (
                <div className="py-10 text-center text-slate-400 space-y-1.5 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No active transfers running</p>
                  <p className="text-[11px] text-slate-400">
                    All queued files have finished transferring or queue is idle.
                  </p>
                </div>
              );
            }
            if (activeDisplay.length === 0) return null;
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-600 animate-ping" />
                    In-Flight Transfers ({activeDisplay.length})
                  </span>
                </div>

                <div className="block md:hidden space-y-3">
                  {activeDisplay.map((file) => {
                    const isWaiting = file.status === "waiting";
                    const isPaused = file.status === "paused";
                    const isUploading = file.isSender && file.status === "transferring";
                    const peerRatio = `${Math.min(totalPeersCount, Math.max(1, totalPeersCount))} / ${totalPeersCount}`;

                    return (
                      <div
                        key={file.fileId}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          {file.isSender ? (
                            <Link
                              href={`/transfers/${file.fileId}${sessionQuery}`}
                              className="flex items-center gap-2.5 min-w-0 group/file cursor-pointer"
                            >
                              <div className="group-hover/file:scale-105 transition-transform">
                                {getFileIcon(file.manifest.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 group-hover/file:text-amber-700 group-hover/file:underline truncate max-w-[180px]">
                                  {file.manifest.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {formatSize(file.manifest.size)}
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div>
                                {getFileIcon(file.manifest.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                                  {file.manifest.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {formatSize(file.manifest.size)}
                                </div>
                              </div>
                            </div>
                          )}

                          {isWaiting || (file.isSender && file.status === "ready") ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold text-[10px] shrink-0 border border-amber-200/60">
                              <Clock className="h-2.5 w-2.5 text-amber-600 animate-spin" />
                              Waiting for peer
                            </span>
                          ) : isUploading ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50/80 text-emerald-700 font-semibold text-[10px] shrink-0">
                              <ArrowUp className="h-2.5 w-2.5" />
                              Uploading
                            </span>
                          ) : isPaused ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 font-semibold text-[10px] shrink-0 border border-amber-200">
                              <span className={`h-1.5 w-1.5 rounded-full ${file.senderAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                              {file.senderAvailable ? "Sender Online" : "Paused"}
                            </span>
                          ) : file.isSender ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold text-[10px] shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold text-[10px] shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                              Downloading
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600">
                            <span>{isWaiting ? "0%" : `${Math.round(file.progress)}%`}</span>
                            <span className="font-mono text-amber-700">
                              {isWaiting ? "—" : formatSpeed(file.speedBytesPerSec)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isWaiting
                                  ? "bg-amber-400 animate-pulse"
                                  : isUploading
                                  ? "bg-emerald-600"
                                  : isPaused
                                  ? "bg-orange-500"
                                  : "bg-amber-600"
                              }`}
                              style={{ width: isWaiting ? "100%" : `${Math.max(3, file.progress)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-200/60">
                          <div className="flex items-center gap-3 font-mono">
                            <span>Peers: {peerRatio}</span>
                            <span>ETA: {isWaiting ? "Waiting for peer..." : formatEta(file.etaSeconds)}</span>
                          </div>

                          <div className="flex items-center gap-1 flex-wrap justify-end">

                            {isPaused && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!file.senderAvailable && !file.isSender}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onResumeTransfer?.(file.fileId);
                                }}
                                className="h-7 px-2 text-[10px] font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50 rounded-lg gap-1 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                                title={!file.senderAvailable && !file.isSender ? "Sender must be in room to resume" : "Resume Download"}
                              >
                                <Play className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                                <span>Resume</span>
                              </Button>
                            )}

                            {!isPaused && file.status === "transferring" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onPauseTransfer?.(file.fileId);
                                }}
                                className="h-7 px-2 text-[10px] font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Pause Transfer"
                              >
                                <Pause className="h-3 w-3" />
                                <span>Pause</span>
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                onCancelTransfer?.(file.fileId);
                              }}
                              className="h-7 px-2 text-[10px] font-semibold text-red-600 border-red-200 hover:bg-red-50 rounded-lg gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Cancel Transfer"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Cancel</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                        <th className="pb-3 text-left font-semibold">File Name</th>
                        <th className="pb-3 text-left font-semibold">Size</th>
                        <th className="pb-3 text-left font-semibold">Status</th>
                        <th className="pb-3 text-left font-semibold">Progress</th>
                        <th className="pb-3 text-center font-semibold">Peers</th>
                        <th className="pb-3 text-left font-semibold">ETA</th>
                        <th className="pb-3 text-left font-semibold">Speed</th>
                        <th className="pb-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                      {activeDisplay.map((file) => {
                        const isWaiting = file.status === "waiting";
                        const isPaused = file.status === "paused";
                        const isUploading = file.isSender && file.status === "transferring";
                        const peerRatio = `${Math.min(totalPeersCount, Math.max(1, totalPeersCount))} / ${totalPeersCount}`;

                        return (
                          <tr
                            key={file.fileId}
                            className="hover:bg-slate-50/70 transition-colors group"
                          >
                            <td className="py-3.5 pr-4">
                              {file.isSender ? (
                                <Link
                                  href={`/transfers/${file.fileId}${sessionQuery}`}
                                  className="flex items-center gap-3 group/link cursor-pointer"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <div className="group-hover/link:scale-105 transition-transform">
                                    {getFileIcon(file.manifest.name)}
                                  </div>
                                  <span className="font-semibold text-slate-900 group-hover/link:text-amber-700 group-hover/link:underline truncate max-w-[200px] lg:max-w-[260px]">
                                    {file.manifest.name}
                                  </span>
                                </Link>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div>
                                    {getFileIcon(file.manifest.name)}
                                  </div>
                                  <span className="font-semibold text-slate-900 truncate max-w-[200px] lg:max-w-[260px]">
                                    {file.manifest.name}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 pr-4 text-slate-600 whitespace-nowrap">
                              {formatSize(file.manifest.size)}
                            </td>

                            <td className="py-3.5 pr-4 whitespace-nowrap">
                              {isWaiting || (file.isSender && file.status === "ready") ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold text-[11px] border border-amber-200/60">
                                  <Clock className="h-3 w-3 text-amber-600 animate-spin" />
                                  Waiting for peer
                                </span>
                              ) : isUploading ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 text-emerald-700 font-semibold text-[11px]">
                                  <ArrowUp className="h-3 w-3 text-emerald-600 stroke-[2.5]" />
                                  Uploading
                                </span>
                              ) : isPaused ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 font-semibold text-[11px] border border-amber-200">
                                  <span className={`h-2 w-2 rounded-full ${file.senderAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                                  {file.senderAvailable ? "Sender Online" : "Paused"}
                                </span>
                              ) : file.isSender ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold text-[11px]">
                                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                                  Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold text-[11px]">
                                  <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                                  Downloading
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 pr-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 font-bold text-slate-800 text-[11px]">
                                  {isWaiting ? "0%" : `${Math.round(file.progress)}%`}
                                </span>
                                <div className="w-16 lg:w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isWaiting
                                        ? "bg-amber-400 animate-pulse"
                                        : isUploading
                                        ? "bg-emerald-600"
                                        : isPaused
                                        ? "bg-orange-500"
                                        : "bg-amber-600"
                                    }`}
                                    style={{ width: isWaiting ? "100%" : `${Math.max(3, file.progress)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-2 text-center text-slate-600 whitespace-nowrap font-mono text-[11px]">
                              {peerRatio}
                            </td>

                            <td className="py-3.5 pr-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                              {isWaiting ? "Waiting for peer..." : formatEta(file.etaSeconds)}
                            </td>

                            <td className="py-3.5 pr-4 whitespace-nowrap font-mono text-[11px] font-bold">
                              {isWaiting ? (
                                <span className="text-slate-400">—</span>
                              ) : isUploading ? (
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
                                  {formatSpeed(file.speedBytesPerSec)}
                                </span>
                              ) : isPaused ? (
                                <span className="text-orange-500 flex items-center gap-1">
                                  <ArrowDown className="h-3.5 w-3.5 stroke-[2.5]" />
                                  {formatSpeed(file.speedBytesPerSec)}
                                </span>
                              ) : (
                                <span className="text-amber-700 flex items-center gap-1">
                                  <ArrowDown className="h-3.5 w-3.5 stroke-[2.5]" />
                                  {formatSpeed(file.speedBytesPerSec)}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">

                                {isPaused && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!file.senderAvailable && !file.isSender}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onResumeTransfer?.(file.fileId);
                                    }}
                                    className="h-7 px-2.5 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[11px] font-semibold gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
                                    title={
                                      !file.senderAvailable && !file.isSender
                                        ? "Sender must be connected in room to resume"
                                        : "Resume Download"
                                    }
                                  >
                                    <Play className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                                    <span>Resume</span>
                                  </Button>
                                )}

                                {!isPaused && file.status === "transferring" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onPauseTransfer?.(file.fileId);
                                    }}
                                    className="h-7 px-2.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold gap-1 cursor-pointer shadow-2xs"
                                    title="Pause Transfer"
                                  >
                                    <Pause className="h-3 w-3" />
                                    <span>Pause</span>
                                  </Button>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onCancelTransfer?.(file.fileId);
                                  }}
                                  className="h-7 px-2.5 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-[11px] font-semibold gap-1.5 cursor-pointer shadow-2xs transition-colors"
                                  title="Cancel Transfer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Cancel</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {(activeTab === "all" || activeTab === "completed") && (() => {
            const completedDisplay = activeTab === "all" ? completedFiles : displayFiles.filter((f) => f.status === "completed");
            if (completedDisplay.length === 0 && activeTab === "completed") {
              return (
                <div className="py-10 text-center text-slate-400 space-y-1.5 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Clock className="h-6 w-6 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No completed transfers yet</p>
                  <p className="text-[11px] text-slate-400">
                    Files transferred in this session will appear here.
                  </p>
                </div>
              );
            }
            if (completedDisplay.length === 0) return null;
            return (
              <div className="space-y-3">
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Completed History ({completedDisplay.length})
                  </span>
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                        <th className="pb-3 text-left font-semibold">File Name</th>
                        <th className="pb-3 text-left font-semibold">Size</th>
                        <th className="pb-3 text-left font-semibold">Status</th>
                        <th className="pb-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                      {completedDisplay.map((file) => (
                        <tr
                          key={file.fileId}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          <td className="py-3.5 pr-4">
                            {file.isSender ? (
                              <Link
                                href={`/transfers/${file.fileId}${sessionQuery}`}
                                className="flex items-center gap-3 group/link cursor-pointer"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <div className="group-hover/link:scale-105 transition-transform">
                                  {getFileIcon(file.manifest.name)}
                                </div>
                                <span className="font-semibold text-slate-900 group-hover/link:text-amber-700 group-hover/link:underline truncate max-w-[320px] lg:max-w-[480px]">
                                  {file.manifest.name}
                                </span>
                              </Link>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div>
                                  {getFileIcon(file.manifest.name)}
                                </div>
                                <span className="font-semibold text-slate-900 truncate max-w-[320px] lg:max-w-[480px]">
                                  {file.manifest.name}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 pr-4 text-slate-600 whitespace-nowrap">
                            {formatSize(file.manifest.size)}
                          </td>

                          <td className="py-3.5 pr-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200/60">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Completed
                            </span>
                          </td>

                          <td className="py-3.5 text-right whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                onCancelTransfer?.(file.fileId);
                              }}
                              className="h-7 px-2.5 rounded-lg border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-[11px] font-semibold gap-1.5 cursor-pointer shadow-2xs transition-colors"
                              title="Remove from history"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="block md:hidden space-y-2.5">
                  {completedDisplay.map((file) => (
                    <div
                      key={file.fileId}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex items-center justify-between gap-3"
                    >
                      {file.isSender ? (
                        <Link
                          href={`/transfers/${file.fileId}${sessionQuery}`}
                          className="flex items-center gap-2.5 min-w-0 group/file cursor-pointer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="group-hover/file:scale-105 transition-transform">
                            {getFileIcon(file.manifest.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 group-hover/file:text-amber-700 group-hover/file:underline truncate max-w-[180px]">
                              {file.manifest.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {formatSize(file.manifest.size)}
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div>
                            {getFileIcon(file.manifest.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                              {file.manifest.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {formatSize(file.manifest.size)}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200/60">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Completed
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onCancelTransfer?.(file.fileId);
                          }}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                          title="Remove from history"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
