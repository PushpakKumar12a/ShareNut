"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePeerStore } from "@/features/mesh/peerStore";
import { useEngineState, useTransferEngine } from "@/features/transfer/engine/EngineContext";
import { useModalStore } from "@/features/ui/modalStore";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { TopTransferActionCards } from "@/features/dashboard/ActionCards";
import { ConnectedMeshPanel, type PeerMeshItem } from "@/features/mesh/MeshPanel";
import { ConnectedDevicesCard } from "@/features/mesh/ConnectedDevicesCard";
import { TransferActivityHub } from "@/features/transfer/components/TransferTable";
import { QrScannerDialog } from "@/features/sharing/QrScanner";
import { ShareSessionDialog } from "@/features/sharing/ShareDialog";
import { extractPeerShortId } from "@/lib/utils";

const SESSION_CODE_KEY = "ShareNut_active_session_code";

function getStoredSessionCode(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_CODE_KEY);
}

function storeSessionCode(code: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_CODE_KEY, code);
}

function consumeStagedFiles(): File[] {
  if (typeof window === "undefined") return [];
  const targetWindow = window as unknown as Record<string, unknown>;
  const windowFiles =
    targetWindow["shareNutStagedFiles"] ||
    targetWindow["ShareNut_staged_files"] ||
    targetWindow["__ShareNut_staged_files"];

  delete targetWindow["shareNutStagedFiles"];
  delete targetWindow["ShareNut_staged_files"];
  delete targetWindow["__ShareNut_staged_files"];

  if (Array.isArray(windowFiles) && windowFiles.length > 0) {
    return windowFiles as File[];
  }
  return [];
}

function generateFreshSessionCode(): string {
  return "NUT-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, device } = usePeerStore();
  const engine = useTransferEngine();
  const engineState = useEngineState();

  const [activeSessionCode, setActiveSessionCode] = useState<string>("");
  const isShareOpen = useModalStore((state) => state.isShareOpen);
  const isQrScannerOpen = useModalStore((state) => state.isQrScannerOpen);
  const openShare = useModalStore((state) => state.openShare);
  const closeShare = useModalStore((state) => state.closeShare);
  const openQrScanner = useModalStore((state) => state.openQrScanner);
  const closeQrScanner = useModalStore((state) => state.closeQrScanner);
  const [sessionInitialized, setSessionInitialized] = useState(false);

  useEffect(() => {
    const param = searchParams.get("session")?.toUpperCase();
    const existing = engine.getState().sessionCode;
    const stored = getStoredSessionCode();
    const code = param || existing || stored || generateFreshSessionCode();
    setActiveSessionCode(code);
  }, [searchParams, engine]);

  const initSession = useCallback(
    async (codeToJoin?: string) => {
      if (!user || !device) return;

      try {
        let code = codeToJoin?.trim().toUpperCase() || "";

        if (!code) {
          const paramCode = searchParams.get("session")?.toUpperCase();
          const existing = engine.getState().sessionCode;
          const stored = getStoredSessionCode();
          code = paramCode || existing || stored || generateFreshSessionCode();
        }

        if (typeof window !== "undefined") {
          storeSessionCode(code);
          const url = new URL(window.location.href);
          url.searchParams.set("session", code);
          window.history.replaceState(null, "", url.toString());
        }

        setActiveSessionCode(code);
        await engine.joinSession(code, device.id, device.device_name, user.username);
        setSessionInitialized(true);

        const pendingFiles = consumeStagedFiles();
        if (pendingFiles.length > 0) {
          await engine.stageFiles(pendingFiles);
        }
      } catch (err) {
        console.error("Failed to initialize session:", err);
        setSessionInitialized(true);
      }
    },
    [user, device, searchParams, engine]
  );

  useEffect(() => {
    if (user && device && !sessionInitialized) {
      initSession();
    }
  }, [user, device, sessionInitialized, initSession]);

  // Auto-consume files staged from landing page hero uploader
  useEffect(() => {
    if (sessionInitialized) {
      const staged = consumeStagedFiles();
      if (staged && staged.length > 0) {
        engine.stageFiles(staged).catch((err) => {
          console.error("Auto-staging files from landing failed:", err);
        });
      }
    }
  }, [sessionInitialized, engine]);

  const handleSelectFiles = async (files: File[]) => {
    await engine.stageFiles(files);
  };

  const handleResumeTransfer = async (fileId: string) => {
    try {
      await engine.resumeTransfer(fileId);
      router.push(`/transfers/${fileId}?session=${currentSessionCode}`);
    } catch (err: any) {
      alert(err?.message || "Failed to resume transfer");
    }
  };

  const handlePauseTransfer = (fileId: string) => {
    engine.pauseTransfer(fileId);
  };

  const handleCancelTransfer = async (fileId: string) => {
    await engine.cancelTransfer(fileId);
  };

  const handleOpenShare = () => {
    openShare(currentSessionCode);
  };

  const currentSessionCode = activeSessionCode || engineState.sessionCode || "NUT-ROOM1";

  const seenPeers = new Set<string>();
  const meshPeersList: PeerMeshItem[] = Array.from(engineState.peers.entries())
    .filter(([peerId, p]) => {
      const isSelf =
        peerId === engineState.localPeerId ||
        p.metadata?.peer_id === engineState.localPeerId;

      if (isSelf) return false;

      if (seenPeers.has(peerId)) return false;
      seenPeers.add(peerId);
      return true;
    })
    .map(([peerId, p]) => {
      const shortCode = extractPeerShortId(p.metadata?.username, peerId);
      return {
        id: `#${shortCode}`,
        rawPeerId: peerId,
        speed: "Direct SCTP",
        latency: p.latencyMs !== undefined ? `${p.latencyMs}ms` : (p.connectionState === "connected" ? "< 1ms" : "—"),
        isOnline: p.connectionState === "connected",
      };
    });

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col">
      <AppNavbar
        sessionCode={currentSessionCode}
        onOpenShare={handleOpenShare}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto p-3.5 sm:p-6 space-y-5 pb-16">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">

          <TopTransferActionCards
            sessionCode={currentSessionCode}
            onSelectFiles={handleSelectFiles}
            activeFileId={engineState.activeFiles[0]?.fileId}
            onJoinSession={(code) => initSession(code)}
            onOpenQrScanner={() => openQrScanner()}
          />

          <div className="hidden lg:block h-full">
            <ConnectedMeshPanel
              meshPeers={meshPeersList}
              sessionCode={currentSessionCode}
              onJoinSession={(code) => initSession(code)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-5 items-start">

          <TransferActivityHub
            activeFiles={engineState.activeFiles}
            totalPeersCount={Math.max(1, engineState.peers.size)}
            sessionCode={currentSessionCode}
            onCancelTransfer={handleCancelTransfer}
            onResumeTransfer={handleResumeTransfer}
            onPauseTransfer={handlePauseTransfer}
          />

          <ConnectedDevicesCard
            meshPeers={meshPeersList}
          />
        </div>
      </main>

      <QrScannerDialog
        isOpen={isQrScannerOpen}
        onClose={closeQrScanner}
        onScanSuccess={(code: string) => initSession(code)}
      />

      <ShareSessionDialog
        sessionCode={currentSessionCode}
        isOpen={isShareOpen}
        onClose={closeShare}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5]" />}>
      <DashboardContent />
    </Suspense>
  );
}
