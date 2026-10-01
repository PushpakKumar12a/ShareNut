import { BinaryFraming, PacketType, type DecodedPacket } from "./BinaryFraming";
import { Chunker } from "../Chunker";
import { StreamingZipChunker } from "../StreamingZip";
import { chunkStore } from "../ChunkStore";
import { CryptoEngine } from "../CryptoEngine";
import { Bitfield } from "@/features/p2p/Bitfield";
import { ChunkScheduler } from "@/features/p2p/Scheduler";
import {
  getConfiguredChunkSize,
  getConfiguredConcurrency,
} from "@/features/settings/settingsStore";
import type {
  ChunkInfo,
  FileManifest,
  ManifestPacketPayload,
} from "@/types/protocol";
import type { InternalFileTransfer } from "../engineTypes";
import type { TransferEngine } from "../TransferEngine";
import { LanTransferHandler } from "../lan/LanTransferHandler";

export class WebTransferHandler {
  public static async stageWebUpload(
    engine: TransferEngine,
    files: File[],
  ): Promise<void> {
    if (!files || files.length === 0) return;

    if (files.length > 1) {
      const streamingZip = new StreamingZipChunker(
        files,
        getConfiguredChunkSize(),
      );
      const fileSeqId = engine.nextFileSeqId++;
      const fileId = `ShareNut-file-${fileSeqId}-${Date.now()}`;
      const { manifest, chunks } = streamingZip.createInstantManifest(fileId);

      const fileTransfer: InternalFileTransfer = {
        fileSeqId,
        fileId,
        manifest,
        chunks,
        status: "ready",
        progress: 0,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        verifiedCount: 0,
        totalCount: manifest.totalChunks,
        isSender: true,
        chunker: streamingZip as any,
        createdAt: Date.now(),
        bytesInterval: 0,
      };

      engine.localOriginatedFileIds.add(fileId);
      engine.activeFiles.set(fileId, fileTransfer);
      engine.fileSeqMap.set(fileSeqId, fileId);

      const payload: ManifestPacketPayload = { fileSeqId, manifest };
      const packet = BinaryFraming.encodeJson(
        PacketType.MANIFEST,
        payload,
        fileSeqId,
      );

      engine.webrtcManager?.broadcastBinary(packet);
      if (engine.sessionCode) {
        engine.signalingClient?.send({
          type: "MESSAGE",
          session_code: engine.sessionCode,
          sender_peer_id: engine.localPeerId,
          payload: {
            action: "FILE_MANIFEST",
            payload,
          },
        });
      }

      engine.notify(true);
      setTimeout(() => {
        engine.startPushStreaming(fileId);
      }, 50);
    } else {
      const file = files[0];
      const chunker = new Chunker(file, getConfiguredChunkSize());
      const fileSeqId = engine.nextFileSeqId++;
      const fileId = `ShareNut-file-${fileSeqId}-${Date.now()}`;
      const { manifest, chunks } = chunker.createInstantManifest(fileId);

      const fileTransfer: InternalFileTransfer = {
        fileSeqId,
        fileId,
        manifest,
        chunks,
        status: "ready",
        progress: 0,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        verifiedCount: 0,
        totalCount: manifest.totalChunks,
        isSender: true,
        rawFile: file,
        chunker,
        createdAt: Date.now(),
        bytesInterval: 0,
      };

      engine.localOriginatedFileIds.add(fileId);
      engine.activeFiles.set(fileId, fileTransfer);
      engine.fileSeqMap.set(fileSeqId, fileId);

      const payload: ManifestPacketPayload = { fileSeqId, manifest };
      const packet = BinaryFraming.encodeJson(
        PacketType.MANIFEST,
        payload,
        fileSeqId,
      );

      engine.webrtcManager?.broadcastBinary(packet);
      if (engine.sessionCode) {
        engine.signalingClient?.send({
          type: "MESSAGE",
          session_code: engine.sessionCode,
          sender_peer_id: engine.localPeerId,
          payload: {
            action: "FILE_MANIFEST",
            payload,
          },
        });
      }

      engine.notify(true);
      setTimeout(() => {
        engine.startPushStreaming(fileId);
      }, 50);
    }
  }

