import { detectEffectiveTransportRoute } from "@/features/settings/settingsStore";
import { LanTransferHandler } from "./lan/LanTransferHandler";
import { WebTransferHandler } from "./web/WebTransferHandler";
import type { TransferEngine } from "./TransferEngine";
import type { FileManifest } from "@/types/protocol";
import type { InternalFileTransfer } from "./engineTypes";

export class StagingManager {
  public static async stageFiles(
    engine: TransferEngine,
    files: File[],
  ): Promise<void> {
    if (!files || files.length === 0) return;

    if (engine.getConnectedPeerCount() === 0) {
      for (const file of files) {
        const fileSeqId = engine.nextFileSeqId++;
        const fileId = `ShareNut-file-${fileSeqId}-${Date.now()}`;
        const manifest: FileManifest = {
          fileId,
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          totalChunks: Math.ceil((file.size || 1) / (1024 * 1024)) || 1,
          chunkSize: 1024 * 1024,
          chunkHashes: [],
        };

        const fileTransfer: InternalFileTransfer = {
          fileSeqId,
          fileId,
          manifest,
          chunks: [],
          status: "waiting",
          progress: 0,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          verifiedCount: 0,
          totalCount: file.size,
          isSender: true,
          rawFile: file,
          createdAt: Date.now(),
          bytesInterval: 0,
        };

        engine.localOriginatedFileIds.add(fileId);
        engine.activeFiles.set(fileId, fileTransfer);
        engine.fileSeqMap.set(fileSeqId, fileId);
      }
      engine.notify(true);
      return;
    }

    await StagingManager.startActiveStage(engine, files);
  }

  public static async startActiveStage(
    engine: TransferEngine,
    files: File[],
  ): Promise<void> {
    if (!files || files.length === 0) return;

    const effectiveRoute = await detectEffectiveTransportRoute();
    engine.activeTransportRoute = effectiveRoute;
    engine.notify();

    if (effectiveRoute === "lan") {
      const staged = await LanTransferHandler.stageLanUpload(engine, files);
      if (staged) {
        return;
      }

      engine.activeTransportRoute = "webrtc";
      engine.notify();
    }

    await WebTransferHandler.stageWebUpload(engine, files);
  }

  public static async stageFile(
    engine: TransferEngine,
    file: File,
  ): Promise<void> {
    await StagingManager.stageFiles(engine, [file]);
  }
}
