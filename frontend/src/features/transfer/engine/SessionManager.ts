import { detectEffectiveTransportRoute } from "@/features/settings/settingsStore";
import { LanTurboTransport } from "./lan/LanTurboTransport";
import type { FileManifest } from "@/types/protocol";
import type { InternalFileTransfer } from "./engineTypes";
import type { TransferEngine } from "./TransferEngine";

export class SessionManager {
  public static async checkInitialRoomFiles(
    engine: TransferEngine,
  ): Promise<void> {
    if (!engine.sessionCode) return;

    const effectiveRoute = await detectEffectiveTransportRoute();
    if (effectiveRoute !== "lan") return;

    try {
      const roomFiles = await LanTurboTransport.getRoomFiles(
        engine.sessionCode,
      );
      for (const rf of roomFiles) {
        if (engine.cancelledFileIds.has(rf.fileId)) {
          continue;
        }

        const isShareNuter = Boolean(
          (rf.senderPeerId && rf.senderPeerId === engine.localPeerId) ||
          engine.localOriginatedFileIds.has(rf.fileId) ||
          engine.activeFiles.get(rf.fileId)?.isSender ||
          engine.activeFiles.get(rf.fileId)?.rawFile,
        );

        const existing = engine.activeFiles.get(rf.fileId);
        if (existing) {
          if (isShareNuter) {
            existing.isSender = true;
          }
          if (rf.completed && existing.status !== "completed") {
            existing.status = "completed";
            existing.progress = 100;
            existing.speedBytesPerSec = 0;
            existing.etaSeconds = 0;
            engine.notify();
          }
          continue;
        }

        if (isShareNuter) {
          continue;
        }

        console.log(
          `[TransferEngine] Auto-discovered LAN staged file: ${rf.fileName} (${rf.size} B), completed=${rf.completed}`,
        );
        const fileSeqId = engine.nextFileSeqId++;
        const manifest: FileManifest = {
          fileId: rf.fileId,
          name: rf.fileName,
          size: rf.size,
          mimeType: rf.fileType || "application/octet-stream",
          totalChunks: Math.ceil(rf.size / (1024 * 1024)) || 1,
          chunkSize: 1024 * 1024,
          chunkHashes: [],
        };

        const isDone = Boolean(rf.completed);

        const fileTransfer: InternalFileTransfer = {
          fileSeqId,
          fileId: rf.fileId,
          manifest,
          chunks: [],
          status: isDone ? "completed" : "transferring",
          progress: isDone ? 100 : 0,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          verifiedCount: isDone ? rf.size : 0,
          totalCount: rf.size,
          isSender: isShareNuter,
          lanSessionId: rf.sessionId,
          lanToken: rf.token,
          createdAt: Date.now(),
          bytesInterval: 0,
        };

        engine.activeFiles.set(rf.fileId, fileTransfer);
        engine.fileSeqMap.set(fileSeqId, rf.fileId);
        engine.notify(true);

        const alreadyDownloaded =
          typeof window !== "undefined" &&
          (Boolean(
            sessionStorage.getItem(`ShareNut_downloaded_${rf.fileId}`),
          ) ||
            Boolean(localStorage.getItem(`ShareNut_downloaded_${rf.fileId}`)));

        if (!isShareNuter && !isDone && !alreadyDownloaded) {
          LanTurboTransport.downloadFile(
            rf.sessionId,
            rf.fileId,
            rf.fileName,
            (progress, speedBps, bytesReceived, totalBytes) => {
              engine.handleLanProgressUpdate({
                fileId: rf.fileId,
                progress,
                speedBytesPerSec: speedBps,
                bytesTransferred: bytesReceived,
                totalBytes,
              });
            },
          ).catch((err) => {
            console.error(
              `[LanTurboTransport] Auto-download failed for ${rf.fileName}:`,
              err,
            );
            fileTransfer.status = "failed";
            engine.notify();
          });
        }
      }
    } catch (e) {
      console.warn("[TransferEngine] checkInitialRoomFiles failed:", e);
    }
  }
}