  public static async startPushStreaming(
    engine: TransferEngine,
    fileId?: string,
  ): Promise<void> {
    if (!fileId) {
      for (const [id, f] of engine.activeFiles.entries()) {
        if (f.isSender && f.status !== "completed") {
          WebTransferHandler.startPushStreaming(engine, id);
        }
      }
      return;
    }

    if (engine.activeStreams.has(fileId)) return;
    const file = engine.activeFiles.get(fileId);
    if (!file || !file.isSender || !file.chunker) return;

    engine.activeStreams.add(fileId);
    file.status = "transferring";
    engine.notify();

    try {
      const total = file.manifest.totalChunks;
      for (let i = 0; i < total; i++) {
        if (
          file.status !== "transferring" ||
          engine.cancelledFileIds.has(fileId)
        )
          break;

        const openPeers: string[] = [];
        engine.peers.forEach((peer, peerId) => {
          if (
            peer.dataChannelState === "open" ||
            peer.connectionState === "connected"
          ) {
            openPeers.push(peerId);
          }
        });

        if (openPeers.length === 0) {
          await new Promise((r) => setTimeout(r, 200));
          if (
            file.status !== "transferring" ||
            engine.cancelledFileIds.has(fileId)
          )
            break;
          engine.peers.forEach((peer, peerId) => {
            if (
              peer.dataChannelState === "open" ||
              peer.connectionState === "connected"
            ) {
              openPeers.push(peerId);
            }
          });
          if (openPeers.length === 0) break;
        }

        const chunkData = await file.chunker.getChunk(i);
        if (!chunkData) continue;

        const sessionSecret = engine.sessionCode || file.manifest.fileId;
        const encryptedChunk = await CryptoEngine.encryptChunk(
          chunkData,
          sessionSecret,
        );
        const packet = BinaryFraming.encodeChunk(
          file.fileSeqId,
          i,
          encryptedChunk,
        );

        CryptoEngine.computeSha256(chunkData).then((chunkHash) => {
          if (file.chunks[i]) {
            file.chunks[i].hash = chunkHash;
          }
        });

        const targetPeer = openPeers[i % openPeers.length];
        const sent = await engine.webrtcManager?.sendBinaryWithBackpressure(
          targetPeer,
          packet,
        );
        if (sent) {
          file.bytesInterval += packet.byteLength;
          engine.bytesTransferredInterval += packet.byteLength;
        }

        if (openPeers.length > 1 && i < total - 1) {
          await new Promise((r) => setTimeout(r, 20));
        }

        file.verifiedCount = i + 1;
        file.progress = total > 0 ? Math.round(((i + 1) / total) * 100) : 0;

        if (i % 8 === 0 || i === total - 1) {
          engine.notify();
        }
      }

      if (file.verifiedCount >= total && !engine.cancelledFileIds.has(fileId)) {
        file.status = "completed";
        file.progress = 100;
        file.speedBytesPerSec = 0;
        file.etaSeconds = 0;
        engine.notify(true);

        const completePacket = BinaryFraming.encodeJson(
          PacketType.TRANSFER_COMPLETE,
          { fileId },
          file.fileSeqId,
        );
        engine.webrtcManager?.broadcastBinary(completePacket);
      }
    } catch (err) {
      console.error("[WebTransferHandler] Push streaming error:", err);
      file.status = "failed";
      engine.notify();
    } finally {
      engine.activeStreams.delete(fileId);
    }
  }

  public static async startTransfer(
    engine: TransferEngine,
    fileId?: string,
  ): Promise<void> {
    if (fileId) {
      const file = engine.activeFiles.get(fileId);
      if (file && file.status !== "completed") {
        file.status = "transferring";
        if (file.isSender) {
          WebTransferHandler.startPushStreaming(engine, fileId);
        }
      }
    } else {
      for (const file of engine.activeFiles.values()) {
        if (file.status !== "completed") {
          file.status = "transferring";
          if (file.isSender) {
            WebTransferHandler.startPushStreaming(engine, file.fileId);
          } else if (!file.scheduler) {
            file.scheduler = new ChunkScheduler(
              file.manifest.totalChunks,
              getConfiguredConcurrency(),
            );
          }
        }
      }
    }

    engine.notify();
    WebTransferHandler.pumpRarestFirst(engine);

    if (!engine.pumpTimer) {
      engine.pumpTimer = setInterval(() => {
        const hasTransferring = Array.from(engine.activeFiles.values()).some(
          (f) => f.status === "transferring",
        );
        if (hasTransferring) {
          WebTransferHandler.pumpRarestFirst(engine);
        }
      }, 100);
    }
  }

