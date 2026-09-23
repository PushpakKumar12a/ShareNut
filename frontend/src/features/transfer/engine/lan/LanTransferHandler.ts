import { LanTurboTransport } from "./LanTurboTransport";
import { NetworkRouteDetector } from "./NetworkRouteDetector";
import {
  BinaryFraming,
  PacketType,
  type DecodedPacket,
} from "../web/BinaryFraming";
import { StreamingZipChunker } from "../StreamingZip";
import { getConfiguredChunkSize } from "@/features/settings/settingsStore";
import type { FileManifest } from "@/types/protocol";
import type { InternalFileTransfer } from "../engineTypes";
import type { TransferEngine } from "../TransferEngine";

export class LanTransferHandler {
  public static async stageLanUpload(
    engine: TransferEngine,
    files: File[],
  ): Promise<boolean> {
    if (!files || files.length === 0) return false;

    try {
      if (files.length > 1) {
        const streamingZip = new StreamingZipChunker(
          files,
          getConfiguredChunkSize(),
        );
        const fileSeqId = engine.nextFileSeqId++;
        const fileId = `ShareNut-file-${fileSeqId}-${Date.now()}`;
        const { manifest } = streamingZip.createInstantManifest(fileId);

        const prep = await LanTurboTransport.prepareUpload(
          [
            {
              name: streamingZip.name,
              size: streamingZip.size,
              type: "application/zip",
            } as unknown as File,
          ],
          engine.localUsername,
          engine.sessionCode || undefined,
          engine.localPeerId,
        );
        const [lanFileId, token] = Object.entries(prep.files)[0] || [
          `lan-${Date.now()}`,
          "",
        ];

        const fileTransfer: InternalFileTransfer = {
          fileSeqId,
          fileId: lanFileId,
          manifest: { ...manifest, fileId: lanFileId },
          chunks: [],
          status: "transferring",
          progress: 0,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          verifiedCount: 0,
          totalCount: streamingZip.size,
          isSender: true,
          rawFile: undefined,
          lanSessionId: prep.sessionId,
          lanToken: token,
          createdAt: Date.now(),
          bytesInterval: 0,
        };

        engine.localOriginatedFileIds.add(lanFileId);
        engine.activeFiles.set(lanFileId, fileTransfer);
        engine.fileSeqMap.set(fileSeqId, lanFileId);

        const lanPayload = {
          action: "LAN_MANIFEST",
          sessionId: prep.sessionId,
          fileId: lanFileId,
          token,
          name: streamingZip.name,
          size: streamingZip.size,
          mimeType: "application/zip",
          senderPeerId: engine.localPeerId,
        };

        const lanPacket = BinaryFraming.encodeJson(
          PacketType.LAN_MANIFEST,
          lanPayload,
          fileSeqId,
        );
        engine.webrtcManager?.broadcastBinary(lanPacket);
        if (engine.sessionCode) {
          engine.signalingClient?.send({
            type: "MESSAGE",
            session_code: engine.sessionCode,
            sender_peer_id: engine.localPeerId,
            payload: lanPayload,
          });
        }

        const abortController = new AbortController();
        engine.abortControllers.set(lanFileId, abortController);

        let lastProgressBroadcast = 0;
        LanTurboTransport.uploadFile(
          prep.sessionId,
          lanFileId,
          token,
          streamingZip,
          (progress, speedBps, bytesSent, totalBytes) => {
            if (engine.cancelledFileIds.has(lanFileId)) return;
            fileTransfer.progress = progress;
            fileTransfer.speedBytesPerSec = speedBps;
            fileTransfer.verifiedCount = bytesSent;
            if (speedBps > 0) {
              fileTransfer.etaSeconds = Math.max(
                0,
                Math.round((totalBytes - bytesSent) / speedBps),
              );
            }
            if (progress >= 100) {
              fileTransfer.status = "completed";
              fileTransfer.speedBytesPerSec = 0;
              fileTransfer.etaSeconds = 0;
            } else {
              fileTransfer.status = "transferring";
            }

            const now = Date.now();
            if (now - lastProgressBroadcast >= 100 || progress >= 100) {
              lastProgressBroadcast = now;
              const progressPayload = {
                action: "LAN_PROGRESS",
                fileId: lanFileId,
                name: streamingZip.name,
                sessionId: prep.sessionId,
                token,
                progress,
                speedBytesPerSec: speedBps,
                bytesTransferred: bytesSent,
                totalBytes,
              };
              if (engine.sessionCode) {
                engine.signalingClient?.send({
                  type: "MESSAGE",
                  session_code: engine.sessionCode,
                  sender_peer_id: engine.localPeerId,
                  payload: progressPayload,
                });
              }
              const progressPacket = BinaryFraming.encodeJson(
                PacketType.LAN_PROGRESS,
                progressPayload,
                fileSeqId,
              );
              engine.webrtcManager?.broadcastBinary(progressPacket);
              engine.notify();
            }
          },
          abortController.signal,
        )
          .catch((err) => {
            if (
              abortController.signal.aborted ||
              engine.cancelledFileIds.has(lanFileId)
            ) {
              console.log(
                `[LanTurboTransport] Upload cancelled for ${streamingZip.name}`,
              );
              return;
            }
            console.error(
              `[LanTurboTransport] Upload failed for ${streamingZip.name}:`,
              err,
            );
            fileTransfer.status = "failed";
            engine.notify();
          })
          .finally(() => {
            engine.abortControllers.delete(lanFileId);
          });

        engine.notify(true);
        return true;
      } else {
        const file = files[0];
        const prep = await LanTurboTransport.prepareUpload(
          [file],
          engine.localUsername,
          engine.sessionCode || undefined,
          engine.localPeerId,
        );
        const [lanFileId, token] = Object.entries(prep.files)[0] || [
          `lan-${Date.now()}`,
          "",
        ];

        const fileSeqId = engine.nextFileSeqId++;
        const manifest: FileManifest = {
          fileId: lanFileId,
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          totalChunks: Math.ceil(file.size / (1024 * 1024)) || 1,
          chunkSize: 1024 * 1024,
          chunkHashes: [],
        };

        const fileTransfer: InternalFileTransfer = {
          fileSeqId,
          fileId: lanFileId,
          manifest,
          chunks: [],
          status: "transferring",
          progress: 0,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          verifiedCount: 0,
          totalCount: file.size,
          isSender: true,
          rawFile: file,
          lanSessionId: prep.sessionId,
          lanToken: token,
          createdAt: Date.now(),
          bytesInterval: 0,
        };

        engine.localOriginatedFileIds.add(lanFileId);
        engine.activeFiles.set(lanFileId, fileTransfer);
        engine.fileSeqMap.set(fileSeqId, lanFileId);

        const lanPayload = {
          action: "LAN_MANIFEST",
          sessionId: prep.sessionId,
          fileId: lanFileId,
          token,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          senderPeerId: engine.localPeerId,
        };

        const lanPacket = BinaryFraming.encodeJson(
          PacketType.LAN_MANIFEST,
          lanPayload,
          fileSeqId,
        );
        engine.webrtcManager?.broadcastBinary(lanPacket);
        if (engine.sessionCode) {
          engine.signalingClient?.send({
            type: "MESSAGE",
            session_code: engine.sessionCode,
            sender_peer_id: engine.localPeerId,
            payload: lanPayload,
          });
        }

        const abortController = new AbortController();
        engine.abortControllers.set(lanFileId, abortController);

        let lastProgressBroadcast = 0;
        LanTurboTransport.uploadFile(
          prep.sessionId,
          lanFileId,
          token,
          file,
          (progress, speedBps, bytesSent, totalBytes) => {
            if (engine.cancelledFileIds.has(lanFileId)) return;
            fileTransfer.progress = progress;
            fileTransfer.speedBytesPerSec = speedBps;
            fileTransfer.verifiedCount = bytesSent;
            if (speedBps > 0) {
              fileTransfer.etaSeconds = Math.max(
                0,
                Math.round((totalBytes - bytesSent) / speedBps),
              );
            }
            if (progress >= 100) {
              fileTransfer.status = "completed";
              fileTransfer.speedBytesPerSec = 0;
              fileTransfer.etaSeconds = 0;
            } else {
              fileTransfer.status = "transferring";
            }

            const now = Date.now();
            if (now - lastProgressBroadcast >= 100 || progress >= 100) {
              lastProgressBroadcast = now;
              const progressPayload = {
                action: "LAN_PROGRESS",
                fileId: lanFileId,
                name: file.name,
                sessionId: prep.sessionId,
                token,
                progress,
                speedBytesPerSec: speedBps,
                bytesTransferred: bytesSent,
                totalBytes,
              };
              if (engine.sessionCode) {
                engine.signalingClient?.send({
                  type: "MESSAGE",
                  session_code: engine.sessionCode,
                  sender_peer_id: engine.localPeerId,
                  payload: progressPayload,
                });
              }
              const progressPacket = BinaryFraming.encodeJson(
                PacketType.LAN_PROGRESS,
                progressPayload,
                fileSeqId,
              );
              engine.webrtcManager?.broadcastBinary(progressPacket);
              engine.notify();
            }
          },
          abortController.signal,
        )
          .catch((err) => {
            if (
              abortController.signal.aborted ||
              engine.cancelledFileIds.has(lanFileId)
            ) {
              console.log(
                `[LanTurboTransport] Upload cancelled for ${file.name}`,
              );
              return;
            }
            console.error(
              `[LanTurboTransport] Upload failed for ${file.name}:`,
              err,
            );
            fileTransfer.status = "failed";
            engine.notify();
          })
          .finally(() => {
            engine.abortControllers.delete(lanFileId);
          });

        engine.notify(true);
        return true;
      }
    } catch (err) {
      console.warn(
        "[LanTransferHandler] LAN mode failed, falling back to WebRTC:",
        err,
      );
      NetworkRouteDetector.invalidateCache();
      return false;
    }
  }

