import type {
  DataChannelState,
  DataMessage,
  WebRTCConnectionState,
} from "@/types/protocol";
import { DataChannelBackpressure } from "@/features/transfer/engine/web/BinaryFraming";

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export interface WebRTCManagerCallbacks {
  sendSignalOffer: (
    targetPeerId: string,
    sdp: RTCSessionDescriptionInit,
  ) => void;
  sendSignalAnswer: (
    targetPeerId: string,
    sdp: RTCSessionDescriptionInit,
  ) => void;
  sendSignalCandidate: (
    targetPeerId: string,
    candidate: RTCIceCandidateInit,
  ) => void;
  onPeerConnectionStateChange: (
    peerId: string,
    state: WebRTCConnectionState,
  ) => void;
  onDataChannelStateChange: (peerId: string, state: DataChannelState) => void;
  onDataMessage: (peerId: string, message: DataMessage) => void;
  onBinaryData?: (peerId: string, data: ArrayBuffer) => void;
}

export class WebRTCManager {
  private localPeerId: string;
  private iceServers: RTCIceServer[];
  private callbacks: WebRTCManagerCallbacks;

  private peerConnections: Map<string, RTCPeerConnection> = new Map();

  private dataChannels: Map<string, RTCDataChannel> = new Map();

  private backpressureHandlers: Map<string, DataChannelBackpressure> =
    new Map();

  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();

  private makingOffer: Map<string, boolean> = new Map();

  constructor(
    localPeerId: string,
    callbacks: WebRTCManagerCallbacks,
    iceServers: RTCIceServer[] = DEFAULT_ICE_SERVERS,
  ) {
    this.localPeerId = localPeerId;
    this.callbacks = callbacks;
    this.iceServers = iceServers;
  }

  public async initiateConnection(targetPeerId: string): Promise<void> {
    if (this.peerConnections.has(targetPeerId)) {
      console.log(`[WebRTC] Connection to ${targetPeerId} already in progress`);
      return;
    }

    console.log(`[WebRTC] Initiating connection to ${targetPeerId}`);
    const pc = this.createPeerConnection(targetPeerId);

    const dc = pc.createDataChannel("ShareNut-data", {
      ordered: true,
    });
    this.setupDataChannel(targetPeerId, dc);

    try {
      this.makingOffer.set(targetPeerId, true);
      const offer = await pc.createOffer();
      if (pc.signalingState !== "stable") {
        return;
      }
      await pc.setLocalDescription(offer);
      this.callbacks.sendSignalOffer(targetPeerId, offer);
    } catch (err) {
      console.error(
        `[WebRTC] Failed to create offer for ${targetPeerId}:`,
        err,
      );
    } finally {
      this.makingOffer.set(targetPeerId, false);
    }
  }

  public async handleOffer(
    senderPeerId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<void> {
    console.log(`[WebRTC] Handling offer from ${senderPeerId}`);

    let pc = this.peerConnections.get(senderPeerId);
    if (!pc) {
      pc = this.createPeerConnection(senderPeerId);
    }

    const isOfferCollision =
      Boolean(this.makingOffer.get(senderPeerId)) ||
      pc.signalingState !== "stable";
    const isPolite = this.localPeerId < senderPeerId;

    if (isOfferCollision) {
      if (!isPolite) {
        console.log(
          `[WebRTC] Glare collision with ${senderPeerId} — Impolite peer ignoring remote offer.`,
        );
        return;
      }
      console.log(
        `[WebRTC] Glare collision with ${senderPeerId} — Polite peer rolling back.`,
      );
      if (pc.signalingState !== "stable") {
        try {
          await pc.setLocalDescription({ type: "rollback" });
        } catch (e) {
          console.warn("[WebRTC] Rollback notice:", e);
        }
      }
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const queued = this.pendingCandidates.get(senderPeerId) || [];
      for (const cand of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn("[WebRTC] Error draining queued ICE candidate:", e);
        }
      }
      this.pendingCandidates.delete(senderPeerId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.callbacks.sendSignalAnswer(senderPeerId, answer);
    } catch (err) {
      console.warn(`[WebRTC] Handled offer notice for ${senderPeerId}:`, err);
    }
  }

  public async handleAnswer(
    senderPeerId: string,
    answer: RTCSessionDescriptionInit,
  ): Promise<void> {
    console.log(`[WebRTC] Handling answer from ${senderPeerId}`);
    const pc = this.peerConnections.get(senderPeerId);
    if (!pc) {
      console.warn(
        `[WebRTC] No connection found for answer from ${senderPeerId}`,
      );
      return;
    }

    if (pc.signalingState !== "have-local-offer") {
      console.log(
        `[WebRTC] Safely ignoring answer from ${senderPeerId} because signalingState is '${pc.signalingState}' (expected 'have-local-offer')`,
      );
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      const queued = this.pendingCandidates.get(senderPeerId) || [];
      for (const cand of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn("[WebRTC] Error draining queued ICE candidate:", e);
        }
      }
      this.pendingCandidates.delete(senderPeerId);
    } catch (err) {
      console.warn(
        `[WebRTC] Answer processing notice for ${senderPeerId}:`,
        err,
      );
    }
  }

  public async handleIceCandidate(
    senderPeerId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const pc = this.peerConnections.get(senderPeerId);
    if (!pc || !pc.remoteDescription || pc.signalingState === "closed") {
      const queue = this.pendingCandidates.get(senderPeerId) || [];
      queue.push(candidate);
      this.pendingCandidates.set(senderPeerId, queue);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.debug(`[WebRTC] ICE candidate notice from ${senderPeerId}:`, err);
    }
  }