  public static async pumpRarestFirst(engine: TransferEngine): Promise<void> {
    for (const file of engine.activeFiles.values()) {
      if (
        file.isSender ||
        file.status !== "transferring" ||
        !file.scheduler ||
        file.lanSessionId
      ) {
        continue;
      }

      const scheduled = file.scheduler.getNextRequests();
      if (scheduled.length === 0) continue;

      for (const req of scheduled) {
        const reqPacket = BinaryFraming.encodeRequestChunk(
          file.fileSeqId,
          req.chunkIndex,
        );
        const sent = await engine.webrtcManager?.sendBinary(
          req.peerId,
          reqPacket,
        );

        if (sent && file.chunks[req.chunkIndex]) {
          file.chunks[req.chunkIndex].status = "downloading";
          file.chunks[req.chunkIndex].progress = 30;
          file.chunks[req.chunkIndex].peerId = req.peerId;
        }
      }
    }
    engine.notify();
  }

  public static async handleWebPacket(
    engine: TransferEngine,
    senderPeerId: string,
    packet: DecodedPacket,
  ): Promise<void> {
    switch (packet.type) {
      case PacketType.MANIFEST: {
        const decoder = new TextDecoder();
        const json = JSON.parse(decoder.decode(packet.payload));
        const fileSeqId: number =
          json.fileSeqId !== undefined ? json.fileSeqId : 0;
        const manifest: FileManifest = json.manifest || json;

        if (engine.cancelledFileIds.has(manifest.fileId)) {
          console.log(
            `[TransferEngine] Ignoring MANIFEST for cancelled file ${manifest.fileId}`,
          );
          break;
        }

        console.log(
          `[TransferEngine] Received file manifest for "${manifest.name}" (seq: ${fileSeqId}) from ${senderPeerId}`,
        );

        let fileTransfer = engine.activeFiles.get(manifest.fileId);
        if (
          senderPeerId === engine.localPeerId ||
          engine.localOriginatedFileIds.has(manifest.fileId) ||
          fileTransfer?.isSender ||
          fileTransfer?.rawFile
        ) {
          console.log(
            `[TransferEngine] Ignoring MANIFEST for locally seeded file ${manifest.fileId}`,
          );
          break;
        }
        if (fileTransfer?.lanSessionId) {
          console.log(
            `[TransferEngine] Ignoring WebRTC MANIFEST for active LAN Turbo file ${manifest.fileId}`,
          );
          break;
        }
        if (!fileTransfer) {
          const chunks: ChunkInfo[] = [];
          for (let i = 0; i < manifest.totalChunks; i++) {
            const offset = i * manifest.chunkSize;
            const size = Math.min(manifest.chunkSize, manifest.size - offset);
            chunks.push({
              index: i,
              offset,
              size,
              hash: "",
              status: "pending",
              progress: 0,
            });
          }

          const scheduler = new ChunkScheduler(
            manifest.totalChunks,
            getConfiguredConcurrency(),
          );

          fileTransfer = {
            fileSeqId,
            fileId: manifest.fileId,
            manifest,
            chunks,
            status: "ready",
            progress: 0,
            speedBytesPerSec: 0,
            etaSeconds: 0,
            verifiedCount: 0,
            totalCount: manifest.totalChunks,
            isSender: false,
            scheduler,
            createdAt: Date.now(),
            bytesInterval: 0,
          };

          engine.activeFiles.set(manifest.fileId, fileTransfer);
          engine.fileSeqMap.set(fileSeqId, manifest.fileId);
        }

        fileTransfer.scheduler?.updatePeerBitfield(
          senderPeerId,
          Bitfield.createAll(manifest.totalChunks),
        );
        fileTransfer.scheduler?.setSenderPeerId(senderPeerId);

        engine.peers.forEach((peerItem, pId) => {
          if (pId !== senderPeerId && pId !== engine.localPeerId) {
            fileTransfer.scheduler?.updatePeerBitfield(
              pId,
              new Bitfield(manifest.totalChunks),
            );
          }
        });

        const peer = engine.peers.get(senderPeerId);
        if (peer) {
          if (!peer.fileChunks) peer.fileChunks = new Map();
          peer.fileChunks.set(
            manifest.fileId,
            new Set(
              Array.from({ length: manifest.totalChunks }, (chunkItem, i) => i),
            ),
          );
        }

        engine.notify();
        await engine.startTransfer(manifest.fileId);
        break;
      }

      case PacketType.REQUEST_CHUNK: {
        let fileId = engine.fileSeqMap.get(packet.fileSeqId);
        let file = fileId ? engine.activeFiles.get(fileId) : undefined;
        if (!file) {
          for (const f of engine.activeFiles.values()) {
            if (
              f.fileSeqId === packet.fileSeqId ||
              (f.isSender && engine.activeFiles.size === 1)
            ) {
              file = f;
              fileId = f.fileId;
              break;
            }
          }
        }
        if (!file || (fileId && engine.cancelledFileIds.has(fileId))) return;

        if (file.isSender) {
          const connectedPeerCount = engine.getConnectedPeerCount();
          if (
            connectedPeerCount > 1 &&
            fileId &&
            engine.activeStreams.has(fileId)
          ) {
            return;
          }
          if (file.status !== "transferring") {
            file.status = "transferring";
          }
        }

        const chunkIndex = packet.chunkIndex;
        let chunkData: ArrayBuffer | null = null;

        if (file.chunker) {
          chunkData = await file.chunker.getChunk(chunkIndex);
        } else {
          chunkData = await chunkStore.getChunk(
            file.fileId,
            chunkIndex,
            file.manifest?.chunkSize || 65504,
          );
        }

        if (chunkData) {
          const sessionSecret =
            engine.sessionCode || file.manifest?.fileId || "ShareNut";
          const encryptedChunk = await CryptoEngine.encryptChunk(
            chunkData,
            sessionSecret,
          );
          const chunkPacket = BinaryFraming.encodeChunk(
            packet.fileSeqId,
            chunkIndex,
            encryptedChunk,
          );
          file.bytesInterval += chunkPacket.byteLength;
          engine.bytesTransferredInterval += chunkPacket.byteLength;
          await engine.webrtcManager?.sendBinary(senderPeerId, chunkPacket);

          CryptoEngine.computeSha256(chunkData).then((chunkHash) => {
            if (file?.chunks[chunkIndex]) {
              file.chunks[chunkIndex].hash = chunkHash;
            }
          });
        }
        break;
      }

      case PacketType.CHUNK_DATA: {
        let fileId = engine.fileSeqMap.get(packet.fileSeqId);
        let file = fileId ? engine.activeFiles.get(fileId) : undefined;
        if (!file) {
          for (const f of engine.activeFiles.values()) {
            if (
              f.fileSeqId === packet.fileSeqId ||
              (!f.isSender && engine.activeFiles.size === 1)
            ) {
              file = f;
              fileId = f.fileId;
              break;
            }
          }
        }
        if (
          !file ||
          !file.chunks[packet.chunkIndex] ||
          (fileId && engine.cancelledFileIds.has(fileId))
        )
          return;

        const chunkIndex = packet.chunkIndex;
        const sessionSecret =
          engine.sessionCode || file.manifest.fileId || "ShareNut";
        const chunkData = await CryptoEngine.decryptChunk(
          packet.payload,
          sessionSecret,
        );

        const effectiveChunkSize = file.manifest.chunkSize || 65536;
        chunkStore
          .saveChunk(file.fileId, chunkIndex, chunkData, effectiveChunkSize)
          .catch((err) => {
            console.warn("[TransferEngine] Async chunk save error:", err);
          });

        CryptoEngine.computeSha256(chunkData).then((chunkHash) => {
          if (file?.chunks[chunkIndex]) {
            file.chunks[chunkIndex].hash = chunkHash;
          }
        });

        file.bytesInterval += chunkData.byteLength;
        file.chunks[chunkIndex].status = "verified";
        file.chunks[chunkIndex].progress = 100;
        file.chunks[chunkIndex].peerId = senderPeerId;
        file.scheduler?.markLocalChunk(chunkIndex, true);

        const havePacket = BinaryFraming.encodeHaveChunk(
          packet.fileSeqId,
          chunkIndex,
        );
        engine.webrtcManager?.broadcastBinary(havePacket);

        const verifiedCount = file.chunks.filter(
          (c) => c.status === "verified",
        ).length;
        file.verifiedCount = verifiedCount;
        file.progress =
          file.totalCount > 0
            ? Math.round((verifiedCount / file.totalCount) * 100)
            : 0;

        if (verifiedCount === file.totalCount) {
          file.status = "completed";
          file.speedBytesPerSec = 0;
          file.etaSeconds = 0;
          engine.notify(true);

          chunkStore.closeOpfsWritable(file.fileId).catch((err) => {
            console.warn(
              "[TransferEngine] Error closing OPFS writable on complete:",
              err,
            );
          });

          if (
            !file.isSender &&
            !engine.localOriginatedFileIds.has(file.fileId)
          ) {
            this.downloadReconstructedFile(engine, file.fileId).catch((err) => {
              console.error("[TransferEngine] Auto-download error:", err);
            });
          }
        } else {
          engine.notify();
        }
        break;
      }

      case PacketType.HAVE_CHUNK: {
        const fileId = engine.fileSeqMap.get(packet.fileSeqId);
        if (!fileId || engine.cancelledFileIds.has(fileId)) return;
        const file = engine.activeFiles.get(fileId);
        if (!file) return;

        file.scheduler?.markPeerHave(senderPeerId, packet.chunkIndex);

        const peer = engine.peers.get(senderPeerId);
        if (peer) {
          if (!peer.fileChunks) peer.fileChunks = new Map();
          let set = peer.fileChunks.get(fileId);
          if (!set) {
            set = new Set();
            peer.fileChunks.set(fileId, set);
          }
          set.add(packet.chunkIndex);
        }
        WebTransferHandler.pumpRarestFirst(engine);
        break;
      }

      case PacketType.TRANSFER_PAUSE: {
        const fileId = engine.fileSeqMap.get(packet.fileSeqId);
        if (!fileId) return;
        const file = engine.activeFiles.get(fileId);
        if (file) {
          file.status = "paused";
          engine.notify();
        }
        break;
      }

      case PacketType.TRANSFER_CANCEL: {
        const fileId = engine.fileSeqMap.get(packet.fileSeqId);
        if (fileId) {
          await engine.cancelTransfer(fileId);
        }
        break;
      }

      case PacketType.TRANSFER_COMPLETE: {
        const fileId = engine.fileSeqMap.get(packet.fileSeqId);
        if (fileId) {
          const file = engine.activeFiles.get(fileId);
          if (file && file.verifiedCount >= file.totalCount) {
            file.status = "completed";
            engine.notify(true);
          }
        }
        break;
      }

      case PacketType.PING: {
        const pongPacket = BinaryFraming.encodePong(packet.chunkIndex);
        engine.webrtcManager?.sendBinary(senderPeerId, pongPacket);
        break;
      }

      case PacketType.PONG: {
        const sentTime = packet.chunkIndex;
        const now = Math.round(performance.now());
        const rtt = Math.max(
          1,
          Math.min(9999, now >= sentTime ? now - sentTime : 1),
        );
        const peer = engine.peers.get(senderPeerId);
        if (peer) {
          peer.latencyMs = rtt;
          engine.notify();
        }
        break;
      }

      case PacketType.LAN_MANIFEST: {
        await LanTransferHandler.handleLanManifest(
          engine,
          senderPeerId,
          packet,
        );
        break;
      }

      case PacketType.LAN_PROGRESS: {
        LanTransferHandler.handleLanProgressPacket(
          engine,
          senderPeerId,
          packet,
        );
        break;
      }
    }
  }

