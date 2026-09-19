"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Activity,
  HardDrive,
  Clock,
  Pause,
  Play,
  Trash2,
  Share2,
  CheckCircle2,
  Layers,
  ArrowDown,
  Wifi,
} from "lucide-react";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { Button } from "@/components/ui/button";
import { usePeerStore } from "@/features/mesh/peerStore";
import {
  useEngineState,
  useTransferEngine,
} from "@/features/transfer/engine/EngineContext";
import {
  formatSize,
  formatSpeed,
  formatEta,
  getFileIcon,
} from "@/features/transfer/components/transferUtils";
import { MeshPeerCard } from "@/features/transfer/components/MeshPeerCard";
import { SegmentedPeerProgressBar } from "@/features/transfer/components/SegmentedPeerProgressBar";
import type { MeshPeerProgress } from "@/features/transfer/engine/engineTypes";
import { ShareSessionDialog } from "@/features/sharing/ShareDialog";

function TransferDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const fileIdParam = (params?.fileId as string) || "";
  const engine = useTransferEngine();
  const engineState = useEngineState();
  const { user, device } = usePeerStore();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Live polling tick to guarantee real-time UI updates (progress, speed, ETA)
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => (prev + 1) % 10000);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const currentSessionCode =
    searchParams.get("session")?.toUpperCase() ||
    engineState.sessionCode ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("ShareNut_active_session_code") || "NUT-ACTIVE"
      : "NUT-ACTIVE");

  useEffect(() => {
    if (user && device && !engineState.sessionCode && currentSessionCode) {
      engine.joinSession(
        currentSessionCode,
        device.id,
        device.device_name,
        user.username,
      );
    }
  }, [user, device, engineState.sessionCode, currentSessionCode, engine]);

  const targetFile = useMemo(() => {
    if (!fileIdParam) return engineState.activeFiles[0] || null;
    return (
      engineState.activeFiles.find(
        (f) => f.fileId === fileIdParam || f.manifest.fileId === fileIdParam,
      ) ||
      engineState.activeFiles[0] ||
      null
    );
  }, [fileIdParam, engineState.activeFiles, tick]);

  const meshSummary = useMemo(() => {
    if (!targetFile) return null;
    return engine.getMeshProgressSummary(targetFile.fileId);
  }, [engine, targetFile, engineState, tick]);

  const handleTogglePauseResume = async () => {
    if (!targetFile) return;
    setErrorMessage(null);
    try {
      if (targetFile.status === "paused") {
        await engine.resumeTransfer(targetFile.fileId);
      } else {
        engine.pauseTransfer(targetFile.fileId);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to resume transfer");
    }
  };

  const handleCancel = async () => {
    if (!targetFile) return;
    await engine.cancelTransfer(targetFile.fileId);
    router.push(`/dashboard?session=${currentSessionCode}`);
  };

  useEffect(() => {
    if (targetFile && !targetFile.isSender) {
      router.replace(`/dashboard?session=${currentSessionCode}`);
    }
  }, [targetFile, currentSessionCode, router]);

  if (!targetFile || !targetFile.isSender) {
    return (
      <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col">
        <AppNavbar sessionCode={currentSessionCode} />
        <main className="flex-1 max-w-4xl mx-auto p-4 sm:p-6 w-full flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-2xs">
            <HardDrive className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Transfer Monitor Available for Sender Only
            </h2>
            <p className="text-xs text-slate-500 max-w-md">
              The detailed device streaming monitor is available to the sender distributing the file.
            </p>
          </div>
          <Link href={`/dashboard?session=${currentSessionCode}`}>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-2 font-semibold">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const isPaused = targetFile.status === "paused";
  const isCompleted = targetFile.status === "completed";
  const isTransferring = targetFile.status === "transferring";
  const isWaiting =
    !isCompleted &&
    !isTransferring &&
    (targetFile.status === "waiting" ||
      (targetFile.isSender && targetFile.status === "ready") ||
      (targetFile.isSender && engine.getConnectedPeerCount() === 0));

  const recipientPeers =
    meshSummary?.peers.filter((peerItem: MeshPeerProgress) => !peerItem.isSender) || [];

  const liveOverallProgress = isCompleted
    ? 100
    : isWaiting
    ? 0
    : Math.min(100, Math.max(meshSummary?.overallProgress ?? 0, targetFile.progress));

  const liveTransferredBytes = isCompleted
    ? targetFile.manifest.size
    : isWaiting
    ? 0
    : Math.min(
        targetFile.manifest.size,
        Math.max(
          meshSummary?.totalBytesTransferredAcrossMesh ?? 0,
          Math.round((liveOverallProgress / 100) * targetFile.manifest.size),
          targetFile.verifiedCount * (targetFile.manifest.chunkSize || 65536),
        ),
      );

  const liveSpeed = Math.max(
    meshSummary?.totalMeshSpeedBps ?? 0,
    targetFile.speedBytesPerSec,
  );

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col antialiased">
      <AppNavbar
        sessionCode={currentSessionCode}
        onOpenShare={() => setIsShareOpen(true)}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto p-3.5 sm:p-6 space-y-5 pb-16">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <Link
            href={`/dashboard?session=${currentSessionCode}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              Room <strong className="text-amber-700">{currentSessionCode}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareOpen(true)}
              className="h-7 px-2.5 text-xs font-semibold rounded-lg border-slate-200 bg-white gap-1 cursor-pointer text-slate-700 hover:text-slate-900 shadow-2xs"
            >
              <Share2 className="h-3 w-3 text-amber-700" />
              <span>Share Room</span>
            </Button>
          </div>
        </div>

        {/* Error Alert if Resume fails */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-medium flex items-center justify-between gap-2 shadow-2xs">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 text-sm font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* File Overview Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {getFileIcon(targetFile.manifest.name)}
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
                  {targetFile.manifest.name}
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                  <span>{formatSize(targetFile.manifest.size)}</span>
                  <span>•</span>
                  <span className="capitalize">{targetFile.manifest.mimeType || "Binary File"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {isWaiting && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold shadow-2xs">
                  <Clock className="h-3.5 w-3.5 text-amber-600 animate-spin" />
                  <span>Waiting for peer</span>
                </span>
              )}

              {isPaused && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePauseResume}
                  className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-amber-700 text-amber-700" />
                  <span>Resume Transfer</span>
                </Button>
              )}

              {isTransferring && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePauseResume}
                  className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause Transfer</span>
                </Button>
              )}

              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Completed</span>
                </span>
              )}

              {!isCompleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 px-3 rounded-lg text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Overall Transfer Progress Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 shadow-2xs">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 leading-tight">
                  Overall Transfer Progress
                </h2>
                <p className="text-[10px] text-slate-400 font-medium">
                  Aggregated across all connected downloading devices
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-base sm:text-lg font-black text-amber-700">
                {isWaiting ? "Waiting" : `${Math.round(liveOverallProgress)}%`}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {isWaiting ? "for peer" : isCompleted ? "Completed" : "Delivered"}
              </span>
            </div>
          </div>

          {/* Segmented Peer Progress Bar */}
          <div className="space-y-2">
            <SegmentedPeerProgressBar
              peers={meshSummary?.peers || []}
              overallProgress={liveOverallProgress}
              isWaiting={isWaiting}
              isCompleted={isCompleted}
              isPaused={isPaused}
            />

            <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 pt-1">
              <span>
                Total Transferred:{" "}
                <strong className="text-slate-800">
                  {formatSize(liveTransferredBytes)}
                </strong>
              </span>

              {liveSpeed > 0 && (
                <span className="text-amber-700 font-bold flex items-center gap-1 font-mono">
                  <ArrowDown className="h-3 w-3 stroke-[2.5]" />
                  {formatSpeed(liveSpeed)} Transfer Speed
                </span>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Connected Devices
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                {engine.getConnectedPeerCount()} active
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Active Downloads
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                {recipientPeers.length} device{recipientPeers.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Completed
              </span>
              <p className="text-xs sm:text-sm font-bold text-emerald-600 font-mono">
                {recipientPeers.length > 0
                  ? `${meshSummary?.completedRecipientPeers ?? (isCompleted ? recipientPeers.length : 0)} / ${recipientPeers.length}`
                  : isCompleted
                  ? "1 / 1"
                  : "—"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Estimated Time
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                {isCompleted
                  ? "Complete"
                  : isWaiting
                  ? "Waiting for peer..."
                  : formatEta(targetFile.etaSeconds)}
              </p>
            </div>
          </div>
        </div>

        {/* Peers Downloading The File ("Device Section Style") */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {/* Header Bar */}
          <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 shadow-2xs">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                Downloading Devices ({meshSummary?.peers.length || 0})
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200/60 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Direct P2P</span>
            </span>
          </div>

          {/* List of Peers in Device Section Style */}
          <div className="p-3.5 sm:p-4 space-y-3">
            {meshSummary?.peers && meshSummary.peers.length > 0 ? (
              meshSummary.peers.map((peer: MeshPeerProgress) => (
                <MeshPeerCard key={peer.peerId} peer={peer} />
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Users className="h-6 w-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  No devices currently downloading this file
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Share room code{" "}
                  <strong className="font-mono text-slate-800">
                    {currentSessionCode}
                  </strong>{" "}
                  with other devices to begin receiving this file directly.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <ShareSessionDialog
        sessionCode={currentSessionCode}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}

export default function TransferDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5]" />}>
      <TransferDetailPageContent />
    </Suspense>
  );
}