  public sendData(targetPeerId: string, message: DataMessage): boolean {
    const dc = this.dataChannels.get(targetPeerId);
    if (!dc || dc.readyState !== "open") {
      return false;
    }

    try {
      dc.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error(
        `[WebRTC] Failed to send DataMessage to ${targetPeerId}:`,
        err,
      );
      return false;
    }
  }

  public async sendBinaryWithBackpressure(
    targetPeerId: string,
    data: ArrayBuffer,
  ): Promise<boolean> {
    const handler = this.backpressureHandlers.get(targetPeerId);
    if (handler) {
      return await handler.sendWithBackpressure(data);
    }
    return this.sendBinary(targetPeerId, data);
  }

  public sendBinary(targetPeerId: string, data: ArrayBuffer): boolean {
    const dc = this.dataChannels.get(targetPeerId);
    if (!dc || dc.readyState !== "open") {
      console.warn(
        `[WebRTC] Cannot send binary to ${targetPeerId}: DataChannel not open (state: ${dc?.readyState})`,
      );
      return false;
    }

    try {
      dc.send(data);
      return true;
    } catch (err) {
      console.error(`[WebRTC] Failed to send binary to ${targetPeerId}:`, err);
      return false;
    }
  }

  public broadcastData(message: DataMessage): number {
    let sentCount = 0;
    const serialized = JSON.stringify(message);

    this.dataChannels.forEach((dc, peerId) => {
      if (dc.readyState === "open") {
        try {
          dc.send(serialized);
          sentCount++;
        } catch (e) {
          console.error(`[WebRTC] Broadcast error to ${peerId}:`, e);
        }
      }
    });

    return sentCount;
  }

  public broadcastBinary(data: ArrayBuffer): number {
    let sentCount = 0;
    this.dataChannels.forEach((dc, peerId) => {
      if (dc.readyState === "open") {
        try {
          dc.send(data);
          sentCount++;
        } catch (e) {
          console.error(`[WebRTC] Broadcast binary error to ${peerId}:`, e);
        }
      }
    });
    return sentCount;
  }

  public getDataChannelState(peerId: string): DataChannelState | null {
    const dc = this.dataChannels.get(peerId);
    return dc ? (dc.readyState as DataChannelState) : null;
  }

  public getConnectionState(peerId: string): WebRTCConnectionState | null {
    const pc = this.peerConnections.get(peerId);
    return pc ? (pc.connectionState as WebRTCConnectionState) : null;
  }

  public async getPeerLatency(peerId: string): Promise<number | null> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return null;
    try {
      const stats = await pc.getStats();
      for (const report of stats.values()) {
        if (
          report.type === "candidate-pair" &&
          (report.state === "succeeded" || report.nominated)
        ) {
          if (typeof report.currentRoundTripTime === "number") {
            return Math.max(1, Math.round(report.currentRoundTripTime * 1000));
          }
          if (
            typeof report.totalRoundTripTime === "number" &&
            typeof report.responsesReceived === "number" &&
            report.responsesReceived > 0
          ) {
            return Math.max(
              1,
              Math.round(
                (report.totalRoundTripTime / report.responsesReceived) * 1000,
              ),
            );
          }
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  public closePeer(peerId: string): void {
    const dc = this.dataChannels.get(peerId);
    const pc = this.peerConnections.get(peerId);

    this.dataChannels.delete(peerId);
    this.peerConnections.delete(peerId);
    this.backpressureHandlers.delete(peerId);
    this.pendingCandidates.delete(peerId);
    this.makingOffer.delete(peerId);

    if (dc) {
      dc.onopen = null;
      dc.onclose = null;
      dc.onerror = null;
      dc.onmessage = null;
      try {
        dc.close();
      } catch {}
    }

    if (pc) {
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.ondatachannel = null;
      try {
        pc.close();
      } catch {}
    }
  }

  public closeAll(): void {
    const peerIds = Array.from(this.peerConnections.keys());
    peerIds.forEach((pid) => this.closePeer(pid));
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.sendSignalCandidate(peerId, event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] ${peerId} connection state:`, pc.connectionState);
      this.callbacks.onPeerConnectionStateChange(
        peerId,
        pc.connectionState as WebRTCConnectionState,
      );
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        this.closePeer(peerId);
      }
    };

    pc.ondatachannel = (event) => {
      console.log(`[WebRTC] Received remote DataChannel from ${peerId}`);
      this.setupDataChannel(peerId, event.channel);
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  private setupDataChannel(peerId: string, dc: RTCDataChannel): void {
    dc.binaryType = "arraybuffer";
    this.dataChannels.set(peerId, dc);
    this.backpressureHandlers.set(peerId, new DataChannelBackpressure(dc));

    dc.onopen = () => {
      console.log(`[WebRTC] DataChannel OPEN with ${peerId}`);
      this.callbacks.onDataChannelStateChange(peerId, "open");
    };

    dc.onclose = () => {
      console.log(`[WebRTC] DataChannel CLOSED with ${peerId}`);
      this.dataChannels.delete(peerId);
      this.callbacks.onDataChannelStateChange(peerId, "closed");
    };

    dc.onerror = (err) => {
      console.error(`[WebRTC] DataChannel ERROR with ${peerId}:`, err);
    };

    dc.onmessage = async (event: MessageEvent) => {
      let data = event.data;
      if (data instanceof Blob) {
        data = await data.arrayBuffer();
      }

      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data) as DataMessage;
          this.callbacks.onDataMessage(peerId, parsed);
        } catch {
          console.warn("[WebRTC] Non-JSON string data on data channel:", data);
        }
      } else if (data instanceof ArrayBuffer) {
        this.callbacks.onBinaryData?.(peerId, data);
      }
    };
  }
}