  public static async downloadReconstructedFile(
    engine: TransferEngine,
    fileId: string,
  ): Promise<void> {
    const file = engine.activeFiles.get(fileId);
    if (!file) {
      console.warn(`[TransferEngine] File ${fileId} not found for download`);
      return;
    }

    try {
      const fileBlob = await chunkStore.assembleFile(file.manifest.fileId);

      let savedViaPicker = false;
      if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: file.manifest.name,
          });
          const writable = await handle.createWritable();
          if (typeof fileBlob.stream === "function") {
            await fileBlob.stream().pipeTo(writable);
          } else {
            await writable.write(fileBlob);
            await writable.close();
          }
          savedViaPicker = true;
        } catch (pickerErr: any) {
          if (pickerErr?.name === "AbortError") {
            return;
          }
        }
      }

      if (!savedViaPicker && typeof document !== "undefined") {
        const url = URL.createObjectURL(fileBlob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.manifest.name;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `ShareNut_downloaded_${file.manifest.fileId}`,
          "1",
        );
        try {
          localStorage.setItem(
            `ShareNut_downloaded_${file.manifest.fileId}`,
            "1",
          );
        } catch {}
      }

      console.log(
        `[TransferEngine] Successfully assembled and downloaded "${file.manifest.name}"`,
      );
    } catch (err) {
      console.error("[TransferEngine] File assembly error:", err);
    }
  }

  // Alias used by TransferEngine — delegates to pumpRarestFirst
  public static async pumpScheduler(engine: TransferEngine): Promise<void> {
    return WebTransferHandler.pumpRarestFirst(engine);
  }

  // Decode raw binary buffer and dispatch to handleWebPacket
  public static async handleIncomingBinary(
    engine: TransferEngine,
    senderPeerId: string,
    buffer: ArrayBuffer,
  ): Promise<void> {
    const packet = BinaryFraming.decode(buffer);
    if (!packet) return;
    await WebTransferHandler.handleWebPacket(engine, senderPeerId, packet);
  }

  // Trigger download for every completed file
  public static async downloadAllCompleted(
    engine: TransferEngine,
  ): Promise<void> {
    for (const file of engine.activeFiles.values()) {
      if (file.status === "completed" && !file.isSender) {
        await WebTransferHandler.downloadReconstructedFile(engine, file.fileId);
      }
    }
  }
}
