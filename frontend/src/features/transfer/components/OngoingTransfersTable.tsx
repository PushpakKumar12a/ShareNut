"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  HardDrive,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type TransfersTableProps,
  formatSpeed,
  formatSize,
  formatEta,
  getFileIcon,
} from "./transferUtils";

export function OngoingTransfersTable({
  activeFiles = [],
  totalPeersCount = 1,
  sessionCode = "",
  onCancelTransfer,
  onResumeTransfer,
  onPauseTransfer,
  onViewAll,
}: TransfersTableProps) {
  const currentSession =
    sessionCode ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("ShareNut_active_session_code") || ""
      : "");
  const sessionQuery = currentSession ? `?session=${currentSession}` : "";

  const ongoingFiles = activeFiles.filter(
    (f) => f.status !== "completed" && f.status !== "cancelled",
  );

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-4">

      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Ongoing Transfers
          </h2>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-[11px] font-extrabold text-amber-700">
            {ongoingFiles.length}
          </span>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            type="button"
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer transition-colors"
          >
            View All
          </button>
        )}
      </div>

      {ongoingFiles.length === 0 ? (
        <div className="py-8 sm:py-10 text-center text-slate-400 space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mx-auto">
            <HardDrive className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">No ongoing transfers in this session</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Select or drop files in the card above to start streaming directly across connected peers.
          </p>
        </div>
      ) : (
        <>

          <div className="block md:hidden space-y-3">
            {ongoingFiles.map((file) => {
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
                {ongoingFiles.map((file) => {
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
                            <span className="font-semibold text-slate-900 group-hover/link:text-amber-700 group-hover/link:underline truncate max-w-[220px] lg:max-w-[280px]">
                              {file.manifest.name}
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div>
                              {getFileIcon(file.manifest.name)}
                            </div>
                            <span className="font-semibold text-slate-900 truncate max-w-[220px] lg:max-w-[280px]">
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
                        <div className="flex items-center gap-3">
                          <span className="w-8 font-bold text-slate-800 text-[11px]">
                            {isWaiting ? "0%" : `${Math.round(file.progress)}%`}
                          </span>
                          <div className="w-16 lg:w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
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

                      <td className="py-3.5 px-3 text-center text-slate-600 whitespace-nowrap font-mono text-[11px]">
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
        </>
      )}
    </div>
  );
}
