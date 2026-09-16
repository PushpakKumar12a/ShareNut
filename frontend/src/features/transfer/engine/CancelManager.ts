import { BinaryFraming, PacketType } from "./web/BinaryFraming";
import { LanTurboTransport } from "./lan/LanTurboTransport";
import { chunkStore } from "@/features/transfer/engine/ChunkStore";
import { ResumeRegistry } from "./ResumeRegistry";
import type { TransferEngine } from "./TransferEngine";

export class CancelManager {
  public static async cancelTransfer(
    engine: TransferEngine,
    fileId?: string,
  ): Promise<void> {
    if (fileId) {
      ResumeRegistry.removePartialTransfer(fileId);
      engine.cancelledFileIds.add(fileId);
      engine.localOriginatedFileIds.delete(fileId);
      const controller = engine.abortControllers.get(fileId);
      if (controller) {
        controller.abort();
        engine.abortControllers.delete(fileId);
      }
      engine.activeStreams.delete(fileId);

      LanTurboTransport.resetDownload(fileId);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`ShareNut_downloaded_${fileId}`);
          localStorage.removeItem(`ShareNut_downloaded_${fileId}`);
        } catch {}
      }

      const file = engine.activeFiles.get(fileId);
      if (file && file.lanSessionId) {
        LanTurboTransport.cancelSession(file.lanSessionId).catch(console.warn);
      }

      if (file && (file.status === "completed" || file.status === "waiting")) {
        console.log(
          `[TransferEngine] Removing ${file.status} file ${fileId} locally`,
        );
        try {
          await chunkStore.clearFileChunks(file.fileId);
        } catch (err) {
          console.warn("[TransferEngine] Error clearing file chunks:", err);
        }
        engine.fileSeqMap.delete(file.fileSeqId);
        engine.activeFiles.delete(fileId);
        engine.notify(true);
        return;
      }
    }

    console.log(
      `[TransferEngine] Cancelling in-progress transfer ${fileId || "all"}`,
    );

    if (engine.sessionCode) {
      engine.signalingClient?.send({
        type: "MESSAGE",
        session_code: engine.sessionCode,
        sender_peer_id: engine.localPeerId,
        payload: {
          action: "TRANSFER_CANCEL",
          fileId: fileId || null,
          all: !fileId,
        },
      });
    }

    const cancelPacket = BinaryFraming.encodeJson(PacketType.TRANSFER_CANCEL, {
      fileId: fileId || null,
      all: !fileId,
    });
    engine.webrtcManager?.broadcastBinary(cancelPacket);
    engine.webrtcManager?.broadcastData({
      type: "TRANSFER_CANCEL",
      timestamp: Date.now(),
      sender_peer_id: engine.localPeerId,
      payload: {
        action: "TRANSFER_CANCEL",
        fileId: fileId || null,
        all: !fileId,
      },
    });

    await CancelManager.handleRemoteCancelTransfer(engine, fileId, !fileId);
  }

  public static async handleRemoteCancelTransfer(
    engine: TransferEngine,
    fileId?: string,
    all?: boolean,
  ): Promise<void> {
    if (fileId) {
      engine.cancelledFileIds.add(fileId);
      engine.localOriginatedFileIds.delete(fileId);
      const controller = engine.abortControllers.get(fileId);
      if (controller) {
        controller.abort();
        engine.abortControllers.delete(fileId);
      }
      engine.activeStreams.delete(fileId);

      const file = engine.activeFiles.get(fileId);
      if (file && file.lanSessionId) {
        LanTurboTransport.cancelSession(file.lanSessionId).catch(console.warn);
      }

      if (file && file.status === "completed") {
        console.log(
          `[TransferEngine] Remote peer cancelled file ${fileId}, but we already completed it. Keeping local copy.`,
        );
        return;
      }
      if (file) {
        file.status = "cancelled";
        file.speedBytesPerSec = 0;
        file.etaSeconds = 0;
        file.scheduler = undefined;
        try {
          await chunkStore.clearFileChunks(file.fileId);
        } catch (err) {
          console.warn("[TransferEngine] Error clearing file chunks:", err);
        }
        engine.fileSeqMap.delete(file.fileSeqId);
        engine.activeFiles.delete(fileId);
      }
    } else if (all || !fileId) {
      if (engine.pumpTimer) {
        clearInterval(engine.pumpTimer);
        engine.pumpTimer = null;
      }
      for (const controller of engine.abortControllers.values()) {
        controller.abort();
      }
      engine.abortControllers.clear();
      engine.activeStreams.clear();

      for (const [fId, file] of Array.from(engine.activeFiles.entries())) {
        engine.cancelledFileIds.add(fId);
        engine.localOriginatedFileIds.delete(fId);
        if (file.lanSessionId) {
          LanTurboTransport.cancelSession(file.lanSessionId).catch(
            console.warn,
          );
        }

        if (file.status !== "completed") {
          file.status = "cancelled";
          file.speedBytesPerSec = 0;
          file.etaSeconds = 0;
          file.scheduler = undefined;
          try {
            await chunkStore.clearFileChunks(file.fileId);
          } catch (err) {
            console.warn("[TransferEngine] Error clearing file chunks:", err);
          }
          engine.fileSeqMap.delete(file.fileSeqId);
          engine.activeFiles.delete(fId);
        }
      }
    }
    engine.notify(true);
  }
}
