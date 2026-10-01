import { SignalingClient } from "@/features/p2p/Signaling";
import { WebRTCManager } from "@/features/p2p/WebRTC";
import { BinaryFraming, PacketType } from "./web/BinaryFraming";
import { LanTurboTransport } from "./lan/LanTurboTransport";
import { getIceServers } from "@/features/settings/settingsStore";
import {
  NetworkRouteDetector,
  type TransportRoute,
  type DetectedRoute,
} from "./lan/NetworkRouteDetector";
import type {
  FileManifest,
  ManifestPacketPayload,
  PeerMetadata,
  TransferStatus,
} from "@/types/protocol";

import type {
  PeerNode,
  EngineState,
  StateListener,
  InternalFileTransfer,
  LanProgressPacketPayload,
  MeshPeerProgress,
  MeshProgressSummary,
} from "./engineTypes";
export type {
  PeerNode,
  EngineState,
  StateListener,
  InternalFileTransfer,
  LanProgressPacketPayload,
  MeshPeerProgress,
  MeshProgressSummary,
} from "./engineTypes";

import { SessionManager } from "./SessionManager";
import { CancelManager } from "./CancelManager";
import { StagingManager } from "./StagingManager";

import { WebTransferHandler } from "./web/WebTransferHandler";
import { chunkStore } from "./ChunkStore";
import { extractPeerShortId } from "@/lib/utils";

export class TransferEngine {
  public localPeerId: string;
  public sessionCode: string | null = null;
  public localRole: "host" | "peer" | null = null;
  public localUsername: string = "User";
  public localDeviceId: string = "";

  public signalingClient: SignalingClient | null = null;
  public webrtcManager: WebRTCManager | null = null;

  public peers: Map<string, PeerNode> = new Map();

  public activeFiles: Map<string, InternalFileTransfer> = new Map();

  public fileSeqMap: Map<number, string> = new Map();
  public nextFileSeqId: number = 0;

  public bytesTransferredInterval: number = 0;
  public speedTimer: ReturnType<typeof setInterval> | null = null;
  public latencyTimer: ReturnType<typeof setInterval> | null = null;
  public pumpTimer: ReturnType<typeof setInterval> | null = null;
  public lanPollerTimer: ReturnType<typeof setInterval> | null = null;
  public activeStreams: Set<string> = new Set();
  public cancelledFileIds: Set<string> = new Set();
  public localOriginatedFileIds: Set<string> = new Set();
  private isResumingWaiting: boolean = false;
  public abortControllers: Map<string, AbortController> = new Map();
  private notifyTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastNotifyTime: number = 0;
  private readonly NOTIFY_INTERVAL_MS = 35;
  private listeners: Set<StateListener> = new Set();
  public signalingConnected: boolean = false;
  public activeTransportRoute: TransportRoute = "lan";
  public lastRouteDetection: DetectedRoute | null = null;

  private isJoiningSession: boolean = false;