  public static async handleLanManifest(
    engine: TransferEngine,
    senderPeerId: string,
    packet: DecodedPacket,
  ): Promise<void> {
    const decoder = new TextDecoder();
    const json = JSON.parse(decoder.decode(packet.payload));
    const { sessionId, fileId, token, name, size, mimeType } = json;

    if (engine.cancelledFileIds.has(fileId)) {
      console.log(
        `[TransferEngine] Ignoring LAN_MANIFEST for cancelled file ${fileId}`,
      );
      return;
    }

    if (
      senderPeerId === engine.localPeerId ||
      engine.localOriginatedFileIds.has(fileId) ||
      engine.activeFiles.get(fileId)?.isSender ||
      engine.activeFiles.get(fileId)?.rawFile
    ) {
      console.log(
        `[TransferEngine] Ignoring LAN_MANIFEST for locally seeded file ${fileId}`,
      );
      return;
    }

    console.log(
      `[TransferEngine] Received LAN_MANIFEST for "${name}" (${size} bytes) from ${senderPeerId}`,
    );

    let fileTransfer = engine.activeFiles.get(fileId);
    if (!fileTransfer) {
      const fileSeqId = engine.nextFileSeqId++;
      const manifest: FileManifest = {
        fileId,
        name,
        size,
        mimeType: mimeType || "application/octet-stream",
        totalChunks: Math.ceil(size / (1024 * 1024)) || 1,
        chunkSize: 1024 * 1024,
        chunkHashes: [],
      };

      fileTransfer = {
        fileSeqId,
        fileId,
        manifest,
        chunks: [],
        status: "transferring",
        progress: 0,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        verifiedCount: 0,
        totalCount: size,
        isSender: false,
        lanSessionId: sessionId,
        lanToken: token,
        createdAt: Date.now(),
        bytesInterval: 0,
      };

      engine.activeFiles.set(fileId, fileTransfer);
      engine.fileSeqMap.set(fileSeqId, fileId);
    } else {
      if (fileTransfer.status === "completed") {
        console.log(
          `[TransferEngine] Ignoring LAN_MANIFEST for already-completed file ${fileId}`,
        );
        return;
      }
      fileTransfer.lanSessionId = sessionId;
      fileTransfer.lanToken = token;
      fileTransfer.status = "transferring";
      fileTransfer.scheduler = undefined;
    }

    const alreadyDownloaded =
      typeof window !== "undefined" &&
      (Boolean(sessionStorage.getItem(`ShareNut_downloaded_${fileId}`)) ||
        Boolean(localStorage.getItem(`ShareNut_downloaded_${fileId}`)));
    if (alreadyDownloaded) {
      fileTransfer.status = "completed";
      fileTransfer.progress = 100;
      fileTransfer.speedBytesPerSec = 0;
      fileTransfer.etaSeconds = 0;
      engine.notify(true);
      return;
    }

    engine.notify(true);

    LanTurboTransport.downloadFile(
      sessionId,
      fileId,
      name,
      (progress, speedBps, bytesReceived, totalBytes) => {
        if (!fileTransfer) return;
        fileTransfer.progress = progress;
        fileTransfer.speedBytesPerSec = speedBps;
        fileTransfer.verifiedCount = bytesReceived;
        if (speedBps > 0) {
          fileTransfer.etaSeconds = Math.max(
            0,
            Math.round((totalBytes - bytesReceived) / speedBps),
          );
        }
        if (progress >= 100) {
          fileTransfer.status = "completed";
          fileTransfer.speedBytesPerSec = 0;
          fileTransfer.etaSeconds = 0;
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(`ShareNut_downloaded_${fileId}`, "1");
              localStorage.setItem(`ShareNut_downloaded_${fileId}`, "1");
            } catch {}
          }
        } else {
          fileTransfer.status = "transferring";
        }
        engine.notify();
      },
    )
      .then(() => {
        console.log(
          `[LanTurboTransport] Download stream initiated for "${name}"`,
        );
      })
      .catch((err) => {
        console.error(`[LanTurboTransport] Download failed for ${name}:`, err);
        if (fileTransfer) {
          fileTransfer.status = "failed";
          engine.notify(true);
        }
      });
  }

  public static handleLanProgressPacket(
    engine: TransferEngine,
    senderPeerId: string,
    packet: DecodedPacket,
  ): void {
    try {
      const decoder = new TextDecoder();
      const json = JSON.parse(decoder.decode(packet.payload));
      if (json && json.fileId) {
        engine.handleLanProgressUpdate(json);
      }
    } catch (err) {
      console.warn(
        "[LanTransferHandler] Error parsing LAN_PROGRESS packet:",
        err,
      );
    }
  }
}