  constructor(localPeerId?: string) {
    let suffix = "";
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("ShareNut_peer_profile");
        if (raw) {
          const parsed = JSON.parse(raw);
          const u = parsed?.user?.username || "";
          if (u.includes("#")) {
            const extracted = u.split("#")[1]?.trim().slice(0, 4).toLowerCase();
            if (extracted && extracted !== "peer" && extracted.length === 4) {
              suffix = extracted;
            }
          }
        }
      } catch {}
    }
    this.localPeerId =
      localPeerId ||
      (suffix
        ? `peer-${Math.random().toString(36).slice(2, 8)}-${suffix}`
        : "peer-" +
          Math.random().toString(36).slice(2, 8) +
          "-" +
          Math.random().toString(36).slice(2, 6));
  }

  public getLocalPeerId(): string {
    return this.localPeerId;
  }

  public getState(): EngineState {
    const filesList = Array.from(this.activeFiles.values()).map((f) => ({
      fileSeqId: f.fileSeqId,
      fileId: f.fileId,
      manifest: f.manifest,
      chunks: f.chunks,
      status: f.status,
      progress: f.progress,
      speedBytesPerSec: f.speedBytesPerSec,
      etaSeconds: f.etaSeconds,
      verifiedCount: f.verifiedCount,
      totalCount: f.totalCount,
      isSender: f.isSender,
      createdAt: f.createdAt,
    }));

    const latestFile = filesList[filesList.length - 1] || null;

    let overallStatus: TransferStatus = "idle";
    let overallProgress = 0;
    let totalSpeed = 0;
    let maxEta = 0;

    if (filesList.length > 0) {
      const anyTransferring = filesList.some(
        (f) => f.status === "transferring",
      );
      const anyPaused = filesList.some((f) => f.status === "paused");
      const allCompleted = filesList.every(
        (f) => f.status === "completed" || f.status === "cancelled",
      );

      if (allCompleted) {
        overallStatus = "completed";
        overallProgress = 100;
      } else if (anyTransferring) {
        overallStatus = "transferring";
      } else if (anyPaused) {
        overallStatus = "paused";
      } else {
        overallStatus = "ready";
      }

      const totalChunksAllFiles = filesList.reduce(
        (acc, f) => acc + f.totalCount,
        0,
      );
      const verifiedChunksAllFiles = filesList.reduce(
        (acc, f) => acc + f.verifiedCount,
        0,
      );
      overallProgress =
        totalChunksAllFiles > 0
          ? Math.round((verifiedChunksAllFiles / totalChunksAllFiles) * 100)
          : 0;

      const ulSpeed = filesList
        .filter((f) => f.isSender)
        .reduce((acc, f) => acc + f.speedBytesPerSec, 0);
      const dlSpeed = filesList
        .filter((f) => !f.isSender)
        .reduce((acc, f) => acc + f.speedBytesPerSec, 0);
      totalSpeed = ulSpeed + dlSpeed;
      maxEta = Math.max(...filesList.map((f) => f.etaSeconds), 0);

      return {
        sessionCode: this.sessionCode,
        localPeerId: this.localPeerId,
        localRole: this.localRole,
        signalingConnected: this.signalingConnected,
        peers: new Map(this.peers),
        activeFiles: filesList,
        manifest: latestFile ? latestFile.manifest : null,
        chunks: latestFile ? latestFile.chunks : [],
        transferStatus: overallStatus,
        transferProgress: overallProgress,
        throughputBps: totalSpeed,
        uploadThroughputBps: ulSpeed,
        downloadThroughputBps: dlSpeed,
        etaSeconds: maxEta,
        activeTransportRoute: this.activeTransportRoute,
        lastRouteDetection: this.lastRouteDetection,
      };
    }

    return {
      sessionCode: this.sessionCode,
      localPeerId: this.localPeerId,
      localRole: this.localRole,
      signalingConnected: this.signalingConnected,
      peers: new Map(this.peers),
      activeFiles: filesList,
      manifest: latestFile ? latestFile.manifest : null,
      chunks: latestFile ? latestFile.chunks : [],
      transferStatus: overallStatus,
      transferProgress: overallProgress,
      throughputBps: totalSpeed,
      uploadThroughputBps: 0,
      downloadThroughputBps: 0,
      etaSeconds: maxEta,
      activeTransportRoute: this.activeTransportRoute,
      lastRouteDetection: this.lastRouteDetection,
    };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(immediate: boolean = false): void {
    if (immediate) {
      if (this.notifyTimeout) {
        clearTimeout(this.notifyTimeout);
        this.notifyTimeout = null;
      }
      this.lastNotifyTime = Date.now();
      this.dispatchState();
      return;
    }

    const now = Date.now();
    const elapsed = now - this.lastNotifyTime;

    if (elapsed >= this.NOTIFY_INTERVAL_MS) {
      if (this.notifyTimeout) {
        clearTimeout(this.notifyTimeout);
        this.notifyTimeout = null;
      }
      this.lastNotifyTime = now;
      this.dispatchState();
    } else if (!this.notifyTimeout) {
      const remaining = this.NOTIFY_INTERVAL_MS - elapsed;
      this.notifyTimeout = setTimeout(() => {
        this.notifyTimeout = null;
        this.lastNotifyTime = Date.now();
        this.dispatchState();
      }, remaining);
    }
  }

  private dispatchState(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error("[TransferEngine] Listener error:", err);
      }
    });
  }

  public async joinSession(
    sessionCode: string,
    deviceId: string,
    deviceName: string,
    username: string,
  ): Promise<void> {
    const cleanCode = sessionCode.trim().toUpperCase();

    if (this.isJoiningSession) {
      return;
    }

    if (this.sessionCode === cleanCode && this.signalingClient) {
      console.log(
        `[TransferEngine] Already connected to session ${cleanCode}, preserving mesh mesh.`,
      );
      return;
    }

    this.isJoiningSession = true;

    try {
      if (this.sessionCode && this.sessionCode !== cleanCode) {
        this.leaveSession();
      }

      let userSuffix = "";
      if (username && username.includes("#")) {
        const extracted = username
          .split("#")[1]
          ?.trim()
          .slice(0, 4)
          .toLowerCase();
        if (extracted && extracted !== "peer" && extracted.length === 4) {
          userSuffix = extracted;
        }
      }
      if (userSuffix) {
        this.localPeerId = `peer-${Math.random().toString(36).slice(2, 8)}-${userSuffix}`;
      } else if (!this.localPeerId) {
        this.localPeerId =
          "peer-" +
          Math.random().toString(36).slice(2, 8) +
          "-" +
          Math.random().toString(36).slice(2, 6);
      }
      this.sessionCode = cleanCode;
      this.localUsername = username;
      this.localDeviceId = deviceId;

      this.webrtcManager = new WebRTCManager(
        this.localPeerId,
        {
          sendSignalOffer: (targetPeerId, sdp) => {
            this.signalingClient?.send({
              type: "OFFER",
              session_code: this.sessionCode!,
              sender_peer_id: this.localPeerId,
              target_peer_id: targetPeerId,
              payload: { sdp },
            });
          },
          sendSignalAnswer: (targetPeerId, sdp) => {
            this.signalingClient?.send({
              type: "ANSWER",
              session_code: this.sessionCode!,
              sender_peer_id: this.localPeerId,
              target_peer_id: targetPeerId,
              payload: { sdp },
            });
          },
          sendSignalCandidate: (targetPeerId, candidate) => {
            this.signalingClient?.send({
              type: "ICE_CANDIDATE",
              session_code: this.sessionCode!,
              sender_peer_id: this.localPeerId,
              target_peer_id: targetPeerId,
              payload: { candidate },
            });
          },
          onPeerConnectionStateChange: (peerId, state) => {
            const peer = this.peers.get(peerId);
            if (peer) {
              peer.connectionState = state;
              this.notify();
            }
          },
          onDataChannelStateChange: (peerId, state) => {
            let peer = this.peers.get(peerId);
            if (!peer) {
              const fallbackCode = extractPeerShortId(null, peerId);
              this.addOrUpdatePeer({
                peer_id: peerId,
                user_id: "",
                username: `Peer #${fallbackCode}`,
                device_id: "",
                device_name: "Web Peer",
                role: "peer",
              });
              peer = this.peers.get(peerId);
            }
            if (peer) {
              peer.dataChannelState = state;
              this.notify();
              if (state === "open") {
                this.resumeWaitingTransfers();
                const pingPacket = BinaryFraming.encodePing();
                this.webrtcManager?.sendBinary(peerId, pingPacket);
                this.webrtcManager?.getPeerLatency(peerId).then((rtt) => {
                  if (rtt !== null && peer) {
                    peer.latencyMs = rtt;
                    this.notify();
                  }
                });

                for (const file of this.activeFiles.values()) {
                  if (file.status === "completed") continue;
                  if (file.lanSessionId) {
                    const lanPayload = {
                      action: "LAN_MANIFEST",
                      sessionId: file.lanSessionId,
                      fileId: file.fileId,
                      token: file.lanToken || "",
                      name: file.manifest.name,
                      size: file.manifest.size,
                      mimeType: file.manifest.mimeType,
                      senderPeerId: this.localPeerId,
                    };
                    const lanPacket = BinaryFraming.encodeJson(
                      PacketType.LAN_MANIFEST,
                      lanPayload,
                      file.fileSeqId,
                    );
                    this.webrtcManager?.sendBinary(peerId, lanPacket);
                    continue;
                  }

                  const payload: ManifestPacketPayload = {
                    fileSeqId: file.fileSeqId,
                    manifest: file.manifest,
                  };
                  const manifestPacket = BinaryFraming.encodeJson(
                    PacketType.MANIFEST,
                    payload,
                    file.fileSeqId,
                  );
                  this.webrtcManager?.sendBinary(peerId, manifestPacket);

                  if (
                    file.isSender &&
                    (file.status === "transferring" || file.status === "ready")
                  ) {
                    this.startPushStreaming(file.fileId);
                  }
                }
              }
            }
          },
          onDataMessage: (peerId, msg) => {
            console.log(
              `[TransferEngine] DataMessage from ${peerId}:`,
              msg.type,
            );
            const p = msg.payload as
              | { action?: string; fileId?: string; all?: boolean }
              | undefined;
            if (
              p?.action === "TRANSFER_CANCEL" ||
              msg.type === "TRANSFER_CANCEL"
            ) {
              console.log(
                `[TransferEngine] Remote peer ${peerId} cancelled transfer ${p?.fileId || "all"}`,
              );
              this.handleRemoteCancelTransfer(p?.fileId, p?.all);
            }
          },
          onBinaryData: (peerId, data) => {
            this.handleIncomingBinary(peerId, data);
          },
        },
        getIceServers(),
      );

      this.signalingClient = new SignalingClient({
        sessionCode: this.sessionCode,
        peerId: this.localPeerId,
        deviceId,
        deviceName,
        username: this.localUsername,
        onOpen: () => {
          this.signalingConnected = true;
          this.notify();
        },
        onClose: () => {
          this.signalingConnected = false;
          this.notify();
        },
      });

      this.signalingClient.on("JOINED", (msg) => {
        const payload = msg.payload as {
          your_peer_id: string;
          existing_peers: PeerMetadata[];
        };
        if (payload?.existing_peers) {
          payload.existing_peers.forEach((meta) => {
            if (meta.peer_id !== this.localPeerId) {
              this.addOrUpdatePeer(meta);

              if (this.localPeerId < meta.peer_id) {
                this.webrtcManager?.initiateConnection(meta.peer_id);
              }
            }
          });
        }
        this.notify();
      });

      this.signalingClient.on("PEER_JOINED", (msg) => {
        const meta = msg.payload as unknown as PeerMetadata;
        if (meta && meta.peer_id !== this.localPeerId) {
          this.addOrUpdatePeer(meta);

          if (this.localPeerId < meta.peer_id) {
            this.webrtcManager?.initiateConnection(meta.peer_id);
          }
        }
        this.notify();
      });

      this.signalingClient.on("PEER_LEFT", (msg) => {
        const payload = msg.payload as { peer_id: string };
        if (payload?.peer_id) {
          this.removePeer(payload.peer_id);
        }
      });

      this.signalingClient.on("MESSAGE", (msg) => {
        const payload = msg.payload as {
          action?: string;
          peerId?: string;
          fileId?: string;
          all?: boolean;
          payload?: ManifestPacketPayload;
        };
        if (payload?.action === "TRANSFER_CANCEL") {
          console.log(
            `[TransferEngine] Remote peer ${msg.sender_peer_id} cancelled transfer via signaling ${payload.fileId || "all"}`,
          );
          this.handleRemoteCancelTransfer(payload.fileId, payload.all);
        } else if (
          payload?.action === "FILE_MANIFEST" &&
          payload.payload &&
          msg.sender_peer_id
        ) {
          if (
            payload.payload.manifest?.fileId &&
            this.cancelledFileIds.has(payload.payload.manifest.fileId)
          ) {
            return;
          }
          console.log(
            `[TransferEngine] Received FILE_MANIFEST via signaling fallback from ${msg.sender_peer_id}`,
          );
          const manifestPayload = payload.payload;
          const encoded = BinaryFraming.encodeJson(
            PacketType.MANIFEST,
            manifestPayload,
            manifestPayload.fileSeqId,
          );
          this.handleIncomingBinary(msg.sender_peer_id, encoded);
        } else if (payload?.action === "LAN_MANIFEST" && msg.sender_peer_id) {
          if (payload.fileId && this.cancelledFileIds.has(payload.fileId)) {
            return;
          }
          console.log(
            `[TransferEngine] Received LAN_MANIFEST via signaling from ${msg.sender_peer_id}`,
          );
          const encoded = BinaryFraming.encodeJson(
            PacketType.LAN_MANIFEST,
            payload,
            0,
          );
          this.handleIncomingBinary(msg.sender_peer_id, encoded);
        } else if (payload?.action === "LAN_PROGRESS" && payload.fileId) {
          this.handleLanProgressUpdate(
            payload as unknown as LanProgressPacketPayload,
          );
        }
      });

      this.signalingClient.on("OFFER", (msg) => {
        const payload = msg.payload as { sdp: RTCSessionDescriptionInit };
        if (payload?.sdp && msg.sender_peer_id) {
          this.webrtcManager?.handleOffer(msg.sender_peer_id, payload.sdp);
        }
      });

      this.signalingClient.on("ANSWER", (msg) => {
        const payload = msg.payload as { sdp: RTCSessionDescriptionInit };
        if (payload?.sdp && msg.sender_peer_id) {
          this.webrtcManager?.handleAnswer(msg.sender_peer_id, payload.sdp);
        }
      });

      this.signalingClient.on("ICE_CANDIDATE", (msg) => {
        const payload = msg.payload as { candidate: RTCIceCandidateInit };
        if (payload?.candidate && msg.sender_peer_id) {
          this.webrtcManager?.handleIceCandidate(
            msg.sender_peer_id,
            payload.candidate,
          );
        }
      });

      this.signalingClient.connect();
      this.startSpeedTracker();
      this.startLatencyTracker();

      NetworkRouteDetector.detect()
        .then((detection) => {
          this.activeTransportRoute = detection.recommended;
          this.lastRouteDetection = detection;
          console.log(
            `[TransferEngine] Initial route detection: ${detection.recommended}`,
          );
          this.notify();
        })
        .catch((err) => {
          console.warn("[TransferEngine] Initial route detection failed:", err);
        });

      this.checkInitialRoomFiles();
    } finally {
      this.isJoiningSession = false;
    }
  }

  public leaveSession(): void {
    if (this.speedTimer) {
      clearInterval(this.speedTimer);
      this.speedTimer = null;
    }
    if (this.latencyTimer) {
      clearInterval(this.latencyTimer);
      this.latencyTimer = null;
    }
    if (this.pumpTimer) {
      clearInterval(this.pumpTimer);
      this.pumpTimer = null;
    }
    if (this.lanPollerTimer) {
      clearInterval(this.lanPollerTimer);
      this.lanPollerTimer = null;
    }
    if (this.signalingClient) {
      this.signalingClient.disconnect();
      this.signalingClient = null;
    }
    if (this.webrtcManager) {
      this.webrtcManager.closeAll();
      this.webrtcManager = null;
    }

    this.sessionCode = null;
    this.signalingConnected = false;
    this.peers.clear();
    this.activeFiles.clear();
    this.fileSeqMap.clear();
    this.notify();
  }

  public async checkInitialRoomFiles(): Promise<void> {
    return SessionManager.checkInitialRoomFiles(this);
  }

  public async cancelTransfer(fileId?: string): Promise<void> {
    return CancelManager.cancelTransfer(this, fileId);
  }

  public async handleRemoteCancelTransfer(
    fileId?: string,
    all?: boolean,
  ): Promise<void> {
    return CancelManager.handleRemoteCancelTransfer(this, fileId, all);
  }

  public async stageFiles(files: File[]): Promise<void> {
    return StagingManager.stageFiles(this, files);
  }

  public async stageFile(file: File): Promise<void> {
    return StagingManager.stageFile(this, file);
  }

  public async startPushStreaming(fileId?: string): Promise<void> {
    return WebTransferHandler.startPushStreaming(this, fileId);
  }

  public async startTransfer(fileId?: string): Promise<void> {
    return WebTransferHandler.startTransfer(this, fileId);
  }

  public async pumpScheduler(): Promise<void> {
    return WebTransferHandler.pumpScheduler(this);
  }

  public async handleIncomingBinary(
    senderPeerId: string,
    buffer: ArrayBuffer,
  ): Promise<void> {
    return WebTransferHandler.handleIncomingBinary(this, senderPeerId, buffer);
  }

  public async downloadReconstructedFile(fileId?: string): Promise<void> {
    if (!fileId) return WebTransferHandler.downloadAllCompleted(this);
    return WebTransferHandler.downloadReconstructedFile(this, fileId);
  }

  public async downloadAllCompleted(): Promise<void> {
    return WebTransferHandler.downloadAllCompleted(this);
  }

  public pauseTransfer(fileId?: string): void {
    if (fileId) {
      const file = this.activeFiles.get(fileId);
      if (file) {
        file.status = "paused";
        file.speedBytesPerSec = 0;
      }
    } else {
      for (const file of this.activeFiles.values()) {
        if (file.status !== "completed") {
          file.status = "paused";
          file.speedBytesPerSec = 0;
        }
      }
    }
    this.notify();
  }

  public async resumeTransfer(fileId?: string): Promise<void> {
    if (fileId) {
      const file = this.activeFiles.get(fileId);
      if (file) {
        file.status = "transferring";
        if (file.isSender) {
          await WebTransferHandler.startPushStreaming(this, fileId);
        } else {
          await WebTransferHandler.pumpScheduler(this);
        }
      }
    } else {
      for (const file of this.activeFiles.values()) {
        if (file.status === "paused") {
          file.status = "transferring";
          if (file.isSender) {
            await WebTransferHandler.startPushStreaming(this, file.fileId);
          } else {
            await WebTransferHandler.pumpScheduler(this);
          }
        }
      }
    }
    this.notify();
  }

  public getMeshProgressSummary(fileId: string): MeshProgressSummary {
    const file = this.activeFiles.get(fileId);
    if (!file) {
      return {
        fileId,
        totalMeshSpeedBps: 0,
        overallProgress: 0,
        totalBytesTransferredAcrossMesh: 0,
        completedRecipientPeers: 0,
        peers: [],
      };
    }

    const recipientPeers: MeshPeerProgress[] = [];
    const connectedPeers = Array.from(this.peers.values()).filter(
      (peerNode) =>
        peerNode.metadata?.peer_id !== this.localPeerId &&
        peerNode.metadata?.peer_id !== undefined,
    );

    const totalChunks = file.totalCount || file.manifest.totalChunks || 1;
    const totalBytes = file.manifest.size;

    for (const peerNode of connectedPeers) {
      const peerId = peerNode.metadata.peer_id;
      const peerChunks = peerNode.fileChunks?.get(fileId) || peerNode.hasChunks;
      const chunksCount = peerChunks
        ? peerChunks.size
        : file.status === "completed"
          ? totalChunks
          : 0;
      const peerProgress =
        totalChunks > 0
          ? Math.min(100, Math.round((chunksCount / totalChunks) * 100))
          : 0;

      let peerStatus:
        | "transferring"
        | "completed"
        | "waiting"
        | "paused"
        | "connected" = "connected";
      if (peerProgress >= 100) {
        peerStatus = "completed";
      } else if (file.status === "paused") {
        peerStatus = "paused";
      } else if (file.status === "transferring") {
        peerStatus = "transferring";
      } else if (file.status === "waiting") {
        peerStatus = "waiting";
      }

      const peerTransferredBytes = Math.min(
        totalBytes,
        Math.round((peerProgress / 100) * totalBytes),
      );

      const peerSpeed =
        connectedPeers.length > 0
          ? Math.round(file.speedBytesPerSec / connectedPeers.length)
          : file.speedBytesPerSec;

      recipientPeers.push({
        peerId,
        name:
          peerNode.metadata.device_name ||
          `Peer #${extractPeerShortId(peerId)}`,
        deviceModel: peerNode.metadata.device_name || "Browser Device",
        isSender: false,
        progress: peerProgress,
        speedBytesPerSec: peerStatus === "completed" ? 0 : peerSpeed,
        latencyMs: peerNode.latencyMs || 0,
        transferredBytes: peerTransferredBytes,
        totalBytes,
        chunksDownloaded: chunksCount,
        totalChunks,
        status: peerStatus,
        dataChannelState: peerNode.dataChannelState,
        connectionType: "direct",
      });
    }

    const completedCount = recipientPeers.filter(
      (item) => item.progress >= 100,
    ).length;
    const overallProgress =
      recipientPeers.length > 0
        ? Math.round(
            recipientPeers.reduce(
              (accumulator, current) => accumulator + current.progress,
              0,
            ) / recipientPeers.length,
          )
        : file.progress;

    const totalTransferred =
      recipientPeers.length > 0
        ? recipientPeers.reduce(
            (accumulator, current) => accumulator + current.transferredBytes,
            0,
          )
        : Math.round((file.progress / 100) * totalBytes);

    return {
      fileId,
      totalMeshSpeedBps: file.speedBytesPerSec,
      overallProgress,
      totalBytesTransferredAcrossMesh: totalTransferred,
      completedRecipientPeers: completedCount,
      peers: recipientPeers,
    };
  }

  private startSpeedTracker(): void {
    if (this.speedTimer) clearInterval(this.speedTimer);
    this.speedTimer = setInterval(() => {
      for (const file of this.activeFiles.values()) {
        if (file.lanSessionId) {
          continue;
        }

        file.speedBytesPerSec = file.bytesInterval;
        file.bytesInterval = 0;

        if (file.status === "transferring" && file.speedBytesPerSec > 0) {
          const remainingChunks = file.totalCount - file.verifiedCount;
          const remainingBytes = remainingChunks * file.manifest.chunkSize;
          file.etaSeconds = Math.max(
            1,
            Math.round(remainingBytes / file.speedBytesPerSec),
          );
        } else if (file.status === "completed" || file.status === "paused") {
          file.etaSeconds = 0;
        }
      }

      this.bytesTransferredInterval = 0;
      this.notify();
    }, 1000);
  }

  private startLatencyTracker(): void {
    if (this.latencyTimer) clearInterval(this.latencyTimer);
    this.latencyTimer = setInterval(() => {
      if (this.webrtcManager) {
        for (const [peerId, peer] of this.peers.entries()) {
          if (
            peer.dataChannelState === "open" ||
            peer.connectionState === "connected"
          ) {
            this.webrtcManager.getPeerLatency(peerId).then((rtt) => {
              if (rtt !== null && peer.latencyMs !== rtt) {
                peer.latencyMs = rtt;
                this.notify();
              }
            });
            const pingPacket = BinaryFraming.encodePing();
            this.webrtcManager.sendBinary(peerId, pingPacket);
          }
        }
      }
    }, 10000);
  }

  public getConnectedPeerCount(): number {
    let count = 0;
    for (const [peerId, peer] of this.peers.entries()) {
      if (
        peerId !== this.localPeerId &&
        peer.metadata?.peer_id !== this.localPeerId
      ) {
        count++;
      }
    }
    return count;
  }

  public async resumeWaitingTransfers(): Promise<void> {
    if (this.isResumingWaiting || this.getConnectedPeerCount() === 0) {
      return;
    }

    const waitingFiles: File[] = [];
    const waitingFileIds: string[] = [];

    for (const [fileId, fileTransfer] of this.activeFiles.entries()) {
      if (fileTransfer.status === "waiting" && fileTransfer.rawFile) {
        waitingFiles.push(fileTransfer.rawFile);
        waitingFileIds.push(fileId);
      }
    }

    if (waitingFiles.length === 0) {
      return;
    }

    this.isResumingWaiting = true;
    try {
      for (const fileId of waitingFileIds) {
        const file = this.activeFiles.get(fileId);
        if (file) {
          this.fileSeqMap.delete(file.fileSeqId);
        }
        this.activeFiles.delete(fileId);
      }

      await StagingManager.startActiveStage(this, waitingFiles);
    } finally {
      this.isResumingWaiting = false;
    }
  }

  public addOrUpdatePeer(meta: PeerMetadata): void {
    if (!meta?.peer_id || meta.peer_id === this.localPeerId) {
      return;
    }

    if (!this.peers.has(meta.peer_id)) {
      this.peers.set(meta.peer_id, {
        metadata: meta,
        connectionState: "new",
        dataChannelState: "connecting",
        lastSeen: Date.now(),
        fileChunks: new Map(),
      });
    } else {
      const existing = this.peers.get(meta.peer_id)!;
      existing.metadata = meta;
      existing.lastSeen = Date.now();
    }
    this.notify(true);
    this.resumeWaitingTransfers();
  }

  public handleLanProgressUpdate(p: LanProgressPacketPayload): void {
    if (
      !p ||
      !p.fileId ||
      this.cancelledFileIds.has(p.fileId) ||
      this.localOriginatedFileIds.has(p.fileId) ||
      this.activeFiles.get(p.fileId)?.isSender ||
      this.activeFiles.get(p.fileId)?.rawFile
    ) {
      return;
    }

    let fileTransfer = this.activeFiles.get(p.fileId);
    if (!fileTransfer) {
      const fileSeqId = this.nextFileSeqId++;
      const manifest: FileManifest = {
        fileId: p.fileId,
        name: p.name || `File-${p.fileId}`,
        size: p.totalBytes || 0,
        mimeType: "application/octet-stream",
        totalChunks: Math.ceil((p.totalBytes || 1) / (1024 * 1024)) || 1,
        chunkSize: 1024 * 1024,
        chunkHashes: [],
      };

      fileTransfer = {
        fileSeqId,
        fileId: p.fileId,
        manifest,
        chunks: [],
        status: p.progress >= 100 ? "completed" : "transferring",
        progress: p.progress || 0,
        speedBytesPerSec: p.speedBytesPerSec || 0,
        etaSeconds: 0,
        verifiedCount: p.bytesTransferred || 0,
        totalCount: p.totalBytes || 0,
        isSender: false,
        lanSessionId: p.sessionId,
        lanToken: p.token,
        createdAt: Date.now(),
        bytesInterval: 0,
      };

      this.activeFiles.set(p.fileId, fileTransfer);
      this.fileSeqMap.set(fileSeqId, p.fileId);

      if (p.sessionId && p.name && !fileTransfer.isSender) {
        LanTurboTransport.downloadFile(p.sessionId, p.fileId, p.name).catch(
          console.error,
        );
      }
    }

    if (fileTransfer && !fileTransfer.isSender) {
      fileTransfer.progress = p.progress || 0;
      fileTransfer.speedBytesPerSec = p.speedBytesPerSec || 0;
      fileTransfer.verifiedCount = p.bytesTransferred || 0;
      if (
        p.totalBytes &&
        (!fileTransfer.totalCount || fileTransfer.totalCount <= 0)
      ) {
        fileTransfer.totalCount = p.totalBytes;
        fileTransfer.manifest.size = p.totalBytes;
      }
      if (p.speedBytesPerSec > 0 && p.totalBytes > p.bytesTransferred) {
        fileTransfer.etaSeconds = Math.max(
          0,
          Math.round((p.totalBytes - p.bytesTransferred) / p.speedBytesPerSec),
        );
      } else {
        fileTransfer.etaSeconds = 0;
      }

      if (p.progress >= 100) {
        fileTransfer.status = "completed";
        fileTransfer.speedBytesPerSec = 0;
        fileTransfer.etaSeconds = 0;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(`ShareNut_downloaded_${p.fileId}`, "1");
            localStorage.setItem(`ShareNut_downloaded_${p.fileId}`, "1");
          } catch {}
        }
      } else {
        fileTransfer.status = "transferring";
      }
      this.notify(true);
    }
  }

  public removePeer(peerId: string): void {
    if (!this.peers.has(peerId)) return;
    this.peers.delete(peerId);
    for (const file of this.activeFiles.values()) {
      file.scheduler?.removePeer(peerId);
    }
    this.webrtcManager?.closePeer(peerId);
    this.notify();
  }
}

let globalEngine: TransferEngine | null = null;

export function getTransferEngine(): TransferEngine {
  if (typeof window === "undefined") {
    return new TransferEngine();
  }
  if (!globalEngine) {
    globalEngine = new TransferEngine();
    const targetWindow = window as unknown as Record<string, unknown>;
    targetWindow["shareNutEngine"] = globalEngine;
    targetWindow["shareNutChunkStore"] = chunkStore;
    targetWindow["__ShareNut_engine"] = globalEngine;
  }
  return globalEngine;
}
